"""LMS Integration API endpoints"""
from fastapi import APIRouter, HTTPException, Depends
from uuid import UUID
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from ..services.lms_service import LMSService


router = APIRouter(prefix="/api/lms", tags=["lms"])


class LMSIntegrationConfig(BaseModel):
    """LMS 연동 설정"""
    lms_type: str  # canvas, moodle, blackboard
    institution_name: str
    api_endpoint: str
    api_key: str
    course_id: Optional[str] = None


class SyncRequest(BaseModel):
    """동기화 요청"""
    lms_integration_id: UUID
    course_id: str
    sync_students: bool = True
    sync_problems: bool = True


# Dependency injection
async def get_db():
    yield None


@router.post("/integrations")
async def create_lms_integration(
    config: LMSIntegrationConfig,
    db=Depends(get_db)
):
    """
    새로운 LMS 연동 설정

    - **lms_type**: LMS 타입 (canvas, moodle, blackboard)
    - **institution_name**: 기관명
    - **api_endpoint**: LMS API 엔드포인트 URL
    - **api_key**: API 키
    - **course_id**: 기본 코스 ID (선택)
    """
    try:
        # LMS 연결 테스트
        lms = LMSService.create_integration(
            config.lms_type,
            config.api_endpoint,
            config.api_key
        )

        # 연결 확인 (학생 목록 조회 시도)
        if config.course_id:
            students = await lms.get_students(config.course_id)
            connection_status = "connected"
            student_count = len(students)
        else:
            connection_status = "configured"
            student_count = 0

        await lms.close()

        # 실제로는 DB에 저장
        # integration_id = await db.save_lms_integration(config)

        return {
            "status": "success",
            "integration_id": "00000000-0000-0000-0000-000000000000",
            "connection_status": connection_status,
            "student_count": student_count,
            "message": f"{config.lms_type} LMS 연동이 설정되었습니다"
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LMS 연동 실패: {str(e)}")


@router.get("/integrations")
async def list_lms_integrations(
    db=Depends(get_db)
):
    """설정된 LMS 연동 목록 조회"""
    # 실제로는 DB에서 조회
    # SELECT * FROM lms_integrations WHERE is_active = true
    return []


@router.get("/integrations/{integration_id}")
async def get_lms_integration(
    integration_id: UUID,
    db=Depends(get_db)
):
    """특정 LMS 연동 정보 조회"""
    # 실제로는 DB에서 조회
    return {
        "id": str(integration_id),
        "lms_type": "canvas",
        "institution_name": "KAIST",
        "is_active": True,
        "last_sync_at": None
    }


@router.post("/sync")
async def sync_lms_data(
    request: SyncRequest,
    db=Depends(get_db)
):
    """
    LMS에서 데이터 동기화

    - **lms_integration_id**: LMS 연동 ID
    - **course_id**: 코스 ID
    - **sync_students**: 학생 정보 동기화 여부
    - **sync_problems**: 문제 정보 동기화 여부
    """
    try:
        # LMS 연동 정보 조회
        # integration = await db.get_lms_integration(request.lms_integration_id)

        # 임시 설정 (실제로는 DB에서)
        lms = LMSService.create_integration(
            "canvas",
            "https://canvas.instructure.com",
            "dummy_api_key"
        )

        synced_students = 0
        synced_problems = 0

        if request.sync_students:
            synced_students = await LMSService.sync_students(
                lms, request.course_id, db
            )

        if request.sync_problems:
            synced_problems = await LMSService.sync_problems(
                lms, request.course_id, db
            )

        await lms.close()

        return {
            "status": "success",
            "synced_students": synced_students,
            "synced_problems": synced_problems,
            "message": f"동기화 완료: 학생 {synced_students}명, 문제 {synced_problems}개"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"동기화 실패: {str(e)}")


@router.get("/students/{integration_id}/{course_id}")
async def get_lms_students(
    integration_id: UUID,
    course_id: str,
    db=Depends(get_db)
):
    """LMS에서 학생 목록 조회 (동기화 없이 실시간 조회)"""
    try:
        # 실제로는 DB에서 integration 정보 조회 후 LMS API 호출
        lms = LMSService.create_integration("canvas", "https://api.canvas", "key")
        students = await lms.get_students(course_id)
        await lms.close()

        return {
            "students": students,
            "count": len(students)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/problems/{integration_id}/{course_id}")
async def get_lms_problems(
    integration_id: UUID,
    course_id: str,
    db=Depends(get_db)
):
    """LMS에서 문제 목록 조회"""
    try:
        lms = LMSService.create_integration("canvas", "https://api.canvas", "key")
        problems = await lms.get_problems(course_id)
        await lms.close()

        return {
            "problems": problems,
            "count": len(problems)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/submit-grade")
async def submit_grade_to_lms(
    integration_id: UUID,
    student_id: str,
    problem_id: str,
    score: float,
    db=Depends(get_db)
):
    """
    LMS에 성적 제출

    - **integration_id**: LMS 연동 ID
    - **student_id**: LMS의 학생 ID
    - **problem_id**: LMS의 문제 ID
    - **score**: 점수
    """
    try:
        # 실제로는 DB에서 integration 정보 조회
        lms = LMSService.create_integration("canvas", "https://api.canvas", "key")
        success = await lms.submit_grade(student_id, problem_id, score)
        await lms.close()

        if success:
            return {
                "status": "success",
                "message": "성적이 LMS에 제출되었습니다"
            }
        else:
            raise HTTPException(status_code=500, detail="성적 제출 실패")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/problem-types/sync/{integration_id}/{course_id}")
async def sync_and_classify_problems(
    integration_id: UUID,
    course_id: str,
    db=Depends(get_db)
):
    """
    LMS에서 문제를 가져와서 자동으로 유형 분류

    이차함수, 도형 등의 유형으로 자동 분류하여 저장
    """
    try:
        from ..services.tip_service import ProblemTypeClassifier

        # LMS에서 문제 조회
        lms = LMSService.create_integration("canvas", "https://api.canvas", "key")
        problems = await lms.get_problems(course_id)
        await lms.close()

        classified_problems = []

        for problem in problems:
            # 문제 내용에서 유형 자동 분류
            content = problem.get("content", {})
            description = content.get("description", "")

            problem_type = await ProblemTypeClassifier.classify(description)

            classified_problems.append({
                **problem,
                "classified_type": problem_type,
                "needs_manual_review": problem_type is None
            })

        # 통계
        auto_classified = sum(1 for p in classified_problems if p["classified_type"])
        manual_review_needed = len(classified_problems) - auto_classified

        return {
            "status": "success",
            "total_problems": len(classified_problems),
            "auto_classified": auto_classified,
            "manual_review_needed": manual_review_needed,
            "problems": classified_problems
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
