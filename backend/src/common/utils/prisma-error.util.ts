import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

export function handlePrismaError(e: unknown): never {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === 'P2002') {
      throw new ConflictException('A record with this unique value already exists');
    }
    if (e.code === 'P2003') {
      throw new BadRequestException('Invalid reference (foreign key constraint)');
    }
    if (e.code === 'P2025') {
      throw new NotFoundException('Record not found');
    }
  }
  throw e;
}
