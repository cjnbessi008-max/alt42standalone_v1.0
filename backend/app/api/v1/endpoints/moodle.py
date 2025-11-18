"""Moodle integration API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.core.database import get_db
from app.services.moodle_service import get_moodle_service, MoodleAPIError

router = APIRouter()


@router.post("/connect", response_model=Dict[str, Any])
async def connect_to_moodle():
    """Test connection to Moodle instance."""
    try:
        moodle_service = get_moodle_service()
        is_connected = await moodle_service.test_connection()

        if is_connected:
            site_info = await moodle_service.get_site_info()
            return {
                "status": "connected",
                "message": "Successfully connected to Moodle",
                "site_info": site_info,
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to connect to Moodle")

    except MoodleAPIError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/courses", response_model=List[Dict[str, Any]])
async def get_courses():
    """Get all courses from Moodle."""
    try:
        moodle_service = get_moodle_service()
        courses = await moodle_service.get_courses()
        return courses
    except MoodleAPIError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/courses/{course_id}", response_model=Dict[str, Any])
async def get_course(course_id: int):
    """Get a specific course by ID."""
    try:
        moodle_service = get_moodle_service()
        course = await moodle_service.get_course_by_id(course_id)

        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        return course
    except MoodleAPIError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/courses/{course_id}/students", response_model=List[Dict[str, Any]])
async def get_course_students(course_id: int):
    """Get all students enrolled in a course."""
    try:
        moodle_service = get_moodle_service()
        students = await moodle_service.get_enrolled_users(course_id)
        return students
    except MoodleAPIError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/courses/{course_id}/quizzes", response_model=List[Dict[str, Any]])
async def get_course_quizzes(course_id: int):
    """Get all quizzes in a course."""
    try:
        moodle_service = get_moodle_service()
        quizzes = await moodle_service.get_course_quizzes(course_id)
        return quizzes
    except MoodleAPIError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/quizzes/{quiz_id}/attempts", response_model=List[Dict[str, Any]])
async def get_quiz_attempts(quiz_id: int, user_id: int = None):
    """Get quiz attempts, optionally filtered by user."""
    try:
        moodle_service = get_moodle_service()
        attempts = await moodle_service.get_quiz_attempts(quiz_id, user_id)
        return attempts
    except MoodleAPIError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/attempts/{attempt_id}/review", response_model=Dict[str, Any])
async def get_attempt_review(attempt_id: int):
    """Get detailed review of a quiz attempt."""
    try:
        moodle_service = get_moodle_service()
        review = await moodle_service.get_attempt_review(attempt_id)
        return review
    except MoodleAPIError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sync", response_model=Dict[str, Any])
async def sync_moodle_data(
    course_id: int,
    db: Session = Depends(get_db),
):
    """
    Sync data from Moodle to local database.

    This endpoint triggers a full synchronization of:
    - Course information
    - Students
    - Quizzes
    - Quiz attempts
    - Question attempts
    """
    try:
        moodle_service = get_moodle_service()

        # TODO: Implement full sync logic
        # This would involve:
        # 1. Fetch course data
        # 2. Fetch and save students
        # 3. Fetch and save quizzes
        # 4. Fetch and save quiz attempts
        # 5. Fetch and save question attempts

        return {
            "status": "success",
            "message": "Sync completed",
            "course_id": course_id,
        }

    except MoodleAPIError as e:
        raise HTTPException(status_code=500, detail=str(e))
