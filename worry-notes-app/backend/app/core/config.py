"""
Application Configuration
"""
from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )

    # Application
    APP_NAME: str = "Worry Notes System"
    ENV: str = "development"
    DEBUG: bool = True
    API_VERSION: str = "v1"
    SECRET_KEY: str

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database
    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # AI/LLM
    ANTHROPIC_API_KEY: str
    VOYAGE_API_KEY: Optional[str] = None

    # Email
    SENDGRID_API_KEY: Optional[str] = None
    FROM_EMAIL: str = "noreply@example.com"
    FROM_NAME: str = "Worry Notes System"

    # LMS Integration - Canvas
    CANVAS_API_URL: Optional[str] = None
    CANVAS_API_KEY: Optional[str] = None

    # LMS Integration - Moodle
    MOODLE_URL: Optional[str] = None
    MOODLE_TOKEN: Optional[str] = None

    # LMS Integration - Google Classroom
    GOOGLE_CLASSROOM_CLIENT_ID: Optional[str] = None
    GOOGLE_CLASSROOM_CLIENT_SECRET: Optional[str] = None

    # LTI 1.3
    LTI_ISS: Optional[str] = None
    LTI_CLIENT_ID: Optional[str] = None
    LTI_DEPLOYMENT_ID: Optional[str] = None
    LTI_KEY_ID: Optional[str] = None
    LTI_PRIVATE_KEY_PATH: Optional[str] = None
    LTI_PUBLIC_KEY_PATH: Optional[str] = None

    # CORS
    CORS_ORIGINS: List[str] = Field(default_factory=lambda: ["http://localhost:3000"])
    ALLOWED_HOSTS: List[str] = Field(default_factory=lambda: ["localhost", "127.0.0.1"])

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # Monitoring
    SENTRY_DSN: Optional[str] = None

    # Feature Flags
    ENABLE_LMS_INTEGRATION: bool = True
    ENABLE_AI_CATEGORIZATION: bool = True
    ENABLE_EMAIL_NOTIFICATIONS: bool = True
    ENABLE_CRISIS_DETECTION: bool = True

    # Rate Limiting
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = 60

    # Cache
    CACHE_TTL_SECONDS: int = 3600
    LMS_CONTEXT_CACHE_HOURS: int = 6

    # File Upload
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_FILE_TYPES: List[str] = Field(
        default_factory=lambda: ["pdf", "doc", "docx", "txt", "jpg", "jpeg", "png", "gif"]
    )

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/app.log"

    @property
    def async_database_url(self) -> str:
        """Get async database URL"""
        return self.DATABASE_URL

    @property
    def sync_database_url(self) -> str:
        """Get sync database URL (for Alembic)"""
        return self.DATABASE_URL.replace("+asyncpg", "")


# Create settings instance
settings = Settings()
