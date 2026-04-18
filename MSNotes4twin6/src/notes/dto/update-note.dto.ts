import { IsNumber, Max, Min } from 'class-validator';

export class UpdateNoteDto {
  @IsNumber()
  @Min(0)
  @Max(20)
  valeur: number;
}
