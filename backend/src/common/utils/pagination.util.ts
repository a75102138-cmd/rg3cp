export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function getSkip(page: number, limit: number): number {
  const p = Math.max(1, page);
  const l = Math.max(1, limit);
  return (p - 1) * l;
}

export function buildMeta(page: number, limit: number, total: number): PaginatedMeta {
  const l = Math.max(1, limit);
  const p = Math.max(1, page);
  return {
    page: p,
    limit: l,
    total,
    totalPages: Math.max(1, Math.ceil(total / l)),
  };
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginatedMeta;
}
