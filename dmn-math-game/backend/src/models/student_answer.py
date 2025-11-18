"""
Student Answer model
"""

from datetime import datetime
from typing import Optional
from dataclasses import dataclass


@dataclass
class StudentAnswer:
    """Student's answer to a problem"""
    id: str
    problem_id: str
    session_id: str
    student_id: str
    submitted_answer: int
    is_correct: bool
    time_spent_seconds: Optional[int]
    submitted_at: datetime

    @classmethod
    def from_db_row(cls, row):
        """Create StudentAnswer from database row"""
        return cls(
            id=str(row['id']),
            problem_id=str(row['problem_id']),
            session_id=str(row['session_id']),
            student_id=str(row['student_id']),
            submitted_answer=row['submitted_answer'],
            is_correct=row['is_correct'],
            time_spent_seconds=row.get('time_spent_seconds'),
            submitted_at=row['submitted_at']
        )

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'problem_id': self.problem_id,
            'session_id': self.session_id,
            'student_id': self.student_id,
            'submitted_answer': self.submitted_answer,
            'is_correct': self.is_correct,
            'time_spent_seconds': self.time_spent_seconds,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None
        }
