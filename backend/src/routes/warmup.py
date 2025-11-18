"""
워밍업 문제 추천 API 라우터
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from ..models.problem import (
    WarmupRecommendationRequest,
    WarmupRecommendationResponse,
    Problem
)
from ..services.warmup_recommender import WarmupRecommender
from ..services.problem_repository import InMemoryProblemRepository
from ..services.lms_integration import LMSIntegrationService

router = APIRouter(prefix="/api/warmup", tags=["warmup"])

# 싱글톤 인스턴스 (실제로는 의존성 주입 사용)
_problem_repository = None
_warmup_recommender = None
_lms_service = None


def get_problem_repository():
    """문제 저장소 의존성"""
    global _problem_repository
    if _problem_repository is None:
        _problem_repository = InMemoryProblemRepository()
    return _problem_repository


def get_warmup_recommender():
    """워밍업 추천기 의존성"""
    global _warmup_recommender
    if _warmup_recommender is None:
        _warmup_recommender = WarmupRecommender(get_problem_repository())
    return _warmup_recommender


def get_lms_service():
    """LMS 서비스 의존성"""
    global _lms_service
    if _lms_service is None:
        _lms_service = LMSIntegrationService()
    return _lms_service


@router.post("/recommend", response_model=WarmupRecommendationResponse)
async def recommend_warmup_problem(
    request: WarmupRecommendationRequest,
    recommender: WarmupRecommender = Depends(get_warmup_recommender),
    lms_service: LMSIntegrationService = Depends(get_lms_service)
):
    """
    워밍업 문제 즉시 추천 API

    동일 유형의 쉬운 문제 1개를 즉시 추천합니다.

    - **student_id**: 학생 ID (필수)
    - **current_problem_id**: 현재 문제 ID (선택, 동일 유형 추천시 사용)
    - **problem_type**: 문제 유형 (선택)
    - **subject**: 과목 (선택)
    - **grade_level**: 학년 (선택)

    Returns:
        추천된 워밍업 문제와 추천 이유, 신뢰도 점수
    """
    try:
        # LMS 컨텍스트 조회 (비동기, 실패해도 추천은 진행)
        lms_context = await lms_service.get_student_context(request.student_id)

        # LMS에서 가져온 정보로 요청 보강
        if lms_context.get("lms_connected"):
            student_info = lms_context.get("student_info", {})
            # LMS에서 학년 정보가 있으면 사용
            if not request.grade_level and "grade" in student_info:
                request.grade_level = student_info["grade"]

        # 워밍업 문제 추천
        recommendation = recommender.recommend_warmup_problem(request)

        return recommendation

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"추천 중 오류 발생: {str(e)}"
        )


@router.post("/submit")
async def submit_warmup_result(
    student_id: str,
    problem_id: str,
    answer: str,
    time_spent_seconds: int,
    repository=Depends(get_problem_repository),
    lms_service: LMSIntegrationService = Depends(get_lms_service)
):
    """
    워밍업 문제 풀이 결과 제출

    - **student_id**: 학생 ID
    - **problem_id**: 문제 ID
    - **answer**: 학생의 답안
    - **time_spent_seconds**: 소요 시간(초)

    Returns:
        채점 결과 및 LMS 동기화 상태
    """
    try:
        # 문제 조회
        problem = repository.get_by_id(problem_id)
        if not problem:
            raise HTTPException(status_code=404, detail="문제를 찾을 수 없습니다.")

        # 정답 확인
        is_correct = answer.strip().lower() == problem.correct_answer.strip().lower()

        # 결과 저장
        attempt = repository.save_attempt(
            student_id=student_id,
            problem_id=problem_id,
            answer=answer,
            is_correct=is_correct,
            time_spent_seconds=time_spent_seconds
        )

        # LMS에 결과 동기화 (비동기)
        lms_synced = await lms_service.sync_problem_result(
            student_id=student_id,
            problem_id=problem_id,
            is_correct=is_correct,
            time_spent_seconds=time_spent_seconds
        )

        return {
            "attempt_id": attempt["id"],
            "is_correct": is_correct,
            "correct_answer": problem.correct_answer,
            "explanation": problem.explanation,
            "lms_synced": lms_synced,
            "message": "정답입니다! 🎉" if is_correct else "다시 한번 생각해보세요."
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"제출 중 오류 발생: {str(e)}"
        )


@router.get("/student/{student_id}/history")
async def get_student_history(
    student_id: str,
    repository=Depends(get_problem_repository)
):
    """
    학생의 워밍업 문제 풀이 이력 조회

    - **student_id**: 학생 ID

    Returns:
        풀이 이력 목록
    """
    history = repository.get_student_history(student_id)
    return {
        "student_id": student_id,
        "total_attempts": len(history),
        "correct_count": sum(1 for h in history if h.get("is_correct")),
        "history": history
    }


@router.get("/problems")
async def list_warmup_problems(
    difficulty: Optional[str] = None,
    subject: Optional[str] = None,
    repository=Depends(get_problem_repository)
):
    """
    워밍업 문제 목록 조회

    - **difficulty**: 난이도 필터 (선택)
    - **subject**: 과목 필터 (선택)

    Returns:
        문제 목록
    """
    criteria = {}
    if difficulty:
        criteria["difficulty"] = difficulty
    if subject:
        criteria["subject"] = subject

    if criteria:
        problems = repository.find_problems(criteria)
    else:
        problems = repository.get_all_problems()

    return {
        "total": len(problems),
        "problems": problems
    }


@router.get("/problems/{problem_id}")
async def get_problem_detail(
    problem_id: str,
    repository=Depends(get_problem_repository)
):
    """
    특정 문제 상세 조회

    - **problem_id**: 문제 ID

    Returns:
        문제 상세 정보
    """
    problem = repository.get_by_id(problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="문제를 찾을 수 없습니다.")

    return problem
