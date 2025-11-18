"""
Application configuration management
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings"""

    # API Configuration
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Permutation Pattern Matching"

    # Database Configuration
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "permutation_pattern"

    @property
    def DATABASE_URL(self) -> str:
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    # Security
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Moodle Integration
    MOODLE_URL: str = "https://your-moodle-instance.com"
    MOODLE_API_TOKEN: str = ""
    MOODLE_VERSION: str = "3.7"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Debug
    DEBUG: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
