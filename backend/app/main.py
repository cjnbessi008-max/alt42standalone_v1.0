"""
Answer Classification API - Main Application
FastAPI application for classifying student wrong answers
"""
import logging
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.models import schemas
from app.services.classifier import AnswerClassifier, should_request_teacher_review
from app.config import get_settings

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Settings
settings = get_settings()

# Global classifier instance
classifier: Optional[AnswerClassifier] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle management"""
    global classifier

    # Startup
    logger.info("Starting Answer Classification API...")
    classifier = AnswerClassifier(
        api_key=settings.anthropic_api_key,
        model=settings.claude_model
    )
    logger.info(f"Classifier initialized with model: {classifier.get_model_version()}")

    yield

    # Shutdown
    logger.info("Shutting down Answer Classification API...")
    classifier = None


# Create FastAPI app
app = FastAPI(
    title="Answer Classification API",
    description="LMS 연동 오답 원인 분류 시스템 (개념/계산/조건누락)",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Helper Functions
# ============================================================================

def get_classifier() -> AnswerClassifier:
    """Dependency for classifier service"""
    if classifier is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Classifier service not initialized"
        )
    return classifier


# Mock database functions (replace with real DB in production)
async def get_problem_from_db(problem_id: UUID) -> dict:
    """데이터베이스에서 문제 정보 조회"""
    # TODO: Replace with actual database query
    return {
        "id": str(problem_id),
        "problem_text": "1/3 + 1/4 = ?",
        "correct_answer": "7/12",
        "problem_type": "fraction_addition",
        "module_id": "00000000-0000-0000-0000-000000000021"
    }


async def validate_answer(answer: str, correct_answer: str) -> bool:
    """답안 정확성 검증"""
    # TODO: Implement proper answer validation logic
    # For now, simple string comparison
    return answer.strip().lower() == correct_answer.strip().lower()


async def save_submission_to_db(submission_data: dict) -> UUID:
    """답안 제출 DB 저장"""
    # TODO: Replace with actual database insert
    from uuid import uuid4
    submission_id = uuid4()
    logger.info(f"Saved submission {submission_id} to database")
    return submission_id


async def save_classification_to_db(classification_data: dict) -> UUID:
    """분류 결과 DB 저장"""
    # TODO: Replace with actual database insert
    from uuid import uuid4
    classification_id = uuid4()
    logger.info(f"Saved classification {classification_id} to database")
    return classification_id


async def get_recommended_resources(
    classification_type: str,
    problem_type: str
) -> list:
    """분류 타입에 따른 학습 리소스 추천"""
    # TODO: Implement resource recommendation logic
    resources = []

    if classification_type == "개념":
        resources.append({
            "id": "resource-1",
            "feedback_type": "concept",
            "title": "분수 덧셈 기본 개념",
            "content": "분수를 더할 때는 분모를 먼저 같게 만들어야 합니다 (통분).",
            "resource_url": "/resources/fraction-addition-basics"
        })

    return resources


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/health", response_model=schemas.HealthCheckResponse)
async def health_check():
    """헬스 체크 엔드포인트"""
    return schemas.HealthCheckResponse(
        status="healthy",
        version="1.0.0",
        timestamp=datetime.utcnow(),
        database="connected",  # TODO: Check actual DB connection
        ai_service="operational" if classifier else "unavailable"
    )


@app.post(
    "/api/v1/answers/submit",
    response_model=schemas.AnswerSubmitResponse,
    status_code=status.HTTP_201_CREATED
)
async def submit_answer(
    request: schemas.AnswerSubmitRequest,
    classifier_service: AnswerClassifier = Depends(get_classifier)
):
    """
    학생 답안 제출 및 자동 분류

    학생이 문제에 답한 내용을 제출하면:
    1. 정답 여부 확인
    2. 오답일 경우 AI로 원인 분류 (개념/계산/조건누락)
    3. 개인화된 피드백 생성
    4. 학습 리소스 추천

    Returns:
        AnswerSubmitResponse: 평가 결과 및 분류 정보
    """
    try:
        # 1. 문제 정보 조회
        problem = await get_problem_from_db(request.problem_id)
        logger.info(f"Processing answer for problem: {problem['id']}")

        # 2. 정답 여부 확인
        is_correct = await validate_answer(
            request.answer_content,
            problem['correct_answer']
        )

        # 3. 답안 제출 정보 저장
        submission_data = {
            "student_id": str(request.student_id),
            "problem_id": str(request.problem_id),
            "module_id": problem['module_id'],
            "answer_content": request.answer_content,
            "answer_data": request.answer_data,
            "work_shown": request.work_shown,
            "work_images": request.work_images,
            "is_correct": is_correct,
            "time_spent_seconds": request.time_spent_seconds,
            "lms_submission_id": request.lms_submission_id,
            "lms_source": request.lms_source,
            "submitted_at": datetime.utcnow(),
            "evaluated_at": datetime.utcnow()
        }

        submission_id = await save_submission_to_db(submission_data)

        # 4. 정답이면 분류 없이 반환
        if is_correct:
            logger.info(f"Answer is correct for submission {submission_id}")
            return schemas.AnswerSubmitResponse(
                submission_id=submission_id,
                is_correct=True,
                classification=None,
                recommended_resources=[],
                evaluated_at=datetime.utcnow()
            )

        # 5. 오답이면 AI 분류 수행
        logger.info(f"Answer is incorrect, classifying error type...")

        classification_result = await classifier_service.classify_answer(
            problem_text=problem['problem_text'],
            correct_answer=problem['correct_answer'],
            student_answer=request.answer_content,
            work_shown=request.work_shown,
            problem_context={
                "problem_type": problem.get('problem_type'),
                "difficulty": problem.get('difficulty_level')
            }
        )

        # 6. 분류 결과 저장
        classification_data = {
            "submission_id": str(submission_id),
            "classification_type": classification_result['classification'],
            "confidence_score": classification_result['confidence'],
            "explanation": classification_result['reasoning'],
            "ai_reasoning": classification_result['reasoning'],
            "ai_model_version": classifier_service.get_model_version(),
            "feedback_message": classification_result['feedback'],
            "teacher_verified": False,
            "classified_at": datetime.utcnow()
        }

        classification_id = await save_classification_to_db(classification_data)

        # 7. 학습 리소스 추천
        resources = await get_recommended_resources(
            classification_type=classification_result['classification'],
            problem_type=problem.get('problem_type', 'general')
        )

        # 8. 낮은 신뢰도는 로깅 (교사 검토 필요)
        if should_request_teacher_review(classification_result['confidence']):
            logger.warning(
                f"Low confidence classification ({classification_result['confidence']}) "
                f"for submission {submission_id} - teacher review recommended"
            )

        # 9. 응답 생성
        return schemas.AnswerSubmitResponse(
            submission_id=submission_id,
            is_correct=False,
            classification=schemas.ClassificationResult(
                type=schemas.ErrorType(classification_result['classification']),
                confidence=classification_result['confidence'],
                explanation=classification_result['reasoning'],
                feedback=classification_result['feedback'],
                ai_reasoning=classification_result['reasoning'],
                teacher_verified=False
            ),
            recommended_resources=[
                schemas.ResourceRecommendation(**r) for r in resources
            ],
            evaluated_at=datetime.utcnow()
        )

    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error in submit_answer: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="답안 처리 중 오류가 발생했습니다."
        )


@app.get(
    "/api/v1/students/{student_id}/error-patterns",
    response_model=schemas.StudentErrorPatternsResponse
)
async def get_student_error_patterns(student_id: UUID):
    """
    학생의 오류 패턴 조회

    특정 학생의 오답 원인 통계 및 패턴 분석 결과를 반환합니다.
    """
    # TODO: Implement actual database query
    logger.info(f"Fetching error patterns for student {student_id}")

    return schemas.StudentErrorPatternsResponse(
        student_id=student_id,
        overall_stats={
            "total_errors": 0,
            "개념_count": 0,
            "계산_count": 0,
            "조건누락_count": 0
        },
        patterns=[],
        improvement_score=None
    )


@app.get(
    "/api/v1/modules/{module_id}/analytics",
    response_model=schemas.ClassErrorAnalytics
)
async def get_class_analytics(module_id: UUID):
    """
    학급 전체 오류 분석

    모듈(수업)에 대한 전체 학생들의 오류 분포 및 공통 오개념을 분석합니다.
    """
    # TODO: Implement actual analytics query
    logger.info(f"Fetching analytics for module {module_id}")

    return schemas.ClassErrorAnalytics(
        module_id=module_id,
        total_students=0,
        active_students=0,
        error_distribution={},
        common_misconceptions=[],
        at_risk_students=[]
    )


@app.put(
    "/api/v1/classifications/{classification_id}/review",
    status_code=status.HTTP_200_OK
)
async def review_classification(
    classification_id: UUID,
    review: schemas.ClassificationReviewRequest
):
    """
    교사의 분류 검토

    AI가 수행한 분류를 교사가 검토하고 수정할 수 있습니다.
    """
    # TODO: Implement database update
    logger.info(
        f"Teacher {review.teacher_id} reviewed classification {classification_id}: "
        f"verified={review.verified}, override={review.override_type}"
    )

    return {
        "classification_id": str(classification_id),
        "updated": True,
        "teacher_verified": review.verified,
        "teacher_override": review.override_type
    }


# ============================================================================
# Error Handlers
# ============================================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """HTTP 예외 핸들러"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """일반 예외 핸들러"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error",
            "status_code": 500
        }
    )


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
