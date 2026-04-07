import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { buildMeta, getSkip } from '../../common/utils/pagination.util';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto, USER_SORT } from './dto/query-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const PUBLIC_SELECT = {
  id: true,
  code: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{ select: typeof PUBLIC_SELECT }>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async generateUniqueCode(): Promise<string> {
    for (let i = 0; i < 12; i++) {
      const code = `USR-${randomBytes(4).toString('hex').toUpperCase()}`;
      const exists = await this.prisma.user.findUnique({ where: { code } });
      if (!exists) return code;
    }
    throw new InternalServerErrorException('Impossible de générer un code utilisateur');
  }

  private orderBy(q: QueryUserDto): Prisma.UserOrderByWithRelationInput {
    const field =
      q.sortBy && USER_SORT.includes(q.sortBy as (typeof USER_SORT)[number])
        ? q.sortBy
        : 'createdAt';
    const dir = q.sortOrder === 'asc' ? 'asc' : 'desc';
    return { [field]: dir };
  }

  toPublic(user: User): PublicUser {
    const { passwordHash: _, ...rest } = user;
    return rest;
  }

  async validateCredentials(email: string, password: string): Promise<User | null> {
    const normalized = this.normalizeEmail(email);
    const user = await this.prisma.user.findUnique({ where: { email: normalized } });
    if (!user || !user.isActive) return null;
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return null;
    return user;
  }

  async findPublicById(id: string): Promise<PublicUser> {
    const u = await this.prisma.user.findUnique({
      where: { id },
      select: PUBLIC_SELECT,
    });
    if (!u) throw new NotFoundException();
    return u;
  }

  async create(dto: CreateUserDto) {
    const email = this.normalizeEmail(dto.email);
    const dup = await this.prisma.user.findUnique({ where: { email } });
    if (dup) throw new ConflictException('Email déjà utilisé');
    const code = await this.generateUniqueCode();
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        code,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        email,
        passwordHash,
        role: dto.role,
        isActive: dto.isActive ?? true,
      },
    });
    return this.toPublic(user);
  }

  async findAll(query: QueryUserDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.UserWhereInput = {};
    if (query.role) where.role = query.role;
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.search?.length) {
      const s = query.search.trim();
      where.OR = [
        { email: { contains: s, mode: 'insensitive' } },
        { firstName: { contains: s, mode: 'insensitive' } },
        { lastName: { contains: s, mode: 'insensitive' } },
        { code: { contains: s, mode: 'insensitive' } },
      ];
    }
    const [total, data] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip: getSkip(page, limit),
        take: limit,
        orderBy: this.orderBy(query),
        select: PUBLIC_SELECT,
      }),
    ]);
    return { data, meta: buildMeta(page, limit, total) };
  }

  async findOne(id: string) {
    return this.findPublicById(id);
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findPublicById(id);
    const data: Prisma.UserUpdateInput = {};
    let newEmail: string | undefined;
    if (dto.email !== undefined) {
      newEmail = this.normalizeEmail(dto.email);
      data.email = newEmail;
    }
    if (dto.firstName !== undefined) data.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) data.lastName = dto.lastName.trim();
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.password !== undefined) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
    }
    if (newEmail !== undefined) {
      const dup = await this.prisma.user.findFirst({
        where: { email: newEmail, NOT: { id } },
      });
      if (dup) throw new ConflictException('Email déjà utilisé');
    }
    const user = await this.prisma.user.update({
      where: { id },
      data,
    });
    return this.toPublic(user);
  }

  async remove(id: string) {
    await this.findPublicById(id);
    await this.prisma.user.delete({ where: { id } });
  }
}
