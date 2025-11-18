"""
Code submission model
"""
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


class Submission(Base):
    """Student code submission"""

    __tablename__ = "submissions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String, ForeignKey("students.id"), nullable=False, index=True)

    # Code content
    code = Column(Text, nullable=False)
    language = Column(String(50), default="php")

    # Moodle integration
    moodle_assignment_id = Column(Integer, nullable=True)
    moodle_submission_id = Column(Integer, nullable=True, unique=True)

    # Metadata
    filename = Column(String(255))
    submitted_at = Column(DateTime, default=datetime.utcnow)
    analyzed_at = Column(DateTime, nullable=True)

    # Relationships
    student = relationship("Student", back_populates="submissions")
    analysis_result = relationship("AnalysisResult", back_populates="submission", uselist=False)

    def __repr__(self):
        return f"<Submission {self.id} by {self.student_id}>"
