import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    response.status(status).json({
      success: false,
      statusCode: status,
      message: exceptionResponse.message || exception.message,
      errors: exceptionResponse.errors || undefined,
      // Scheduling conflicts (activation/reschedule/session edit): structured
      // lines the frontend renders so staff see exactly what blocked the call.
      conflicts: Array.isArray(exceptionResponse.conflicts) ? exceptionResponse.conflicts : undefined,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
