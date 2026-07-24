from datetime import UTC, datetime
from typing import Protocol

from app.core.config import Settings
from app.schemas.analysis import (
    AnalysisConfidence,
    AnalysisResult,
    AnalysisServiceRequest,
    AnalysisServiceResponse,
    AnalysisSource,
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


class GeneralResearchSearch(Protocol):
    async def __call__(
        self,
        question: str,
        settings: Settings,
        *,
        request_id: str | None = None,
    ) -> list[AnalysisSource]: ...


def _build_placeholder_response(
    request: AnalysisServiceRequest,
    *,
    sources: list[AnalysisSource] | None = None,
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
            sources=[] if sources is None else sources,
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
    def __init__(
        self,
        *,
        settings: Settings,
        search_provider: GeneralResearchSearch,
    ) -> None:
        self._settings = settings
        self._search_provider = search_provider

    async def process(
        self,
        request: AnalysisServiceRequest,
    ) -> AnalysisServiceResponse:
        sources = await self._search_provider(
            request.question,
            self._settings,
            request_id=request.correlation_id,
        )

        return _build_placeholder_response(
            request,
            sources=sources,
        )


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
