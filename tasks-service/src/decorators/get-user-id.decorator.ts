import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthedRequest } from '../auth/jwt-auth.guard';

export const GetUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<AuthedRequest>();
    const userId = request.user?.userId;

    if (!userId) {
      throw new UnauthorizedException('Missing user identity');
    }

    return userId;
  },
);
