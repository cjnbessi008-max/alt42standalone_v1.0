"""
문제(Problem) 데이터 모델
워밍업 문제 추천을 위한 기본 데이터 구조
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum


class DifficultyLevel(str, Enum):
    """난이도 레벨"""
    VERY_EASY = "very_easy"
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    VERY_HARD = "very_hard"


class ProblemType(str, Enum):
    """문제 유형"""
    MULTIPLE_CHOICE = "multiple_choice"
    SHORT_ANSWER = "short_answer"
    FILL_IN_BLANK = "fill_in_blank"
    TRUE_FALSE = "true_false"
    MATCHING = "matching"
    CALCULATION = "calculation"


class Subject(str, Enum):
    """과목"""
    MATH = "math"
    SCIENCE = "science"
    LANGUAGE = "language"
    SOCIAL_STUDIES = "social_studies"


class Problem(BaseModel):
    """문제 모델"""
    id: str = Field(..., description="문제 고유 ID")
    title: str = Field(..., description="문제 제목")
    content: str = Field(..., description="문제 내용")
    problem_type: ProblemType = Field(..., description="문제 유형")
    subject: Subject = Field(..., description="과목")
    difficulty: DifficultyLevel = Field(..., description="난이도")
    grade_level: int = Field(..., ge=1, le=12, description="학년 (1-12)")
    tags: List[str] = Field(default_factory=list, description="태그 목록")
    estimated_time_minutes: int = Field(..., ge=1, description="예상 소요 시간(분)")

    # 정답 관련
    correct_answer: str = Field(..., description="정답")
    explanation: Optional[str] = Field(None, description="해설")

    # 메타데이터
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Config:
        json_schema_extra = {
            "example": {
                "id": "prob_001",
                "title": "분수의 덧셈",
                "content": "1/4 + 1/4 = ?",
                "problem_type": "calculation",
                "subject": "math",
                "difficulty": "easy",
                "grade_level": 3,
                "tags": ["분수", "덧셈", "기초"],
                "estimated_time_minutes": 3,
                "correct_answer": "1/2",
                "explanation": "같은 분모를 가진 분수의 덧셈은 분자끼리 더합니다."
            }
        }


class WarmupRecommendationRequest(BaseModel):
    """워밍업 문제 추천 요청"""
    student_id: str = Field(..., description="학생 ID")
    current_problem_id: Optional[str] = Field(None, description="현재 문제 ID (동일 유형 추천시 사용)")
    problem_type: Optional[ProblemType] = Field(None, description="문제 유형")
    subject: Optional[Subject] = Field(None, description="과목")
    grade_level: Optional[int] = Field(None, ge=1, le=12, description="학년")

    class Config:
        json_schema_extra = {
            "example": {
                "student_id": "student_123",
                "current_problem_id": "prob_001",
                "problem_type": "calculation",
                "subject": "math",
                "grade_level": 3
            }
        }


class WarmupRecommendationResponse(BaseModel):
    """워밍업 문제 추천 응답"""
    recommended_problem: Problem
    reason: str = Field(..., description="추천 이유")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="추천 신뢰도 (0-1)")

    class Config:
        json_schema_extra = {
            "example": {
                "recommended_problem": {
                    "id": "prob_002",
                    "title": "분수의 기초",
                    "content": "1/3 + 1/3 = ?",
                    "problem_type": "calculation",
                    "subject": "math",
                    "difficulty": "easy",
                    "grade_level": 3,
                    "tags": ["분수", "덧셈", "워밍업"],
                    "estimated_time_minutes": 2,
                    "correct_answer": "2/3",
                    "explanation": "같은 분모를 가진 분수는 분자만 더합니다."
                },
                "reason": "동일 유형(분수 덧셈)의 더 쉬운 문제로 워밍업에 적합합니다.",
                "confidence_score": 0.92
            }
        }


class StudentAttempt(BaseModel):
    """학생 문제 풀이 기록"""
    id: str
    student_id: str
    problem_id: str
    answer: str
    is_correct: bool
    time_spent_seconds: int
    attempted_at: datetime = Field(default_factory=datetime.now)
