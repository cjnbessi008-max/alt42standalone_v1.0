"""
Student Progress model
"""

from datetime import datetime
from typing import Optional
from dataclasses import dataclass
from decimal import Decimal


@dataclass
class StudentProgress:
    """Student's overall progress"""
    id: str
    student_id: str
    current_difficulty_level: int
    total_sessions: int
    total_problems_solved: int
    total_correct_answers: int
    average_accuracy: Decimal
    last_session_at: Optional[datetime]
    updated_at: datetime

    @classmethod
    def from_db_row(cls, row):
        """Create StudentProgress from database row"""
        return cls(
            id=str(row['id']),
            student_id=str(row['student_id']),
            current_difficulty_level=row['current_difficulty_level'],
            total_sessions=row['total_sessions'],
            total_problems_solved=row['total_problems_solved'],
            total_correct_answers=row['total_correct_answers'],
            average_accuracy=row['average_accuracy'],
            last_session_at=row.get('last_session_at'),
            updated_at=row['updated_at']
        )

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'student_id': self.student_id,
            'current_difficulty_level': self.current_difficulty_level,
            'total_sessions': self.total_sessions,
            'total_problems_solved': self.total_problems_solved,
            'total_correct_answers': self.total_correct_answers,
            'average_accuracy': float(self.average_accuracy),
            'last_session_at': self.last_session_at.isoformat() if self.last_session_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
