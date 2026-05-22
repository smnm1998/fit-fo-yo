import { IsEmail, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: '유효한 이메일 형식이 아닙니다.' })
  @MaxLength(100)
  email!: string;

  @IsString()
  @MaxLength(30)
  password!: string;
}
