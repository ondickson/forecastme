import logging
import re
from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.config import Settings, get_settings
from app.schemas.classification import (
    AnalysisDomain,
    ClassificationRequest,
    ClassificationResponse,
    ClassificationTask,
    ClassifierSource,
)
from app.services.openrouter_classifier import (
    OpenRouterClassificationError,
    classify_with_openrouter,
)

router = APIRouter(tags=["Classification"])
logger = logging.getLogger(__name__)


def extract_entities(prompt: str) -> list[str]:
    entity_pattern = re.compile(
        r"\b(?:[A-Z]{2,}|[A-Z][a-z]+)"
        r"(?:\s+(?:[A-Z]{2,}|[A-Z][a-z]+))*\b"
    )

    leading_words = {
        "Analyze",
        "Are",
        "Can",
        "Compare",
        "Could",
        "Do",
        "Does",
        "Explain",
        "How",
        "Is",
        "Predict",
        "Should",
        "The",
        "What",
        "When",
        "Where",
        "Which",
        "Who",
        "Why",
        "Will",
        "Would",
    }

    ignored_entities = {
        "CSV",
        "Excel",
        "JSON",
    }

    entities: list[str] = []

    for match in entity_pattern.finditer(prompt):
        words = match.group(0).split()

        while words and words[0] in leading_words:
            words.pop(0)

        entity = " ".join(words)

        if entity and entity not in ignored_entities and entity not in entities:
            entities.append(entity)

    return entities


def extract_dates(prompt: str) -> list[str]:
    month_names = (
        r"January|February|March|April|May|June|July|August|"
        r"September|October|November|December"
    )

    date_patterns = (
        r"\b\d{4}-\d{2}-\d{2}\b",
        rf"\b(?:{month_names})\s+\d{{1,2}}(?:,\s+\d{{4}})?\b",
        rf"\b\d{{1,2}}\s+(?:{month_names})(?:\s+\d{{4}})?\b",
        r"\b(?:today|tomorrow|yesterday)\b",
        r"\bnext\s+(?:day|week|month|quarter|year)\b",
        r"\bthis\s+(?:week|month|quarter|year)\b",
    )

    dates: list[str] = []

    for pattern in date_patterns:
        for match in re.finditer(pattern, prompt, flags=re.IGNORECASE):
            date = match.group(0)

            if date not in dates:
                dates.append(date)

    return dates


def detect_time_horizon(prompt: str) -> str | None:
    horizon_patterns = (
        r"\bnext\s+\d+\s+(?:day|days|week|weeks|month|months|year|years)\b",
        r"\bin\s+\d+\s+(?:day|days|week|weeks|month|months|year|years)\b",
        r"\bwithin\s+\d+\s+(?:day|days|week|weeks|month|months|year|years)\b",
        r"\bby\s+\d{4}\b",
        r"\b(?:today|tomorrow)\b",
        r"\bnext\s+(?:day|week|month|quarter|year|match|game|season)\b",
        r"\bthis\s+(?:week|month|quarter|year|season)\b",
        r"\b(?:short|medium|long)[ -]term\b",
    )

    for pattern in horizon_patterns:
        match = re.search(pattern, prompt, flags=re.IGNORECASE)

        if match:
            return match.group(0)

    return None


def contains_any(prompt: str, keywords: set[str]) -> bool:
    return any(keyword in prompt for keyword in keywords)


def determine_task(
    domain: AnalysisDomain,
    *,
    is_supported: bool,
    prediction_intent: bool,
    comparison_intent: bool,
    risk_intent: bool,
) -> ClassificationTask:
    if not is_supported:
        return ClassificationTask.UNSUPPORTED

    if comparison_intent:
        return ClassificationTask.COMPARISON

    if risk_intent:
        return ClassificationTask.RISK_ASSESSMENT

    if domain == AnalysisDomain.CUSTOM_DATASET:
        return ClassificationTask.DATASET_ANALYSIS

    if prediction_intent:
        if domain == AnalysisDomain.FINANCIAL_MARKET:
            return ClassificationTask.DIRECTIONAL_FORECAST

        return ClassificationTask.OUTCOME_FORECAST

    return ClassificationTask.GENERAL_RESEARCH


def determine_live_data_requirement(
    prompt: str,
    domain: AnalysisDomain,
    *,
    is_supported: bool,
    prediction_intent: bool,
) -> bool:
    if not is_supported or domain == AnalysisDomain.CUSTOM_DATASET:
        return False

    live_data_keywords = {
        "current",
        "currently",
        "latest",
        "live",
        "now",
        "right now",
        "today",
        "tomorrow",
        "this week",
        "this month",
        "this quarter",
        "this season",
        "next match",
        "next game",
    }

    return (
        domain
        in {
            AnalysisDomain.SPORTS,
            AnalysisDomain.FINANCIAL_MARKET,
        }
        or prediction_intent
        or contains_any(prompt.lower(), live_data_keywords)
    )


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

    unsupported_keywords = {
        "bitcoin",
        "crypto",
        "cryptocurrency",
        "diagnose me",
        "election prediction",
        "ethereum",
        "legal advice",
        "rainfall forecast",
        "temperature forecast",
        "weather forecast",
    }

    prediction_keywords = {
        "chance",
        "chances",
        "forecast",
        "likelihood",
        "odds",
        "predict",
        "probability",
        "will ",
    }

    comparison_keywords = {
        "better than",
        "compare",
        "comparison",
        "difference between",
        " versus ",
        " vs ",
    }

    risk_keywords = {
        "danger",
        "downside",
        "risk",
        "risky",
        "threat",
        "uncertainty",
        "volatility",
    }

    entities = extract_entities(prompt)
    dates = extract_dates(prompt)
    time_horizon = detect_time_horizon(prompt)
    prediction_intent = contains_any(
        normalized_prompt,
        prediction_keywords,
    )
    comparison_intent = contains_any(
        normalized_prompt,
        comparison_keywords,
    )
    risk_intent = contains_any(
        normalized_prompt,
        risk_keywords,
    )

    def build_response(
        domain: AnalysisDomain,
        confidence: float,
        reasoning: str,
        is_supported: bool = True,
    ) -> ClassificationResponse:
        task = determine_task(
            domain,
            is_supported=is_supported,
            prediction_intent=prediction_intent,
            comparison_intent=comparison_intent,
            risk_intent=risk_intent,
        )

        requires_live_data = determine_live_data_requirement(
            prompt,
            domain,
            is_supported=is_supported,
            prediction_intent=prediction_intent,
        )

        return ClassificationResponse(
            domain=domain,
            task=task,
            confidence=confidence,
            reasoning=reasoning,
            isSupported=is_supported,
            entities=entities,
            dates=dates,
            timeHorizon=time_horizon,
            requiresLiveData=requires_live_data,
            classifier=ClassifierSource.RULE_BASED_FALLBACK,
            predictionIntent=prediction_intent,
            comparisonIntent=comparison_intent,
            riskIntent=risk_intent,
        )

    if contains_any(normalized_prompt, unsupported_keywords):
        return build_response(
            domain=AnalysisDomain.GENERAL_RESEARCH,
            confidence=0.95,
            reasoning=(
                "The prompt requests a domain or capability that is not supported."
            ),
            is_supported=False,
        )

    if contains_any(normalized_prompt, sports_keywords):
        return build_response(
            domain=AnalysisDomain.SPORTS,
            confidence=0.9,
            reasoning="The prompt contains sports-related terminology.",
        )

    if contains_any(normalized_prompt, financial_keywords):
        return build_response(
            domain=AnalysisDomain.FINANCIAL_MARKET,
            confidence=0.9,
            reasoning="The prompt contains financial-market terminology.",
        )

    if contains_any(normalized_prompt, dataset_keywords):
        return build_response(
            domain=AnalysisDomain.CUSTOM_DATASET,
            confidence=0.85,
            reasoning="The prompt refers to an uploaded or structured dataset.",
        )

    return build_response(
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
    settings: Annotated[Settings, Depends(get_settings)],
) -> ClassificationResponse:
    if settings.openrouter_available:
        try:
            return await classify_with_openrouter(
                request.prompt,
                settings,
            )
        except OpenRouterClassificationError as error:
            logger.warning(
                (
                    "OpenRouter classification failed; "
                    "using rule-based fallback. error_type=%s"
                ),
                type(error).__name__,
            )

    return classify_prompt(request.prompt)
