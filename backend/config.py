"""Application configuration settings."""
import os
from typing import List
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    """Application settings."""

    # API Settings
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Focus Analysis & Time Recommendation System"
    VERSION: str = "1.0.0"

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://user:password@localhost:5432/focus_analysis_db"
    )

    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-this-secret-key-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # LMS Integration (for future use)
    LMS_API_URL: str = os.getenv("LMS_API_URL", "")
    LMS_API_KEY: str = os.getenv("LMS_API_KEY", "")

    # Focus Analysis Settings
    MIN_DATA_POINTS_FOR_RECOMMENDATION: int = 5
    FOCUS_SCORE_THRESHOLD: int = 60
    OPTIMAL_SESSION_DURATION_MINUTES: int = 45

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
