import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ApiMessageErrorPayload,
  ApiValidationErrorPayload,
} from '../models/api-error.model';

@Injectable({ providedIn: 'root' })
export class ApiErrorService {
  toMessages(
    error: unknown,
    fallback = 'No se pudo completar la operacion.',
  ): string[] {
    if (!(error instanceof HttpErrorResponse)) {
      return [fallback];
    }

    if (error.status === 0) {
      return [
        'No pudimos conectar con la API. Revisa que el backend este levantado y vuelve a intentar.',
      ];
    }

    if (error.status === 422) {
      const payload = error.error as ApiValidationErrorPayload | null;
      if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
        return payload.errors;
      }
    }

    const payload = error.error as ApiMessageErrorPayload | null;
    if (typeof payload?.message === 'string' && payload.message.trim().length > 0) {
      return [payload.message];
    }

    if (Array.isArray(payload?.message) && payload.message.length > 0) {
      return payload.message.map((message) => String(message));
    }

    if (typeof error.message === 'string' && error.message.trim().length > 0) {
      return [error.message];
    }

    return [fallback];
  }

  isNotFound(error: unknown): boolean {
    return error instanceof HttpErrorResponse && error.status === 404;
  }
}
