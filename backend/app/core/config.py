"""
Application Configuration
Environment variables and settings
"""

from pydantic_settings import BaseSettings
from typing import List, Optional
from functools import lru_cache


class Settings(BaseSettings):
    """애플리케이션 설정"""

    # Project Info
    PROJECT_NAME: str = "AI Education System"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/alt42_db"

    # JWT Authentication
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",  # Vite default
        "http://127.0.0.1:3000",
    ]

    # Redis (optional)
    REDIS_URL: Optional[str] = None

    # WebSocket
    WS_MESSAGE_MAX_SIZE: int = 1024 * 1024  # 1MB

    # Focus Intensity Algorithm Parameters
    FOCUS_HIGH_ACCURACY_THRESHOLD: float = 0.9
    FOCUS_LOW_ACCURACY_THRESHOLD: float = 0.5
    FOCUS_CONSECUTIVE_CORRECT_THRESHOLD: int = 3
    FOCUS_CONSECUTIVE_INCORRECT_THRESHOLD: int = 2
    FOCUS_MIN_ATTEMPTS_FOR_ADJUSTMENT: int = 3

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 100

    # Logging
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """설정 싱글톤"""
    return Settings()


settings = get_settings()
