"""
Core configuration for the AI Education System
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""

    # App info
    APP_NAME: str = "AI Education System - Learning Analytics"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/ai_education"

    # CORS
    CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:5173"]

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Analysis thresholds
    PAUSE_THRESHOLD_MS: int = 3000  # 3 seconds of inactivity = pause
    STRUGGLE_THRESHOLD_MS: int = 10000  # 10 seconds = struggle indicator

    class Config:
        env_file = ".env"


settings = Settings()
