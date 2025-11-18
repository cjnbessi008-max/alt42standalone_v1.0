"""
API endpoints for LMS integration
"""
from datetime import datetime
from typing import Dict, Optional
from uuid import UUID
import httpx
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.config import settings
from ..models import schemas
from ..models.database import Student, LMSSyncLog

router = APIRouter(prefix="/lms", tags=["LMS Integration"])


async def sync_students_from_lms(
    db: Session,
    lms_endpoint: str,
    filters: Optional[Dict] = None
) -> LMSSyncLog:
    """
    Background task to sync students from LMS
    """
    log = LMSSyncLog(
        sync_type="students",
        status="in_progress",
        sync_data={"endpoint": lms_endpoint, "filters": filters or {}}
    )
    db.add(log)
    db.commit()

    try:
        # Call LMS API
        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = {}
            if settings.LMS_API_KEY:
                headers["Authorization"] = f"Bearer {settings.LMS_API_KEY}"

            response = await client.get(
                lms_endpoint,
                headers=headers,
                params=filters or {}
            )
            response.raise_for_status()
            lms_data = response.json()

        # Process LMS data
        students_created = 0
        students_updated = 0

        for student_data in lms_data.get("students", []):
            external_id = student_data.get("id")
            email = student_data.get("email")

            if not email:
                continue

            # Check if student exists
            existing = db.query(Student).filter(
                Student.external_lms_id == str(external_id)
            ).first()

            if existing:
                # Update existing student
                existing.name = student_data.get("name", existing.name)
                existing.email = student_data.get("email", existing.email)
                existing.grade_level = student_data.get("grade_level", existing.grade_level)
                existing.institution = student_data.get("institution", existing.institution)
                students_updated += 1
            else:
                # Create new student
                new_student = Student(
                    external_lms_id=str(external_id),
                    name=student_data.get("name", ""),
                    email=email,
                    grade_level=student_data.get("grade_level"),
                    institution=student_data.get("institution"),
                    metadata=student_data.get("metadata", {})
                )
                db.add(new_student)
                students_created += 1

        db.commit()

        # Update log
        log.status = "completed"
        log.records_synced = students_created + students_updated
        log.sync_data.update({
            "students_created": students_created,
            "students_updated": students_updated
        })
        log.completed_at = datetime.utcnow()
        db.commit()

        return log

    except Exception as e:
        log.status = "failed"
        log.error_message = str(e)
        log.completed_at = datetime.utcnow()
        db.commit()
        raise


@router.post("/sync", response_model=schemas.LMSSyncResponse)
async def start_lms_sync(
    sync_request: schemas.LMSSyncRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Start LMS data synchronization

    Supported sync types:
    - 'students': Sync student data
    - 'attempts': Sync student attempts/submissions
    - 'full': Full synchronization
    """
    if not sync_request.lms_endpoint and not settings.LMS_API_ENDPOINT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="LMS endpoint not configured"
        )

    endpoint = sync_request.lms_endpoint or settings.LMS_API_ENDPOINT

    # Create initial log entry
    log = LMSSyncLog(
        sync_type=sync_request.sync_type,
        status="pending",
        sync_data={"endpoint": endpoint, "filters": sync_request.filters or {}}
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    # Start background sync
    if sync_request.sync_type == "students":
        background_tasks.add_task(
            sync_students_from_lms,
            db=db,
            lms_endpoint=endpoint,
            filters=sync_request.filters
        )

    return schemas.LMSSyncResponse(
        sync_id=log.id,
        status=log.status,
        records_synced=0,
        started_at=log.started_at,
        completed_at=None
    )


@router.get("/sync/{sync_id}", response_model=schemas.LMSSyncResponse)
async def get_sync_status(
    sync_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get status of an LMS sync operation
    """
    log = db.query(LMSSyncLog).filter(LMSSyncLog.id == sync_id).first()
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sync log with ID {sync_id} not found"
        )

    return schemas.LMSSyncResponse(
        sync_id=log.id,
        status=log.status,
        records_synced=log.records_synced,
        started_at=log.started_at,
        completed_at=log.completed_at,
        error_message=log.error_message
    )


@router.get("/student/lms/{lms_id}", response_model=schemas.StudentResponse)
async def get_student_by_lms_id(
    lms_id: str,
    db: Session = Depends(get_db)
):
    """
    Get student by their LMS ID
    """
    student = db.query(Student).filter(Student.external_lms_id == lms_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with LMS ID {lms_id} not found"
        )

    return schemas.StudentResponse.from_orm(student)
