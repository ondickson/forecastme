from fastapi import APIRouter

from app.schemas.classification import (
    AnalysisDomain,
    ClassificationRequest,
    ClassificationResponse,
)

router = APIRouter(tags=["Classification"])


def classify_prompt(prompt: str) -> ClassificationResponse:
    normalized_prompt = prompt.lower()

    sports_keywords = {
        "match",
        "team",
        "player",
        "score",
        "football",
        "soccer",
        "basketball",
        "tennis",
        "odds",
    }

    financial_keywords = {
        "stock",
        "share",
        "market",
        "price",
        "portfolio",
        "investment",
        "equity",
        "forex",
        "bond",
    }

    dataset_keywords = {
        "csv",
        "excel",
        "spreadsheet",
        "dataset",
        "column",
        "row",
        "upload",
        "file",
    }

    if any(keyword in normalized_prompt for keyword in sports_keywords):
        return ClassificationResponse(
            domain=AnalysisDomain.SPORTS,
            confidence=0.9,
            reasoning="The prompt contains sports-related terminology.",
        )

    if any(keyword in normalized_prompt for keyword in financial_keywords):
        return ClassificationResponse(
            domain=AnalysisDomain.FINANCIAL_MARKET,
            confidence=0.9,
            reasoning="The prompt contains financial-market terminology.",
        )

    if any(keyword in normalized_prompt for keyword in dataset_keywords):
        return ClassificationResponse(
            domain=AnalysisDomain.CUSTOM_DATASET,
            confidence=0.85,
            reasoning="The prompt refers to an uploaded or structured dataset.",
        )

    return ClassificationResponse(
        domain=AnalysisDomain.GENERAL_RESEARCH,
        confidence=0.7,
        reasoning="No specialized domain indicators were detected.",
    )


@router.post(
    "/classify",
    response_model=ClassificationResponse,
)
async def classify(
    request: ClassificationRequest,
) -> ClassificationResponse:
    return classify_prompt(request.prompt)
