"""
Configuration settings for the application
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings"""

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/ai_education"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    # Mind Wandering Detection Parameters
    INACTIVITY_THRESHOLD_SECONDS: int = 30
    MOUSE_STILLNESS_THRESHOLD_SECONDS: int = 20
    RAPID_CLICK_THRESHOLD: int = 10
    FOCUS_LOSS_WEIGHT: float = 0.8
    INACTIVITY_WEIGHT: float = 0.6
    MOUSE_STILLNESS_WEIGHT: float = 0.5
    RAPID_CLICK_WEIGHT: float = 0.7

    # Detection confidence threshold (0-1)
    MIND_WANDERING_CONFIDENCE_THRESHOLD: float = 0.65

    # LMS Integration
    LMS_API_URL: str = "http://localhost:9000/api"
    LMS_API_KEY: str = "your-lms-api-key-here"

    # Session tracking
    BEHAVIOR_BATCH_SIZE: int = 50
    BEHAVIOR_FLUSH_INTERVAL_SECONDS: int = 10

    class Config:
        env_file = ".env"


settings = Settings()
