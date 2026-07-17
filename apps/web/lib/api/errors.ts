export interface ApiErrorPayload {
  statusCode?: number;
  error?: string;
  message?: string | string[];
  path?: string;
  method?: string;
  requestId?: string;
  timestamp?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly requestId?: string;
  readonly payload?: ApiErrorPayload;

  constructor(
    message: string,
    options: {
      status: number;
      code?: string;
      requestId?: string;
      payload?: ApiErrorPayload;
    },
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status;
    this.code = options.code;
    this.requestId = options.requestId;
    this.payload = options.payload;
  }
}
