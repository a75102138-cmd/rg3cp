import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseListQueryDto } from '../../../common/dto/base-list-query.dto';

const ROLE_SORT = ['name', 'createdAt', 'updatedAt'] as const;

export { ROLE_SORT };

export class QueryRoleDto extends BaseListQueryDto {
  @ApiPropertyOptional({ enum: ROLE_SORT })
  sortBy?: (typeof ROLE_SORT)[number];
}
