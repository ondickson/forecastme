from fastapi import FastAPI

from app.schemas.analysis import (
    AnalysisServiceRequest,
    AnalysisServiceResponse,
    AnalysisStatus,
    PredictionResult,
)


app = FastAPI(
    title="ForecastMe Prediction Service",
    version="0.1.0",
)


@app.get("/")
def root() -> dict[str, str]:
    return {
        "service": "forecastme-prediction-service",
        "status": "running",
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy"}



@app.post(
    "/internal/v1/analyses",
    response_model=AnalysisServiceResponse,
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
        summary=(
            "The request passed the shared ForecastMe analysis contract."
        ),
        assumptions=[
            "This is a temporary contract-testing response.",
        ],
        limitations=[
            "No production prediction model has been executed.",
        ],
        sources=[],
        processingTimeMs=0,
    )