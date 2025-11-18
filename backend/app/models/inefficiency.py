"""
Inefficiency detection model
"""
from sqlalchemy import Column, String, Integer, Text, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.core.database import Base


class InefficientType(str, enum.Enum):
    """Types of inefficiency patterns"""
    LOOP_INVARIANT = "loop_invariant"
    NESTED_LOOP = "nested_loop"
    DB_QUERY_IN_LOOP = "db_query_in_loop"
    REDUNDANT_FUNCTION_CALL = "redundant_function_call"
    STRING_CONCAT_IN_LOOP = "string_concat_in_loop"
    ARRAY_PUSH_IN_LOOP = "array_push_in_loop"
    FILE_OPERATION_IN_LOOP = "file_operation_in_loop"
    INEFFICIENT_SEARCH = "inefficient_search"


class Severity(str, enum.Enum):
    """Severity levels"""
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"


class Inefficiency(Base):
    """Detected inefficiency in code"""

    __tablename__ = "inefficiencies"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_result_id = Column(String, ForeignKey("analysis_results.id"), nullable=False, index=True)

    # Inefficiency details
    type = Column(Enum(InefficientType), nullable=False)
    severity = Column(Enum(Severity), nullable=False)

    # Location in code
    line_number = Column(Integer, nullable=False)
    column_number = Column(Integer, nullable=True)
    end_line_number = Column(Integer, nullable=True)

    # Description
    message = Column(Text, nullable=False)
    code_snippet = Column(Text, nullable=True)

    # Suggestions
    suggestion = Column(Text, nullable=True)
    optimized_code = Column(Text, nullable=True)

    # Impact estimation
    estimated_complexity_before = Column(String(50), nullable=True)  # e.g., "O(n^2)"
    estimated_complexity_after = Column(String(50), nullable=True)   # e.g., "O(n)"

    # Additional context
    context = Column(JSON, nullable=True)

    # Relationships
    analysis_result = relationship("AnalysisResult", back_populates="inefficiencies")

    def __repr__(self):
        return f"<Inefficiency {self.type} at line {self.line_number}>"
