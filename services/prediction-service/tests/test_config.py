import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_exa_settings_use_v1_defaults() -> None:
    settings = Settings(
        _env_file=None,
        exa_api_key=None,
    )

    assert settings.exa_search_result_limit == 5
    assert settings.exa_search_timeout_seconds == 10.0
    assert settings.exa_available is False


@pytest.mark.parametrize("api_key", [None, "", "   "])
def test_exa_is_unavailable_without_a_nonempty_key(
    api_key: str | None,
) -> None:
    settings = Settings(
        _env_file=None,
        exa_api_key=api_key,
    )

    assert settings.exa_available is False


def test_exa_is_available_with_an_api_key() -> None:
    settings = Settings(
        _env_file=None,
        exa_api_key="test-exa-key",
    )

    assert settings.exa_available is True


@pytest.mark.parametrize("result_limit", [0, 6])
def test_exa_rejects_result_limit_outside_v1_range(
    result_limit: int,
) -> None:
    with pytest.raises(ValidationError):
        Settings(
            _env_file=None,
            exa_api_key=None,
            exa_search_result_limit=result_limit,
        )


@pytest.mark.parametrize("timeout_seconds", [0, 61])
def test_exa_rejects_invalid_timeout(
    timeout_seconds: float,
) -> None:
    with pytest.raises(ValidationError):
        Settings(
            _env_file=None,
            exa_api_key=None,
            exa_search_timeout_seconds=timeout_seconds,
        )
