import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MealType, RecordType } from '@fitfoyo/database';

export class DietItemInputDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsEnum(MealType)
  mealType?: MealType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  grams?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  calories?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  carbs?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  protein?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fat?: number;

  @IsOptional()
  @IsBoolean()
  estimated?: boolean;
}

export class ExerciseItemInputDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  intensity?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  caloriesBurned?: number;

  @IsOptional()
  @IsBoolean()
  estimated?: boolean;
}

export class CreateRecordDto {
  @IsEnum(RecordType)
  type!: RecordType;

  @IsDateString()
  recordedAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rawInput?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DietItemInputDto)
  dietItems?: DietItemInputDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseItemInputDto)
  exerciseItems?: ExerciseItemInputDto[];
}
