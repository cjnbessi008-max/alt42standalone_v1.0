"""
애플리케이션 설정
"""
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """애플리케이션 설정"""

    # Application
    APP_NAME: str = "Success Routine Cards"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = Field(..., env="DATABASE_URL")
    DATABASE_ECHO: bool = False

    # Security
    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # AI Configuration
    CLAUDE_API_KEY: str = Field(..., env="CLAUDE_API_KEY")
    AI_MODEL: str = "claude-3-sonnet-20240229"
    AI_MAX_TOKENS: int = 2000
    AI_TEMPERATURE: float = 0.7

    # Scheduler
    ENABLE_AUTO_GENERATION: bool = True
    CARD_GENERATION_TIME: str = "07:00:00"
    CARD_RETENTION_DAYS: int = 90

    # LMS Integration (optional)
    LMS_API_URL: str = ""
    LMS_API_KEY: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
