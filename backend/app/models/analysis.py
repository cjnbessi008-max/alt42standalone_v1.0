"""Analysis-related database models."""
from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    Date,
    Numeric,
    Enum as SQLEnum,
    JSON,
)
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class IntensityLevel(str, enum.Enum):
    """Reasoning intensity classification levels."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class AnalysisType(str, enum.Enum):
    """Types of correlation analysis."""

    PEARSON = "pearson"
    SPEARMAN = "spearman"
    KENDALL = "kendall"
    LINEAR_REGRESSION = "linear_regression"


class ReasoningDensityScore(Base):
    """Stores calculated reasoning density scores for student attempts."""

    __tablename__ = "reasoning_density_scores"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    quiz_attempt_id = Column(Integer, ForeignKey("quiz_attempts.id"), nullable=False)
    question_attempt_id = Column(
        Integer, ForeignKey("question_attempts.id"), nullable=True
    )

    # Component scores (0-100 scale)
    time_density_score = Column(Numeric(5, 2))
    attempt_intensity_score = Column(Numeric(5, 2))
    cognitive_load_score = Column(Numeric(5, 2))
    complexity_coefficient = Column(Numeric(5, 2))
    solution_path_score = Column(Numeric(5, 2))

    # Overall reasoning density score
    overall_density_score = Column(Numeric(5, 2))

    # Classification
    intensity_level = Column(SQLEnum(IntensityLevel))

    # Metadata
    calculation_method = Column(String(100))
    calculated_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="reasoning_scores")
    quiz_attempt = relationship("QuizAttempt", back_populates="reasoning_scores")
    question_attempt = relationship("QuestionAttempt", back_populates="reasoning_scores")


class AccuracyRate(Base):
    """Stores calculated accuracy rates for students."""

    __tablename__ = "accuracy_rates"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)

    # Accuracy metrics
    total_questions = Column(Integer)
    correct_answers = Column(Integer)
    accuracy_percentage = Column(Numeric(5, 2))

    # Contextual data
    difficulty_level = Column(Integer)
    topic = Column(String(255))
    time_period_start = Column(Date)
    time_period_end = Column(Date)

    calculated_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="accuracy_rates")
    quiz = relationship("Quiz", back_populates="accuracy_rates")
    course = relationship("Course", back_populates="accuracy_rates")


class CorrelationAnalysis(Base):
    """Stores results of correlation analyses."""

    __tablename__ = "correlation_analyses"

    id = Column(Integer, primary_key=True, index=True)
    analysis_name = Column(String(255))
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=True)

    # Analysis parameters
    analysis_type = Column(SQLEnum(AnalysisType))
    sample_size = Column(Integer)

    # Statistical results
    correlation_coefficient = Column(Numeric(6, 4))
    p_value = Column(Numeric(10, 8))
    r_squared = Column(Numeric(6, 4), nullable=True)
    confidence_interval_lower = Column(Numeric(6, 4))
    confidence_interval_upper = Column(Numeric(6, 4))

    # Control variables (JSON)
    control_variables = Column(JSON, nullable=True)

    # Results interpretation
    significance_level = Column(Numeric(3, 2), default=0.05)
    is_significant = Column(Boolean)
    effect_size = Column(String(50))

    # Metadata
    analyzed_by = Column(String(255))
    analysis_date = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text)

    # Relationships
    course = relationship("Course", back_populates="correlation_analyses")
    quiz = relationship("Quiz", back_populates="correlation_analyses")
    data_points = relationship("CorrelationDataPoint", back_populates="analysis")


class CorrelationDataPoint(Base):
    """Individual data points used in correlation analysis."""

    __tablename__ = "correlation_data_points"

    id = Column(Integer, primary_key=True, index=True)
    correlation_analysis_id = Column(
        Integer, ForeignKey("correlation_analyses.id"), nullable=False
    )
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)

    # Independent variable
    reasoning_density_score = Column(Numeric(5, 2))

    # Dependent variable
    accuracy_rate = Column(Numeric(5, 2))

    # Confounding variables
    time_spent_seconds = Column(Integer)
    attempt_number = Column(Integer)
    problem_difficulty = Column(Integer)

    # Additional metadata
    metadata = Column(JSON, nullable=True)

    # Relationships
    analysis = relationship("CorrelationAnalysis", back_populates="data_points")
    student = relationship("Student", back_populates="correlation_data_points")
