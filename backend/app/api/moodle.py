"""Moodle integration API endpoints."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.integrations.moodle_client import MoodleClient
from app.models import MoodleConfig, Problem, User

router = APIRouter()


class MoodleConfigRequest(BaseModel):
    """Moodle configuration request."""

    moodle_url: str
    api_token: str
    sync_enabled: bool = True
    auto_sync_interval_minutes: Optional[int] = None
    course_ids: Optional[str] = None
    sync_grades_back: bool = False


class MoodleSyncRequest(BaseModel):
    """Moodle sync request."""

    course_ids: Optional[list[int]] = None


@router.post("/config", response_model=dict, status_code=201)
async def configure_moodle(
    config_data: MoodleConfigRequest,
    db: AsyncSession = Depends(get_db),
):
    """Configure Moodle integration.

    Args:
        config_data: Moodle configuration
        db: Database session

    Returns:
        Configuration status
    """
    # Test connection first
    try:
        client = MoodleClient(config_data.moodle_url, config_data.api_token)
        is_valid = await client.test_connection()

        if not is_valid:
            raise HTTPException(
                status_code=400, detail="Failed to connect to Moodle. Check URL and token."
            )
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Moodle connection error: {str(e)}"
        )

    # Check if config exists
    result = await db.scalar(select(MoodleConfig).limit(1))
    config = result

    if config:
        # Update existing config
        config.moodle_url = config_data.moodle_url
        config.api_token = config_data.api_token
        config.sync_enabled = config_data.sync_enabled
        config.auto_sync_interval_minutes = config_data.auto_sync_interval_minutes
        config.course_ids = config_data.course_ids
        config.sync_grades_back = config_data.sync_grades_back
    else:
        # Create new config
        config = MoodleConfig(
            moodle_url=config_data.moodle_url,
            api_token=config_data.api_token,
            sync_enabled=config_data.sync_enabled,
            auto_sync_interval_minutes=config_data.auto_sync_interval_minutes,
            course_ids=config_data.course_ids,
            sync_grades_back=config_data.sync_grades_back,
        )
        db.add(config)

    await db.commit()

    return {
        "success": True,
        "message": "Moodle configuration saved successfully",
        "config_id": config.id,
    }


@router.get("/config", response_model=dict)
async def get_moodle_config(db: AsyncSession = Depends(get_db)):
    """Get current Moodle configuration.

    Args:
        db: Database session

    Returns:
        Moodle configuration (without token)
    """
    result = await db.scalar(select(MoodleConfig).limit(1))
    config = result

    if not config:
        raise HTTPException(status_code=404, detail="Moodle not configured")

    return {
        "config_id": config.id,
        "moodle_url": config.moodle_url,
        "sync_enabled": config.sync_enabled,
        "auto_sync_interval_minutes": config.auto_sync_interval_minutes,
        "last_sync_at": config.last_sync_at.isoformat() if config.last_sync_at else None,
        "last_sync_status": config.last_sync_status,
        "course_ids": config.course_ids,
        "sync_grades_back": config.sync_grades_back,
    }


@router.post("/sync", response_model=dict)
async def sync_from_moodle(
    sync_request: MoodleSyncRequest,
    db: AsyncSession = Depends(get_db),
):
    """Sync problems and users from Moodle.

    Args:
        sync_request: Sync request with optional course filter
        db: Database session

    Returns:
        Sync results
    """
    # Get Moodle config
    result = await db.scalar(select(MoodleConfig).limit(1))
    config = result

    if not config:
        raise HTTPException(status_code=404, detail="Moodle not configured")

    if not config.sync_enabled:
        raise HTTPException(status_code=400, detail="Sync is disabled")

    try:
        client = MoodleClient(config.moodle_url, config.api_token)

        # Get courses to sync
        course_ids = sync_request.course_ids
        if not course_ids and config.course_ids:
            course_ids = [int(cid.strip()) for cid in config.course_ids.split(",")]

        synced_problems = 0
        synced_users = 0

        if course_ids:
            # Sync each course
            for course_id in course_ids:
                # Get enrolled users
                users = await client.get_enrolled_users(course_id)
                for user_data in users:
                    # Check if user exists
                    user_result = await db.scalar(
                        select(User).where(User.moodle_user_id == user_data["id"])
                    )
                    if not user_result:
                        # Create new user
                        user = User(
                            moodle_user_id=user_data["id"],
                            username=user_data.get("username", f"user_{user_data['id']}"),
                            email=user_data.get("email", f"user_{user_data['id']}@example.com"),
                            full_name=user_data.get("fullname"),
                        )
                        db.add(user)
                        synced_users += 1

                # Get quizzes
                quizzes = await client.get_quizzes_by_course(course_id)
                for quiz in quizzes:
                    # Get questions (this is simplified - actual implementation depends on Moodle setup)
                    questions = await client.get_quiz_questions(quiz["id"])
                    for question in questions:
                        # Check if problem already exists
                        problem_result = await db.scalar(
                            select(Problem).where(
                                Problem.moodle_question_id == question.get("id")
                            )
                        )
                        if not problem_result:
                            # Create new problem
                            problem = Problem(
                                moodle_question_id=question.get("id"),
                                course_id=course_id,
                                quiz_id=quiz["id"],
                                problem_type="quiz",
                                difficulty_level=3,  # Default, can be determined from question
                                original_text=question.get("questiontext", ""),
                                original_solution=question.get("generalfeedback"),
                                topic=quiz.get("name", "").lower(),
                                metadata={
                                    "quiz_name": quiz.get("name"),
                                    "question_type": question.get("qtype"),
                                },
                            )
                            db.add(problem)
                            synced_problems += 1

        await db.commit()

        # Update sync status
        from datetime import datetime, timezone

        config.last_sync_at = datetime.now(timezone.utc)
        config.last_sync_status = "success"
        await db.commit()

        return {
            "success": True,
            "synced_problems": synced_problems,
            "synced_users": synced_users,
            "courses_synced": len(course_ids) if course_ids else 0,
        }

    except Exception as e:
        # Update sync status with error
        from datetime import datetime, timezone

        config.last_sync_at = datetime.now(timezone.utc)
        config.last_sync_status = "failed"
        config.last_sync_error = str(e)
        await db.commit()

        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")


@router.get("/courses", response_model=list[dict])
async def get_moodle_courses(db: AsyncSession = Depends(get_db)):
    """Get list of courses from Moodle.

    Args:
        db: Database session

    Returns:
        List of courses
    """
    # Get Moodle config
    result = await db.scalar(select(MoodleConfig).limit(1))
    config = result

    if not config:
        raise HTTPException(status_code=404, detail="Moodle not configured")

    try:
        client = MoodleClient(config.moodle_url, config.api_token)
        courses = await client.get_courses()
        return courses
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch courses: {str(e)}"
        )


@router.post("/test-connection", response_model=dict)
async def test_connection(db: AsyncSession = Depends(get_db)):
    """Test connection to Moodle.

    Args:
        db: Database session

    Returns:
        Connection test result
    """
    # Get Moodle config
    result = await db.scalar(select(MoodleConfig).limit(1))
    config = result

    if not config:
        raise HTTPException(status_code=404, detail="Moodle not configured")

    try:
        client = MoodleClient(config.moodle_url, config.api_token)
        is_connected = await client.test_connection()

        if is_connected:
            return {"success": True, "message": "Successfully connected to Moodle"}
        else:
            return {"success": False, "message": "Failed to connect to Moodle"}
    except Exception as e:
        return {"success": False, "message": f"Connection error: {str(e)}"}
