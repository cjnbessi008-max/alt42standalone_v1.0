"""
Database Models
SQLAlchemy models for derivative focus application
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, TIMESTAMP, ForeignKey, Numeric, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.db.database import Base


class RuleType(str, enum.Enum):
    """Derivative rule types"""
    POWER_RULE = "power_rule"
    CHAIN_RULE = "chain_rule"
    PRODUCT_RULE = "product_rule"
    QUOTIENT_RULE = "quotient_rule"
    CONSTANT_RULE = "constant_rule"
    SUM_RULE = "sum_rule"


class DifficultyLevel(str, enum.Enum):
    """Problem difficulty levels"""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class DerivativeRule(Base):
    """Derivative rules table"""
    __tablename__ = "derivative_rules"

    id = Column(Integer, primary_key=True, index=True)
    rule_name = Column(String(100), nullable=False)
    rule_type = Column(Enum(RuleType), nullable=False, index=True)
    rule_formula = Column(Text, nullable=False)
    pattern_regex = Column(Text, nullable=False)
    description = Column(Text)
    display_order = Column(Integer, default=0)
    is_core_rule = Column(Boolean, default=False, index=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    problem_rules = relationship("ProblemRule", back_populates="rule")


class Problem(Base):
    """Problems table"""
    __tablename__ = "problems"

    id = Column(Integer, primary_key=True, index=True)
    moodle_question_id = Column(Integer, index=True)
    problem_text = Column(Text, nullable=False)
    problem_latex = Column(Text)
    difficulty_level = Column(Enum(DifficultyLevel), default=DifficultyLevel.MEDIUM)
    ai_analysis = Column(Text)  # Claude AI analysis results
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    problem_rules = relationship("ProblemRule", back_populates="problem", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="current_problem")


class ProblemRule(Base):
    """Problem-Rule mapping table"""
    __tablename__ = "problem_rules"

    id = Column(Integer, primary_key=True, index=True)
    problem_id = Column(Integer, ForeignKey("problems.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_id = Column(Integer, ForeignKey("derivative_rules.id", ondelete="CASCADE"), nullable=False, index=True)
    matched_expression = Column(Text)
    highlight_start = Column(Integer)
    highlight_end = Column(Integer)
    confidence_score = Column(Numeric(3, 2), default=1.00)
    ai_explanation = Column(Text)  # Claude's explanation of why this rule applies
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # Relationships
    problem = relationship("Problem", back_populates="problem_rules")
    rule = relationship("DerivativeRule", back_populates="problem_rules")


class Session(Base):
    """User sessions table"""
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_token = Column(String(255), nullable=False, unique=True, index=True)
    moodle_user_id = Column(Integer, index=True)
    current_problem_id = Column(Integer, ForeignKey("problems.id", ondelete="SET NULL"))
    started_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    last_activity = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)

    # Relationships
    current_problem = relationship("Problem", back_populates="sessions")
