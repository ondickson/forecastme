/**
 * Shared API error codes.
 *
 * These codes allow the frontend to respond to errors without depending on
 * human-readable error messages.
 */
export enum ApiErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  ANALYSIS_FAILED = "ANALYSIS_FAILED",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
}

/**
 * Standard field-level validation error.
 */
export interface ValidationIssue {
  field: string;
  message: string;
}

/**
 * Standard API error response returned by ForecastMe services.
 */
export interface ErrorResponse {
  statusCode: number;
  code: ApiErrorCode;
  message: string;
  correlationId?: string;
  details?: ValidationIssue[];
  timestamp: string;
}

/**
 * Generic pagination metadata.
 */
export interface PaginationMetadata {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Generic paginated response.
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}