from sqlalchemy import Column, String, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from .base import BaseModel


class Student(BaseModel):
    """Student/learner model"""
    __tablename__ = "students"

    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True)
    grade_level = Column(String(50))
    enrolled_modules = Column(ARRAY(UUID(as_uuid=True)))
    lms_user_id = Column(String(255))  # External LMS user ID
