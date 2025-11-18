"""
Moodle integration API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from app.core.database import get_db
from app.services.moodle_service import MoodleService
from app.models.student import Student

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/moodle", tags=["moodle"])


@router.post("/sync-user/{moodle_user_id}")
async def sync_user_from_moodle(
    moodle_user_id: int,
    db: Session = Depends(get_db)
):
    """Sync user from Moodle to local database"""
    moodle_service = MoodleService()

    try:
        # Get user info from Moodle
        user_info = await moodle_service.get_user_info(moodle_user_id)

        if not user_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User {moodle_user_id} not found in Moodle"
            )

        # Check if student exists
        student = db.query(Student).filter(Student.moodle_id == moodle_user_id).first()

        if student:
            # Update existing student
            student.username = user_info.get('username', student.username)
            student.email = user_info.get('email', student.email)
            student.firstname = user_info.get('firstname', student.firstname)
            student.lastname = user_info.get('lastname', student.lastname)
        else:
            # Create new student
            student = Student(
                moodle_id=moodle_user_id,
                username=user_info['username'],
                email=user_info['email'],
                firstname=user_info.get('firstname'),
                lastname=user_info.get('lastname')
            )
            db.add(student)

        db.commit()
        db.refresh(student)

        return {
            "success": True,
            "student_id": student.id,
            "message": "User synced successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error syncing user from Moodle: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error syncing user: {str(e)}"
        )


@router.get("/assignment/{assignment_id}/submissions")
async def get_moodle_assignment_submissions(
    assignment_id: int,
    db: Session = Depends(get_db)
):
    """Get submissions for a Moodle assignment"""
    moodle_service = MoodleService()

    try:
        submissions = await moodle_service.get_assignment_submissions(assignment_id)
        return {
            "assignment_id": assignment_id,
            "total_submissions": len(submissions),
            "submissions": submissions
        }
    except Exception as e:
        logger.error(f"Error getting assignment submissions: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting submissions: {str(e)}"
        )


@router.post("/send-feedback")
async def send_feedback_to_student(
    user_id: int,
    subject: str,
    message: str
):
    """Send feedback to student via Moodle messaging"""
    moodle_service = MoodleService()

    try:
        success = await moodle_service.send_feedback(user_id, subject, message)
        if success:
            return {"success": True, "message": "Feedback sent successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send feedback"
            )
    except Exception as e:
        logger.error(f"Error sending feedback: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error sending feedback: {str(e)}"
        )
