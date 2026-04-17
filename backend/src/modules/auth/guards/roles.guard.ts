import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtRequestUser } from '../auth.types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  private expandedRoles(role: UserRole): UserRole[] {
    return [role];
  }

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) {
      return true;
    }
    const req = context.switchToHttp().getRequest<{ user?: JwtRequestUser }>();
    const user = req.user;
    if (!user) {
      throw new ForbiddenException();
    }
    const expanded = this.expandedRoles(user.role);
    if (!required.some((r) => expanded.includes(r))) {
      throw new ForbiddenException();
    }
    return true;
  }
}
