"""Moodle-related database models."""
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
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class MoodleConnection(Base):
    """Stores Moodle instance connection details."""

    __tablename__ = "moodle_connections"

    id = Column(Integer, primary_key=True, index=True)
    instance_name = Column(String(255), nullable=False)
    base_url = Column(String(500), nullable=False)
    api_token = Column(String(500), nullable=False)
    is_active = Column(Boolean, default=True)
    last_sync_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Student(Base):
    """Represents a student synced from Moodle."""

    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    moodle_user_id = Column(Integer, unique=True, nullable=False, index=True)
    username = Column(String(255), nullable=False)
    firstname = Column(String(255))
    lastname = Column(String(255))
    email = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    quiz_attempts = relationship("QuizAttempt", back_populates="student")
    reasoning_scores = relationship("ReasoningDensityScore", back_populates="student")
    accuracy_rates = relationship("AccuracyRate", back_populates="student")
    correlation_data_points = relationship(
        "CorrelationDataPoint", back_populates="student"
    )


class Course(Base):
    """Represents a course from Moodle."""

    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    moodle_course_id = Column(Integer, unique=True, nullable=False, index=True)
    course_name = Column(String(255), nullable=False)
    category = Column(String(255))
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    quizzes = relationship("Quiz", back_populates="course")
    accuracy_rates = relationship("AccuracyRate", back_populates="course")
    correlation_analyses = relationship("CorrelationAnalysis", back_populates="course")


class Quiz(Base):
    """Represents a quiz/assignment from Moodle."""

    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    moodle_quiz_id = Column(Integer, unique=True, nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    quiz_name = Column(String(255), nullable=False)
    time_limit = Column(Integer, nullable=True)  # in seconds
    max_grade = Column(Numeric(5, 2))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    course = relationship("Course", back_populates="quizzes")
    quiz_attempts = relationship("QuizAttempt", back_populates="quiz")
    accuracy_rates = relationship("AccuracyRate", back_populates="quiz")
    correlation_analyses = relationship("CorrelationAnalysis", back_populates="quiz")


class QuizAttempt(Base):
    """Represents a student's attempt at a quiz."""

    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    moodle_attempt_id = Column(Integer, unique=True, nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    attempt_number = Column(Integer, default=1)
    started_at = Column(DateTime)
    finished_at = Column(DateTime)
    total_time_seconds = Column(Integer)
    final_grade = Column(Numeric(5, 2))
    state = Column(String(50))  # 'inprogress', 'finished', 'abandoned'
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="quiz_attempts")
    quiz = relationship("Quiz", back_populates="quiz_attempts")
    question_attempts = relationship("QuestionAttempt", back_populates="quiz_attempt")
    reasoning_scores = relationship(
        "ReasoningDensityScore", back_populates="quiz_attempt"
    )


class QuestionAttempt(Base):
    """Represents a student's attempt at a specific question."""

    __tablename__ = "question_attempts"

    id = Column(Integer, primary_key=True, index=True)
    quiz_attempt_id = Column(Integer, ForeignKey("quiz_attempts.id"), nullable=False)
    question_number = Column(Integer)
    question_text = Column(Text)
    question_type = Column(String(50))  # 'multichoice', 'truefalse', 'essay', etc.
    max_mark = Column(Numeric(5, 2))
    achieved_mark = Column(Numeric(5, 2))
    is_correct = Column(Boolean)
    num_attempts = Column(Integer, default=1)
    time_spent_seconds = Column(Integer)
    hint_requests = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    quiz_attempt = relationship("QuizAttempt", back_populates="question_attempts")
    reasoning_scores = relationship(
        "ReasoningDensityScore", back_populates="question_attempt"
    )
