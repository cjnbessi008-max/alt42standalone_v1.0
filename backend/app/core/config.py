"""
Application configuration
"""
from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings"""

    # Application
    APP_NAME: str = "Inefficient Loop Detector"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    SECRET_KEY: str = "change-this-secret-key-in-production"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/loop_detector"
    DATABASE_ECHO: bool = False

    # Moodle Integration
    MOODLE_URL: str = ""
    MOODLE_TOKEN: str = ""
    MOODLE_WS_FUNCTION_PREFIX: str = "local_loopdetector"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]

    # Analysis Settings
    MAX_CODE_SIZE: int = 50000
    ANALYSIS_TIMEOUT: int = 30
    MAX_NESTED_LOOPS: int = 3

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/app.log"

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
