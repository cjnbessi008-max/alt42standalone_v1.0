"""
API 라우트 정의
"""
from fastapi import APIRouter, HTTPException
from app.models import SubmissionData, SubmissionResponse
from app.validators import validate_answer

router = APIRouter()


@router.post("/submit", response_model=SubmissionResponse)
async def submit_answer(submission: SubmissionData):
    """
    답안 제출 엔드포인트

    클라이언트로부터 답안을 받아 검증하고 결과를 반환합니다.

    Args:
        submission: 제출 데이터 (답안, 문제ID, 학생ID)

    Returns:
        제출 결과 및 검증 결과
    """
    try:
        # 답안 검증
        validation_result = validate_answer(submission.answer)

        if not validation_result.is_valid:
            return SubmissionResponse(
                success=False,
                validation_result=validation_result,
                message="답안 검증에 실패했습니다. 오류를 확인하고 다시 제출해주세요."
            )

        # 검증 성공
        # TODO: 여기에 실제 답안 저장 로직 추가
        # - 데이터베이스에 저장
        # - LMS와 연동
        # - 채점 로직 실행

        return SubmissionResponse(
            success=True,
            validation_result=validation_result,
            message="✓ 답안이 성공적으로 검증되고 제출되었습니다!"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"서버 오류가 발생했습니다: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """
    헬스 체크 엔드포인트

    Returns:
        서버 상태
    """
    return {
        "status": "healthy",
        "service": "answer-submission-validator",
        "version": "1.0.0"
    }
