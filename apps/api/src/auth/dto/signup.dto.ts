import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class SignupDto {
  @IsEmail({}, { message: '유효한 이메일 형식이 아닙니다.' })
  @MaxLength(100, { message: '이메일은 100자 이하여야 합니다.' })
  email!: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다.' })
  @MaxLength(30, { message: '비밀번호는 30자 이하여야 합니다.' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: '비밀번호는 영문과 숫자를 모두 포함해야 합니다.',
  })
  password!: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: '닉네임은 2자 이상이어야 합니다.' })
  @MaxLength(15, { message: '닉네임은 15자 이하여야 합니다.' })
  nickname?: string;
}
