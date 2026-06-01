import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { CurrentUser, type AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { AiService } from './ai.service';
import { ParseInputDto } from './dto/parse-input.dto';

@UseGuards(JwtAccessGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  /**
   * 자연어 → 파싱 → Records 저장.
   * AI 전용 throttler: 1분당 10회 (default 100 보다 강함).
   */
  @Post('parse-and-save')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ ai: { limit: 10, ttl: 60_000 } })
  parseAndSave(@CurrentUser() user: AuthenticatedUser, @Body() dto: ParseInputDto) {
    return this.ai.parseAndSave({
      userId: user.id,
      rawInput: dto.rawInput,
      fallbackRecordedAt: dto.recordedAt,
    });
  }
}
