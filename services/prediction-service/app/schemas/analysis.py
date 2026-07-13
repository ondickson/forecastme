from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class AnalysisDomain(StrEnum):
    SPORTS = "sports"
    BETTING = "betting"
    STOCKS = "stocks"
    CRYPTO = "crypto"
    ECONOMICS = "economics"
    WEATHER = "weather"
    RISK = "risk"
    DATASET = "dataset"
    CUSTOM = "custom"


class AnalysisStatus(StrEnum):
    PENDING = "pending"
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class AnalysisOptions(BaseModel):
    include_explanation: bool | None = Field(
        default=None,
        alias="includeExplanation",
    )
    include_sources: bool | None = Field(
        default=None,
        alias="includeSources",
    )
    include_confidence: bool | None = Field(
        default=None,
        alias="includeConfidence",
    )
    time_horizon: str | None = Field(
        default=None,
        alias="timeHorizon",
    )
    risk_tolerance: Literal["low", "medium", "high"] | None = Field(
        default=None,
        alias="riskTolerance",
    )

    model_config = {
        "populate_by_name": True,
    }


class AnalysisServiceRequest(BaseModel):
    analysis_id: str = Field(
        alias="analysisId",
        min_length=1,
    )
    question: str = Field(
        min_length=3,
        max_length=5000,
    )
    domain: AnalysisDomain
    options: AnalysisOptions | None = None
    dataset_object_key: str | None = Field(
        default=None,
        alias="datasetObjectKey",
    )
    correlation_id: str = Field(
        alias="correlationId",
        min_length=1,
    )

    model_config = {
        "populate_by_name": True,
    }


class AnalysisSource(BaseModel):
    name: str = Field(min_length=1)
    type: Literal["api", "dataset", "document", "model", "manual"]
    reference: str | None = None
    retrieved_at: str | None = Field(
        default=None,
        alias="retrievedAt",
    )

    model_config = {
        "populate_by_name": True,
    }


class ModelMetadata(BaseModel):
    name: str = Field(min_length=1)
    version: str = Field(min_length=1)
    trained_at: str | None = Field(
        default=None,
        alias="trainedAt",
    )

    model_config = {
        "populate_by_name": True,
    }


class PredictionResult(BaseModel):
    outcome: str = Field(min_length=1)
    probability: float = Field(ge=0, le=1)
    confidence: float | None = Field(default=None, ge=0, le=1)
    expected_value: float | None = Field(
        default=None,
        alias="expectedValue",
    )
    recommendation: str | None = None

    model_config = {
        "populate_by_name": True,
    }

    @field_validator("expected_value")
    @classmethod
    def validate_expected_value(cls, value: float | None) -> float | None:
        if value is not None and not float("-inf") < value < float("inf"):
            raise ValueError("expectedValue must be a finite number")

        return value


class AnalysisError(BaseModel):
    code: str = Field(min_length=1)
    message: str = Field(min_length=1)


class AnalysisServiceResponse(BaseModel):
    analysis_id: str = Field(
        alias="analysisId",
        min_length=1,
    )
    status: AnalysisStatus
    result: PredictionResult | None = None
    summary: str | None = None
    assumptions: list[str] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
    sources: list[AnalysisSource] = Field(default_factory=list)
    model: ModelMetadata | None = None
    processing_time_ms: float | None = Field(
        default=None,
        alias="processingTimeMs",
        ge=0,
    )
    error: AnalysisError | None = None

    model_config = {
        "populate_by_name": True,
    }

    @field_validator("result")
    @classmethod
    def completed_analysis_requires_result(
        cls,
        value: PredictionResult | None,
        info,
    ) -> PredictionResult | None:
        status = info.data.get("status")

        if status == AnalysisStatus.COMPLETED and value is None:
            raise ValueError("A completed analysis must contain a result")

        return value
