"""
Configuration settings for Daily Mission Backend
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Daily Mission LMS"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://user:password@localhost:5432/daily_mission_db"
    )

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # LMS Integration
    LMS_API_URL: Optional[str] = os.getenv("LMS_API_URL")
    LMS_API_KEY: Optional[str] = os.getenv("LMS_API_KEY")
    LMS_SYNC_ENABLED: bool = os.getenv("LMS_SYNC_ENABLED", "false").lower() == "true"

    # Redis (for Celery task queue)
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # Email notifications
    SMTP_HOST: Optional[str] = os.getenv("SMTP_HOST")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: Optional[str] = os.getenv("SMTP_USER")
    SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD")
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "noreply@dailymission.edu")

    # AI Integration (for problem generation)
    ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY")

    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
