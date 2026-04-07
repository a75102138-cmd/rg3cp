import { ApiPropertyOptional } from '@nestjs/swagger';
import { ElementType } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { BaseListQueryDto } from '../../../common/dto/base-list-query.dto';

export const ELEMENT_SORT = ['code', 'name', 'elementType', 'createdAt', 'updatedAt'] as const;

export class QueryElementDto extends BaseListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  zoneId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par projet (toutes les zones du projet)' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ enum: ElementType })
  @IsOptional()
  @IsEnum(ElementType)
  elementType?: ElementType;

  @ApiPropertyOptional({ enum: ELEMENT_SORT })
  sortBy?: (typeof ELEMENT_SORT)[number];
}
