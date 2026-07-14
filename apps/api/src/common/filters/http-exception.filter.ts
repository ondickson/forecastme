import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { RequestWithId } from '../middleware/request-id.middleware';

const INTERNAL_SERVER_ERROR_STATUS = 500;

interface NestErrorResponse {
  error?: string;
  message?: string | string[];
}

interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  method: string;
  requestId: string | null;
  timestamp: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const httpContext = host.switchToHttp();
    const request = httpContext.getRequest<RequestWithId>();
    const response = httpContext.getResponse<Response>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : INTERNAL_SERVER_ERROR_STATUS;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const normalizedError = this.normalizeError(exceptionResponse, statusCode);

    const errorResponse: ApiErrorResponse = {
      statusCode,
      error: normalizedError.error,
      message: normalizedError.message,
      path: request.originalUrl,
      method: request.method,
      requestId: request.requestId ?? null,
      timestamp: new Date().toISOString(),
    };

    if (statusCode >= INTERNAL_SERVER_ERROR_STATUS) {
      this.logger.error(
        `${request.method} ${request.originalUrl}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.originalUrl} ${statusCode}`,
      );
    }

    response.status(statusCode).json(errorResponse);
  }

  private normalizeError(
    exceptionResponse: string | object | null,
    statusCode: number,
  ): Required<NestErrorResponse> {
    if (typeof exceptionResponse === 'string') {
      return {
        error: this.defaultError(statusCode),
        message: exceptionResponse,
      };
    }

    if (exceptionResponse && typeof exceptionResponse === 'object') {
      const errorResponse = exceptionResponse as NestErrorResponse;

      return {
        error: errorResponse.error ?? this.defaultError(statusCode),
        message: errorResponse.message ?? this.defaultMessage(statusCode),
      };
    }

    return {
      error: this.defaultError(statusCode),
      message: this.defaultMessage(statusCode),
    };
  }

  private defaultError(statusCode: number): string {
    if (statusCode === INTERNAL_SERVER_ERROR_STATUS) {
      return 'Internal Server Error';
    }

    return HttpStatus[statusCode] ?? 'Error';
  }

  private defaultMessage(statusCode: number): string {
    if (statusCode === INTERNAL_SERVER_ERROR_STATUS) {
      return 'An unexpected error occurred.';
    }

    return this.defaultError(statusCode);
  }
}
