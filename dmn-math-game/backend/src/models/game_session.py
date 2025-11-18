"""
Game Session model
"""

from datetime import datetime
from typing import Optional
from dataclasses import dataclass


@dataclass
class GameSession:
    """Game session entity"""
    id: str
    student_id: str
    started_at: datetime
    ended_at: Optional[datetime]
    total_problems: int
    correct_answers: int
    duration_seconds: Optional[int]
    difficulty_level: int
    is_completed: bool
    lms_launch_id: Optional[str]

    @classmethod
    def from_db_row(cls, row):
        """Create GameSession from database row"""
        return cls(
            id=str(row['id']),
            student_id=str(row['student_id']),
            started_at=row['started_at'],
            ended_at=row.get('ended_at'),
            total_problems=row['total_problems'],
            correct_answers=row['correct_answers'],
            duration_seconds=row.get('duration_seconds'),
            difficulty_level=row['difficulty_level'],
            is_completed=row['is_completed'],
            lms_launch_id=row.get('lms_launch_id')
        )

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'student_id': self.student_id,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'ended_at': self.ended_at.isoformat() if self.ended_at else None,
            'total_problems': self.total_problems,
            'correct_answers': self.correct_answers,
            'duration_seconds': self.duration_seconds,
            'difficulty_level': self.difficulty_level,
            'is_completed': self.is_completed,
            'accuracy': round((self.correct_answers / self.total_problems * 100) if self.total_problems > 0 else 0, 2)
        }
