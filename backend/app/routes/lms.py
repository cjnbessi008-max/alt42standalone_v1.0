"""
API Routes for LMS Integration
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.services.database import get_db
from app.services.lms_integration import LMSIntegrationService

router = APIRouter(prefix="/api/lms", tags=["lms"])


@router.get("/status", response_model=dict)
async def get_lms_status():
    """
    Check LMS connection status
    """
    lms_service = LMSIntegrationService()
    status = lms_service.get_lms_connection_status()

    return {
        "status": status,
        "enabled": lms_service.enabled
    }


@router.get("/user/{lms_user_id}", response_model=dict)
async def sync_user_from_lms(lms_user_id: str):
    """
    Fetch user data from LMS
    """
    lms_service = LMSIntegrationService()
    user_data = lms_service.sync_user_from_lms(lms_user_id)

    if not user_data:
        raise HTTPException(
            status_code=404,
            detail="User not found in LMS or LMS integration not enabled"
        )

    return {
        "user": user_data,
        "message": "User data synced from LMS"
    }


@router.get("/course/{lms_course_id}", response_model=dict)
async def sync_course_from_lms(lms_course_id: str):
    """
    Fetch course data from LMS
    """
    lms_service = LMSIntegrationService()
    course_data = lms_service.sync_course_from_lms(lms_course_id)

    if not course_data:
        raise HTTPException(
            status_code=404,
            detail="Course not found in LMS or LMS integration not enabled"
        )

    return {
        "course": course_data,
        "message": "Course data synced from LMS"
    }


@router.get("/course/{lms_course_id}/students", response_model=dict)
async def get_course_students(lms_course_id: str):
    """
    Get list of students enrolled in a course from LMS
    """
    lms_service = LMSIntegrationService()
    students = lms_service.get_course_students(lms_course_id)

    return {
        "students": students,
        "count": len(students),
        "course_id": lms_course_id
    }
