from typing import Any

import httpx
from pydantic import BaseModel, Field, ValidationError

from app.core.config import Settings
from app.schemas.classification import (
    ClassificationPayload,
    ClassificationResponse,
    ClassifierSource,
)

SYSTEM_PROMPT = """
You are the request classifier for ForecastMe, a multi-domain predictive
intelligence and decision-support platform.

Classify the user's request using exactly one supported domain:

- GENERAL_RESEARCH
- CUSTOM_DATASET
- SPORTS
- FINANCIAL_MARKET

Prediction markets and sportsbooks are provider contexts, not product domains.

Use exactly one task:

- GENERAL_RESEARCH
- DATASET_ANALYSIS
- OUTCOME_FORECAST
- DIRECTIONAL_FORECAST
- COMPARISON
- RISK_ASSESSMENT
- UNSUPPORTED

Requests for weather forecasting, cryptocurrency analysis, election prediction,
medical diagnosis, or legal advice are unsupported for the MVP. For unsupported
requests, use GENERAL_RESEARCH as the domain, UNSUPPORTED as the task,
isSupported=false, and requiresLiveData=false.

Use DIRECTIONAL_FORECAST for financial-market direction questions.
Use OUTCOME_FORECAST for supported non-financial outcome predictions.
Use DATASET_ANALYSIS for uploaded CSV, Excel, JSON, or structured-data analysis.
Use COMPARISON when comparison is the primary intent.
Use RISK_ASSESSMENT when risk is the primary intent.

requiresLiveData must be true when answering accurately requires current or
recent external information. Uploaded dataset analysis does not require live
external data.

Extract only clearly named entities and explicitly stated dates.
Preserve explicit time-horizon wording when present; otherwise use null.

Return only the JSON object required by the response schema.
""".strip()


class OpenRouterMessage(BaseModel):
    content: str = Field(min_length=1)


class OpenRouterChoice(BaseModel):
    message: OpenRouterMessage


class OpenRouterResponse(BaseModel):
    choices: list[OpenRouterChoice] = Field(min_length=1)


class OpenRouterClassificationError(RuntimeError):
    pass


def build_request_payload(
    prompt: str,
    settings: Settings,
) -> dict[str, Any]:
    return {
        "model": settings.openrouter_model,
        "messages": [
            {
                "role": "system",
                "content": SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        "temperature": 0,
        "max_tokens": 1000,
        "provider": {
            "require_parameters": True,
        },
        "response_format": {
            "type": "json_schema",
            "json_schema": {
                "name": "forecastme_classification",
                "strict": True,
                "schema": ClassificationPayload.model_json_schema(
                    by_alias=True,
                ),
            },
        },
    }


async def classify_with_openrouter(
    prompt: str,
    settings: Settings,
) -> ClassificationResponse:
    if not settings.openrouter_available:
        raise OpenRouterClassificationError(
            "OpenRouter classification is not configured."
        )

    api_key = settings.openrouter_api_key

    if api_key is None:
        raise OpenRouterClassificationError(
            "OpenRouter classification is not configured."
        )

    url = f"{settings.openrouter_base_url.rstrip('/')}/chat/completions"

    headers = {
        "Authorization": (f"Bearer {api_key.get_secret_value()}"),
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(
            timeout=settings.openrouter_timeout_seconds,
        ) as client:
            response = await client.post(
                url,
                headers=headers,
                json=build_request_payload(prompt, settings),
            )

        response.raise_for_status()
    except httpx.HTTPError as error:
        raise OpenRouterClassificationError("OpenRouter request failed.") from error

    try:
        provider_response = OpenRouterResponse.model_validate(response.json())
        content = provider_response.choices[0].message.content
        classification = ClassificationPayload.model_validate_json(content)
    except (ValueError, ValidationError, IndexError) as error:
        raise OpenRouterClassificationError(
            "OpenRouter returned an invalid classification response."
        ) from error

    return ClassificationResponse.model_validate(
        {
            **classification.model_dump(by_alias=True),
            "classifier": ClassifierSource.LLM,
        }
    )
