from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class AnalysisDomain(StrEnum):
    GENERAL_RESEARCH = "GENERAL_RESEARCH"
    CUSTOM_DATASET = "CUSTOM_DATASET"
    SPORTS = "SPORTS"
    FINANCIAL_MARKET = "FINANCIAL_MARKET"
    UNSUPPORTED = "UNSUPPORTED"


class ClassificationRequest(BaseModel):
    prompt: str = Field(min_length=3, max_length=5000)


class ClassificationResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    domain: AnalysisDomain
    confidence: float = Field(ge=0, le=1)
    reasoning: str = Field(min_length=1)

    entities: list[str] = Field(default_factory=list)
    dates: list[str] = Field(default_factory=list)
    time_horizon: str | None = Field(default=None, alias="timeHorizon")

    prediction_intent: bool = Field(
        default=False,
        alias="predictionIntent",
    )
    comparison_intent: bool = Field(
        default=False,
        alias="comparisonIntent",
    )
    risk_intent: bool = Field(
        default=False,
        alias="riskIntent",
    )
