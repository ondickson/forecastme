import json
from datetime import UTC, datetime
from unittest.mock import AsyncMock, Mock

import httpx
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.core.config import Settings, get_settings
from app.main import app
from app.schemas.analysis import (
    AnalysisConfidence,
    AnalysisResult,
    AnalysisServiceResponse,
    AnalysisStatus,
    DataFreshness,
    FreshnessStatus,
    ModelInformation,
)


def get_test_settings() -> Settings:
    return Settings(
        openrouter_enabled=False,
        openrouter_api_key=None,
    )


def get_openrouter_test_settings() -> Settings:
    return Settings(
        openrouter_enabled=True,
        openrouter_api_key="test-openrouter-key",
        openrouter_base_url="https://openrouter.test/api/v1",
        openrouter_model="test-classification-model",
        openrouter_timeout_seconds=2,
    )


app.dependency_overrides[get_settings] = get_test_settings

client = TestClient(app)

OPENROUTER_REQUEST = httpx.Request(
    "POST",
    "https://openrouter.test/api/v1/chat/completions",
)


def classify_with_mocked_openrouter(
    monkeypatch: pytest.MonkeyPatch,
    provider_result: httpx.Response | httpx.HTTPError,
) -> httpx.Response:
    mock_client = AsyncMock()
    mock_client.__aenter__.return_value = mock_client

    if isinstance(provider_result, httpx.HTTPError):
        mock_client.post.side_effect = provider_result
    else:
        mock_client.post.return_value = provider_result

    monkeypatch.setattr(
        httpx,
        "AsyncClient",
        lambda **_kwargs: mock_client,
    )

    app.dependency_overrides[get_settings] = get_openrouter_test_settings

    try:
        return client.post(
            "/classify",
            json={
                "prompt": "Will Tesla stock rise within 3 months?",
            },
        )
    finally:
        app.dependency_overrides[get_settings] = get_test_settings


@pytest.mark.parametrize(
    ("openrouter_enabled", "openrouter_api_key"),
    [
        pytest.param(False, "test-key", id="disabled"),
        pytest.param(True, None, id="missing-api-key"),
        pytest.param(True, "   ", id="blank-api-key"),
    ],
)
def test_classify_skips_openrouter_when_configuration_is_unavailable(
    monkeypatch: pytest.MonkeyPatch,
    openrouter_enabled: bool,
    openrouter_api_key: str | None,
) -> None:
    async_client = Mock()
    monkeypatch.setattr(httpx, "AsyncClient", async_client)

    def unavailable_settings() -> Settings:
        return Settings(
            openrouter_enabled=openrouter_enabled,
            openrouter_api_key=openrouter_api_key,
        )

    app.dependency_overrides[get_settings] = unavailable_settings

    try:
        response = client.post(
            "/classify",
            json={
                "prompt": "Will Tesla stock rise within 3 months?",
            },
        )
    finally:
        app.dependency_overrides[get_settings] = get_test_settings

    assert response.status_code == 200

    body = response.json()

    assert body["domain"] == "FINANCIAL_MARKET"
    assert body["classifier"] == "RULE_BASED_FALLBACK"
    assert async_client.call_count == 0


@pytest.mark.parametrize(
    "domain",
    [
        "GENERAL_RESEARCH",
        "CUSTOM_DATASET",
        "SPORTS",
        "FINANCIAL_MARKET",
    ],
)
def test_create_analysis_accepts_current_domains(domain: str) -> None:
    response = client.post(
        "/internal/v1/analyses",
        json={
            "analysisId": f"analysis_{domain}",
            "question": "Provide a valid analysis for this request.",
            "domain": domain,
            "correlationId": f"correlation_{domain}",
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "COMPLETED"


@pytest.mark.parametrize(
    "provider_result",
    [
        pytest.param(
            httpx.Response(
                status_code=503,
                json={"error": "Provider unavailable"},
                request=OPENROUTER_REQUEST,
            ),
            id="provider-http-error",
        ),
        pytest.param(
            httpx.ReadTimeout(
                "OpenRouter request timed out.",
                request=OPENROUTER_REQUEST,
            ),
            id="timeout",
        ),
        pytest.param(
            httpx.ConnectError(
                "OpenRouter connection failed.",
                request=OPENROUTER_REQUEST,
            ),
            id="network-error",
        ),
        pytest.param(
            httpx.Response(
                status_code=200,
                content=b"{invalid-json",
                request=OPENROUTER_REQUEST,
            ),
            id="invalid-provider-json",
        ),
        pytest.param(
            httpx.Response(
                status_code=200,
                json={"choices": []},
                request=OPENROUTER_REQUEST,
            ),
            id="missing-choices",
        ),
        pytest.param(
            httpx.Response(
                status_code=200,
                json={
                    "choices": [
                        {
                            "message": {
                                "content": "not-json",
                            },
                        },
                    ],
                },
                request=OPENROUTER_REQUEST,
            ),
            id="invalid-classification-json",
        ),
        pytest.param(
            httpx.Response(
                status_code=200,
                json={
                    "choices": [
                        {
                            "message": {
                                "content": json.dumps(
                                    {
                                        "domain": "WEATHER",
                                        "task": "DIRECTIONAL_FORECAST",
                                        "confidence": 0.9,
                                        "reasoning": "Invalid unsupported domain.",
                                        "isSupported": True,
                                        "entities": [],
                                        "dates": [],
                                        "timeHorizon": "within 3 months",
                                        "requiresLiveData": True,
                                        "predictionIntent": True,
                                        "comparisonIntent": False,
                                        "riskIntent": False,
                                    }
                                ),
                            },
                        },
                    ],
                },
                request=OPENROUTER_REQUEST,
            ),
            id="schema-invalid-classification",
        ),
    ],
)
def test_classify_uses_rule_based_fallback_after_openrouter_failure(
    monkeypatch: pytest.MonkeyPatch,
    provider_result: httpx.Response | httpx.HTTPError,
) -> None:
    response = classify_with_mocked_openrouter(
        monkeypatch,
        provider_result,
    )

    assert response.status_code == 200

    body = response.json()

    assert body["domain"] == "FINANCIAL_MARKET"
    assert body["task"] == "DIRECTIONAL_FORECAST"
    assert body["isSupported"] is True
    assert body["requiresLiveData"] is True
    assert body["classifier"] == "RULE_BASED_FALLBACK"


@pytest.mark.parametrize(
    "domain",
    [
        "betting",
        "stocks",
        "crypto",
        "economics",
        "weather",
        "risk",
        "dataset",
        "custom",
    ],
)
def test_create_analysis_rejects_legacy_domains(domain: str) -> None:
    response = client.post(
        "/internal/v1/analyses",
        json={
            "analysisId": f"analysis_{domain}",
            "question": "Provide a valid analysis for this request.",
            "domain": domain,
            "correlationId": f"correlation_{domain}",
        },
    )

    assert response.status_code == 422

    body = response.json()

    assert body["code"] == "VALIDATION_ERROR"
    assert any(detail["field"] == "body.domain" for detail in body["details"])


def test_root_endpoint() -> None:
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "service": "forecastme-prediction-service",
        "status": "running",
    }


def test_health_endpoint() -> None:
    response = client.get("/health")

    assert response.status_code == 200

    body = response.json()

    assert body["status"] == "healthy"
    assert body["service"] == "forecastme-prediction-service"
    assert body["version"] == "0.1.0"
    assert body["timestamp"]
    assert response.headers["X-Request-ID"]


def test_create_analysis_endpoint() -> None:
    response = client.post(
        "/internal/v1/analyses",
        json={
            "analysisId": "analysis_test_001",
            "question": "What is the probability that Team A defeats Team B?",
            "domain": "SPORTS",
            "options": {
                "includeExplanation": True,
                "includeSources": True,
                "includeConfidence": True,
                "timeHorizon": "next_match",
                "riskPreference": "medium",
            },
            "correlationId": "correlation_test_001",
        },
    )

    assert response.status_code == 200

    body = response.json()
    result = body["result"]

    assert body["analysisId"] == "analysis_test_001"
    assert body["status"] == "COMPLETED"
    assert body["processingTimeMs"] is None
    assert body["error"] is None

    assert set(result) == {
        "directAnswer",
        "probability",
        "confidence",
        "evidence",
        "riskFactors",
        "suggestedAction",
        "sources",
        "model",
        "dataFreshness",
    }

    assert "cannot calculate a probability" in result["directAnswer"]
    assert result["probability"] is None
    assert result["confidence"]["score"] is None
    assert result["confidence"]["level"] is None
    assert result["confidence"]["explanation"]
    assert result["evidence"] == []
    assert result["riskFactors"] == []
    assert result["suggestedAction"] is None
    assert result["sources"] == []
    assert result["model"] == {
        "name": "forecastme-contract-validator",
        "version": "0.1.0",
        "method": "schema-validation-only",
    }
    assert result["dataFreshness"]["generatedAt"]
    assert result["dataFreshness"]["dataAsOf"] is None
    assert result["dataFreshness"]["status"] == "UNKNOWN"


def test_existing_request_id_is_preserved() -> None:
    request_id = "request-test-001"

    response = client.get(
        "/health",
        headers={"X-Request-ID": request_id},
    )

    assert response.status_code == 200
    assert response.headers["X-Request-ID"] == request_id


def test_unknown_route_returns_standard_error_response() -> None:
    request_id = "request-not-found-001"

    response = client.get(
        "/does-not-exist",
        headers={"X-Request-ID": request_id},
    )

    assert response.status_code == 404

    body = response.json()

    assert body["statusCode"] == 404
    assert body["code"] == "NOT_FOUND"
    assert body["message"] == "Not Found"
    assert body["requestId"] == request_id
    assert body["timestamp"]


def test_classify_sports_prompt() -> None:
    response = client.post(
        "/classify",
        json={
            "prompt": "Will England beat Argentina in the next football match?",
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["domain"] == "SPORTS"
    assert body["confidence"] == 0.9
    assert body["reasoning"]


def test_classify_financial_market_prompt() -> None:
    response = client.post(
        "/classify",
        json={
            "prompt": "Should I invest in this stock based on the market trend?",
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["domain"] == "FINANCIAL_MARKET"
    assert body["confidence"] == 0.9


def test_classify_dataset_prompt() -> None:
    response = client.post(
        "/classify",
        json={
            "prompt": "Analyze the columns in my uploaded CSV file.",
        },
    )

    assert response.status_code == 200
    assert response.json()["domain"] == "CUSTOM_DATASET"


def test_classify_general_research_prompt() -> None:
    response = client.post(
        "/classify",
        json={
            "prompt": "Explain the causes of the industrial revolution.",
        },
    )

    assert response.status_code == 200
    assert response.json()["domain"] == "GENERAL_RESEARCH"


def test_classify_unsupported_prompt() -> None:
    response = client.post(
        "/classify",
        json={
            "prompt": "Give me a weather forecast for tomorrow.",
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["domain"] == "GENERAL_RESEARCH"
    assert body["isSupported"] is False
    assert body["confidence"] == 0.95
    assert body["reasoning"]


def test_classify_extracts_entities() -> None:
    response = client.post(
        "/classify",
        json={
            "prompt": (
                "Will Manchester United beat Arsenal in the next football match?"
            ),
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["domain"] == "SPORTS"
    assert body["entities"] == ["Manchester United", "Arsenal"]


def test_classify_extracts_dates() -> None:
    response = client.post(
        "/classify",
        json={
            "prompt": ("Compare Apple stock on 2026-07-19 and July 25, 2026."),
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["dates"] == ["2026-07-19", "July 25, 2026"]


def test_classify_detects_time_horizon() -> None:
    response = client.post(
        "/classify",
        json={
            "prompt": "Will Tesla stock rise within 3 months?",
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["domain"] == "FINANCIAL_MARKET"
    assert body["timeHorizon"] == "within 3 months"


def test_classify_detects_prediction_intent() -> None:
    response = client.post(
        "/classify",
        json={
            "prompt": "What is the probability that demand will increase?",
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["predictionIntent"] is True
    assert body["comparisonIntent"] is False
    assert body["riskIntent"] is False


def test_classify_detects_comparison_intent() -> None:
    response = client.post(
        "/classify",
        json={
            "prompt": "Compare Apple stock versus Microsoft stock.",
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["domain"] == "FINANCIAL_MARKET"
    assert body["comparisonIntent"] is True


def test_classify_detects_risk_intent() -> None:
    response = client.post(
        "/classify",
        json={
            "prompt": "What is the downside risk of this portfolio?",
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["domain"] == "FINANCIAL_MARKET"
    assert body["riskIntent"] is True


def test_classify_returns_default_metadata() -> None:
    response = client.post(
        "/classify",
        json={
            "prompt": "Explain the causes of the industrial revolution.",
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["domain"] == "GENERAL_RESEARCH"
    assert body["entities"] == []
    assert body["dates"] == []
    assert body["timeHorizon"] is None
    assert body["predictionIntent"] is False
    assert body["comparisonIntent"] is False
    assert body["riskIntent"] is False


def test_classify_rejects_short_prompt() -> None:
    response = client.post(
        "/classify",
        json={"prompt": "Hi"},
    )

    assert response.status_code == 422

    body = response.json()

    assert body["code"] == "VALIDATION_ERROR"
    assert body["details"]


def build_valid_result() -> AnalysisResult:
    return AnalysisResult(
        directAnswer="No probability is available.",
        probability=None,
        confidence=AnalysisConfidence(
            score=None,
            level=None,
            explanation="No confidence score is available.",
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
    )


def test_analysis_result_rejects_probability_above_one() -> None:
    payload = build_valid_result().model_dump(by_alias=True)
    payload["probability"] = 1.01

    with pytest.raises(ValidationError):
        AnalysisResult.model_validate(payload)


def test_confidence_score_requires_confidence_level() -> None:
    with pytest.raises(ValidationError):
        AnalysisConfidence(
            score=0.6,
            level=None,
            explanation=None,
        )


def test_data_freshness_rejects_timestamp_without_timezone() -> None:
    with pytest.raises(ValidationError):
        DataFreshness(
            generatedAt=datetime.now(),
            dataAsOf=None,
            status=FreshnessStatus.UNKNOWN,
        )


def test_completed_response_requires_result() -> None:
    with pytest.raises(ValidationError):
        AnalysisServiceResponse(
            analysisId="analysis_missing_result",
            status=AnalysisStatus.COMPLETED,
            result=None,
            processingTimeMs=None,
            error=None,
        )


def test_failed_response_requires_error() -> None:
    with pytest.raises(ValidationError):
        AnalysisServiceResponse(
            analysisId="analysis_missing_error",
            status=AnalysisStatus.FAILED,
            result=None,
            processingTimeMs=None,
            error=None,
        )
