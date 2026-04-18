import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateBulkNotesDto } from './dto/create-bulk-notes.dto';
import { CreateInscriptionDto } from './dto/create-inscription.dto';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NotesService } from './notes.service';

@Controller('notes')
@UseGuards(RolesGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post('inscriptions')
  @Roles('ROLE_CHEF_ENSEIGNANT', 'ROLE_ENSEIGNANT')
  affecterEtudiantMatiere(@Body() dto: CreateInscriptionDto, @CurrentUser() user: Record<string, unknown>) {
    return this.notesService.affecterEtudiantMatiere(dto, user);
  }

  @Get()
  @Roles('ROLE_CHEF_ENSEIGNANT')
  findAll() {
    return this.notesService.findAllNotes();
  }

  @Get('me')
  @Roles('ROLE_ETUDIANT')
  findMyNotes(@CurrentUser() user: Record<string, unknown>) {
    return this.notesService.findMyNotes(user);
  }

  @Get('me/stats')
  @Roles('ROLE_ETUDIANT')
  getMyStats(@CurrentUser() user: Record<string, unknown>) {
    return this.notesService.getStatsByEtudiant(user);
  }

  @Get('classe/:classeId')
  @Roles('ROLE_CHEF_ENSEIGNANT', 'ROLE_ENSEIGNANT')
  findByClasse(@Param('classeId') classeId: string, @CurrentUser() user: Record<string, unknown>) {
    const roles = (user?.realm_access as { roles?: string[] } | undefined)?.roles ?? [];
    const isChef = roles.includes('ROLE_CHEF_ENSEIGNANT');
    return this.notesService.findByClasse(classeId, isChef ? null : (user.preferred_username as string));
  }

  @Get('search')
  @Roles('ROLE_CHEF_ENSEIGNANT', 'ROLE_ENSEIGNANT')
  search(
    @Query('etudiantId') etudiantId?: string,
    @Query('matiereId') matiereId?: string,
    @Query('classeId') classeId?: string,
    @Query('dateDebut') dateDebut?: string,
    @Query('dateFin') dateFin?: string,
    @Query('notMin') notMin?: string,
    @Query('notMax') notMax?: string,
    @CurrentUser() user?: Record<string, unknown>,
  ) {
    const roles = (user?.realm_access as { roles?: string[] } | undefined)?.roles ?? [];
    const isChef = roles.includes('ROLE_CHEF_ENSEIGNANT');
    return this.notesService.searchAdvanced({
      etudiantId,
      matiereId,
      classeId,
      dateDebut,
      dateFin,
      noteMin: notMin !== undefined ? Number(notMin) : undefined,
      noteMax: notMax !== undefined ? Number(notMax) : undefined,
      enseignantUsername: isChef ? null : (user?.preferred_username as string | undefined) ?? null,
    });
  }

  @Get('stats/classe/:classeId')
  @Roles('ROLE_CHEF_ENSEIGNANT', 'ROLE_ENSEIGNANT')
  getStatsByClasse(@Param('classeId') classeId: string) {
    return this.notesService.getStatsByClasse(classeId);
  }

  @Get('stats/classe/:classeId/matiere/:matiereId')
  @Roles('ROLE_CHEF_ENSEIGNANT', 'ROLE_ENSEIGNANT')
  getStatsByMatiereClasse(@Param('classeId') classeId: string, @Param('matiereId') matiereId: string) {
    return this.notesService.getStatsByMatiereClasse(classeId, matiereId);
  }

  @Get('export/:classeId')
  @Roles('ROLE_CHEF_ENSEIGNANT', 'ROLE_ENSEIGNANT')
  exportNotes(@Param('classeId') classeId: string, @CurrentUser() user: Record<string, unknown>) {
    const roles = (user?.realm_access as { roles?: string[] } | undefined)?.roles ?? [];
    const isChef = roles.includes('ROLE_CHEF_ENSEIGNANT');
    return this.notesService.exportReleveNotes(
      classeId,
      user?.preferred_username as string | undefined,
      isChef ? null : (user?.preferred_username as string | undefined) ?? null,
    );
  }

  @Get('classement/:classeId')
  @Roles('ROLE_CHEF_ENSEIGNANT', 'ROLE_ENSEIGNANT')
  getClassement(@Param('classeId') classeId: string) {
    return this.notesService.getClassement(classeId);
  }

  @Post()
  @Roles('ROLE_CHEF_ENSEIGNANT', 'ROLE_ENSEIGNANT')
  affecterNote(@Body() dto: CreateNoteDto, @CurrentUser() user: Record<string, unknown>) {
    return this.notesService.affecterNote(dto, user);
  }

  @Post('bulk')
  @Roles('ROLE_CHEF_ENSEIGNANT', 'ROLE_ENSEIGNANT')
  createBulk(@Body() dto: CreateBulkNotesDto, @CurrentUser() user: Record<string, unknown>) {
    return this.notesService.createBulk(dto, user);
  }

  @Put(':id')
  @Roles('ROLE_CHEF_ENSEIGNANT', 'ROLE_ENSEIGNANT')
  modifierNote(
    @Param('id') id: string,
    @Body() dto: UpdateNoteDto,
    @CurrentUser() user: Record<string, unknown>,
  ) {
    return this.notesService.modifierNote(id, dto, user);
  }

  @Delete(':id')
  @Roles('ROLE_CHEF_ENSEIGNANT', 'ROLE_ENSEIGNANT')
  async delete(@Param('id') id: string, @CurrentUser() user: Record<string, unknown>) {
    return this.notesService.supprimerNote(id, user);
  }

  @Get('etudiants/:etudiantId')
  @Roles('ROLE_CHEF_ENSEIGNANT', 'ROLE_ENSEIGNANT', 'ROLE_ETUDIANT')
  consulterNotesEtudiant(
    @Param('etudiantId', ParseIntPipe) etudiantId: number,
    @CurrentUser() user: Record<string, unknown>,
  ) {
    const roles = (user?.realm_access as { roles?: string[] } | undefined)?.roles ?? [];
    if (roles.includes('ROLE_ETUDIANT')) {
      const mine = Number(user.school_etudiant_id);
      if (!Number.isInteger(mine) || mine !== etudiantId) {
        throw new ForbiddenException('Vous ne pouvez consulter que vos propres notes.');
      }
    }
    return this.notesService.consulterNotesEtudiant(etudiantId);
  }

  @Get('historique')
  @Roles('ROLE_CHEF_ENSEIGNANT', 'ROLE_ENSEIGNANT')
  consulterHistorique(@Query('etudiantId') etudiantId?: string) {
    if (etudiantId == null || etudiantId === '') {
      return this.notesService.consulterHistorique();
    }
    const id = Number(etudiantId);
    if (!Number.isInteger(id) || id < 1) {
      throw new BadRequestException('Query etudiantId doit être un entier positif.');
    }
    return this.notesService.consulterHistorique(id);
  }
}
