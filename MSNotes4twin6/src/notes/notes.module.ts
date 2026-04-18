import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Inscription, InscriptionSchema } from './schemas/inscription.schema';
import { Note, NoteSchema } from './schemas/note.schema';
import { NoteHistorique, NoteHistoriqueSchema } from './schemas/note-historique.schema';
import { RabbitMqPublisherService } from '../rabbitmq/rabbitmq-publisher.service';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Inscription.name, schema: InscriptionSchema },
      { name: Note.name, schema: NoteSchema },
      { name: NoteHistorique.name, schema: NoteHistoriqueSchema },
    ]),
  ],
  controllers: [NotesController],
  providers: [NotesService, RabbitMqPublisherService],
})
export class NotesModule {}
