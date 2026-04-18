import { IsInt, IsOptional, Min } from 'class-validator';

export class CreateInscriptionDto {
  @IsInt()
  @Min(1)
  etudiantId: number;

  @IsInt()
  @Min(1)
  matiereId: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  classeId?: number;
}
