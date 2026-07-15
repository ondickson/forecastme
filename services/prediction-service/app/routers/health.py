from datetime import UTC, datetime

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["Health"])


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: datetime


@router.get(
    "/health",
    response_model=HealthResponse,
)
async def get_health() -> HealthResponse:
    return HealthResponse(
        status="healthy",
        service="forecastme-prediction-service",
        version="0.1.0",
        timestamp=datetime.now(UTC),
    )
