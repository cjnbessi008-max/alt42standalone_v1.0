"""
Student Solution and Flowchart Data Models
"""
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, JSON, Text, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.db.database import Base


class ActionType(str, enum.Enum):
    """Types of student actions"""
    VIEW_PROBLEM = "view_problem"
    ATTEMPT_SOLUTION = "attempt_solution"
    VIEW_HINT = "view_hint"
    VIEW_EXPLANATION = "view_explanation"
    CORRECT_ANSWER = "correct_answer"
    INCORRECT_ANSWER = "incorrect_answer"
    SKIP_PROBLEM = "skip_problem"
    REVISE_ANSWER = "revise_answer"
    USE_TOOL = "use_tool"  # e.g., calculator, visualizer


class Student(Base):
    """Student model"""
    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lms_user_id = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True)
    grade_level = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    solutions = relationship("StudentSolution", back_populates="student")
    actions = relationship("StudentAction", back_populates="student")


class Module(Base):
    """Educational module model"""
    __tablename__ = "modules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    subject = Column(String(100), default="mathematics")
    grade_level = Column(String(50))
    teacher_id = Column(UUID(as_uuid=True), nullable=False)
    status = Column(String(50), default="active")  # active, archived, draft
    world_model = Column(JSONB)  # AI-generated domain model
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    problems = relationship("Problem", back_populates="module")
    solutions = relationship("StudentSolution", back_populates="module")


class Problem(Base):
    """Problem/Question model"""
    __tablename__ = "problems"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id"), nullable=False)
    problem_type = Column(String(100))  # e.g., "fraction_addition", "visualization"
    content = Column(JSONB, nullable=False)  # Problem data (question, options, etc.)
    difficulty_level = Column(Integer, default=1)  # 1-5
    correct_answer = Column(JSONB)  # Expected answer
    hints = Column(JSONB)  # Available hints
    explanation = Column(Text)  # Solution explanation
    metadata = Column(JSONB)  # Additional problem metadata
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    module = relationship("Module", back_populates="problems")
    solutions = relationship("StudentSolution", back_populates="problem")


class StudentSolution(Base):
    """Student's solution/session for a problem"""
    __tablename__ = "student_solutions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id"), nullable=False)
    problem_id = Column(UUID(as_uuid=True), ForeignKey("problems.id"), nullable=False)

    # Session tracking
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    time_spent_seconds = Column(Integer, default=0)

    # Solution tracking
    final_answer = Column(JSONB)
    is_correct = Column(Boolean, nullable=True)
    attempts_count = Column(Integer, default=0)
    hints_used_count = Column(Integer, default=0)

    # Flowchart data
    solution_path = Column(JSONB)  # Serialized flowchart nodes and edges
    behavior_data = Column(JSONB)  # Click patterns, interactions, etc.

    # Metadata
    score = Column(Float, nullable=True)  # If graded
    feedback = Column(Text)  # Teacher or AI feedback
    metadata = Column(JSONB)

    # Relationships
    student = relationship("Student", back_populates="solutions")
    module = relationship("Module", back_populates="solutions")
    problem = relationship("Problem", back_populates="solutions")
    actions = relationship("StudentAction", back_populates="solution", order_by="StudentAction.timestamp")


class StudentAction(Base):
    """Individual student actions during problem solving"""
    __tablename__ = "student_actions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    solution_id = Column(UUID(as_uuid=True), ForeignKey("student_solutions.id"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)

    # Action details
    action_type = Column(SQLEnum(ActionType), nullable=False)
    action_data = Column(JSONB)  # Specific data for this action
    timestamp = Column(DateTime, default=datetime.utcnow)
    sequence_number = Column(Integer)  # Order within the solution session

    # Context
    previous_action_id = Column(UUID(as_uuid=True), ForeignKey("student_actions.id"), nullable=True)
    time_since_previous = Column(Float)  # Seconds since previous action

    # Relationships
    solution = relationship("StudentSolution", back_populates="actions")
    student = relationship("Student", back_populates="actions")
    previous_action = relationship("StudentAction", remote_side=[id], foreign_keys=[previous_action_id])


class FlowchartNode(Base):
    """Flowchart node for visualization"""
    __tablename__ = "flowchart_nodes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    solution_id = Column(UUID(as_uuid=True), ForeignKey("student_solutions.id"), nullable=False)

    # Node properties
    node_type = Column(String(50), nullable=False)  # start, action, decision, end
    label = Column(String(255))
    description = Column(Text)
    position_x = Column(Float)
    position_y = Column(Float)

    # Node data
    action_id = Column(UUID(as_uuid=True), ForeignKey("student_actions.id"), nullable=True)
    data = Column(JSONB)  # Additional node data

    # Visual properties
    style = Column(JSONB)  # Color, shape, etc.

    created_at = Column(DateTime, default=datetime.utcnow)


class FlowchartEdge(Base):
    """Flowchart edge connecting nodes"""
    __tablename__ = "flowchart_edges"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    solution_id = Column(UUID(as_uuid=True), ForeignKey("student_solutions.id"), nullable=False)

    # Edge properties
    source_node_id = Column(UUID(as_uuid=True), ForeignKey("flowchart_nodes.id"), nullable=False)
    target_node_id = Column(UUID(as_uuid=True), ForeignKey("flowchart_nodes.id"), nullable=False)
    label = Column(String(255))

    # Edge data
    weight = Column(Float, default=1.0)  # For analytics
    data = Column(JSONB)

    # Visual properties
    style = Column(JSONB)  # Line style, color, etc.

    created_at = Column(DateTime, default=datetime.utcnow)
