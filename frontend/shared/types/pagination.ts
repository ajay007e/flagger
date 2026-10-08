export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasData?: boolean;
}

export interface PaginatedData<T> {
  items: T[];
  meta: PaginationMeta;
}
