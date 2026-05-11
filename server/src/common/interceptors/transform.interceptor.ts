import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../response';

/**
 * 统一响应包装拦截器，将 Controller 返回的 data 包装为 { code: 200, message: "success", data }
 * 如果 Controller 已返回完整的 ApiResponse 格式，则直接透传
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse> {
    return next.handle().pipe(
      map((data) => {
        // 已包含 code 字段的视为已包装，直接透传
        if (data && typeof data === 'object' && 'code' in data) {
          return data;
        }
        return { code: 200, message: 'success', data };
      }),
    );
  }
}
