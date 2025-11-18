"""
Application Configuration
"""
from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """애플리케이션 설정"""

    # Application
    app_name: str = "Answer Classification API"
    app_version: str = "1.0.0"
    debug: bool = False

    # API Keys
    anthropic_api_key: str
    claude_model: str = "claude-3-sonnet-20240229"

    # Database
    database_url: str = "postgresql+asyncpg://user:password@localhost/answer_classification"
    db_echo: bool = False

    # CORS
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://kaist.ac.kr"
    ]

    # LMS Integration
    lti_key: str = ""
    lti_secret: str = ""

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Logging
    log_level: str = "INFO"

    # Classification
    classification_confidence_threshold: float = 0.6
    max_classification_retries: int = 3

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )


@lru_cache()
def get_settings() -> Settings:
    """설정 싱글톤 인스턴스"""
    return Settings()
