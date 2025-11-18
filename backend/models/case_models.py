"""
SQLAlchemy Models for One-Frame Case
"""

from sqlalchemy import Column, String, Integer, Text, Boolean, ForeignKey, ARRAY, BigInteger, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB, TIMESTAMP
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid


from .base import Base


class CaseVisualization(Base):
    """Case visualization metadata"""

    __tablename__ = "case_visualizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id", ondelete="CASCADE"))
    problem_id = Column(UUID(as_uuid=True), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    layout_type = Column(
        String(50),
        nullable=False,
        default="tree"
    )
    case_data = Column(JSONB, nullable=False)
    animation_config = Column(JSONB)
    viewport_config = Column(
        JSONB,
        default={
            "position": "bottom-right",
            "width": 375,
            "height": 667,
            "scale": 0.6,
            "showFrame": True
        }
    )
    created_by = Column(UUID(as_uuid=True), ForeignKey("teachers.id", ondelete="SET NULL"))
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    interactions = relationship("CaseInteraction", back_populates="case", cascade="all, delete-orphan")
    progress_records = relationship("CaseProgress", back_populates="case", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint(
            "layout_type IN ('tree', 'grid', 'radial', 'flow')",
            name="check_layout_type"
        ),
    )


class CaseInteraction(Base):
    """Student interactions with case nodes"""

    __tablename__ = "case_interactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey("case_visualizations.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    case_node_id = Column(String(255), nullable=False)
    interaction_type = Column(String(50), nullable=False)
    interaction_data = Column(JSONB)
    time_spent_ms = Column(Integer)
    interacted_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    case = relationship("CaseVisualization", back_populates="interactions")
    student = relationship("Student", back_populates="case_interactions")

    __table_args__ = (
        CheckConstraint(
            "interaction_type IN ('view', 'click', 'hover', 'select')",
            name="check_interaction_type"
        ),
    )


class CaseProgress(Base):
    """Student progress on case explorations"""

    __tablename__ = "case_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    case_id = Column(UUID(as_uuid=True), ForeignKey("case_visualizations.id", ondelete="CASCADE"), nullable=False)
    completed_cases = Column(ARRAY(Text), default=[])
    current_case = Column(String(255))
    total_time_spent_ms = Column(BigInteger, default=0)
    interaction_count = Column(Integer, default=0)
    started_at = Column(TIMESTAMP, server_default=func.now())
    last_interaction_at = Column(TIMESTAMP)
    completed_at = Column(TIMESTAMP)

    # Relationships
    case = relationship("CaseVisualization", back_populates="progress_records")
    student = relationship("Student", back_populates="case_progress")

    __table_args__ = (
        # Unique constraint: one progress record per student per case
        # Note: This would be defined in migration, shown here for clarity
    )
