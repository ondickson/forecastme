from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class ApiErrorCode(StrEnum):
    VALIDATION_ERROR = "VALIDATION_ERROR"
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    NOT_FOUND = "NOT_FOUND"
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    ANALYSIS_FAILED = "ANALYSIS_FAILED"
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"


class ValidationIssue(BaseModel):
    field: str = Field(min_length=1)
    message: str = Field(min_length=1)


class ErrorResponse(BaseModel):
    status_code: int = Field(alias="statusCode", ge=400, le=599)
    code: ApiErrorCode
    message: str = Field(min_length=1)
    request_id: str | None = Field(default=None, alias="requestId")
    details: list[ValidationIssue] | None = None
    timestamp: datetime

    model_config = {
        "populate_by_name": True,
    }
