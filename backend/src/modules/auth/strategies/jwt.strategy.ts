import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRole } from '@prisma/client';
import { JwtRequestUser } from '../auth.types';

type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
  code: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('jwt.secret'),
    });
  }

  validate(payload: JwtPayload): JwtRequestUser {
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      code: payload.code,
    };
  }
}
