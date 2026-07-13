from fastapi import FastAPI

app = FastAPI(
    title="ForecastMe Prediction Service",
    version="0.1.0",
)


@app.get("/")
def root() -> dict[str, str]:
    return {
        "service": "forecastme-prediction-service",
        "status": "running",
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy"}