from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import Dict, Any
from uuid import UUID

from ..db.session import get_db
from ..services.lms_service import LMSService
from ..models.lms_integration import LMSIntegration
from pydantic import BaseModel

router = APIRouter(prefix="/api/lms", tags=["lms"])


class LTILaunchRequest(BaseModel):
    """LTI launch request data"""
    lms_id: UUID
    launch_data: Dict[str, Any]


class GradeSubmission(BaseModel):
    """Grade submission to LMS"""
    lms_id: UUID
    student_lms_id: str
    resource_link_id: str
    score: float
    max_score: float = 100.0


@router.post("/lti/login")
async def lti_login(request: Request, db: Session = Depends(get_db)):
    """Handle LTI 1.3 login initiation"""
    # This endpoint receives the LTI login initiation request from the LMS
    # and redirects to the authentication endpoint

    # Extract LTI parameters from request
    form_data = await request.form()
    lms_id = form_data.get("lms_id")

    if not lms_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing lms_id parameter",
        )

    lms_service = LMSService(db)
    lms_config = lms_service.get_lms_config(UUID(lms_id))

    if not lms_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"LMS configuration {lms_id} not found",
        )

    # Create LTI registration and handle login
    registration = lms_service.create_lti_registration(lms_config)

    # TODO: Implement full LTI 1.3 OIDC login flow
    # This requires proper pylti1p3 integration with Flask/FastAPI

    return {
        "status": "login_initiated",
        "auth_url": lms_config.auth_login_url,
        "client_id": lms_config.client_id,
    }


@router.post("/lti/launch")
async def lti_launch(
    launch_request: LTILaunchRequest,
    db: Session = Depends(get_db),
):
    """Handle LTI 1.3 resource link launch"""
    lms_service = LMSService(db)
    lms_config = lms_service.get_lms_config(launch_request.lms_id)

    if not lms_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"LMS configuration {launch_request.lms_id} not found",
        )

    try:
        # Process launch data
        launch_info = lms_service.process_lti_launch(launch_request.launch_data)

        # Sync student from LMS
        student = lms_service.sync_student_from_lms(
            launch_info["user"]["lms_user_id"],
            launch_info["user"],
        )

        return {
            "status": "launch_successful",
            "student_id": str(student.id),
            "course_info": launch_info["course"],
            "resource_info": launch_info["resource"],
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error processing LTI launch: {str(e)}",
        )


@router.post("/grade/submit")
def submit_grade(
    grade_data: GradeSubmission,
    db: Session = Depends(get_db),
):
    """Submit grade back to LMS"""
    lms_service = LMSService(db)
    lms_config = lms_service.get_lms_config(grade_data.lms_id)

    if not lms_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"LMS configuration {grade_data.lms_id} not found",
        )

    success = lms_service.send_grade_to_lms(
        lms_config,
        grade_data.student_lms_id,
        grade_data.resource_link_id,
        grade_data.score,
        grade_data.max_score,
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit grade to LMS",
        )

    return {"status": "grade_submitted", "score": grade_data.score}


@router.get("/config/{lms_id}")
def get_lms_config(
    lms_id: UUID,
    db: Session = Depends(get_db),
):
    """Get LMS integration configuration (public info only)"""
    lms_service = LMSService(db)
    lms_config = lms_service.get_lms_config(lms_id)

    if not lms_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"LMS configuration {lms_id} not found",
        )

    # Return only public configuration info
    return {
        "id": str(lms_config.id),
        "name": lms_config.name,
        "lms_type": lms_config.lms_type,
        "is_active": lms_config.is_active,
    }


@router.get("/roster/{lms_id}/{course_id}")
def get_course_roster(
    lms_id: UUID,
    course_id: str,
    db: Session = Depends(get_db),
):
    """Get course roster from LMS"""
    lms_service = LMSService(db)
    lms_config = lms_service.get_lms_config(lms_id)

    if not lms_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"LMS configuration {lms_id} not found",
        )

    roster = lms_service.get_course_roster(lms_config, course_id)

    return {"course_id": course_id, "students": roster}
