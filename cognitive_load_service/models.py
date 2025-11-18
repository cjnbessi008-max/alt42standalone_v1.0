"""
데이터 모델 정의
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from enum import Enum


class ProblemType(str, Enum):
    """문제 유형"""
    CALCULATION = "calculation"  # 단순 계산
    WORD_PROBLEM = "word_problem"  # 단어 문제
    MULTISTEP = "multistep"  # 다단계 문제
    CONCEPTUAL = "conceptual"  # 개념 이해
    PROBLEM_SOLVING = "problem_solving"  # 문제 해결
    PROOF = "proof"  # 증명/논리


class AnswerType(str, Enum):
    """답변 유형"""
    NUMERICAL = "numerical"
    MULTIPLE_CHOICE = "multichoice"
    TRUE_FALSE = "truefalse"
    SHORT_ANSWER = "shortanswer"
    ESSAY = "essay"
    MATCHING = "matching"


class DifficultyLevel(str, Enum):
    """난이도 레벨"""
    VERY_LOW = "Very Low"
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    VERY_HIGH = "Very High"


class IntrinsicLoadMetrics(BaseModel):
    """내재적 부하 메트릭"""
    concept_complexity: float = Field(ge=0, le=10, description="개념 복잡도")
    relationship_complexity: float = Field(ge=0, le=10, description="관계 복잡도")
    required_steps: float = Field(ge=0, le=10, description="필수 단계 수")
    prerequisite_knowledge: float = Field(ge=0, le=10, description="전제 지식")
    reasoning: str = Field(description="설명")


class ExtraneousLoadMetrics(BaseModel):
    """외재적 부하 메트릭"""
    information_density: float = Field(ge=0, le=10, description="정보 밀도")
    visual_complexity: float = Field(ge=0, le=10, description="시각적 복잡도")
    linguistic_complexity: float = Field(ge=0, le=10, description="언어 복잡도")
    reasoning: str = Field(description="설명")


class GermaneLoadMetrics(BaseModel):
    """본유적 부하 메트릭"""
    abstraction_level: float = Field(ge=0, le=10, description="추상화 수준")
    pattern_recognition: float = Field(ge=0, le=10, description="패턴 인식 요구")
    transfer_potential: float = Field(ge=0, le=10, description="전이 가능성")
    reasoning: str = Field(description="설명")


class AIAnalysisResult(BaseModel):
    """AI 분석 결과"""
    intrinsic: IntrinsicLoadMetrics
    extraneous: ExtraneousLoadMetrics
    germane: GermaneLoadMetrics
    concepts_identified: List[str] = Field(description="식별된 개념 목록")
    prerequisite_concepts: List[str] = Field(description="선수 학습 개념")
    estimated_time_minutes: int = Field(ge=0, description="예상 소요 시간 (분)")
    recommendations: str = Field(description="교사를 위한 추천사항")


class RuleBasedAnalysis(BaseModel):
    """규칙 기반 분석 결과"""
    linguistic_complexity: float
    information_density: float
    equation_count: int
    number_count: int
    word_count: int
    sentence_count: int = 0
    has_diagram: bool = False
    has_table: bool = False


class ProblemAnalysisRequest(BaseModel):
    """문제 분석 요청"""
    problem_id: int = Field(description="문제 ID")
    problem_type: ProblemType = Field(description="문제 유형")
    question_text: str = Field(description="문제 텍스트")
    question_html: Optional[str] = Field(None, description="문제 HTML")
    answer_type: AnswerType = Field(description="답변 유형")
    grade_level: int = Field(ge=1, le=12, description="학년 수준")
    subject: str = Field(default="mathematics", description="과목")
    correct_answer: Optional[str] = Field(None, description="정답")
    max_marks: Optional[float] = Field(None, description="배점")


class CognitiveLoadScore(BaseModel):
    """인지 부하 점수"""
    intrinsic: float = Field(ge=0, le=10, description="내재적 부하")
    extraneous: float = Field(ge=0, le=10, description="외재적 부하")
    germane: float = Field(ge=0, le=10, description="본유적 부하")
    total: float = Field(ge=0, le=100, description="총 점수")
    level: DifficultyLevel = Field(description="난이도 레벨")


class CognitiveLoadResponse(BaseModel):
    """인지 부하 분석 응답"""
    problem_id: int
    intrinsic_load: float
    extraneous_load: float
    germane_load: float
    total_score: float
    difficulty_level: DifficultyLevel
    analysis_details: Dict
    estimated_time_minutes: int = 0
    recommendations: str = ""


class BatchAnalysisRequest(BaseModel):
    """일괄 분석 요청"""
    problems: List[ProblemAnalysisRequest]


class BatchAnalysisResponse(BaseModel):
    """일괄 분석 응답"""
    results: List[CognitiveLoadResponse]
    total_analyzed: int
    average_load: float
    distribution: Dict[DifficultyLevel, int]


class StudentMetrics(BaseModel):
    """학생 메트릭"""
    student_id: int
    problem_id: int
    time_spent_seconds: int
    num_attempts: int
    hints_used: int = 0
    is_correct: bool
    perceived_difficulty: Optional[int] = Field(None, ge=1, le=5)
    cognitive_load_experienced: float


class QuizAnalysisSummary(BaseModel):
    """퀴즈 분석 요약"""
    quiz_id: int
    total_questions: int
    average_cognitive_load: float
    load_distribution: Dict[DifficultyLevel, int]
    recommended_time_minutes: int
    balance_score: float = Field(ge=0, le=100, description="난이도 균형 점수")
    warnings: List[str] = Field(default_factory=list)
