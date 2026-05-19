import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export type AuthenticatedUser = {
  id: string;
  email?: string | null;
  nickname?: string | null;
  isGuest: boolean;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
