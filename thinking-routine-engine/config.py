"""Configuration management for Thinking Routine Engine"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""

    # API Settings
    API_TITLE: str = "Thinking Routine AI Engine"
    API_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"

    # Moodle Database (MySQL 5.7)
    MOODLE_DB_HOST: str = "localhost"
    MOODLE_DB_PORT: int = 3306
    MOODLE_DB_NAME: str = "moodle"
    MOODLE_DB_USER: str = "moodle"
    MOODLE_DB_PASSWORD: str = "moodle"
    MOODLE_DB_PREFIX: str = "mdl_"

    # Application Database (PostgreSQL for analytics)
    APP_DB_HOST: str = "localhost"
    APP_DB_PORT: int = 5432
    APP_DB_NAME: str = "thinking_routine"
    APP_DB_USER: str = "postgres"
    APP_DB_PASSWORD: str = "postgres"

    # Redis Cache
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = None

    # Claude AI (Anthropic)
    ANTHROPIC_API_KEY: str = ""
    CLAUDE_MODEL: str = "claude-3-sonnet-20240229"
    CLAUDE_MAX_TOKENS: int = 4096
    CLAUDE_TEMPERATURE: float = 0.7

    # Analysis Settings
    TOP_PERFORMER_PERCENTILE: float = 10.0
    MIN_SESSIONS_FOR_ANALYSIS: int = 5
    SESSION_GAP_MINUTES: int = 30
    ANALYSIS_LOOKBACK_DAYS: int = 90

    # API Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:8080",
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
