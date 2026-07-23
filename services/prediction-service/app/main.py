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
from app.schemas.analysis import AnalysisServiceRequest, AnalysisServiceResponse
from app.services.analysis_handlers import (
    CustomDatasetHandler,
    FinancialMarketHandler,
    GeneralResearchHandler,
    SportsHandler,
)
from app.services.domain_router import DomainRouter

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

domain_router = DomainRouter(
    general_research_handler=GeneralResearchHandler(),
    custom_dataset_handler=CustomDatasetHandler(),
    sports_handler=SportsHandler(),
    financial_market_handler=FinancialMarketHandler(),
)


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "service": "forecastme-prediction-service",
        "status": "running",
    }


@app.post(
    "/internal/v1/analyses",
    response_model=AnalysisServiceResponse,
    tags=["Analysis"],
)
async def create_analysis(
    request: AnalysisServiceRequest,
) -> AnalysisServiceResponse:
    return await domain_router.route(request)
