import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { BaseListQueryDto } from '../../../common/dto/base-list-query.dto';

export const USER_SORT = [
  'email',
  'firstName',
  'lastName',
  'role',
  'createdAt',
  'updatedAt',
] as const;

export class QueryUserDto extends BaseListQueryDto {
  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ enum: USER_SORT })
  sortBy?: (typeof USER_SORT)[number];
}
