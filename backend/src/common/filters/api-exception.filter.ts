import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

type ErrorMessage = string | string[];
type DatabaseDriverError = Error & {
  code?: string;
  detail?: string;
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    if (exception instanceof QueryFailedError) {
      return this.handleQueryFailedError(
        exception as QueryFailedError<DatabaseDriverError>,
        response,
        request,
      );
    }

    if (exception instanceof HttpException) {
      return this.handleHttpException(exception, response, request);
    }

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'Ocurrio un error inesperado.',
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private handleHttpException(
    exception: HttpException,
    response: Response,
    request: Request,
  ) {
    const status = exception.getStatus() as HttpStatus;
    const payload = exception.getResponse();
    const body =
      typeof payload === 'string'
        ? { message: payload }
        : (payload as Record<string, unknown>);

    const basePayload = {
      statusCode: status,
      error:
        typeof body.error === 'string'
          ? body.error
          : status === HttpStatus.UNPROCESSABLE_ENTITY
            ? 'Unprocessable Entity'
            : exception.name,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    if (status === HttpStatus.UNPROCESSABLE_ENTITY) {
      return response.status(status).json({
        ...basePayload,
        errors: this.normalizeErrors(body.errors ?? body.message),
      });
    }

    return response.status(status).json({
      ...basePayload,
      message: this.normalizeMessage(body.message),
    });
  }

  private handleQueryFailedError(
    exception: QueryFailedError<DatabaseDriverError>,
    response: Response,
    request: Request,
  ) {
    const driverError = exception.driverError;

    if (driverError.code === '23505') {
      const duplicate = this.extractDuplicateMetadata(driverError.detail);
      const label =
        duplicate.field === 'dominio' && duplicate.value
          ? `Ya existe un automotor con dominio ${duplicate.value}.`
          : duplicate.field === 'cuit' && duplicate.value
            ? `Ya existe un sujeto con CUIT ${duplicate.value}.`
            : 'El registro que intentas guardar ya existe.';

      return this.handleHttpException(
        new UnprocessableEntityException({
          errors: [label],
        }),
        response,
        request,
      );
    }

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'No se pudo completar la operacion contra la base de datos.',
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private extractDuplicateMetadata(detail?: string) {
    const match = detail?.match(/\(([^)]+)\)=\(([^)]+)\)/);

    return {
      field: match?.[1],
      value: match?.[2],
    };
  }

  private normalizeMessage(message: unknown): ErrorMessage {
    if (Array.isArray(message)) {
      return message.map((item) => String(item)).join('; ');
    }

    if (typeof message === 'string') {
      return message;
    }

    return 'Ocurrio un error.';
  }

  private normalizeErrors(errors: unknown) {
    if (Array.isArray(errors)) {
      return errors.map((item) => String(item));
    }

    if (typeof errors === 'string') {
      return [errors];
    }

    return ['Ocurrio un error de validacion.'];
  }
}
