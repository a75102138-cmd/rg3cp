import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseListQueryDto } from '../../../common/dto/base-list-query.dto';

export const MATERIAL_SORT = ['code', 'name', 'createdAt', 'updatedAt'] as const;

export class QueryMaterialDto extends BaseListQueryDto {
  @ApiPropertyOptional({ enum: MATERIAL_SORT })
  sortBy?: (typeof MATERIAL_SORT)[number];
}
