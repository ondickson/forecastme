from datetime import UTC, datetime
from enum import StrEnum
from typing import Literal, Self

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    HttpUrl,
    field_validator,
    model_validator,
)


class ContractModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        extra="forbid",
        str_strip_whitespace=True,
    )


class AnalysisDomain(StrEnum):
    GENERAL_RESEARCH = "general_research"
    CUSTOM_DATASET = "custom_dataset"
    SPORTS = "sports"
    FINANCIAL_MARKET = "financial_market"


class AnalysisStatus(StrEnum):
    PENDING = "pending"
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ConfidenceLevel(StrEnum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class EvidenceImpact(StrEnum):
    SUPPORTS = "SUPPORTS"
    OPPOSES = "OPPOSES"
    NEUTRAL = "NEUTRAL"


class StrengthLevel(StrEnum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class FreshnessStatus(StrEnum):
    CURRENT = "CURRENT"
    AGING = "AGING"
    STALE = "STALE"
    UNKNOWN = "UNKNOWN"


class AnalysisOptions(ContractModel):
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
        alias="riskPreference",
    )


class AnalysisServiceRequest(ContractModel):
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


class AnalysisConfidence(ContractModel):
    score: float | None = Field(ge=0, le=1)
    level: ConfidenceLevel | None
    explanation: str | None

    @model_validator(mode="after")
    def validate_score_and_level(self) -> Self:
        if (self.score is None) != (self.level is None):
            raise ValueError(
                "confidence score and level must either both be set or both be null"
            )

        return self


class EvidenceItem(ContractModel):
    id: str = Field(min_length=1)
    title: str = Field(min_length=1)
    description: str = Field(min_length=1)
    impact: EvidenceImpact | None
    strength: StrengthLevel | None


class RiskFactor(ContractModel):
    id: str = Field(min_length=1)
    title: str = Field(min_length=1)
    description: str = Field(min_length=1)
    severity: StrengthLevel | None


class AnalysisSource(ContractModel):
    id: str = Field(min_length=1)
    title: str = Field(min_length=1)
    url: HttpUrl | None
    publisher: str | None
    retrieved_at: datetime | None = Field(alias="retrievedAt")

    @field_validator("retrieved_at")
    @classmethod
    def validate_retrieved_at(
        cls,
        value: datetime | None,
    ) -> datetime | None:
        if value is None:
            return None

        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("retrievedAt must include a timezone")

        return value.astimezone(UTC)


class ModelInformation(ContractModel):
    name: str = Field(min_length=1)
    version: str = Field(min_length=1)
    method: str | None


class DataFreshness(ContractModel):
    generated_at: datetime = Field(alias="generatedAt")
    data_as_of: datetime | None = Field(alias="dataAsOf")
    status: FreshnessStatus

    @field_validator("generated_at")
    @classmethod
    def validate_generated_at(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("generatedAt must include a timezone")

        return value.astimezone(UTC)

    @field_validator("data_as_of")
    @classmethod
    def validate_data_as_of(
        cls,
        value: datetime | None,
    ) -> datetime | None:
        if value is None:
            return None

        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("dataAsOf must include a timezone")

        return value.astimezone(UTC)


class AnalysisResult(ContractModel):
    direct_answer: str = Field(
        alias="directAnswer",
        min_length=1,
    )
    probability: float | None = Field(ge=0, le=1)
    confidence: AnalysisConfidence
    evidence: list[EvidenceItem] = Field(default_factory=list)
    risk_factors: list[RiskFactor] = Field(
        default_factory=list,
        alias="riskFactors",
    )
    suggested_action: str | None = Field(alias="suggestedAction")
    sources: list[AnalysisSource] = Field(default_factory=list)
    model: ModelInformation
    data_freshness: DataFreshness = Field(alias="dataFreshness")


class AnalysisError(ContractModel):
    code: str = Field(min_length=1)
    message: str = Field(min_length=1)


class AnalysisServiceResponse(ContractModel):
    analysis_id: str = Field(
        alias="analysisId",
        min_length=1,
    )
    status: AnalysisStatus
    result: AnalysisResult | None
    processing_time_ms: float | None = Field(
        alias="processingTimeMs",
        ge=0,
    )
    error: AnalysisError | None

    @model_validator(mode="after")
    def validate_status_payload(self) -> Self:
        if self.status == AnalysisStatus.COMPLETED and self.result is None:
            raise ValueError("A completed analysis must contain a result")

        if self.status == AnalysisStatus.FAILED and self.error is None:
            raise ValueError("A failed analysis must contain an error")

        if self.status == AnalysisStatus.FAILED and self.result is not None:
            raise ValueError("A failed analysis cannot contain a result")

        if self.status != AnalysisStatus.FAILED and self.error is not None:
            raise ValueError("Only a failed analysis can contain an error")

        return self
