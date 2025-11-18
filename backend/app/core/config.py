"""Application configuration settings."""
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "Moodle LMS Correlation Analysis System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    SECRET_KEY: str = Field(..., min_length=32)

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database
    DATABASE_URL: str = Field(..., description="MySQL database connection URL")
    DB_ECHO: bool = False

    # Moodle API
    MOODLE_BASE_URL: str = Field(..., description="Moodle instance base URL")
    MOODLE_API_TOKEN: str = Field(..., description="Moodle web service token")
    MOODLE_SERVICE: str = "moodle_mobile_app"

    # Redis (optional)
    REDIS_URL: str = "redis://localhost:6379/0"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    # JWT
    JWT_SECRET_KEY: str = Field(..., min_length=32)
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 60

    # Reasoning Density Weights
    WEIGHT_TIME_DENSITY: float = 0.30
    WEIGHT_ATTEMPT_INTENSITY: float = 0.25
    WEIGHT_COGNITIVE_LOAD: float = 0.20
    WEIGHT_COMPLEXITY: float = 0.15
    WEIGHT_SOLUTION_PATH: float = 0.10

    # Statistical Analysis
    SIGNIFICANCE_LEVEL: float = 0.05
    CONFIDENCE_LEVEL: float = 0.95

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/app.log"

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
