"""
User model updates for standalone authentication
"""
from sqlalchemy import Column, String, Boolean
from app.models.student_solution import Student as BaseStudent


# Extend Student model with authentication fields
# Add these columns to the Student table
def add_auth_columns():
    """
    Add these columns to Student model in student_solution.py:

    password_hash = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_teacher = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    last_login = Column(DateTime, nullable=True)
    """
    pass
