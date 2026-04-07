import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.validateCredentials(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      code: user.code,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      user: this.usersService.toPublic(user),
    };
  }

  async register(dto: RegisterDto) {
    const created = await this.usersService.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: dto.password,
      role: UserRole.USER,
      isActive: true,
    });
    const payload = {
      sub: created.id,
      email: created.email,
      role: created.role,
      code: created.code,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      user: created,
    };
  }
}
