"""
Application Configuration Settings
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Application
    APP_NAME: str = "AI Education Pipeline"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True
    API_PREFIX: str = "/api"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost:5432/ai_education"
    DB_ECHO: bool = False

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    # AI/LLM
    ANTHROPIC_API_KEY: Optional[str] = None
    CLAUDE_MODEL: str = "claude-3-sonnet-20240229"
    MAX_TOKENS: int = 4096

    # LMS Integration
    LMS_TYPE: str = "mock"  # "mock" or "moodle"
    MOODLE_URL: Optional[str] = None
    MOODLE_TOKEN: Optional[str] = None

    # Rate Limiting
    RATE_LIMIT_PER_HOUR: int = 100

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
