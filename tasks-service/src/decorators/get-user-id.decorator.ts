import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export const GetUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | undefined> }>();
    const userId = req.headers['x-user-id'];

    if (!userId) {
      throw new UnauthorizedException('Missing X-User-Id header');
    }

    return userId;
  },
);
