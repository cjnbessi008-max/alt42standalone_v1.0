"""
Application configuration settings
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings and environment variables"""

    # Application
    APP_NAME: str = "LMS Hint System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # API Keys
    ANTHROPIC_API_KEY: str

    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/hint_system"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # LMS Integration (LTI)
    LTI_CLIENT_ID: Optional[str] = None
    LTI_DEPLOYMENT_ID: Optional[str] = None
    LTI_ISS: Optional[str] = None
    LTI_AUTH_TOKEN_URL: Optional[str] = None
    LTI_AUTH_LOGIN_URL: Optional[str] = None
    LTI_KEYSET_URL: Optional[str] = None

    # Hint Generation Settings
    MAX_HINT_STEPS: int = 5  # Maximum number of progressive hints
    HINT_MODEL: str = "claude-3-5-sonnet-20241022"
    HINT_TEMPERATURE: float = 0.7
    MAX_TOKENS: int = 500

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
