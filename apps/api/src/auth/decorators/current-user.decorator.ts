import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UserDto } from '@lernivox/contracts';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserDto => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
