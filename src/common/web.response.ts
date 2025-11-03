export class WebResponse<T, Pagination = undefined> {
  status_code?: number;
  data?: T;
  pagination?: Pagination;
  message?: string;
  errors?: any;
}

export class Pagination {
  current_page: number;
  total_page: number;
  total_data: number;
}
