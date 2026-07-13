from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


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
    assert response.json() == {"status": "healthy"}


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
