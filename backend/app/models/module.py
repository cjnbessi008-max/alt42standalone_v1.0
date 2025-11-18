from sqlalchemy import Column, String, Text, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin, UUIDMixin
import enum


class ModuleStatus(str, enum.Enum):
    """Module status enum"""
    ACTIVE = "active"
    DRAFT = "draft"
    ARCHIVED = "archived"


class Module(Base, UUIDMixin, TimestampMixin):
    """
    Module model - represents educational modules
    """
    __tablename__ = "modules"

    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    subject = Column(String(100), nullable=False, default="mathematics")
    grade_level = Column(String(50), nullable=False)
    teacher_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    status = Column(Enum(ModuleStatus), nullable=False, default=ModuleStatus.DRAFT)

    # Relationships
    problems = relationship("Problem", back_populates="module", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Module(id={self.id}, name={self.name}, status={self.status})>"
