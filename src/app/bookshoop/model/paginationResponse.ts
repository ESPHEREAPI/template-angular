export interface PaginationResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
}