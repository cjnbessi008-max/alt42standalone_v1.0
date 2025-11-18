"""
Application configuration
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""

    # API Settings
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "AI Education System - LMS Integration"
    VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/ai_education_db"
    )

    # Anthropic Claude API
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")

    # CORS
    ALLOWED_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
    ]

    # LMS Integration
    LMS_API_ENDPOINT: Optional[str] = os.getenv("LMS_API_ENDPOINT")
    LMS_API_KEY: Optional[str] = os.getenv("LMS_API_KEY")
    LMS_SYNC_INTERVAL_MINUTES: int = int(os.getenv("LMS_SYNC_INTERVAL_MINUTES", "30"))

    # Pattern Analysis Settings
    PATTERN_MIN_FREQUENCY: int = int(os.getenv("PATTERN_MIN_FREQUENCY", "2"))
    PATTERN_ANALYSIS_DAYS_BACK: int = int(os.getenv("PATTERN_ANALYSIS_DAYS_BACK", "30"))
    WARNING_SEVERITY_THRESHOLD: str = os.getenv("WARNING_SEVERITY_THRESHOLD", "medium")

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
