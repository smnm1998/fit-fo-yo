import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { StringValue } from '../common/duration';
import { PasswordService } from './password.service';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GuestCleanupService } from './guest-cleanup.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { OAuthTicketService } from './oauth-ticket.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') ?? '1h') as StringValue,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    JwtAccessStrategy,
    JwtRefreshStrategy,
    GoogleStrategy,
    PasswordService,
    AuthService,
    GuestCleanupService,
    OAuthTicketService,
  ],
  exports: [PasswordService],
})
export class AuthModule {}
