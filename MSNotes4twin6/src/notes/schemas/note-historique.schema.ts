import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NoteHistoriqueDocument = HydratedDocument<NoteHistorique>;

export type NoteHistoriqueAction = 'CREATION' | 'MODIFICATION';

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'notes_historique' })
export class NoteHistorique {
  @Prop({ type: Types.ObjectId, ref: 'Note', required: true })
  noteId: Types.ObjectId;

  @Prop({ required: true })
  etudiantId: number;

  @Prop({ required: true })
  matiereId: number;

  /** Absent lors de la première saisie */
  @Prop()
  ancienneValeur?: number;

  @Prop({ required: true })
  nouvelleValeur: number;

  @Prop({ required: true })
  action: NoteHistoriqueAction;
}

export const NoteHistoriqueSchema = SchemaFactory.createForClass(NoteHistorique);
