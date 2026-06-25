import { IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpsertHealthProfileDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  heightCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  weightKey?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  conditions?: string;
}
