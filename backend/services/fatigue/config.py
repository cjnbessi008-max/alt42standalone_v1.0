"""
Configuration for Fatigue Monitoring System

Environment variables and configuration settings.
"""

import os
from typing import List
from pydantic import BaseSettings


class FatigueMonitoringConfig(BaseSettings):
    """Configuration settings for fatigue monitoring"""

    # Database
    DATABASE_URL: str = os.getenv(
        'DATABASE_URL',
        'postgresql://user:password@localhost:5432/education_db'
    )

    # Redis (for caching and WebSocket pub/sub)
    REDIS_URL: str = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

    # Fatigue calculation settings
    METRIC_COLLECTION_INTERVAL_SECONDS: int = int(os.getenv('METRIC_INTERVAL', '120'))  # 2 minutes
    AUTO_BREAK_RECOMMENDATION_ENABLED: bool = os.getenv('AUTO_BREAK', 'true').lower() == 'true'
    MANDATORY_BREAK_THRESHOLD: int = int(os.getenv('MANDATORY_BREAK_THRESHOLD', '85'))

    # Session settings
    MAX_SESSION_DURATION_MINUTES: int = int(os.getenv('MAX_SESSION_DURATION', '180'))  # 3 hours
    IDLE_TIMEOUT_MINUTES: int = int(os.getenv('IDLE_TIMEOUT', '15'))

    # Break settings
    MICRO_BREAK_DURATION: int = int(os.getenv('MICRO_BREAK_DURATION', '3'))
    SHORT_BREAK_DURATION: int = int(os.getenv('SHORT_BREAK_DURATION', '10'))
    MEDIUM_BREAK_DURATION: int = int(os.getenv('MEDIUM_BREAK_DURATION', '15'))
    LONG_BREAK_DURATION: int = int(os.getenv('LONG_BREAK_DURATION', '30'))

    # Reminder settings
    BREAK_REMINDER_ENABLED: bool = os.getenv('BREAK_REMINDER', 'true').lower() == 'true'
    REMINDER_INTERVAL_MINUTES: int = int(os.getenv('REMINDER_INTERVAL', '10'))
    MAX_REMINDERS: int = int(os.getenv('MAX_REMINDERS', '3'))

    # Personalization settings
    PROFILE_CALIBRATION_SESSIONS: int = int(os.getenv('CALIBRATION_SESSIONS', '10'))
    ADAPTIVE_THRESHOLD_ENABLED: bool = os.getenv('ADAPTIVE_THRESHOLD', 'true').lower() == 'true'

    # WebSocket settings
    WS_HEARTBEAT_INTERVAL: int = int(os.getenv('WS_HEARTBEAT', '30'))  # seconds
    WS_MAX_CONNECTIONS_PER_USER: int = int(os.getenv('WS_MAX_CONNECTIONS', '5'))

    # Analytics settings
    ANALYTICS_SNAPSHOT_ENABLED: bool = os.getenv('ANALYTICS_SNAPSHOT', 'true').lower() == 'true'
    SNAPSHOT_GENERATION_TIME: str = os.getenv('SNAPSHOT_TIME', '02:00')  # 2 AM

    # Notification settings
    NOTIFICATION_ENABLED: bool = os.getenv('NOTIFICATION_ENABLED', 'true').lower() == 'true'
    NOTIFICATION_SOUND_ENABLED: bool = os.getenv('NOTIFICATION_SOUND', 'true').lower() == 'true'

    # Development/Testing
    DEBUG: bool = os.getenv('DEBUG', 'false').lower() == 'true'
    TESTING_MODE: bool = os.getenv('TESTING_MODE', 'false').lower() == 'true'

    class Config:
        env_file = '.env'
        case_sensitive = True


# Singleton instance
config = FatigueMonitoringConfig()


# Weight configurations (can be overridden per student)
DEFAULT_FATIGUE_WEIGHTS = {
    'base_fatigue': 0.40,
    'complexity_load': 0.25,
    'error_impact': 0.20,
    'pace_pressure': 0.15
}


# Circadian rhythm modifiers by hour
CIRCADIAN_MODIFIERS = {
    6: 1.15, 7: 1.10, 8: 1.05,
    9: 0.95, 10: 0.90, 11: 0.92,
    12: 1.00, 13: 1.10, 14: 1.15,
    15: 1.05, 16: 1.00, 17: 1.05,
    18: 1.10, 19: 1.15, 20: 1.20,
    21: 1.25, 22: 1.30, 23: 1.35
}


# Break activities suggestions
BREAK_ACTIVITIES = {
    'micro': [
        '20-20-20 규칙 (20초간 6m 거리 보기)',
        '목과 어깨 스트레칭',
        '심호흡 5회'
    ],
    'short': [
        '2-3분 걷기',
        '물 마시기',
        '전신 스트레칭',
        '창밖 보기'
    ],
    'medium': [
        '5-10분 걷기',
        '간식과 물',
        '스트레칭 루틴',
        '가벼운 운동'
    ],
    'long': [
        '실외 산책 10-15분',
        '식사 또는 충분한 간식',
        '요가 또는 가벼운 운동',
        '명상 또는 이완'
    ]
}


def get_config() -> FatigueMonitoringConfig:
    """Get configuration instance"""
    return config
