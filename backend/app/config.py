"""
Application configuration and settings
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings"""

    # Application
    app_name: str = "Metacognition Growth Tracker"
    app_version: str = "1.0.0"
    debug: bool = True

    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:5432/metacognition"

    # Anthropic Claude API
    anthropic_api_key: str = ""
    claude_model: str = "claude-3-5-sonnet-20241022"

    # Security
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # CORS
    cors_origins: list = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
