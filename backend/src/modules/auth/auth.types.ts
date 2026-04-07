import { UserRole } from '@prisma/client';

/** Payload JWT et `req.user` après validation Passport. */
export interface JwtRequestUser {
  sub: string;
  email: string;
  role: UserRole;
  code: string;
}
