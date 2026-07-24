import json
from datetime import UTC, datetime
from unittest.mock import AsyncMock, Mock

import httpx
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

import app.main as main_module
from app.core.config import Settings, get_settings
from app.main import app
from app.schemas.analysis import (
    AnalysisConfidence,
    AnalysisResult,
    AnalysisServiceResponse,
    AnalysisSource,
    AnalysisStatus,
    DataFreshness,
    FreshnessStatus,
    ModelInformation,
)
from app.schemas.domain import AnalysisDomain


def get_test_settings() -> Settings:
    return Settings(
        openrouter_enabled=False,
        openrouter_api_key=None,
        exa_api_key="test-exa-key",
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
        AnalysisDomain.GENERAL_RESEARCH,
        AnalysisDomain.CUSTOM_DATASET,
        AnalysisDomain.SPORTS,
        AnalysisDomain.FINANCIAL_MARKET,
    ],
)
def test_create_analysis_routes_each_domain_and_preserves_contract(
    monkeypatch: pytest.MonkeyPatch,
    domain: AnalysisDomain,
) -> None:
    question = "Provide a valid analysis for this request."

    normalized_source = AnalysisSource(
        id="source-day-21e",
        title="Normalized research source",
        url="https://example.com/research",
        publisher="example.com",
        publicationDate="2026-07-24T08:00:00+00:00",
        retrievedAt="2026-07-24T09:00:00+00:00",
        snippet="Relevant normalized source.",
    )

    search_mock = AsyncMock(return_value=[normalized_source])

    monkeypatch.setattr(
        main_module,
        "search_with_exa",
        search_mock,
    )

    process_spies: dict[AnalysisDomain, AsyncMock] = {}
    original_builder = main_module.build_domain_router

    def recording_builder(settings: Settings):
        router = original_builder(settings)

        for registered_domain, handler in router._handlers.items():
            process_spy = AsyncMock(wraps=handler.process)
            monkeypatch.setattr(handler, "process", process_spy)
            process_spies[registered_domain] = process_spy

        return router

    monkeypatch.setattr(
        main_module,
        "build_domain_router",
        recording_builder,
    )

    analysis_id = f"analysis_{domain.value}"
    correlation_id = f"correlation_{domain.value}"
    request_id = f"request_{domain.value}"

    response = client.post(
        "/internal/v1/analyses",
        headers={"X-Request-ID": request_id},
        json={
            "analysisId": analysis_id,
            "question": question,
            "domain": domain.value,
            "correlationId": correlation_id,
        },
    )

    assert response.status_code == 200
    assert response.headers["X-Request-ID"] == request_id

    body = response.json()

    assert set(body) == {
        "analysisId",
        "status",
        "result",
        "processingTimeMs",
        "error",
    }
    assert body["analysisId"] == analysis_id
    assert body["status"] == "COMPLETED"
    assert body["processingTimeMs"] is None
    assert body["error"] is None

    result = body["result"]

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

    selected_handler = process_spies[domain]
    selected_handler.assert_awaited_once()

    await_arguments = selected_handler.await_args
    assert await_arguments is not None

    routed_request = await_arguments.args[0]

    assert routed_request.analysis_id == analysis_id
    assert routed_request.domain == domain
    assert routed_request.correlation_id == correlation_id

    for registered_domain, process_spy in process_spies.items():
        if registered_domain != domain:
            process_spy.assert_not_awaited()

    assert sum(process_spy.await_count for process_spy in process_spies.values()) == 1

    if domain == AnalysisDomain.GENERAL_RESEARCH:
        search_mock.assert_awaited_once()

        search_arguments = search_mock.await_args
        assert search_arguments is not None
        assert search_arguments.args[0] == question
        exa_api_key = search_arguments.args[1].exa_api_key
        assert exa_api_key is not None
        assert exa_api_key.get_secret_value() == "test-exa-key"
        assert search_arguments.kwargs == {
            "request_id": correlation_id,
        }

        assert result["sources"] == [
            normalized_source.model_dump(
                by_alias=True,
                mode="json",
            )
        ]
    else:
        search_mock.assert_not_awaited()
        assert result["sources"] == []


def test_create_analysis_generates_request_id() -> None:
    response = client.post(
        "/internal/v1/analyses",
        json={
            "analysisId": "analysis_generated_request_id",
            "question": "Provide a valid analysis for this request.",
            "domain": "SPORTS",
            "correlationId": "correlation_generated_request_id",
        },
    )

    assert response.status_code == 200
    assert response.headers["X-Request-ID"].strip()


def test_create_analysis_validation_error_preserves_request_id(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    request_id = "request-analysis-validation-001"
    builder_spy = Mock(wraps=main_module.build_domain_router)

    monkeypatch.setattr(
        main_module,
        "build_domain_router",
        builder_spy,
    )

    response = client.post(
        "/internal/v1/analyses",
        headers={"X-Request-ID": request_id},
        json={
            "analysisId": "analysis_invalid_domain",
            "question": "Provide a valid analysis for this request.",
            "domain": "UNMAPPED_DOMAIN",
            "correlationId": "correlation_invalid_domain",
        },
    )

    assert response.status_code == 422
    assert response.headers["X-Request-ID"] == request_id

    body = response.json()

    assert body["statusCode"] == 422
    assert body["code"] == "VALIDATION_ERROR"
    assert body["message"] == "Request validation failed"
    assert body["requestId"] == request_id
    assert body["timestamp"]
    assert any(detail["field"] == "body.domain" for detail in body["details"])

    builder_spy.assert_not_called()


def test_create_analysis_handler_failure_returns_standard_error(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    request_id = "request-analysis-failure-001"
    process_mock = AsyncMock(
        side_effect=RuntimeError("Simulated handler failure"),
    )
    original_builder = main_module.build_domain_router

    def failing_builder(settings: Settings):
        router = original_builder(settings)
        handler = router._handlers[AnalysisDomain.SPORTS]
        monkeypatch.setattr(handler, "process", process_mock)
        return router

    monkeypatch.setattr(
        main_module,
        "build_domain_router",
        failing_builder,
    )

    with TestClient(app, raise_server_exceptions=False) as error_client:
        response = error_client.post(
            "/internal/v1/analyses",
            headers={"X-Request-ID": request_id},
            json={
                "analysisId": "analysis_handler_failure",
                "question": "Provide a valid sports analysis.",
                "domain": "SPORTS",
                "correlationId": "correlation_handler_failure",
            },
        )

    assert response.status_code == 500

    body = response.json()

    assert body["statusCode"] == 500
    assert body["code"] == "INTERNAL_SERVER_ERROR"
    assert body["message"] == "An unexpected error occurred"
    assert body["requestId"] == request_id
    assert body["timestamp"]

    process_mock.assert_awaited_once()


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


def build_valid_source_payload() -> dict[str, object]:
    return {
        "id": "source-1",
        "title": "Example research article",
        "url": "https://example.com/research/article",
        "publisher": "example.com",
        "publicationDate": "2026-07-18T17:30:00+08:00",
        "retrievedAt": "2026-07-18T18:00:00+08:00",
        "snippet": "  A normalized research result.  ",
    }


def test_analysis_source_normalizes_timestamps_and_snippet() -> None:
    source = AnalysisSource.model_validate(build_valid_source_payload())

    assert source.publication_date == datetime(2026, 7, 18, 9, 30, tzinfo=UTC)
    assert source.retrieved_at == datetime(2026, 7, 18, 10, 0, tzinfo=UTC)
    assert source.snippet == "A normalized research result."

    serialized = source.model_dump(by_alias=True, mode="json")

    assert serialized["publicationDate"] == "2026-07-18T09:30:00Z"
    assert serialized["retrievedAt"] == "2026-07-18T10:00:00Z"
    assert serialized["snippet"] == "A normalized research result."


def test_analysis_source_accepts_nullable_fields() -> None:
    payload = build_valid_source_payload()
    payload["publicationDate"] = None
    payload["snippet"] = None

    source = AnalysisSource.model_validate(payload)

    assert source.publication_date is None
    assert source.snippet is None


def test_analysis_source_normalizes_blank_snippet_to_null() -> None:
    payload = build_valid_source_payload()
    payload["snippet"] = "   "

    source = AnalysisSource.model_validate(payload)

    assert source.snippet is None


@pytest.mark.parametrize(
    "missing_field",
    [
        "url",
        "publisher",
        "publicationDate",
        "retrievedAt",
        "snippet",
    ],
)
def test_analysis_source_rejects_missing_required_field(
    missing_field: str,
) -> None:
    payload = build_valid_source_payload()
    payload.pop(missing_field)

    with pytest.raises(ValidationError):
        AnalysisSource.model_validate(payload)


def test_analysis_source_rejects_invalid_url() -> None:
    payload = build_valid_source_payload()
    payload["url"] = "not-a-valid-url"

    with pytest.raises(ValidationError):
        AnalysisSource.model_validate(payload)


@pytest.mark.parametrize(
    "timestamp_field",
    ["publicationDate", "retrievedAt"],
)
def test_analysis_source_rejects_timestamp_without_timezone(
    timestamp_field: str,
) -> None:
    payload = build_valid_source_payload()
    payload[timestamp_field] = "2026-07-18T10:00:00"

    with pytest.raises(ValidationError):
        AnalysisSource.model_validate(payload)


def test_analysis_source_rejects_provider_specific_fields() -> None:
    payload = build_valid_source_payload()
    payload["exaScore"] = 0.98

    with pytest.raises(ValidationError):
        AnalysisSource.model_validate(payload)


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
