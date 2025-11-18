from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings"""

    # Application
    app_name: str = "ALT42 LMS Hint System"
    app_version: str = "1.0.0"
    debug: bool = True
    secret_key: str = "your_secret_key_here_change_in_production"

    # Database
    database_url: str = "postgresql+asyncpg://user:password@localhost:5432/alt42_lms"
    database_sync_url: str = "postgresql://user:password@localhost:5432/alt42_lms"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Claude API
    anthropic_api_key: str = ""
    claude_model: str = "claude-3-sonnet-20240229"

    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # LTI Configuration
    lti_consumer_key: str = ""
    lti_shared_secret: str = ""

    # Hint Generation Settings
    max_hint_tokens: int = 500
    hint_cache_ttl: int = 3600  # 1 hour in seconds

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
