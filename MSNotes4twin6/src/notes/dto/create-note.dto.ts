import { IsInt, IsNumber, Max, Min } from 'class-validator';

export class CreateNoteDto {
  @IsInt()
  @Min(1)
  etudiantId: number;

  @IsInt()
  @Min(1)
  matiereId: number;

  @IsNumber()
  @Min(0)
  @Max(20)
  valeur: number;
}
