from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.models.user import User
from app.models.problem import Problem
from app.schemas.problem import (
    ProblemCreate,
    ProblemUpdate,
    ProblemResponse,
    ProblemReadingStage,
    ProblemSolvingStage,
)
from app.core.security import get_current_user, get_current_active_teacher

router = APIRouter(prefix="/api/problems", tags=["Problems"])


@router.post("/", response_model=ProblemResponse, status_code=status.HTTP_201_CREATED)
def create_problem(
    problem_data: ProblemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_teacher)
):
    """Create a new problem (teachers only)"""
    new_problem = Problem(
        title=problem_data.title,
        problem_type=problem_data.problem_type,
        difficulty_level=problem_data.difficulty_level,
        subject=problem_data.subject,
        grade_level=problem_data.grade_level,
        reading_content=problem_data.reading_content,
        reading_visual_url=problem_data.reading_visual_url,
        question_text=problem_data.question_text,
        correct_answer=problem_data.correct_answer,
        answer_options=problem_data.answer_options,
        explanation=problem_data.explanation,
        tags=problem_data.tags,
        created_by=current_user.id,
    )

    db.add(new_problem)
    db.commit()
    db.refresh(new_problem)

    return new_problem


@router.get("/", response_model=List[ProblemResponse])
def get_problems(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    subject: Optional[str] = None,
    grade_level: Optional[str] = None,
    difficulty: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of problems with optional filters"""
    query = db.query(Problem)

    if subject:
        query = query.filter(Problem.subject == subject)
    if grade_level:
        query = query.filter(Problem.grade_level == grade_level)
    if difficulty:
        query = query.filter(Problem.difficulty_level == difficulty)

    problems = query.offset(skip).limit(limit).all()
    return problems


@router.get("/{problem_id}", response_model=ProblemResponse)
def get_problem(
    problem_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific problem by ID"""
    problem = db.query(Problem).filter(Problem.id == problem_id).first()

    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Problem not found"
        )

    return problem


@router.get("/{problem_id}/reading", response_model=ProblemReadingStage)
def get_problem_reading_stage(
    problem_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get problem content for reading stage (without answer)"""
    problem = db.query(Problem).filter(Problem.id == problem_id).first()

    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Problem not found"
        )

    return problem


@router.get("/{problem_id}/solving", response_model=ProblemSolvingStage)
def get_problem_solving_stage(
    problem_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get problem content for solving stage (question only, no answer)"""
    problem = db.query(Problem).filter(Problem.id == problem_id).first()

    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Problem not found"
        )

    return problem


@router.put("/{problem_id}", response_model=ProblemResponse)
def update_problem(
    problem_id: str,
    problem_data: ProblemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_teacher)
):
    """Update a problem (teachers only)"""
    problem = db.query(Problem).filter(Problem.id == problem_id).first()

    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Problem not found"
        )

    # Update only provided fields
    update_data = problem_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(problem, field, value)

    db.commit()
    db.refresh(problem)

    return problem


@router.delete("/{problem_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_problem(
    problem_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_teacher)
):
    """Delete a problem (teachers only)"""
    problem = db.query(Problem).filter(Problem.id == problem_id).first()

    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Problem not found"
        )

    db.delete(problem)
    db.commit()

    return None
