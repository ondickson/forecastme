from functools import lru_cache

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    openrouter_enabled: bool = True
    openrouter_api_key: SecretStr | None = None
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_model: str = "openai/gpt-4.1-mini"
    openrouter_timeout_seconds: float = Field(
        default=10.0,
        gt=0,
        le=60,
    )

    exa_api_key: SecretStr | None = None
    exa_search_result_limit: int = Field(
        default=5,
        gt=0,
        le=5,
    )
    exa_search_timeout_seconds: float = Field(
        default=10.0,
        gt=0,
        le=60,
    )

    @property
    def openrouter_available(self) -> bool:
        if not self.openrouter_enabled or self.openrouter_api_key is None:
            return False

        return bool(self.openrouter_api_key.get_secret_value().strip())

    @property
    def exa_available(self) -> bool:
        if self.exa_api_key is None:
            return False

        return bool(self.exa_api_key.get_secret_value().strip())


@lru_cache
def get_settings() -> Settings:
    return Settings()
