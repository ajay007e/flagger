import type { PaginatedData, PaginationQuery } from "./types";

type ResolvedPagination = Required<PaginationQuery>;

export function getSkipTake({ page, limit }: ResolvedPagination): {
  skip: number;
  take: number;
} {
  return { skip: (page - 1) * limit, take: limit };
}

export function toPaginatedData<T>(
  items: T[],
  total: number,
  { page, limit }: ResolvedPagination,
): PaginatedData<T> {
  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasData: total > 0,
    },
  };
}
