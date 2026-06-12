import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpException');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Log the actual detailed stack trace on the server securely
    this.logger.error(
      `Exception caught: ${exception instanceof Error ? exception.message : JSON.stringify(exception)}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    // Return sanitized response to the client
    const responseBody = typeof message === 'string'
      ? { statusCode: status, message }
      : { statusCode: status, ...(message as object) };

    response.status(status).json(responseBody);
  }
}
