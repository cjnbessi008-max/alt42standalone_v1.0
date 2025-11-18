"""
Problem model
"""

from datetime import datetime
from dataclasses import dataclass
from enum import Enum


class ProblemType(str, Enum):
    """Problem types"""
    ADDITION = 'addition'
    SUBTRACTION = 'subtraction'
    MULTIPLICATION = 'multiplication'


@dataclass
class Problem:
    """Math problem entity"""
    id: str
    session_id: str
    problem_type: ProblemType
    operand_1: int
    operand_2: int
    correct_answer: int
    difficulty_level: int
    created_at: datetime

    @classmethod
    def from_db_row(cls, row):
        """Create Problem from database row"""
        return cls(
            id=str(row['id']),
            session_id=str(row['session_id']),
            problem_type=ProblemType(row['problem_type']),
            operand_1=row['operand_1'],
            operand_2=row['operand_2'],
            correct_answer=row['correct_answer'],
            difficulty_level=row['difficulty_level'],
            created_at=row['created_at']
        )

    def to_dict(self, include_answer=False):
        """Convert to dictionary"""
        data = {
            'id': self.id,
            'session_id': self.session_id,
            'problem_type': self.problem_type.value,
            'operand_1': self.operand_1,
            'operand_2': self.operand_2,
            'difficulty_level': self.difficulty_level,
            'question': self.get_question_text()
        }
        if include_answer:
            data['correct_answer'] = self.correct_answer
        return data

    def get_question_text(self) -> str:
        """Get human-readable question text"""
        operators = {
            ProblemType.ADDITION: '+',
            ProblemType.SUBTRACTION: '-',
            ProblemType.MULTIPLICATION: '×'
        }
        op = operators.get(self.problem_type, '+')
        return f"{self.operand_1} {op} {self.operand_2}"
