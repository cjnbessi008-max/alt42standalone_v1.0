"""Tips API endpoints"""
from fastapi import APIRouter, HTTPException, Depends
from uuid import UUID
from typing import Optional, List
from datetime import datetime

from ..models.tips import (
    PerspectiveTip,
    TipRequest,
    TipResponse,
    TipRecommendation
)
from ..services.tip_service import TipRecommendationEngine, ProblemTypeClassifier


router = APIRouter(prefix="/api/tips", tags=["tips"])


# Dependency injection (실제로는 DB 세션)
async def get_db():
    # yield db_session
    yield None


@router.post("/recommend", response_model=TipResponse)
async def recommend_tip(
    request: TipRequest,
    db=Depends(get_db)
):
    """
    학생에게 맞춤 관점 전환 팁 추천

    - **student_id**: 학생 ID
    - **problem_id**: 문제 ID
    - **current_attempt_number**: 현재 시도 횟수
    - **time_spent_seconds**: 소요 시간 (선택)
    - **previous_answers**: 이전 답안들 (선택)
    """
    try:
        engine = TipRecommendationEngine(db)

        # 문제 정보 조회 (실제로는 DB에서)
        # problem = await db.get_problem(request.problem_id)
        # problem_type_id = problem.problem_type_id

        # 임시로 UUID 사용
        from uuid import uuid4
        problem_type_id = uuid4()

        recommendation = await engine.recommend_tip(
            student_id=request.student_id,
            problem_id=request.problem_id,
            problem_type_id=problem_type_id,
            attempt_number=request.current_attempt_number,
            time_spent_seconds=request.time_spent_seconds,
            previous_answers=request.previous_answers
        )

        return TipResponse(**recommendation)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/feedback/{recommendation_id}")
async def submit_tip_feedback(
    recommendation_id: UUID,
    was_helpful: bool,
    student_feedback: Optional[str] = None,
    db=Depends(get_db)
):
    """
    팁이 도움되었는지 피드백 제출

    - **recommendation_id**: 팁 추천 ID
    - **was_helpful**: 도움 되었는지 여부
    - **student_feedback**: 학생의 추가 피드백 (선택)
    """
    try:
        engine = TipRecommendationEngine(db)
        await engine.record_tip_feedback(
            recommendation_id,
            was_helpful,
            student_feedback
        )

        return {
            "status": "success",
            "message": "피드백이 기록되었습니다"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/problem-type/{problem_type_id}", response_model=List[PerspectiveTip])
async def get_tips_by_problem_type(
    problem_type_id: UUID,
    perspective_type: Optional[str] = None,
    tip_level: Optional[int] = None,
    db=Depends(get_db)
):
    """
    문제 유형별 팁 목록 조회

    - **problem_type_id**: 문제 유형 ID
    - **perspective_type**: 관점 타입 필터 (visual, algebraic, geometric, conceptual)
    - **tip_level**: 팁 레벨 필터 (1: basic, 2: intermediate, 3: advanced)
    """
    # 실제로는 DB 쿼리
    # SELECT * FROM perspective_tips WHERE problem_type_id = ?
    # AND (perspective_type = ? OR ? IS NULL)
    # AND (tip_level = ? OR ? IS NULL)

    return []


@router.post("/classify-problem")
async def classify_problem_type(
    problem_content: str
):
    """
    문제 내용을 분석하여 자동으로 유형 분류

    - **problem_content**: 문제 내용 (한국어)
    """
    try:
        problem_type = await ProblemTypeClassifier.classify(problem_content)

        if not problem_type:
            return {
                "problem_type": None,
                "confidence": 0.0,
                "message": "문제 유형을 자동으로 분류할 수 없습니다"
            }

        return {
            "problem_type": problem_type,
            "confidence": 0.8,
            "message": f"'{problem_type}' 유형으로 분류되었습니다"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/{problem_type_id}")
async def get_tip_analytics(
    problem_type_id: UUID,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db=Depends(get_db)
):
    """
    팁 효과성 분석 데이터

    - **problem_type_id**: 문제 유형 ID
    - **date_from**: 시작 날짜 (선택)
    - **date_to**: 종료 날짜 (선택)
    """
    try:
        engine = TipRecommendationEngine(db)
        analytics = await engine.get_tip_analytics(
            problem_type_id,
            date_from,
            date_to
        )

        return analytics

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/student/{student_id}/effectiveness")
async def get_student_tip_effectiveness(
    student_id: UUID,
    problem_type_id: Optional[UUID] = None,
    db=Depends(get_db)
):
    """
    학생별 팁 효과성 조회
    어떤 관점의 팁이 이 학생에게 효과적인지 분석

    - **student_id**: 학생 ID
    - **problem_type_id**: 문제 유형 ID (선택, 없으면 전체)
    """
    # 실제로는 student_learning_profiles 테이블에서 조회
    return {
        "student_id": str(student_id),
        "preferred_perspective": "visual",
        "perspective_effectiveness": {
            "visual": 0.85,
            "geometric": 0.72,
            "algebraic": 0.55,
            "conceptual": 0.68
        },
        "total_tips_received": 42,
        "helpful_rate": 0.73
    }
