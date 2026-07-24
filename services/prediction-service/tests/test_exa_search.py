import asyncio
import logging
from collections.abc import Coroutine
from typing import Any
from unittest.mock import AsyncMock, Mock

import httpx
import pytest

from app.core.config import Settings
from app.services.exa_search import (
    EXA_SEARCH_URL,
    ExaNoResultsError,
    ExaSearchConfigurationError,
    ExaSearchError,
    ExaSearchResponseError,
    ExaSearchTimeoutError,
    search_with_exa,
)

EXA_REQUEST = httpx.Request(
    "POST",
    EXA_SEARCH_URL,
)


def run_async(
    coroutine: Coroutine[Any, Any, Any],
) -> Any:
    return asyncio.run(coroutine)


def get_exa_test_settings(
    *,
    api_key: str | None = "test-exa-key",
    result_limit: int = 5,
) -> Settings:
    return Settings(
        _env_file=None,
        exa_api_key=api_key,
        exa_search_result_limit=result_limit,
        exa_search_timeout_seconds=2,
    )


def install_mock_client(
    monkeypatch: pytest.MonkeyPatch,
    provider_result: httpx.Response | httpx.HTTPError,
) -> tuple[Mock, AsyncMock]:
    mock_client = AsyncMock()
    mock_client.__aenter__.return_value = mock_client

    if isinstance(provider_result, httpx.HTTPError):
        mock_client.post.side_effect = provider_result
    else:
        mock_client.post.return_value = provider_result

    client_factory = Mock(return_value=mock_client)

    monkeypatch.setattr(
        httpx,
        "AsyncClient",
        client_factory,
    )

    return client_factory, mock_client


def test_search_normalizes_deduplicates_and_caps_results(
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
) -> None:
    provider_response = httpx.Response(
        200,
        request=EXA_REQUEST,
        json={
            "results": [
                {
                    "title": "  First source  ",
                    "url": ("HTTPS://EXAMPLE.COM/research/#provider-fragment"),
                    "publishedDate": "2026-07-23T18:30:00+08:00",
                    "highlights": [
                        " ",
                        " First relevant excerpt. ",
                    ],
                },
                {
                    "title": "Duplicate source",
                    "url": "https://example.com/research",
                    "publishedDate": None,
                    "highlights": ["Duplicate excerpt."],
                },
                {
                    "title": "Query-specific source",
                    "url": ("https://example.com/research?version=2#section"),
                    "publishedDate": None,
                    "highlights": ["Second relevant excerpt."],
                },
                {
                    "title": "Third unique source",
                    "url": "https://another.example/article",
                    "publishedDate": None,
                    "highlights": ["Should be capped."],
                },
            ]
        },
    )

    client_factory, mock_client = install_mock_client(
        monkeypatch,
        provider_response,
    )

    with caplog.at_level(logging.INFO):
        sources = run_async(
            search_with_exa(
                "  reusable rocket systems  ",
                get_exa_test_settings(result_limit=2),
                request_id="request-21d-success",
            )
        )

    assert len(sources) == 2

    first_source = sources[0]
    second_source = sources[1]

    assert set(
        first_source.model_dump(
            by_alias=True,
            mode="json",
        )
    ) == {
        "id",
        "title",
        "url",
        "publisher",
        "publicationDate",
        "retrievedAt",
        "snippet",
    }

    assert first_source.title == "First source"
    assert str(first_source.url) == "https://example.com/research"
    assert first_source.publisher == "example.com"
    assert first_source.publication_date is not None
    assert first_source.publication_date.isoformat() == ("2026-07-23T10:30:00+00:00")
    assert first_source.retrieved_at.utcoffset() is not None
    assert first_source.snippet == "First relevant excerpt."

    assert second_source.title == "Query-specific source"
    assert str(second_source.url) == ("https://example.com/research?version=2")
    assert second_source.publication_date is None
    assert second_source.snippet == "Second relevant excerpt."

    client_factory.assert_called_once_with(timeout=2.0)
    mock_client.post.assert_awaited_once_with(
        EXA_SEARCH_URL,
        headers={
            "x-api-key": "test-exa-key",
            "Content-Type": "application/json",
        },
        json={
            "query": "reusable rocket systems",
            "type": "auto",
            "numResults": 2,
            "contents": {
                "highlights": True,
            },
        },
    )

    assert any(
        getattr(record, "request_id", None) == "request-21d-success"
        for record in caplog.records
    )
    assert "test-exa-key" not in caplog.text
    assert "provider-fragment" not in caplog.text


def test_search_preserves_first_duplicate_record(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    provider_response = httpx.Response(
        200,
        request=EXA_REQUEST,
        json={
            "results": [
                {
                    "title": "First record",
                    "url": "https://example.com/article/",
                    "highlights": ["First snippet."],
                },
                {
                    "title": "Later duplicate",
                    "url": "HTTPS://EXAMPLE.COM/article#duplicate",
                    "highlights": ["Later snippet."],
                },
            ]
        },
    )

    install_mock_client(
        monkeypatch,
        provider_response,
    )

    sources = run_async(
        search_with_exa(
            "test duplicate handling",
            get_exa_test_settings(),
        )
    )

    assert len(sources) == 1
    assert sources[0].title == "First record"
    assert sources[0].snippet == "First snippet."


def test_search_skips_malformed_records_safely(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    provider_response = httpx.Response(
        200,
        request=EXA_REQUEST,
        json={
            "results": [
                None,
                "not-an-object",
                {
                    "title": "",
                    "url": "https://example.com/missing-title",
                },
                {
                    "title": "Missing URL",
                },
                {
                    "title": "Invalid URL",
                    "url": "not-a-url",
                },
                {
                    "title": "Usable result",
                    "url": "https://valid.example/article",
                    "publishedDate": "not-a-date",
                    "highlights": "not-a-list",
                    "summary": " Fallback summary. ",
                },
            ]
        },
    )

    install_mock_client(
        monkeypatch,
        provider_response,
    )

    sources = run_async(
        search_with_exa(
            "test malformed records",
            get_exa_test_settings(),
        )
    )

    assert len(sources) == 1
    assert sources[0].title == "Usable result"
    assert sources[0].publisher == "valid.example"
    assert sources[0].publication_date is None
    assert sources[0].snippet == "Fallback summary."


def test_search_maps_provider_timeout(
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
) -> None:
    install_mock_client(
        monkeypatch,
        httpx.ReadTimeout(
            "provider timeout",
            request=EXA_REQUEST,
        ),
    )

    with caplog.at_level(logging.WARNING):
        with pytest.raises(
            ExaSearchTimeoutError,
            match="Exa search timed out",
        ):
            run_async(
                search_with_exa(
                    "timeout question",
                    get_exa_test_settings(),
                    request_id="request-21d-timeout",
                )
            )

    assert any(
        getattr(record, "request_id", None) == "request-21d-timeout"
        for record in caplog.records
    )
    assert "test-exa-key" not in caplog.text


def test_search_maps_non_success_response(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    install_mock_client(
        monkeypatch,
        httpx.Response(
            503,
            request=EXA_REQUEST,
            json={"error": "provider unavailable"},
        ),
    )

    with pytest.raises(
        ExaSearchError,
        match="Exa search request failed",
    ):
        run_async(
            search_with_exa(
                "provider failure question",
                get_exa_test_settings(),
            )
        )


def test_search_rejects_invalid_json(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    install_mock_client(
        monkeypatch,
        httpx.Response(
            200,
            request=EXA_REQUEST,
            content=b"not-json",
        ),
    )

    with pytest.raises(
        ExaSearchResponseError,
        match="invalid search response",
    ):
        run_async(
            search_with_exa(
                "invalid json question",
                get_exa_test_settings(),
            )
        )


@pytest.mark.parametrize(
    "provider_payload",
    [
        None,
        [],
        {},
        {"results": None},
        {"results": {}},
        {"results": "not-a-list"},
    ],
)
def test_search_rejects_invalid_result_collection(
    monkeypatch: pytest.MonkeyPatch,
    provider_payload: Any,
) -> None:
    install_mock_client(
        monkeypatch,
        httpx.Response(
            200,
            request=EXA_REQUEST,
            json=provider_payload,
        ),
    )

    with pytest.raises(
        ExaSearchResponseError,
        match="invalid search response",
    ):
        run_async(
            search_with_exa(
                "invalid collection question",
                get_exa_test_settings(),
            )
        )


@pytest.mark.parametrize(
    "results",
    [
        [],
        [None, "invalid"],
        [
            {
                "title": "",
                "url": "https://example.com",
            },
            {
                "title": "Invalid URL",
                "url": "invalid",
            },
        ],
    ],
)
def test_search_raises_clear_no_results_error(
    monkeypatch: pytest.MonkeyPatch,
    results: list[Any],
) -> None:
    install_mock_client(
        monkeypatch,
        httpx.Response(
            200,
            request=EXA_REQUEST,
            json={"results": results},
        ),
    )

    with pytest.raises(
        ExaNoResultsError,
        match="No usable search results were found",
    ):
        run_async(
            search_with_exa(
                "empty results question",
                get_exa_test_settings(),
            )
        )


def test_search_requires_configuration(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async_client = Mock()
    monkeypatch.setattr(httpx, "AsyncClient", async_client)

    with pytest.raises(
        ExaSearchConfigurationError,
        match="Exa search is not configured",
    ):
        run_async(
            search_with_exa(
                "configuration question",
                get_exa_test_settings(api_key=None),
            )
        )

    async_client.assert_not_called()


def test_search_rejects_blank_question(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async_client = Mock()
    monkeypatch.setattr(httpx, "AsyncClient", async_client)

    with pytest.raises(
        ValueError,
        match="Search question must not be blank",
    ):
        run_async(
            search_with_exa(
                "   ",
                get_exa_test_settings(),
            )
        )

    async_client.assert_not_called()
