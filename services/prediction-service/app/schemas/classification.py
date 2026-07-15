from enum import StrEnum

from pydantic import BaseModel, Field


class AnalysisDomain(StrEnum):
    GENERAL_RESEARCH = "GENERAL_RESEARCH"
    CUSTOM_DATASET = "CUSTOM_DATASET"
    SPORTS = "SPORTS"
    FINANCIAL_MARKET = "FINANCIAL_MARKET"


class ClassificationRequest(BaseModel):
    prompt: str = Field(min_length=3, max_length=5000)


class ClassificationResponse(BaseModel):
    domain: AnalysisDomain
    confidence: float = Field(ge=0, le=1)
    reasoning: str = Field(min_length=1)
