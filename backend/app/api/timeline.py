from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import datetime, timedelta

from ..database import get_db
from ..models.student import Student, StudentAttempt, StudentProgress, Problem, Module
from ..schemas.timeline import (
    StudentTimeline,
    ModuleTimeline,
    TimelineEvent,
    Student as StudentSchema,
    Attempt,
    AttemptCreate
)

router = APIRouter(prefix="/timeline", tags=["timeline"])


@router.get("/students/{student_id}", response_model=StudentTimeline)
async def get_student_timeline(
    student_id: str,
    start_date: Optional[datetime] = Query(None, description="Filter events from this date"),
    end_date: Optional[datetime] = Query(None, description="Filter events until this date"),
    db: Session = Depends(get_db)
):
    """
    Get complete timeline of student's learning activity.

    Shows all attempts, module starts, and completions in chronological order.
    """
    # Get student
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Build timeline events
    events = []

    # Get all attempts with problem details
    attempts_query = db.query(StudentAttempt, Problem, Module).join(
        Problem, StudentAttempt.problem_id == Problem.id
    ).join(
        Module, Problem.module_id == Module.id
    ).filter(StudentAttempt.student_id == student_id)

    # Apply date filters
    if start_date:
        attempts_query = attempts_query.filter(StudentAttempt.attempted_at >= start_date)
    if end_date:
        attempts_query = attempts_query.filter(StudentAttempt.attempted_at <= end_date)

    attempts_query = attempts_query.order_by(StudentAttempt.attempted_at)

    for attempt, problem, module in attempts_query.all():
        events.append(TimelineEvent(
            id=attempt.id,
            event_type="attempt",
            timestamp=attempt.attempted_at,
            problem_id=problem.id,
            problem_title=problem.title,
            problem_type=problem.problem_type,
            difficulty_level=problem.difficulty_level,
            is_correct=attempt.is_correct,
            time_spent_seconds=attempt.time_spent_seconds,
            answer_data=attempt.answer_data,
            module_id=module.id,
            module_name=module.name,
            hint_used=attempt.hint_used,
            feedback=attempt.feedback_given
        ))

    # Get module start/complete events from progress
    progress_query = db.query(StudentProgress, Module).join(
        Module, StudentProgress.module_id == Module.id
    ).filter(StudentProgress.student_id == student_id)

    if start_date:
        progress_query = progress_query.filter(StudentProgress.started_at >= start_date)

    for progress, module in progress_query.all():
        # Module start event
        events.append(TimelineEvent(
            id=f"start_{progress.id}",
            event_type="module_start",
            timestamp=progress.started_at,
            module_id=module.id,
            module_name=module.name,
            progress_percentage=0.0
        ))

        # Module complete event
        if progress.completed_at:
            if not end_date or progress.completed_at <= end_date:
                events.append(TimelineEvent(
                    id=f"complete_{progress.id}",
                    event_type="module_complete",
                    timestamp=progress.completed_at,
                    module_id=module.id,
                    module_name=module.name,
                    progress_percentage=100.0
                ))

    # Sort all events by timestamp
    events.sort(key=lambda e: e.timestamp)

    # Calculate statistics
    total_attempts = len([e for e in events if e.event_type == "attempt"])
    correct_attempts = len([e for e in events if e.event_type == "attempt" and e.is_correct])
    total_time = sum(e.time_spent_seconds or 0 for e in events if e.event_type == "attempt")
    modules_completed = len([e for e in events if e.event_type == "module_complete"])
    hints_used = len([e for e in events if e.event_type == "attempt" and e.hint_used])

    statistics = {
        "total_attempts": total_attempts,
        "correct_attempts": correct_attempts,
        "accuracy_rate": (correct_attempts / total_attempts * 100) if total_attempts > 0 else 0,
        "total_time_seconds": total_time,
        "average_time_per_attempt": total_time / total_attempts if total_attempts > 0 else 0,
        "modules_completed": modules_completed,
        "hints_used": hints_used,
        "hint_usage_rate": (hints_used / total_attempts * 100) if total_attempts > 0 else 0
    }

    return StudentTimeline(
        student=StudentSchema.from_orm(student),
        events=events,
        statistics=statistics
    )


@router.get("/students/{student_id}/modules/{module_id}", response_model=ModuleTimeline)
async def get_module_timeline(
    student_id: str,
    module_id: str,
    db: Session = Depends(get_db)
):
    """
    Get student's timeline for a specific module.

    Shows all attempts and progress for one module.
    """
    # Get student
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Get module
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    # Get progress
    progress = db.query(StudentProgress).filter(
        and_(
            StudentProgress.student_id == student_id,
            StudentProgress.module_id == module_id
        )
    ).first()

    # Build events
    events = []

    # Get all attempts for this module
    attempts_query = db.query(StudentAttempt, Problem).join(
        Problem, StudentAttempt.problem_id == Problem.id
    ).filter(
        and_(
            StudentAttempt.student_id == student_id,
            Problem.module_id == module_id
        )
    ).order_by(StudentAttempt.attempted_at)

    for attempt, problem in attempts_query.all():
        events.append(TimelineEvent(
            id=attempt.id,
            event_type="attempt",
            timestamp=attempt.attempted_at,
            problem_id=problem.id,
            problem_title=problem.title,
            problem_type=problem.problem_type,
            difficulty_level=problem.difficulty_level,
            is_correct=attempt.is_correct,
            time_spent_seconds=attempt.time_spent_seconds,
            answer_data=attempt.answer_data,
            module_id=module.id,
            module_name=module.name,
            hint_used=attempt.hint_used,
            feedback=attempt.feedback_given
        ))

    # Add module events if progress exists
    if progress:
        events.insert(0, TimelineEvent(
            id=f"start_{progress.id}",
            event_type="module_start",
            timestamp=progress.started_at,
            module_id=module.id,
            module_name=module.name,
            progress_percentage=0.0
        ))

        if progress.completed_at:
            events.append(TimelineEvent(
                id=f"complete_{progress.id}",
                event_type="module_complete",
                timestamp=progress.completed_at,
                module_id=module.id,
                module_name=module.name,
                progress_percentage=100.0
            ))

    # Calculate statistics
    total_attempts = len([e for e in events if e.event_type == "attempt"])
    correct_attempts = len([e for e in events if e.event_type == "attempt" and e.is_correct])
    total_time = sum(e.time_spent_seconds or 0 for e in events if e.event_type == "attempt")

    # Calculate problem type breakdown
    problem_types = {}
    for event in events:
        if event.event_type == "attempt" and event.problem_type:
            if event.problem_type not in problem_types:
                problem_types[event.problem_type] = {"total": 0, "correct": 0}
            problem_types[event.problem_type]["total"] += 1
            if event.is_correct:
                problem_types[event.problem_type]["correct"] += 1

    statistics = {
        "total_attempts": total_attempts,
        "correct_attempts": correct_attempts,
        "accuracy_rate": (correct_attempts / total_attempts * 100) if total_attempts > 0 else 0,
        "total_time_seconds": total_time,
        "average_time_per_attempt": total_time / total_attempts if total_attempts > 0 else 0,
        "progress_percentage": progress.progress_percentage if progress else 0,
        "started_at": progress.started_at.isoformat() if progress else None,
        "completed_at": progress.completed_at.isoformat() if progress and progress.completed_at else None,
        "problem_type_breakdown": problem_types
    }

    return ModuleTimeline(
        student=StudentSchema.from_orm(student),
        module_name=module.name,
        module_id=module.id,
        events=events,
        statistics=statistics
    )


@router.post("/attempts", response_model=Attempt)
async def create_attempt(
    attempt_data: AttemptCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new student attempt.

    This endpoint is used when a student submits an answer.
    """
    # Verify student exists
    student = db.query(Student).filter(Student.id == attempt_data.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Verify problem exists
    problem = db.query(Problem).filter(Problem.id == attempt_data.problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    # Check if answer is correct (simple comparison for demo)
    is_correct = attempt_data.answer_data == problem.answer_data

    # Generate feedback
    feedback = "정답입니다! 잘했어요!" if is_correct else "다시 한번 시도해보세요."

    # Create attempt
    new_attempt = StudentAttempt(
        student_id=attempt_data.student_id,
        problem_id=attempt_data.problem_id,
        answer_data=attempt_data.answer_data,
        is_correct=is_correct,
        time_spent_seconds=attempt_data.time_spent_seconds,
        interaction_data=attempt_data.interaction_data,
        hint_used=attempt_data.hint_used,
        feedback_given=feedback
    )

    db.add(new_attempt)
    db.commit()
    db.refresh(new_attempt)

    # Update progress percentage
    progress = db.query(StudentProgress).filter(
        and_(
            StudentProgress.student_id == attempt_data.student_id,
            StudentProgress.module_id == problem.module_id
        )
    ).first()

    if progress:
        # Simple progress calculation: count correct attempts
        total_problems = db.query(Problem).filter(Problem.module_id == problem.module_id).count()
        correct_problems = db.query(StudentAttempt).join(Problem).filter(
            and_(
                StudentAttempt.student_id == attempt_data.student_id,
                Problem.module_id == problem.module_id,
                StudentAttempt.is_correct == True
            )
        ).distinct(StudentAttempt.problem_id).count()

        progress.progress_percentage = (correct_problems / total_problems * 100) if total_problems > 0 else 0
        progress.last_accessed_at = datetime.now()

        # Mark as completed if 100%
        if progress.progress_percentage >= 100 and not progress.completed_at:
            progress.completed_at = datetime.now()

        db.commit()

    return Attempt.from_orm(new_attempt)


@router.get("/students", response_model=List[StudentSchema])
async def list_students(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all students."""
    students = db.query(Student).offset(skip).limit(limit).all()
    return [StudentSchema.from_orm(s) for s in students]
