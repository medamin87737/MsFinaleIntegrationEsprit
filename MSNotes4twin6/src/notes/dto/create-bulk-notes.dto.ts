import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

export class BulkNoteEntryDto {
  @IsInt()
  @Min(1)
  etudiantId!: number;

  @IsNumber()
  @Min(0)
  @Max(20)
  valeur!: number;
}

export class CreateBulkNotesDto {
  @IsInt()
  @Min(1)
  classeId!: number;

  @IsInt()
  @Min(1)
  matiereId!: number;

  @IsOptional()
  @IsString()
  dateEvaluation?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BulkNoteEntryDto)
  notes!: BulkNoteEntryDto[];
}
