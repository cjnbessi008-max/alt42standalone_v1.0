from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class Problem(Base):
    __tablename__ = "problems"

    id = Column(Integer, primary_key=True, index=True)
    problem_type = Column(String, default="fraction_addition")
    question_text = Column(String, nullable=False)
    correct_numerator = Column(Integer, nullable=False)
    correct_denominator = Column(Integer, nullable=False)
    difficulty = Column(String, default="medium")
    created_at = Column(DateTime, default=datetime.utcnow)

    attempts = relationship("StudentAttempt", back_populates="problem")


class StudentAttempt(Base):
    __tablename__ = "student_attempts"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, nullable=False)
    problem_id = Column(Integer, ForeignKey("problems.id"))
    answer_numerator = Column(Integer, nullable=False)
    answer_denominator = Column(Integer, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    time_spent_seconds = Column(Integer)
    attempted_at = Column(DateTime, default=datetime.utcnow)

    problem = relationship("Problem", back_populates="attempts")
    predictions = relationship("AnswerPrediction", back_populates="attempt")


class AnswerPrediction(Base):
    __tablename__ = "answer_predictions"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("student_attempts.id"))
    student_id = Column(String, nullable=False)
    problem_id = Column(Integer, nullable=False)
    submitted_answer = Column(String, nullable=False)
    predicted_error_type = Column(String)
    prediction_confidence = Column(Float)
    suggestion_text = Column(String)
    shown_to_student = Column(Boolean, default=False)
    student_proceeded = Column(Boolean, default=False)
    actual_result = Column(Boolean)
    created_at = Column(DateTime, default=datetime.utcnow)

    attempt = relationship("StudentAttempt", back_populates="predictions")
