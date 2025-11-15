import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message:
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || 'Internal server error',
      error:
        typeof exceptionResponse === 'object' && (exceptionResponse as any).error
          ? (exceptionResponse as any).error
          : undefined,
    };

    // Log error for debugging (avoid logging sensitive data)
    console.error(
      `[${new Date().toISOString()}] ${request.method} ${request.url} - ${status} - ${errorResponse.message}`,
    );

    response.status(status).json(errorResponse);
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'حدث خطأ داخلي في الخادم';

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
    };

    // Log error for debugging
    console.error(
      `[${new Date().toISOString()}] ${request.method} ${request.url} - ${status}`,
      exception,
    );

    response.status(status).json(errorResponse);
  }
}
