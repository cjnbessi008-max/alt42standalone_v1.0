"""
Configuration management using Pydantic Settings
"""

from pydantic_settings import BaseSettings
from pydantic import Field, validator
from typing import List
import os


class Settings(BaseSettings):
    """Application settings"""

    # Environment
    environment: str = Field(default="development", env="ENVIRONMENT")

    # Database
    database_url: str = Field(..., env="DATABASE_URL")

    # Redis
    redis_url: str = Field(default="redis://localhost:6379", env="REDIS_URL")

    # Claude API
    claude_api_key: str = Field(..., env="CLAUDE_API_KEY")
    claude_model: str = Field(default="claude-3-5-sonnet-20241022", env="CLAUDE_MODEL")
    claude_max_tokens: int = Field(default=4096, env="CLAUDE_MAX_TOKENS")

    # API Settings
    api_title: str = "AI Education Pipeline"
    api_version: str = "1.0.0"

    # CORS
    cors_origins: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001"],
        env="CORS_ORIGINS"
    )

    # Logging
    log_level: str = Field(default="INFO", env="LOG_LEVEL")

    # Rate Limiting
    rate_limit_per_minute: int = Field(default=60, env="RATE_LIMIT_PER_MINUTE")

    # Cache TTL (seconds)
    cache_ttl_short: int = Field(default=300, env="CACHE_TTL_SHORT")  # 5 minutes
    cache_ttl_medium: int = Field(default=3600, env="CACHE_TTL_MEDIUM")  # 1 hour
    cache_ttl_long: int = Field(default=86400, env="CACHE_TTL_LONG")  # 24 hours

    # Generation Settings
    max_generation_time: int = Field(default=300, env="MAX_GENERATION_TIME")  # 5 minutes
    enable_streaming: bool = Field(default=True, env="ENABLE_STREAMING")

    @validator("cors_origins", pre=True)
    def parse_cors_origins(cls, v):
        """Parse CORS origins from comma-separated string"""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Create settings instance
settings = Settings()
