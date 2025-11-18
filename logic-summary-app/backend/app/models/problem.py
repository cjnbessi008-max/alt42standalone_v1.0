from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Problem(Base):
    """Database model for logic problems"""
    __tablename__ = "problems"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    problem_type = Column(String(50), default="logic")  # logic, math, reasoning
    grade_level = Column(String(20), nullable=True)

    # AI-generated logic summary
    propositions = Column(JSON, nullable=True)  # List of extracted propositions
    logic_summary = Column(Text, nullable=True)  # Human-readable summary

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Problem(id={self.id}, title='{self.title}')>"
