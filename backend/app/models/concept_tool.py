"""Concept Tool model."""
from sqlalchemy import Column, String, Text, DateTime, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from ..database import Base


class ConceptTool(Base):
    """Concept tool/learning resource entity."""

    __tablename__ = "concept_tools"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tool_name = Column(String(200), unique=True, nullable=False, index=True)
    tool_category = Column(String(100), index=True)
    description = Column(Text)
    difficulty_level = Column(String(50))
    target_grade_levels = Column(String(200))
    learning_objectives = Column(ARRAY(Text))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<ConceptTool(tool_name='{self.tool_name}', category='{self.tool_category}')>"
