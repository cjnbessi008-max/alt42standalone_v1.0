"""
Pydantic models for Daily Mission API
"""
from datetime import date, datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from enum import Enum
from pydantic import BaseModel, Field, EmailStr


# Enums
class MissionStatus(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"


class UserRole(str, Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"


class ProblemType(str, Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    SHORT_ANSWER = "short_answer"
    ESSAY = "essay"
    CODE = "code"


class NotificationType(str, Enum):
    PROBLEM_AVAILABLE = "problem_available"
    REMINDER = "reminder"
    ACHIEVEMENT = "achievement"


# User Models
class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: UserRole = UserRole.STUDENT
    lms_user_id: Optional[str] = None
    institution: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Daily Mission Models
class DailyMissionBase(BaseModel):
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    subject: Optional[str] = Field(None, max_length=100)
    grade_level: Optional[str] = Field(None, max_length=50)
    problem_pool_size: int = Field(default=30, ge=1)
    difficulty_adaptive: bool = False
    status: MissionStatus = MissionStatus.ACTIVE
    start_date: date
    end_date: Optional[date] = None
    lms_course_id: Optional[str] = None


class DailyMissionCreate(DailyMissionBase):
    pass


class DailyMissionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[MissionStatus] = None
    end_date: Optional[date] = None


class DailyMissionResponse(DailyMissionBase):
    id: UUID
    teacher_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Problem Models
class ProblemContent(BaseModel):
    """Flexible problem content structure"""
    question: str
    options: Optional[List[str]] = None  # For multiple choice
    code_template: Optional[str] = None  # For coding problems
    metadata: Optional[Dict[str, Any]] = None


class MissionProblemBase(BaseModel):
    mission_id: UUID
    problem_content: ProblemContent
    problem_type: ProblemType
    difficulty_level: int = Field(..., ge=1, le=5)
    topic: Optional[str] = Field(None, max_length=100)
    correct_answer: Dict[str, Any]
    explanation: Optional[str] = None
    hints: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None


class MissionProblemCreate(MissionProblemBase):
    pass


class MissionProblemResponse(MissionProblemBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# Progress Models
class StudentAnswerSubmission(BaseModel):
    problem_id: UUID
    answer: Dict[str, Any]
    time_spent_seconds: Optional[int] = None


class StudentMissionProgressResponse(BaseModel):
    id: UUID
    student_id: UUID
    mission_id: UUID
    problem_id: UUID
    today_date: date
    is_completed: bool
    is_correct: Optional[bool]
    student_answer: Optional[Dict[str, Any]]
    time_spent_seconds: Optional[int]
    attempts_count: int
    hints_used: int
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


# Streak Models
class StudentMissionStreakResponse(BaseModel):
    id: UUID
    student_id: UUID
    mission_id: UUID
    current_streak: int
    longest_streak: int
    last_completed_date: Optional[date]
    total_completed: int
    total_correct: int
    updated_at: datetime

    class Config:
        from_attributes = True


# Enrollment Models
class MissionEnrollmentCreate(BaseModel):
    student_id: UUID
    mission_id: UUID


class MissionEnrollmentResponse(BaseModel):
    id: UUID
    student_id: UUID
    mission_id: UUID
    enrolled_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


# Daily Problem Assignment
class DailyProblemAssignmentResponse(BaseModel):
    id: UUID
    mission_id: UUID
    problem_id: UUID
    assigned_date: date
    created_at: datetime

    class Config:
        from_attributes = True


# Notification Models
class NotificationResponse(BaseModel):
    id: UUID
    student_id: UUID
    mission_id: UUID
    notification_type: NotificationType
    title: str
    message: Optional[str]
    sent_at: datetime
    read_at: Optional[datetime]
    metadata: Optional[Dict[str, Any]]

    class Config:
        from_attributes = True


# Dashboard/Analytics Models
class StudentDashboardResponse(BaseModel):
    today_problem: Optional[MissionProblemResponse]
    progress: Optional[StudentMissionProgressResponse]
    streak: Optional[StudentMissionStreakResponse]
    mission: DailyMissionResponse


class MissionAnalyticsResponse(BaseModel):
    mission_id: UUID
    total_students: int
    active_students: int
    completion_rate: float
    average_correct_rate: float
    average_time_seconds: float
    total_problems_completed: int
