from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field

from .domain import AnalysisDomain as AnalysisDomain


class ClassificationTask(StrEnum):
    GENERAL_RESEARCH = "GENERAL_RESEARCH"
    DATASET_ANALYSIS = "DATASET_ANALYSIS"
    OUTCOME_FORECAST = "OUTCOME_FORECAST"
    DIRECTIONAL_FORECAST = "DIRECTIONAL_FORECAST"
    COMPARISON = "COMPARISON"
    RISK_ASSESSMENT = "RISK_ASSESSMENT"
    UNSUPPORTED = "UNSUPPORTED"


class ClassifierSource(StrEnum):
    LLM = "LLM"
    RULE_BASED_FALLBACK = "RULE_BASED_FALLBACK"


class ClassificationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    prompt: str = Field(min_length=3, max_length=5000)


class ClassificationPayload(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        extra="forbid",
    )

    domain: AnalysisDomain
    task: ClassificationTask
    confidence: float = Field(ge=0, le=1)
    reasoning: str = Field(min_length=1)
    is_supported: bool = Field(alias="isSupported")

    entities: list[str]
    dates: list[str]
    time_horizon: str | None = Field(alias="timeHorizon")

    requires_live_data: bool = Field(alias="requiresLiveData")

    prediction_intent: bool = Field(alias="predictionIntent")
    comparison_intent: bool = Field(alias="comparisonIntent")
    risk_intent: bool = Field(alias="riskIntent")


class ClassificationResponse(ClassificationPayload):
    classifier: ClassifierSource
