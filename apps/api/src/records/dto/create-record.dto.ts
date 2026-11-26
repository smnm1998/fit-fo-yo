import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MealType, RecordType } from '@fitfoyo/database';

/**
 * 입력 상한: 상한이 없으면 큰 숫자가 DB Int 범위를 넘어 500이 된다
 * 사람이 실제로 적을 값보다 넉넉하게, 잘못된 값만 400으로 막는 정도로 잡았다
 */
export const RECORD_LIMITS = {
  items: 30, // 한 기록의 항목 수
  kcal: 10_000, // 항목 하나의 칼로리
  grams: 10_000, // 항목 하나의 무게(g)
  quantity: 1_000, // 개수·인분
  nutrientGrams: 1_000, // 탄수화물·단백질·지방(g)
  minutes: 1_440, // 운동 시간 = 하루
} as const;

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
  @Max(RECORD_LIMITS.quantity)
  quantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(RECORD_LIMITS.grams)
  grams?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(RECORD_LIMITS.kcal)
  calories?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(RECORD_LIMITS.nutrientGrams)
  carbs?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(RECORD_LIMITS.nutrientGrams)
  protein?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(RECORD_LIMITS.nutrientGrams)
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
  @Max(RECORD_LIMITS.minutes)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  intensity?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(RECORD_LIMITS.kcal)
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
  @ArrayMaxSize(RECORD_LIMITS.items)
  @ValidateNested({ each: true })
  @Type(() => DietItemInputDto)
  dietItems?: DietItemInputDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(RECORD_LIMITS.items)
  @ValidateNested({ each: true })
  @Type(() => ExerciseItemInputDto)
  exerciseItems?: ExerciseItemInputDto[];
}
