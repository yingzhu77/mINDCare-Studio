import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * 全局异常过滤，将异常包装为统一响应格式 { code, message, data }
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;
    let data: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exRes = exception.getResponse();
      if (typeof exRes === 'string') {
        message = exRes;
      } else if (typeof exRes === 'object' && exRes !== null) {
        const obj = exRes as any;
        message = obj.message || exception.message;
        // 保留 class-validator 的校验错误信息
        if (Array.isArray(obj.message)) {
          message = obj.message.join('; ');
          data = obj.message;
        }
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = '服务器内部错误';
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = '服务器内部错误';
    }

    response.status(status).json({
      code: status,
      message,
      data,
    });
  }
}
