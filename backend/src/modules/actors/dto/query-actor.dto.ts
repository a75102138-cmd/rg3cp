import { ApiPropertyOptional } from '@nestjs/swagger';
import { ActorRole } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { BaseListQueryDto } from '../../../common/dto/base-list-query.dto';

export const ACTOR_SORT = ['code', 'name', 'createdAt', 'updatedAt'] as const;

export class QueryActorDto extends BaseListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  organization?: string;

  @ApiPropertyOptional({ enum: ActorRole })
  @IsOptional()
  @IsEnum(ActorRole)
  role?: ActorRole;

  @ApiPropertyOptional({ enum: ACTOR_SORT })
  sortBy?: (typeof ACTOR_SORT)[number];
}
