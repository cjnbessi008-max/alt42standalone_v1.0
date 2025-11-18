"""
Configuration settings for the application
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings"""

    # Application
    APP_NAME: str = "AI Education System"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/ai_education"

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    # LTI Configuration
    LTI_ISSUER: str = "https://your-lms.example.com"
    LTI_CLIENT_ID: str = "your-client-id"
    LTI_DEPLOYMENT_ID: str = "your-deployment-id"
    LTI_PLATFORM_PUBLIC_KEY: str = ""
    LTI_PRIVATE_KEY_PATH: str = "./keys/private.key"

    # Claude API
    ANTHROPIC_API_KEY: str = ""

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    class Config:
        env_file = ".env"


settings = Settings()
