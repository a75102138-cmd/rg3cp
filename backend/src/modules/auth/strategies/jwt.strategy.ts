import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRole } from '@prisma/client';
import { UsersService } from '../../users/users.service';
import { JwtRequestUser } from '../auth.types';

type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
  code: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('jwt.secret'),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtRequestUser> {
    // Important: role can change after token issuance (e.g., USER -> ADMIN).
    // Always resolve current role from DB to avoid stale-role 403.
    const current = await this.usersService.findPublicById(payload.sub).catch(() => null);
    if (!current?.id) {
      throw new UnauthorizedException();
    }
    return {
      sub: current.id,
      email: current.email,
      role: current.role as UserRole,
      code: current.code,
    };
  }
}
