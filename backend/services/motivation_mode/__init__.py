"""
Motivation Mode Service

Provides "Just Do One Problem" low-pressure learning mode for students
with decreased motivation. Tracks sessions, manages problem selection,
and provides positive reinforcement.
"""

from .session_manager import MotivationSessionManager
from .suggestion_engine import MotivationSuggestionEngine
from .analytics_service import MotivationAnalyticsService
from .config_manager import MotivationConfigManager

__all__ = [
    'MotivationSessionManager',
    'MotivationSuggestionEngine',
    'MotivationAnalyticsService',
    'MotivationConfigManager',
]

__version__ = '1.0.0'
