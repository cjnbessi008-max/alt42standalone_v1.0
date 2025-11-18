from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Praise Cards System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql://praiseuser:praisepass@postgres:5432/praisedb"

    # Redis
    REDIS_URL: str = "redis://redis:6379/0"

    # Anthropic AI
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-3-5-sonnet-20241022"

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Achievement thresholds
    HIGH_ACCURACY_THRESHOLD: int = 80  # 80%
    CONSECUTIVE_DAYS_THRESHOLD: int = 3
    DAILY_LEARNING_TIME_THRESHOLD: int = 30  # minutes
    PROGRESS_BOOST_THRESHOLD: int = 20  # 20%

    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://frontend:3000",
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
