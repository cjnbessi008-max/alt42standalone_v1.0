"""
Moodle Integration Module

Provides LTI 1.3 authentication and session management for Moodle 3.7+ integration.
"""

from .lti_provider import LTI13Provider, MOODLE_LTI_CONFIG
from .session_manager import SessionManager, LearningSession, SessionStatus

__all__ = [
    'LTI13Provider',
    'MOODLE_LTI_CONFIG',
    'SessionManager',
    'LearningSession',
    'SessionStatus',
]

__version__ = '1.0.0'
