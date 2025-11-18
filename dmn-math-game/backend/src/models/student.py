"""
Student model
"""

from datetime import datetime
from typing import Optional
from dataclasses import dataclass


@dataclass
class Student:
    """Student entity"""
    id: str
    lms_user_id: Optional[str]
    name: str
    email: Optional[str]
    grade_level: Optional[str]
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_db_row(cls, row):
        """Create Student from database row"""
        return cls(
            id=str(row['id']),
            lms_user_id=row.get('lms_user_id'),
            name=row['name'],
            email=row.get('email'),
            grade_level=row.get('grade_level'),
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'lms_user_id': self.lms_user_id,
            'name': self.name,
            'email': self.email,
            'grade_level': self.grade_level,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
