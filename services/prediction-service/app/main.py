from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.exceptions import (
    http_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)
from app.core.logging import configure_logging
from app.middleware.request_id import RequestIdMiddleware
from app.routers.classification import router as classification_router
from app.routers.health import router as health_router
from app.schemas.analysis import (
    AnalysisServiceRequest,
    AnalysisServiceResponse,
    AnalysisStatus,
    PredictionResult,
)

configure_logging()

app = FastAPI(
    title="ForecastMe Prediction Service",
    description="Python analysis service for ForecastMe",
    version="0.1.0",
)

app.add_middleware(RequestIdMiddleware)

app.add_exception_handler(
    RequestValidationError,
    validation_exception_handler,
)
app.add_exception_handler(
    StarletteHTTPException,
    http_exception_handler,
)
app.add_exception_handler(
    Exception,
    unhandled_exception_handler,
)

app.include_router(health_router)
app.include_router(classification_router)


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "service": "forecastme-prediction-service",
        "status": "running",
    }


@app.post(
    "/internal/v1/analyses",
    response_model=AnalysisServiceResponse,
    tags=["Legacy Analysis Contract"],
)
async def create_analysis(
    request: AnalysisServiceRequest,
) -> AnalysisServiceResponse:
    return AnalysisServiceResponse(
        analysisId=request.analysis_id,
        status=AnalysisStatus.COMPLETED,
        result=PredictionResult(
            outcome="Contract validation successful",
            probability=0.5,
            confidence=0.5,
            recommendation="Continue implementing the analysis pipeline.",
        ),
        summary="The request passed the shared ForecastMe analysis contract.",
        assumptions=[
            "This is a temporary contract-testing response.",
        ],
        limitations=[
            "No production prediction model has been executed.",
        ],
        sources=[],
        processingTimeMs=0,
    )
