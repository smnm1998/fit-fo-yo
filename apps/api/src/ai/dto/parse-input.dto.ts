import { IsDateString, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ParseInputDto {
  // 자연어 원본, 500자 제한
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  rawInput!: string;

  // 기록 시각 (미지정 시 현재 시각), AI가 자연어에서 추론 못 한 경우 default
  @IsOptional()
  @IsDateString()
  recordedAt?: string;
}
