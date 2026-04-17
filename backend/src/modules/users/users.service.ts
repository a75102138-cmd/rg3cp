import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccountStatus, Prisma, User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { buildMeta, getSkip } from '../../common/utils/pagination.util';
import { PrismaService } from '../../prisma/prisma.service';
import { InvitationMailService } from '../mail/invitation-mail.service';
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
  status: true,
  defaultValidatorUserId: true,
  defaultValidator: {
    select: {
      id: true,
      code: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
    },
  },
  isActive: true,
  invitedAt: true,
  acceptedAt: true,
  createdAt: true,
  updatedAt: true,
  projectAssignments: {
    select: {
      projectId: true,
    },
  },
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{ select: typeof PUBLIC_SELECT }>;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invitationMailService: InvitationMailService,
    private readonly config: ConfigService,
  ) {}

  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private uniqueIds(ids: string[]): string[] {
    return Array.from(new Set((ids ?? []).filter(Boolean)));
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

  async validateCredentials(email: string, password: string): Promise<User | null> {
    const normalized = this.normalizeEmail(email);
    // #region agent log
    fetch('http://127.0.0.1:7723/ingest/1799121e-74eb-4090-a7d5-1dedde7c8faf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '50e417' },
      body: JSON.stringify({
        sessionId: '50e417',
        runId: 'pre-fix',
        hypothesisId: 'H1',
        location: 'backend/src/modules/users/users.service.ts:validateCredentials:beforeFindUnique',
        message: 'validateCredentials query starting',
        data: { emailDomain: normalized.includes('@') ? normalized.split('@')[1] : null },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    let user: User | null;
    try {
      user = await this.prisma.user.findUnique({ where: { email: normalized } });
    } catch (error) {
      const err = error as { code?: string; message?: string; meta?: unknown } | undefined;
      // #region agent log
      fetch('http://127.0.0.1:7723/ingest/1799121e-74eb-4090-a7d5-1dedde7c8faf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '50e417' },
        body: JSON.stringify({
          sessionId: '50e417',
          runId: 'pre-fix',
          hypothesisId: 'H1',
          location: 'backend/src/modules/users/users.service.ts:validateCredentials:findUniqueError',
          message: 'validateCredentials query failed',
          data: {
            code: err?.code ?? null,
            messageIncludesInvitedAt: Boolean(err?.message?.includes('invitedAt')),
            messagePreview: err?.message?.slice(0, 220) ?? null,
            meta: err?.meta ?? null,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      throw error;
    }
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
    if (dto.role === UserRole.USER && dto.isActive === false) {
      return this.createInvitedUser(dto);
    }
    if (!dto.password) {
      throw new BadRequestException('password est requis pour ce rôle');
    }
    const email = this.normalizeEmail(dto.email);
    const dup = await this.prisma.user.findUnique({ where: { email } });
    if (dup) throw new ConflictException('Email déjà utilisé');
    if (dto.defaultValidatorUserId) {
      const validator = await this.prisma.user.findFirst({
        where: { id: dto.defaultValidatorUserId, role: 'ACTEUR' },
        select: { id: true },
      });
      if (!validator) throw new NotFoundException('Compte ACTEUR assigné introuvable');
    }
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
        status: AccountStatus.ACTIVE,
        defaultValidatorUserId: dto.defaultValidatorUserId ?? null,
        isActive: dto.isActive ?? true,
      },
    });
    return this.findPublicById(user.id);
  }

  async createInvitedUser(dto: CreateUserDto) {
    if (dto.role !== UserRole.USER) {
      throw new BadRequestException('Ce flux est réservé à la création de comptes USER');
    }
    if (!dto.defaultValidatorUserId) {
      throw new BadRequestException('defaultValidatorUserId est requis pour créer un utilisateur invité');
    }
    const email = this.normalizeEmail(dto.email);
    const dup = await this.prisma.user.findUnique({ where: { email } });
    if (dup) throw new ConflictException('Email déjà utilisé');

    const validator = await this.prisma.user.findFirst({
      where: { id: dto.defaultValidatorUserId, role: UserRole.ACTEUR },
      select: { id: true },
    });
    if (!validator) throw new NotFoundException('Compte ACTEUR assigné introuvable');

    const code = await this.generateUniqueCode();
    const inviteToken = randomBytes(32).toString('hex');
    const inviteTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const randomPassword = randomBytes(24).toString('hex');
    const passwordHash = await bcrypt.hash(randomPassword, 10);
    const invitedAt = new Date();

    const user = await this.prisma.user.create({
      data: {
        code,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        email,
        passwordHash,
        role: UserRole.USER,
        status: AccountStatus.INVITED,
        defaultValidatorUserId: dto.defaultValidatorUserId,
        isActive: false,
        inviteToken,
        inviteTokenExpiresAt,
        invitedAt,
      },
    });

    const appUrl = this.config.get<string>('APP_URL') ?? 'http://localhost:3000';
    const invitationLink = `${appUrl}/invite?token=${inviteToken}`;
    await this.invitationMailService.sendInvitationEmail({
      email: user.email,
      firstName: user.firstName,
      invitationLink,
    });

    return this.findPublicById(user.id);
  }

  async getInvitationByToken(token: string) {
    const normalized = token.trim();
    const user = await this.prisma.user.findFirst({
      where: {
        inviteToken: normalized,
        status: AccountStatus.INVITED,
      },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        inviteTokenExpiresAt: true,
      },
    });
    if (!user || !user.inviteTokenExpiresAt || user.inviteTokenExpiresAt < new Date()) {
      throw new NotFoundException('Invitation invalide ou expirée');
    }
    return {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      expiresAt: user.inviteTokenExpiresAt,
    };
  }

  async acceptInvitation(token: string, password: string) {
    const normalized = token.trim();
    const user = await this.prisma.user.findFirst({
      where: {
        inviteToken: normalized,
        status: AccountStatus.INVITED,
      },
      select: {
        id: true,
        inviteTokenExpiresAt: true,
      },
    });
    if (!user || !user.inviteTokenExpiresAt || user.inviteTokenExpiresAt < new Date()) {
      throw new NotFoundException('Invitation invalide ou expirée');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        status: AccountStatus.ACTIVE,
        isActive: true,
        acceptedAt: new Date(),
        inviteToken: null,
        inviteTokenExpiresAt: null,
      },
    });
    return { success: true };
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
    return this.findPublicById(user.id);
  }

  async remove(id: string) {
    await this.findPublicById(id);
    await this.prisma.user.delete({ where: { id } });
  }

  async findAssignedProjects(id: string) {
    await this.findPublicById(id);
    const rows = await this.prisma.projectUserAssignment.findMany({
      where: { userId: id },
      select: {
        projectId: true,
        project: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => row.project);
  }

  async updateAssignedProjects(id: string, projectIds: string[]) {
    await this.findPublicById(id);
    const uniqueProjectIds = this.uniqueIds(projectIds);
    if (uniqueProjectIds.length) {
      const totalProjects = await this.prisma.project.count({
        where: { id: { in: uniqueProjectIds } },
      });
      if (totalProjects !== uniqueProjectIds.length) {
        throw new NotFoundException('Au moins un projet assigné est introuvable');
      }
    }
    await this.prisma.$transaction([
      this.prisma.projectUserAssignment.deleteMany({ where: { userId: id } }),
      ...(uniqueProjectIds.length
        ? [
            this.prisma.projectUserAssignment.createMany({
              data: uniqueProjectIds.map((projectId) => ({ userId: id, projectId })),
            }),
          ]
        : []),
    ]);
    return this.findAssignedProjects(id);
  }
}
