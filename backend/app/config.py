"""
Application configuration using Pydantic Settings.
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings."""

    # Application
    APP_NAME: str = "AI Education System"
    DEBUG: bool = True
    VERSION: str = "1.0.0"

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/ai_education_db"

    # Security
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",  # Vite default
        "http://localhost:3000",  # React default
    ]

    # TES Calculation Settings
    TES_MIN_ATTEMPTS_REQUIRED: int = 10
    TES_MIN_TIME_THRESHOLD_SECONDS: int = 5
    TES_CACHE_TTL_MINUTES: int = 30

    # Component Weights
    TES_WEIGHT_CORRECTNESS: float = 0.40
    TES_WEIGHT_SPEED: float = 0.30
    TES_WEIGHT_FIRST_TRY: float = 0.20
    TES_WEIGHT_CONSISTENCY: float = 0.10

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
