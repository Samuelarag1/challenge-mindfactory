export interface ApiValidationErrorPayload {
  statusCode?: number;
  errors?: string[];
}

export interface ApiMessageErrorPayload {
  statusCode?: number;
  message?: string | string[];
}
