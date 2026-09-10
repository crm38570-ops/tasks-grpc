import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthedRequest } from '../../auth/types/authed-request.interface';

export const GetUserId = createParamDecorator(
  (_property: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    return request.user.userId;
  },
);
