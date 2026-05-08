// 统一响应结构，兼容前端 src/utils/request.js 的处理逻辑

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface PageData<T = any> {
  records: T[];
  total: number;
  currentPage: number;
  size: number;
}

export function success<T>(data: T, message = 'success'): ApiResponse<T> {
  return { code: 200, message, data };
}

export function fail(message: string, code = 400, data: any = null): ApiResponse {
  return { code, message, data };
}

export function pageData<T>(
  records: T[],
  total: number,
  currentPage: number,
  size: number,
): PageData<T> {
  return { records, total, currentPage, size };
}
