import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NoteDocument = HydratedDocument<Note>;

@Schema({ timestamps: true, collection: 'notes' })
export class Note {
  @Prop({ type: Types.ObjectId, ref: 'Inscription', required: true })
  inscriptionId: Types.ObjectId;

  @Prop({ required: true, min: 0, max: 20 })
  valeur: number;
}

export const NoteSchema = SchemaFactory.createForClass(Note);
NoteSchema.index({ inscriptionId: 1 }, { unique: true });
