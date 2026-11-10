import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

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
        ? exception.getResponse()
        : 'Internal server error';

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error: typeof message === 'object' ? message : { message },
    };

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      if (exception && typeof exception === 'object' && 'code' in exception) {
        const code = (exception as any).code;
        const msg = exception instanceof Error ? exception.message : String(exception);
        this.logger.error(
          `[Database/Prisma Exception ${code}] on ${request.method} ${request.url}: ${msg}`,
          exception instanceof Error ? exception.stack : undefined,
        );
      } else {
        this.logger.error(
          `HTTP ${status} Error on ${request.method} ${request.url}`,
          exception instanceof Error ? exception.stack : String(exception),
        );
      }
    } else {
      this.logger.warn(`HTTP ${status} on ${request.method} ${request.url}`);
    }

    response.status(status).json(errorResponse);
  }
}
