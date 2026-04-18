import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type InscriptionDocument = HydratedDocument<Inscription>;

@Schema({ timestamps: true, collection: 'inscriptions' })
export class Inscription {
  @Prop({ required: true })
  etudiantId: number;

  @Prop({ required: true })
  matiereId: number;

  /** Classe pédagogique (remplie pour filtrage enseignant / export). */
  @Prop()
  classeId?: number;

  /** Enseignant ayant créé l’inscription (contrôle d’accès côté service). */
  @Prop()
  enseignantUsername?: string;
}

export const InscriptionSchema = SchemaFactory.createForClass(Inscription);
InscriptionSchema.index({ etudiantId: 1, matiereId: 1 }, { unique: true });
