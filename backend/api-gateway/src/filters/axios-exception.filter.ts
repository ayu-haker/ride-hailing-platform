import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AxiosError } from 'axios';
import { Response } from 'express';

@Catch(AxiosError)
export class AxiosExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AxiosExceptionFilter.name);

  catch(exception: AxiosError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.BAD_GATEWAY;
    let errorResponse: any = {
      statusCode: status,
      message: 'Upstream service unavailable',
    };

    if (exception.response) {
      status = exception.response.status || HttpStatus.BAD_GATEWAY;
      const data = exception.response.data as any;
      errorResponse = data || {
        statusCode: status,
        message: exception.message,
      };
    }

    this.logger.error(
      `Upstream error: ${exception.config?.url} -> ${status}`,
    );

    response.status(status).json(errorResponse);
  }
}
