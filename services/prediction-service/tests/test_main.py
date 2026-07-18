import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


@pytest.mark.parametrize(
    "domain",
    [
        "general_research",
        "custom_dataset",
        "sports",
        "financial_market",
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
    assert response.json()["status"] == "completed"


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
            "domain": "sports",
            "options": {
                "includeExplanation": True,
                "includeSources": True,
                "includeConfidence": True,
                "timeHorizon": "next_match",
                "riskTolerance": "medium",
            },
            "correlationId": "correlation_test_001",
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["analysisId"] == "analysis_test_001"
    assert body["status"] == "completed"
    assert body["result"]["outcome"] == "Contract validation successful"
    assert body["result"]["probability"] == 0.5
    assert body["result"]["confidence"] == 0.5
    assert body["processingTimeMs"] == 0


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


def test_classify_rejects_short_prompt() -> None:
    response = client.post(
        "/classify",
        json={"prompt": "Hi"},
    )

    assert response.status_code == 422

    body = response.json()

    assert body["code"] == "VALIDATION_ERROR"
    assert body["details"]
