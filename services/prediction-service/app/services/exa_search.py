import logging
from datetime import UTC, datetime
from typing import Any
from urllib.parse import urlsplit, urlunsplit
from uuid import NAMESPACE_URL, uuid5

import httpx
from pydantic import ValidationError

from app.core.config import Settings
from app.schemas.analysis import AnalysisSource

logger = logging.getLogger(__name__)

EXA_SEARCH_URL = "https://api.exa.ai/search"


class ExaSearchError(RuntimeError):
    pass


class ExaSearchConfigurationError(ExaSearchError):
    pass


class ExaSearchTimeoutError(ExaSearchError):
    pass


class ExaSearchResponseError(ExaSearchError):
    pass


class ExaNoResultsError(ExaSearchError):
    pass


def build_exa_search_payload(
    question: str,
    result_limit: int,
) -> dict[str, Any]:
    query = question.strip()

    if not query:
        raise ValueError("Search question must not be blank.")

    return {
        "query": query,
        "type": "auto",
        "numResults": result_limit,
        "contents": {
            "highlights": True,
        },
    }


def normalize_url(value: Any) -> tuple[str, str] | None:
    if not isinstance(value, str):
        return None

    candidate = value.strip()

    if not candidate:
        return None

    try:
        parsed = urlsplit(candidate)
        scheme = parsed.scheme.lower()
        hostname = parsed.hostname

        if (
            scheme not in {"http", "https"}
            or hostname is None
            or parsed.username is not None
            or parsed.password is not None
        ):
            return None

        hostname = hostname.lower()
        port = parsed.port
    except ValueError:
        return None

    normalized_hostname = f"[{hostname}]" if ":" in hostname else hostname
    netloc = normalized_hostname

    if port is not None:
        netloc = f"{netloc}:{port}"

    path = parsed.path.rstrip("/")

    normalized_url = urlunsplit(
        (
            scheme,
            netloc,
            path,
            parsed.query,
            "",
        )
    )

    return normalized_url, hostname


def parse_publication_date(value: Any) -> datetime | None:
    if not isinstance(value, str):
        return None

    candidate = value.strip()

    if not candidate:
        return None

    try:
        parsed = datetime.fromisoformat(
            candidate.replace("Z", "+00:00"),
        )
    except ValueError:
        return None

    if parsed.tzinfo is None or parsed.utcoffset() is None:
        return None

    return parsed.astimezone(UTC)


def clean_string(value: Any) -> str | None:
    if not isinstance(value, str):
        return None

    cleaned = value.strip()
    return cleaned or None


def extract_snippet(result: dict[Any, Any]) -> str | None:
    highlights = result.get("highlights")

    if isinstance(highlights, list):
        cleaned_highlights = [
            cleaned
            for value in highlights
            if (cleaned := clean_string(value)) is not None
        ]

        if cleaned_highlights:
            return " ".join(cleaned_highlights)

    for field_name in ("summary", "text"):
        cleaned = clean_string(result.get(field_name))

        if cleaned is not None:
            return cleaned

    return None


def normalize_exa_result(
    result: Any,
    retrieved_at: datetime,
) -> AnalysisSource | None:
    if not isinstance(result, dict):
        return None

    title = clean_string(result.get("title"))
    normalized_url = normalize_url(result.get("url"))

    if title is None or normalized_url is None:
        return None

    url, publisher = normalized_url
    publication_date = parse_publication_date(
        result.get("publishedDate"),
    )

    try:
        return AnalysisSource.model_validate(
            {
                "id": str(uuid5(NAMESPACE_URL, url)),
                "title": title,
                "url": url,
                "publisher": publisher,
                "publicationDate": publication_date,
                "retrievedAt": retrieved_at,
                "snippet": extract_snippet(result),
            }
        )
    except ValidationError:
        return None


async def search_with_exa(
    question: str,
    settings: Settings,
    request_id: str | None = None,
) -> list[AnalysisSource]:
    if not settings.exa_available or settings.exa_api_key is None:
        raise ExaSearchConfigurationError("Exa search is not configured.")

    payload = build_exa_search_payload(
        question,
        settings.exa_search_result_limit,
    )

    headers = {
        "x-api-key": settings.exa_api_key.get_secret_value(),
        "Content-Type": "application/json",
    }

    logger.info(
        "Exa search started",
        extra={"request_id": request_id},
    )

    try:
        async with httpx.AsyncClient(
            timeout=settings.exa_search_timeout_seconds,
        ) as client:
            response = await client.post(
                EXA_SEARCH_URL,
                headers=headers,
                json=payload,
            )

        response.raise_for_status()
    except httpx.TimeoutException as error:
        logger.warning(
            "Exa search timed out",
            extra={"request_id": request_id},
        )
        raise ExaSearchTimeoutError("Exa search timed out.") from error
    except httpx.HTTPError as error:
        logger.warning(
            "Exa search request failed",
            extra={"request_id": request_id},
        )
        raise ExaSearchError("Exa search request failed.") from error

    try:
        provider_payload: Any = response.json()
    except ValueError as error:
        logger.warning(
            "Exa returned invalid JSON",
            extra={"request_id": request_id},
        )
        raise ExaSearchResponseError(
            "Exa returned an invalid search response."
        ) from error

    if not isinstance(provider_payload, dict):
        raise ExaSearchResponseError("Exa returned an invalid search response.")

    raw_results = provider_payload.get("results")

    if not isinstance(raw_results, list):
        raise ExaSearchResponseError("Exa returned an invalid search response.")

    retrieved_at = datetime.now(UTC)
    sources: list[AnalysisSource] = []
    seen_urls: set[str] = set()

    for raw_result in raw_results:
        source = normalize_exa_result(
            raw_result,
            retrieved_at,
        )

        if source is None:
            continue

        normalized_source_url = str(source.url).rstrip("/")

        if normalized_source_url in seen_urls:
            continue

        seen_urls.add(normalized_source_url)
        sources.append(source)

        if len(sources) >= settings.exa_search_result_limit:
            break

    if not sources:
        logger.info(
            "Exa search returned no usable results",
            extra={"request_id": request_id},
        )
        raise ExaNoResultsError("No usable search results were found.")

    logger.info(
        "Exa search completed",
        extra={
            "request_id": request_id,
            "source_count": len(sources),
        },
    )

    return sources
