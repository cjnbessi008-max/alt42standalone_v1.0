from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings."""

    # Database
    DATABASE_URL: str = "postgresql://timeline_user:timeline_pass@db:5432/timeline_db"

    # API
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Student Timeline API"
    VERSION: str = "1.0.0"

    # CORS
    ALLOWED_ORIGINS: list = ["http://localhost:3000", "http://localhost:5173"]

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
