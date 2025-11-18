"""
API routes for DMN Math Game
"""

from .game_routes import game_bp
from .student_routes import student_bp

__all__ = ['game_bp', 'student_bp']
