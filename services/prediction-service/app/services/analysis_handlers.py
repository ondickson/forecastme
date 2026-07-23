from datetime import UTC, datetime
from typing import Protocol

from app.schemas.analysis import (
    AnalysisConfidence,
    AnalysisResult,
    AnalysisServiceRequest,
    AnalysisServiceResponse,
    AnalysisStatus,
    DataFreshness,
    FreshnessStatus,
    ModelInformation,
)


class AnalysisHandler(Protocol):
    async def process(
        self,
        request: AnalysisServiceRequest,
    ) -> AnalysisServiceResponse: ...


def _build_placeholder_response(
    request: AnalysisServiceRequest,
) -> AnalysisServiceResponse:
    return AnalysisServiceResponse(
        analysisId=request.analysis_id,
        status=AnalysisStatus.COMPLETED,
        result=AnalysisResult(
            directAnswer=(
                "ForecastMe cannot calculate a probability for this request..."
            ),
            probability=None,
            confidence=AnalysisConfidence(
                score=None,
                level=None,
                explanation=(
                    "Confidence cannot be scored because no probability was calculated."
                ),
            ),
            evidence=[],
            riskFactors=[],
            suggestedAction=None,
            sources=[],
            model=ModelInformation(
                name="forecastme-contract-validator",
                version="0.1.0",
                method="schema-validation-only",
            ),
            dataFreshness=DataFreshness(
                generatedAt=datetime.now(UTC),
                dataAsOf=None,
                status=FreshnessStatus.UNKNOWN,
            ),
        ),
        processingTimeMs=None,
        error=None,
    )


class GeneralResearchHandler(AnalysisHandler):
    async def process(
        self,
        request: AnalysisServiceRequest,
    ) -> AnalysisServiceResponse:
        return _build_placeholder_response(request)


class CustomDatasetHandler(AnalysisHandler):
    async def process(
        self,
        request: AnalysisServiceRequest,
    ) -> AnalysisServiceResponse:
        return _build_placeholder_response(request)


class SportsHandler(AnalysisHandler):
    async def process(
        self,
        request: AnalysisServiceRequest,
    ) -> AnalysisServiceResponse:
        return _build_placeholder_response(request)


class FinancialMarketHandler(AnalysisHandler):
    async def process(
        self,
        request: AnalysisServiceRequest,
    ) -> AnalysisServiceResponse:
        return _build_placeholder_response(request)
