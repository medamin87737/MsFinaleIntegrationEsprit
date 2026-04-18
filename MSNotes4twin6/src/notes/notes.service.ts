import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateBulkNotesDto } from './dto/create-bulk-notes.dto';
import { CreateInscriptionDto } from './dto/create-inscription.dto';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { Inscription, InscriptionDocument } from './schemas/inscription.schema';
import { Note, NoteDocument } from './schemas/note.schema';
import { NoteHistorique } from './schemas/note-historique.schema';
import { RabbitMqPublisherService } from '../rabbitmq/rabbitmq-publisher.service';
import { allKeycloakRoles } from '../auth/jwt-roles';

export interface SearchCriteria {
  etudiantId?: string;
  matiereId?: string;
  classeId?: string;
  dateDebut?: string;
  dateFin?: string;
  noteMin?: number;
  noteMax?: number;
  enseignantUsername?: string | null;
}

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);

  constructor(
    @InjectModel(Inscription.name)
    private readonly inscriptionModel: Model<Inscription>,
    @InjectModel(Note.name)
    private readonly noteModel: Model<Note>,
    @InjectModel(NoteHistorique.name)
    private readonly historiqueModel: Model<NoteHistorique>,
    private readonly rabbit: RabbitMqPublisherService,
  ) {}

  private static realmRoles(user: Record<string, unknown> | undefined): string[] {
    return allKeycloakRoles(user);
  }

  private static isChef(user: Record<string, unknown> | undefined): boolean {
    return NotesService.realmRoles(user).includes('ROLE_CHEF_ENSEIGNANT');
  }

  private static isEnseignant(user: Record<string, unknown> | undefined): boolean {
    return NotesService.realmRoles(user).includes('ROLE_ENSEIGNANT');
  }

  private static etudiantIdFromUser(user: Record<string, unknown> | undefined): number {
    const raw = user?.school_etudiant_id;
    const id = raw != null && raw !== '' ? Number(raw) : NaN;
    if (!Number.isInteger(id) || id < 1) {
      throw new BadRequestException('Claim school_etudiant_id manquant ou invalide dans le token.');
    }
    return id;
  }

  async affecterEtudiantMatiere(dto: CreateInscriptionDto, user?: Record<string, unknown>) {
    const enseignantUsername =
      NotesService.isEnseignant(user) && !NotesService.isChef(user)
        ? (user?.preferred_username as string | undefined)
        : undefined;
    try {
      const doc = await this.inscriptionModel.create({
        etudiantId: dto.etudiantId,
        matiereId: dto.matiereId,
        classeId: dto.classeId,
        enseignantUsername,
      });
      const pub = this.rabbit.publish('inscription.created', {
        etudiantId: doc.etudiantId,
        matiereId: doc.matiereId,
        inscriptionId: String(doc._id),
      });
      if (pub) {
        this.logger.log(
          '[RabbitMQ — Scénario 2] Message "inscription.created" envoyé au broker → MSClasse pourra enregistrer le suivi pédagogique.',
        );
      }
      return doc.toJSON();
    } catch (e: unknown) {
      const code = (e as { code?: number }).code;
      if (code === 11000) {
        const existing = await this.inscriptionModel
          .findOne({ etudiantId: dto.etudiantId, matiereId: dto.matiereId })
          .exec();
        throw new ConflictException({
          message:
            'Cet étudiant est déjà inscrit à cette matière (Scénario 2 déjà enregistré pour cette paire). Pour retester, utilisez un autre couple etudiantId/matiereId ou supprimez l’inscription en base.',
          inscriptionId: existing?._id?.toString(),
        });
      }
      throw e;
    }
  }

  async affecterNote(dto: CreateNoteDto, user?: Record<string, unknown>) {
    const ins = await this.inscriptionModel
      .findOne({
        etudiantId: dto.etudiantId,
        matiereId: dto.matiereId,
      })
      .exec();
    if (!ins) {
      throw new NotFoundException(
        'Inscription étudiant/matière introuvable. Affectez d’abord l’étudiant à la matière.',
      );
    }
    this.assertCanWriteNoteOnInscription(ins, user);
    const existing = await this.noteModel.findOne({ inscriptionId: ins._id }).exec();
    if (existing) {
      throw new ConflictException({
        message:
          'Une note existe déjà pour cette inscription. Le premier POST ne peut être fait qu’une fois ; pour changer la note (Scénario 1 — grade.updated), utilisez PUT avec noteId ci-dessous.',
        noteId: existing._id.toString(),
      });
    }
    const note = await this.noteModel.create({
      inscriptionId: ins._id as Types.ObjectId,
      valeur: dto.valeur,
    });
    await this.historiqueModel.create({
      noteId: note._id as Types.ObjectId,
      etudiantId: dto.etudiantId,
      matiereId: dto.matiereId,
      nouvelleValeur: dto.valeur,
      action: 'CREATION',
    });
    const pubCreated = this.rabbit.publish('grade.created', {
      action: 'CREATION',
      noteId: note._id.toString(),
      etudiantId: dto.etudiantId,
      matiereId: dto.matiereId,
      valeur: dto.valeur,
    });
    if (pubCreated) {
      this.logger.log(
        '[RabbitMQ — Scénario 1] Message "grade.created" envoyé au broker → MSEtudiant enregistrera l’audit (table audit_notes_events).',
      );
    }
    return this.mapNoteOut(note, ins);
  }

  async modifierNote(id: string, dto: UpdateNoteDto, user?: Record<string, unknown>) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        'L’id dans l’URL doit être l’ObjectId MongoDB de la note (24 caractères hex), pas un entier. Récupérez-le dans la réponse du POST /notes ou dans GET /notes/etudiants/:etudiantId → champ note.id.',
      );
    }
    const note = await this.noteModel.findById(id).exec();
    if (!note) {
      throw new NotFoundException(
        'Aucune note avec cet id. Vérifiez que vous utilisez bien note.id (et non inscriptionId ni etudiantId).',
      );
    }
    const ins = await this.inscriptionModel.findById(note.inscriptionId).exec();
    if (!ins) {
      throw new NotFoundException('Inscription associée introuvable.');
    }
    this.assertCanWriteNoteOnInscription(ins, user);
    const ancienne = note.valeur;
    note.valeur = dto.valeur;
    await note.save();
    await this.historiqueModel.create({
      noteId: note._id as Types.ObjectId,
      etudiantId: ins.etudiantId,
      matiereId: ins.matiereId,
      ancienneValeur: ancienne,
      nouvelleValeur: dto.valeur,
      action: 'MODIFICATION',
    });
    const pubUpdated = this.rabbit.publish('grade.updated', {
      action: 'MODIFICATION',
      noteId: note._id.toString(),
      etudiantId: ins.etudiantId,
      matiereId: ins.matiereId,
      ancienneValeur: ancienne,
      nouvelleValeur: dto.valeur,
    });
    if (pubUpdated) {
      this.logger.log(
        '[RabbitMQ — Scénario 1] Message "grade.updated" envoyé au broker → MSEtudiant enregistrera la ligne d’audit de modification.',
      );
    }
    return this.mapNoteOut(note, ins);
  }

  async supprimerNote(id: string, user?: Record<string, unknown>) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Id note invalide.');
    }
    const note = await this.noteModel.findById(id).exec();
    if (!note) {
      throw new NotFoundException('Note introuvable.');
    }
    const ins = await this.inscriptionModel.findById(note.inscriptionId).exec();
    if (ins) {
      this.assertCanWriteNoteOnInscription(ins, user);
    }
    await this.noteModel.deleteOne({ _id: note._id }).exec();
    return { deleted: true, id };
  }

  async findAllNotes() {
    const notes = await this.noteModel.find().exec();
    const out: unknown[] = [];
    for (const n of notes) {
      const ins = await this.inscriptionModel.findById(n.inscriptionId).exec();
      if (ins) {
        out.push(this.mapNoteOut(n, ins));
      }
    }
    return out;
  }

  async findMyNotes(user: Record<string, unknown>) {
    const id = NotesService.etudiantIdFromUser(user);
    return this.consulterNotesEtudiant(id);
  }

  async getStatsByEtudiant(user: Record<string, unknown>) {
    const rows = await this.findMyNotes(user);
    const valeurs: number[] = [];
    const parMatiere = new Map<number, number[]>();
    for (const r of rows as Array<{ matiereId: number; note: { valeur: number } | null }>) {
      const v = r.note?.valeur;
      if (v == null) continue;
      valeurs.push(v);
      const arr = parMatiere.get(r.matiereId) ?? [];
      arr.push(v);
      parMatiere.set(r.matiereId, arr);
    }
    const moyenneGenerale =
      valeurs.length === 0 ? null : valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
    const parMatiereOut = [...parMatiere.entries()].map(([matiereId, vals]) => ({
      matiereId,
      moyenne: vals.reduce((a, b) => a + b, 0) / vals.length,
      min: Math.min(...vals),
      max: Math.max(...vals),
    }));
    return { moyenneGenerale, parMatiere: parMatiereOut };
  }

  async findByClasse(classeId: string, enseignantUsername: string | null) {
    const filter: Record<string, unknown> = { classeId: Number(classeId) };
    if (Number.isNaN(filter.classeId)) {
      throw new BadRequestException('classeId invalide.');
    }
    if (enseignantUsername) {
      filter.enseignantUsername = enseignantUsername;
    }
    const inscriptions = await this.inscriptionModel.find(filter).exec();
    return this.buildRowsForInscriptions(inscriptions);
  }

  async searchAdvanced(criteria: SearchCriteria) {
    const filter: Record<string, unknown> = {};
    if (criteria.etudiantId) filter.etudiantId = Number(criteria.etudiantId);
    if (criteria.matiereId) filter.matiereId = Number(criteria.matiereId);
    if (criteria.classeId) filter.classeId = Number(criteria.classeId);
    if (criteria.enseignantUsername) filter.enseignantUsername = criteria.enseignantUsername;
    const inscriptions = await this.inscriptionModel.find(filter).exec();
    let rows = await this.buildRowsForInscriptions(inscriptions);
    if (criteria.dateDebut || criteria.dateFin) {
      const d0 = criteria.dateDebut ? new Date(criteria.dateDebut) : null;
      const d1 = criteria.dateFin ? new Date(criteria.dateFin) : null;
      rows = rows.filter((r) => {
        const ca = (r as { note?: { createdAt?: string } }).note?.createdAt;
        if (!ca) return false;
        const d = new Date(ca);
        if (d0 && d < d0) return false;
        if (d1 && d > d1) return false;
        return true;
      });
    }
    if (criteria.noteMin !== undefined || criteria.noteMax !== undefined) {
      rows = rows.filter((r) => {
        const v = (r as { note?: { valeur?: number } }).note?.valeur;
        if (v == null) return false;
        if (criteria.noteMin !== undefined && v < criteria.noteMin) return false;
        if (criteria.noteMax !== undefined && v > criteria.noteMax) return false;
        return true;
      });
    }
    return rows;
  }

  async getStatsByClasse(classeId: string) {
    const cid = Number(classeId);
    if (Number.isNaN(cid)) {
      throw new BadRequestException('classeId invalide.');
    }
    const inscriptions = await this.inscriptionModel.find({ classeId: cid }).exec();
    const ids = inscriptions.map((i) => i._id);
    const agg = await this.noteModel
      .aggregate([
        { $match: { inscriptionId: { $in: ids } } },
        {
          $group: {
            _id: null,
            moyenne: { $avg: '$valeur' },
            min: { $min: '$valeur' },
            max: { $max: '$valeur' },
            count: { $sum: 1 },
          },
        },
      ])
      .exec();
    return agg[0] ?? { moyenne: null, min: null, max: null, count: 0 };
  }

  async getStatsByMatiereClasse(classeId: string, matiereId: string) {
    const cid = Number(classeId);
    const mid = Number(matiereId);
    if (Number.isNaN(cid) || Number.isNaN(mid)) {
      throw new BadRequestException('Identifiants invalides.');
    }
    const inscriptions = await this.inscriptionModel.find({ classeId: cid, matiereId: mid }).exec();
    const ids = inscriptions.map((i) => i._id);
    const agg = await this.noteModel
      .aggregate([
        { $match: { inscriptionId: { $in: ids } } },
        {
          $group: {
            _id: null,
            moyenne: { $avg: '$valeur' },
            min: { $min: '$valeur' },
            max: { $max: '$valeur' },
            count: { $sum: 1 },
          },
        },
      ])
      .exec();
    return agg[0] ?? { moyenne: null, min: null, max: null, count: 0 };
  }

  async exportReleveNotes(
    classeId: string,
    preferredUsername: string | undefined,
    enseignantFilter: string | null,
  ) {
    const rows = await this.findByClasse(classeId, enseignantFilter);
    return {
      classeId: Number(classeId),
      exportePar: preferredUsername ?? null,
      releve: rows,
    };
  }

  async getClassement(classeId: string) {
    const cid = Number(classeId);
    if (Number.isNaN(cid)) {
      throw new BadRequestException('classeId invalide.');
    }
    const inscriptions = await this.inscriptionModel.find({ classeId: cid }).exec();
    const notes = await this.noteModel
      .find({ inscriptionId: { $in: inscriptions.map((i) => i._id) } })
      .exec();
    const grouped = new Map<number, number[]>();
    for (const n of notes) {
      const ins = inscriptions.find((i) => String(i._id) === String(n.inscriptionId));
      if (!ins) continue;
      if (!grouped.has(ins.etudiantId)) grouped.set(ins.etudiantId, []);
      grouped.get(ins.etudiantId)!.push(n.valeur);
    }
    return [...grouped.entries()]
      .map(([etudiantId, vals]) => ({
        etudiantId,
        moyenne: vals.reduce((a, b) => a + b, 0) / vals.length,
      }))
      .sort((a, b) => b.moyenne - a.moyenne)
      .map((e, i) => ({ ...e, rang: i + 1 }));
  }

  async createBulk(dto: CreateBulkNotesDto, user?: Record<string, unknown>) {
    const out: unknown[] = [];
    for (const line of dto.notes) {
      const r = await this.affecterNote(
        {
          etudiantId: line.etudiantId,
          matiereId: dto.matiereId,
          valeur: line.valeur,
        },
        user,
      );
      out.push(r);
    }
    return { classeId: dto.classeId, count: out.length, notes: out };
  }

  async consulterNotesEtudiant(etudiantId: number) {
    const inscriptions = await this.inscriptionModel.find({ etudiantId }).exec();
    return this.buildRowsForInscriptions(inscriptions);
  }

  async consulterHistorique(etudiantId?: number) {
    const filter = etudiantId != null ? { etudiantId } : {};
    return this.historiqueModel.find(filter).sort({ createdAt: -1 }).lean().exec();
  }

  private assertCanWriteNoteOnInscription(ins: InscriptionDocument, user?: Record<string, unknown>) {
    if (!user || NotesService.isChef(user)) {
      return;
    }
    if (NotesService.isEnseignant(user)) {
      const u = user.preferred_username as string | undefined;
      if (!ins.enseignantUsername) {
        throw new ForbiddenException(
          'Inscription sans enseignant référent — seul le chef peut saisir une note.',
        );
      }
      if (u && ins.enseignantUsername === u) {
        return;
      }
      throw new ForbiddenException('Cette inscription ne vous appartient pas.');
    }
    throw new ForbiddenException('Écriture interdite pour ce rôle.');
  }

  private async buildRowsForInscriptions(inscriptions: InscriptionDocument[]) {
    const results: Array<{
      inscriptionId: string;
      etudiantId: number;
      matiereId: number;
      classeId?: number;
      note: {
        id: string;
        valeur: number;
        createdAt?: Date;
        updatedAt?: Date;
      } | null;
    }> = [];
    for (const ins of inscriptions) {
      const note = await this.noteModel.findOne({ inscriptionId: ins._id }).exec();
      results.push({
        inscriptionId: ins._id.toString(),
        etudiantId: ins.etudiantId,
        matiereId: ins.matiereId,
        classeId: ins.classeId,
        note: note
          ? {
              id: note._id.toString(),
              valeur: note.valeur,
              createdAt: note.get('createdAt'),
              updatedAt: note.get('updatedAt'),
            }
          : null,
      });
    }
    return results;
  }

  private mapNoteOut(note: NoteDocument, ins: InscriptionDocument) {
    return {
      id: note._id.toString(),
      inscriptionId: ins._id.toString(),
      etudiantId: ins.etudiantId,
      matiereId: ins.matiereId,
      valeur: note.valeur,
      createdAt: note.get('createdAt') as Date | undefined,
      updatedAt: note.get('updatedAt') as Date | undefined,
    };
  }
}
