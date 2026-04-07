import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtRequestUser } from '../auth.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtRequestUser => {
    const req = ctx.switchToHttp().getRequest();
    return req.user as JwtRequestUser;
  },
);
