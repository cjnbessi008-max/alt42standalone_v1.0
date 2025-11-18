"""
데이터 모델 및 스키마 정의
Moodle LMS 학습 분석을 위한 데이터베이스 모델
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, JSON, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


# ============================================================================
# Enums
# ============================================================================

class QuestionType(str, Enum):
    """문제 유형"""
    REASONING = "reasoning"      # 추론 문제
    CALCULATION = "calculation"  # 계산 문제
    MIXED = "mixed"              # 혼합형
    UNKNOWN = "unknown"          # 미분류


class AnalysisStatus(str, Enum):
    """분석 상태"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class StrengthArea(str, Enum):
    """학생 강점 영역"""
    REASONING = "reasoning"      # 추론에 강함
    CALCULATION = "calculation"  # 계산에 강함
    BALANCED = "balanced"        # 균형잡힘
    INSUFFICIENT_DATA = "insufficient_data"  # 데이터 부족


# ============================================================================
# SQLAlchemy ORM Models
# ============================================================================

class MoodleCourse(Base):
    """Moodle 코스 정보"""
    __tablename__ = "moodle_courses"

    id = Column(Integer, primary_key=True)
    moodle_course_id = Column(Integer, unique=True, nullable=False, index=True)
    fullname = Column(String(255), nullable=False)
    shortname = Column(String(100), nullable=False)
    category = Column(String(100))
    startdate = Column(DateTime)
    enddate = Column(DateTime)
    last_synced = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    students = relationship("Student", back_populates="course")
    questions = relationship("Question", back_populates="course")


class Student(Base):
    """학생 정보"""
    __tablename__ = "students"

    id = Column(Integer, primary_key=True)
    moodle_user_id = Column(Integer, unique=True, nullable=False, index=True)
    username = Column(String(100), nullable=False)
    firstname = Column(String(100))
    lastname = Column(String(100))
    email = Column(String(255))
    course_id = Column(Integer, ForeignKey("moodle_courses.id"))
    last_synced = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    course = relationship("MoodleCourse", back_populates="students")
    attempts = relationship("QuestionAttempt", back_populates="student")
    analysis_results = relationship("StudentAnalysis", back_populates="student")


class Question(Base):
    """문제 정보"""
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True)
    moodle_question_id = Column(Integer, unique=True, nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("moodle_courses.id"))
    quiz_id = Column(Integer)
    question_text = Column(Text, nullable=False)
    question_type_moodle = Column(String(50))  # multichoice, numerical, essay, etc.

    # AI 분류 결과
    classified_type = Column(SQLEnum(QuestionType), default=QuestionType.UNKNOWN)
    classification_confidence = Column(Float)  # 0.0 ~ 1.0
    classification_reasoning = Column(Text)  # AI 분류 근거

    # 난이도 및 통계
    difficulty_level = Column(Float)  # 0.0(쉬움) ~ 1.0(어려움)
    average_score = Column(Float)
    attempt_count = Column(Integer, default=0)

    # 메타데이터
    tags = Column(JSON)  # ["algebra", "linear_equations", etc.]
    created_at = Column(DateTime, default=datetime.utcnow)
    last_classified = Column(DateTime)

    # Relationships
    course = relationship("MoodleCourse", back_populates="questions")
    attempts = relationship("QuestionAttempt", back_populates="question")


class QuestionAttempt(Base):
    """학생 문제 풀이 시도"""
    __tablename__ = "question_attempts"

    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False, index=True)
    moodle_attempt_id = Column(Integer, unique=True)

    # 시도 정보
    attempt_number = Column(Integer, default=1)  # 몇 번째 시도인지
    submitted_answer = Column(Text)
    correct_answer = Column(Text)
    is_correct = Column(Boolean)
    score = Column(Float)  # 0.0 ~ 1.0 (부분 점수 가능)
    max_score = Column(Float)

    # 시간 정보
    time_spent_seconds = Column(Integer)  # 문제 풀이에 소요된 시간
    started_at = Column(DateTime)
    submitted_at = Column(DateTime, nullable=False)

    # 메타데이터
    feedback = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="attempts")
    question = relationship("Question", back_populates="attempts")


class StudentAnalysis(Base):
    """학생 성과 분석 결과"""
    __tablename__ = "student_analysis"

    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    analysis_date = Column(DateTime, default=datetime.utcnow)
    status = Column(SQLEnum(AnalysisStatus), default=AnalysisStatus.PENDING)

    # 추론 능력 분석
    reasoning_score = Column(Float)  # 0.0 ~ 100.0
    reasoning_attempts = Column(Integer)
    reasoning_correct = Column(Integer)
    reasoning_avg_time = Column(Float)  # 평균 소요 시간(초)

    # 계산 능력 분석
    calculation_score = Column(Float)  # 0.0 ~ 100.0
    calculation_attempts = Column(Integer)
    calculation_correct = Column(Integer)
    calculation_avg_time = Column(Float)

    # 종합 분석
    strength_area = Column(SQLEnum(StrengthArea))
    strength_score_diff = Column(Float)  # 강점 영역과 약점 영역의 점수 차이
    overall_score = Column(Float)

    # 세부 분석
    difficulty_sensitivity = Column(JSON)  # 난이도별 정답률
    learning_trend = Column(JSON)  # 시간에 따른 성과 추이
    weak_topics = Column(JSON)  # 약점 토픽 리스트
    strong_topics = Column(JSON)  # 강점 토픽 리스트

    # AI 생성 인사이트
    insights = Column(Text)  # AI가 생성한 분석 인사이트
    recommendations = Column(Text)  # 학습 추천사항

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="analysis_results")


class CourseAnalysis(Base):
    """코스 전체 분석 결과"""
    __tablename__ = "course_analysis"

    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("moodle_courses.id"), nullable=False)
    analysis_date = Column(DateTime, default=datetime.utcnow)

    # 코스 전체 통계
    total_students = Column(Integer)
    total_questions = Column(Integer)
    reasoning_questions = Column(Integer)
    calculation_questions = Column(Integer)

    # 학생 분포
    reasoning_strong_count = Column(Integer)
    calculation_strong_count = Column(Integer)
    balanced_count = Column(Integer)

    # 평균 성과
    avg_reasoning_score = Column(Float)
    avg_calculation_score = Column(Float)
    avg_overall_score = Column(Float)

    # 상세 통계
    score_distribution = Column(JSON)  # 점수 분포 히스토그램 데이터
    difficulty_performance = Column(JSON)  # 난이도별 성과
    topic_performance = Column(JSON)  # 토픽별 성과

    created_at = Column(DateTime, default=datetime.utcnow)


# ============================================================================
# Pydantic Models (API Request/Response)
# ============================================================================

class MoodleConfig(BaseModel):
    """Moodle 연결 설정"""
    db_host: str
    db_port: int = 3306
    db_name: str
    db_user: str
    db_password: str
    api_url: Optional[str] = None
    api_token: Optional[str] = None


class QuestionClassificationRequest(BaseModel):
    """문제 분류 요청"""
    question_ids: List[int]
    force_reclassify: bool = False


class QuestionClassificationResult(BaseModel):
    """문제 분류 결과"""
    question_id: int
    moodle_question_id: int
    question_text: str
    classified_type: QuestionType
    confidence: float
    reasoning: str
    tags: Optional[List[str]] = []


class StudentPerformanceRequest(BaseModel):
    """학생 성과 분석 요청"""
    student_id: int
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None


class StudentPerformanceResponse(BaseModel):
    """학생 성과 분석 응답"""
    student_id: int
    moodle_user_id: int
    student_name: str

    reasoning_score: float
    reasoning_attempts: int
    reasoning_correct: int
    reasoning_accuracy: float

    calculation_score: float
    calculation_attempts: int
    calculation_correct: int
    calculation_accuracy: float

    strength_area: StrengthArea
    strength_score_diff: float
    overall_score: float

    insights: str
    recommendations: str

    learning_trend: Dict[str, Any]
    weak_topics: List[str]
    strong_topics: List[str]

    class Config:
        from_attributes = True


class CoursePerformanceResponse(BaseModel):
    """코스 성과 분석 응답"""
    course_id: int
    course_name: str

    total_students: int
    total_questions: int
    reasoning_questions: int
    calculation_questions: int

    reasoning_strong_count: int
    calculation_strong_count: int
    balanced_count: int

    avg_reasoning_score: float
    avg_calculation_score: float
    avg_overall_score: float

    score_distribution: Dict[str, Any]
    difficulty_performance: Dict[str, Any]
    topic_performance: Dict[str, Any]

    top_performers: List[Dict[str, Any]]
    struggling_students: List[Dict[str, Any]]


class SyncRequest(BaseModel):
    """데이터 동기화 요청"""
    course_ids: Optional[List[int]] = None
    sync_students: bool = True
    sync_questions: bool = True
    sync_attempts: bool = True
    date_from: Optional[datetime] = None


class SyncResponse(BaseModel):
    """데이터 동기화 응답"""
    status: str
    courses_synced: int
    students_synced: int
    questions_synced: int
    attempts_synced: int
    errors: List[str] = []
    duration_seconds: float


class AnalysisJobRequest(BaseModel):
    """분석 작업 요청"""
    course_id: Optional[int] = None
    student_ids: Optional[List[int]] = None
    analyze_all: bool = False


class AnalysisJobResponse(BaseModel):
    """분석 작업 응답"""
    job_id: str
    status: AnalysisStatus
    total_students: int
    completed: int
    failed: int
    estimated_time_remaining: Optional[int] = None
