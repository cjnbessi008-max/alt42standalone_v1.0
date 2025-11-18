from sqlalchemy import Column, String, Enum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
import enum
from .base import BaseModel


class TeacherRole(str, enum.Enum):
    """Teacher role enum"""
    TEACHER = "teacher"
    ADMIN = "admin"
    SYSTEM_MAINTAINER = "system_maintainer"


class Teacher(BaseModel):
    """Teacher/educator model"""
    __tablename__ = "teachers"

    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    institution = Column(String(255))
    role = Column(Enum(TeacherRole), default=TeacherRole.TEACHER, nullable=False)
    preferences = Column(JSONB)

    # Relationships
    modules = relationship("Module", back_populates="teacher")
