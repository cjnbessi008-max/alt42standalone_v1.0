"""
API Routes for Daily Missions
"""
from datetime import date
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.services.database import get_db
from app.services.daily_mission_service import DailyMissionService
from app.services.lms_integration import LMSIntegrationService
from app.models.daily_mission import (
    DailyMissionCreate,
    DailyMissionUpdate,
    DailyMissionResponse,
    StudentAnswerSubmission,
    StudentMissionProgressResponse,
    StudentMissionStreakResponse,
    StudentDashboardResponse,
    MissionAnalyticsResponse,
    MissionEnrollmentCreate,
)

router = APIRouter(prefix="/api/missions", tags=["missions"])


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_mission(
    mission_data: DailyMissionCreate,
    teacher_id: UUID,  # TODO: Get from authenticated user
    db: Session = Depends(get_db)
):
    """
    Create a new daily mission
    Teacher can create missions for their courses
    """
    service = DailyMissionService(db)
    mission = service.create_mission(teacher_id, mission_data)

    # If LMS course ID is provided, auto-enroll students from LMS
    if mission_data.lms_course_id:
        lms_service = LMSIntegrationService()
        enrolled_count = lms_service.auto_enroll_students_from_lms(
            db, mission['id'], mission_data.lms_course_id
        )
        return {
            "mission": mission,
            "lms_enrolled_count": enrolled_count,
            "message": f"Mission created successfully. {enrolled_count} students auto-enrolled from LMS."
        }

    return {
        "mission": mission,
        "message": "Mission created successfully"
    }


@router.get("/{mission_id}", response_model=dict)
async def get_mission(
    mission_id: UUID,
    db: Session = Depends(get_db)
):
    """Get mission details"""
    service = DailyMissionService(db)
    mission = service.get_mission(mission_id)

    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")

    return {"mission": mission}


@router.put("/{mission_id}", response_model=dict)
async def update_mission(
    mission_id: UUID,
    update_data: DailyMissionUpdate,
    db: Session = Depends(get_db)
):
    """Update mission details"""
    service = DailyMissionService(db)
    mission = service.update_mission(mission_id, update_data)

    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")

    return {
        "mission": mission,
        "message": "Mission updated successfully"
    }


@router.get("/teacher/{teacher_id}", response_model=dict)
async def get_teacher_missions(
    teacher_id: UUID,
    db: Session = Depends(get_db)
):
    """Get all missions created by a teacher"""
    service = DailyMissionService(db)
    missions = service.get_missions_by_teacher(teacher_id)

    return {
        "missions": missions,
        "count": len(missions)
    }


@router.post("/{mission_id}/enroll", response_model=dict)
async def enroll_student(
    mission_id: UUID,
    student_id: UUID,
    db: Session = Depends(get_db)
):
    """Enroll a student in a mission"""
    service = DailyMissionService(db)
    enrollment = service.enroll_student(student_id, mission_id)

    return {
        "enrollment": enrollment,
        "message": "Student enrolled successfully"
    }


@router.get("/student/{student_id}", response_model=dict)
async def get_student_missions(
    student_id: UUID,
    db: Session = Depends(get_db)
):
    """Get all missions a student is enrolled in"""
    service = DailyMissionService(db)
    missions = service.get_enrolled_missions(student_id)

    return {
        "missions": missions,
        "count": len(missions)
    }


@router.get("/{mission_id}/daily-problem", response_model=dict)
async def get_daily_problem(
    mission_id: UUID,
    target_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """
    Get today's problem for a mission
    If target_date is not provided, returns today's problem
    """
    service = DailyMissionService(db)
    problem = service.get_or_assign_daily_problem(mission_id, target_date)

    if not problem:
        raise HTTPException(
            status_code=404,
            detail="No problems available for this mission"
        )

    # Remove correct_answer from response for security
    problem_dict = dict(problem)
    problem_dict.pop('correct_answer', None)

    return {
        "problem": problem_dict,
        "date": target_date or date.today()
    }


@router.post("/{mission_id}/submit", response_model=dict)
async def submit_answer(
    mission_id: UUID,
    student_id: UUID,  # TODO: Get from authenticated user
    submission: StudentAnswerSubmission,
    db: Session = Depends(get_db)
):
    """
    Submit an answer to today's problem
    Returns progress, correctness, and feedback
    """
    service = DailyMissionService(db)

    try:
        progress, is_correct, feedback = service.submit_answer(
            student_id, mission_id, submission
        )

        # Sync to LMS if enabled
        lms_service = LMSIntegrationService()
        if lms_service.enabled:
            # Get user and mission details for LMS sync
            user_query = "SELECT lms_user_id FROM users WHERE id = %s"
            user_result = db.execute(user_query, (str(student_id),))
            user = user_result.fetchone()

            mission_query = "SELECT title, lms_course_id FROM daily_missions WHERE id = %s"
            mission_result = db.execute(mission_query, (str(mission_id),))
            mission = mission_result.fetchone()

            if user and mission and user['lms_user_id'] and mission['lms_course_id']:
                score = 100.0 if is_correct else 0.0
                lms_service.sync_mission_completion_to_lms(
                    student_lms_id=user['lms_user_id'],
                    course_lms_id=mission['lms_course_id'],
                    mission_title=mission['title'],
                    is_correct=is_correct,
                    score=score
                )

        return {
            "progress": progress,
            "feedback": feedback,
            "message": "답변이 제출되었습니다!"
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{mission_id}/student/{student_id}/dashboard", response_model=dict)
async def get_student_dashboard(
    mission_id: UUID,
    student_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get complete dashboard data for a student in a mission
    Includes: today's problem, progress, and streak
    """
    service = DailyMissionService(db)

    # Get mission
    mission = service.get_mission(mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")

    # Get today's problem
    problem = service.get_or_assign_daily_problem(mission_id)

    # Get today's progress
    progress = service.get_student_progress(student_id, mission_id)

    # Get streak
    streak = service.get_student_streak(student_id, mission_id)

    # Remove correct answer from problem if not completed
    problem_dict = None
    if problem:
        problem_dict = dict(problem)
        if not progress or not progress.get('is_completed'):
            problem_dict.pop('correct_answer', None)

    return {
        "mission": mission,
        "today_problem": problem_dict,
        "progress": progress,
        "streak": streak,
        "date": date.today()
    }


@router.get("/{mission_id}/progress/{student_id}", response_model=dict)
async def get_student_mission_progress(
    mission_id: UUID,
    student_id: UUID,
    target_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """Get student's progress for a specific date"""
    service = DailyMissionService(db)
    progress = service.get_student_progress(student_id, mission_id, target_date)

    if not progress:
        return {
            "progress": None,
            "message": "No progress found for this date"
        }

    return {"progress": progress}


@router.get("/{mission_id}/streak/{student_id}", response_model=dict)
async def get_student_streak(
    mission_id: UUID,
    student_id: UUID,
    db: Session = Depends(get_db)
):
    """Get student's streak information"""
    service = DailyMissionService(db)
    streak = service.get_student_streak(student_id, mission_id)

    if not streak:
        return {
            "streak": {
                "current_streak": 0,
                "longest_streak": 0,
                "total_completed": 0,
                "total_correct": 0
            }
        }

    return {"streak": streak}


@router.get("/{mission_id}/analytics", response_model=dict)
async def get_mission_analytics(
    mission_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get analytics for a mission
    Teacher can view completion rates, accuracy, etc.
    """
    service = DailyMissionService(db)

    # Check if mission exists
    mission = service.get_mission(mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")

    analytics = service.get_mission_analytics(mission_id)

    return {
        "analytics": analytics,
        "mission": mission
    }
