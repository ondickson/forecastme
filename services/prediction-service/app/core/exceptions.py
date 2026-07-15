import logging
from datetime import UTC, datetime
from typing import Any

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.schemas.common import (
    ApiErrorCode,
    ErrorResponse,
    ValidationIssue,
)

logger = logging.getLogger(__name__)


def get_request_id(request: Request) -> str | None:
    request_id: Any = getattr(request.state, "request_id", None)

    if isinstance(request_id, str):
        return request_id

    return None


def create_error_response(
    *,
    request: Request,
    status_code: int,
    code: ApiErrorCode,
    message: str,
    details: list[ValidationIssue] | None = None,
) -> JSONResponse:
    error = ErrorResponse(
        statusCode=status_code,
        code=code,
        message=message,
        requestId=get_request_id(request),
        details=details,
        timestamp=datetime.now(UTC),
    )

    return JSONResponse(
        status_code=status_code,
        content=error.model_dump(
            mode="json",
            by_alias=True,
            exclude_none=True,
        ),
    )


async def validation_exception_handler(
    request: Request,
    exception: Exception,
) -> JSONResponse:
    if not isinstance(exception, RequestValidationError):
        raise exception

    details: list[ValidationIssue] = []

    for error in exception.errors():
        location = ".".join(str(part) for part in error["loc"])

        details.append(
            ValidationIssue(
                field=location,
                message=str(error["msg"]),
            ),
        )

    return create_error_response(
        request=request,
        status_code=422,
        code=ApiErrorCode.VALIDATION_ERROR,
        message="Request validation failed",
        details=details,
    )


async def http_exception_handler(
    request: Request,
    exception: Exception,
) -> JSONResponse:
    if not isinstance(exception, StarletteHTTPException):
        raise exception

    code = ApiErrorCode.INTERNAL_SERVER_ERROR

    if exception.status_code == 401:
        code = ApiErrorCode.UNAUTHORIZED
    elif exception.status_code == 403:
        code = ApiErrorCode.FORBIDDEN
    elif exception.status_code == 404:
        code = ApiErrorCode.NOT_FOUND
    elif exception.status_code == 429:
        code = ApiErrorCode.RATE_LIMIT_EXCEEDED
    elif exception.status_code == 503:
        code = ApiErrorCode.SERVICE_UNAVAILABLE

    return create_error_response(
        request=request,
        status_code=exception.status_code,
        code=code,
        message=str(exception.detail),
    )


async def unhandled_exception_handler(
    request: Request,
    exception: Exception,
) -> JSONResponse:
    request_id = get_request_id(request)

    logger.exception(
        "Unhandled application exception",
        exc_info=exception,
        extra={"request_id": request_id},
    )

    return create_error_response(
        request=request,
        status_code=500,
        code=ApiErrorCode.INTERNAL_SERVER_ERROR,
        message="An unexpected error occurred",
    )
