from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # API Configuration
    app_name: str = "ALT42 AI Reasoning Analysis Service"
    app_version: str = "1.0.0"
    environment: str = os.getenv("PYTHON_ENV", "development")

    # Database
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/alt42_reasoning"
    )

    # Redis
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379")

    # Claude API
    claude_api_key: str = os.getenv("CLAUDE_API_KEY", "")
    claude_model: str = os.getenv("CLAUDE_MODEL", "claude-3-sonnet-20240229")
    claude_max_tokens: int = int(os.getenv("CLAUDE_MAX_TOKENS", "4096"))
    claude_temperature: float = float(os.getenv("CLAUDE_TEMPERATURE", "0.7"))

    # Service
    host: str = "0.0.0.0"
    port: int = int(os.getenv("AI_SERVICE_PORT", "8001"))

    # Logging
    log_level: str = os.getenv("LOG_LEVEL", "INFO")

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
