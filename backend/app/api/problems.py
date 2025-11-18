"""Problems API endpoints."""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models import Problem

router = APIRouter()


class ProblemCreate(BaseModel):
    """Problem creation schema."""

    problem_type: str = Field(..., example="math")
    difficulty_level: int = Field(..., ge=1, le=5, example=3)
    original_text: str = Field(..., example="Solve: 2x + 5 = 13")
    original_solution: Optional[str] = Field(None, example="x = 4")
    topic: Optional[str] = Field(None, example="algebra")
    moodle_question_id: Optional[int] = None
    course_id: Optional[int] = None
    quiz_id: Optional[int] = None
    metadata: Optional[dict] = None


class ProblemResponse(BaseModel):
    """Problem response schema."""

    id: str
    problem_type: str
    difficulty_level: int
    original_text: str
    original_solution: Optional[str]
    topic: Optional[str]
    moodle_question_id: Optional[int]
    course_id: Optional[int]
    quiz_id: Optional[int]
    metadata: Optional[dict]
    created_at: str

    class Config:
        from_attributes = True


@router.get("", response_model=list[ProblemResponse])
async def list_problems(
    problem_type: Optional[str] = Query(None),
    topic: Optional[str] = Query(None),
    difficulty_level: Optional[int] = Query(None, ge=1, le=5),
    course_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List problems with optional filters.

    Args:
        problem_type: Filter by problem type
        topic: Filter by topic
        difficulty_level: Filter by difficulty
        course_id: Filter by Moodle course ID
        skip: Number of records to skip
        limit: Maximum number of records to return
        db: Database session

    Returns:
        List of problems
    """
    query = select(Problem)

    if problem_type:
        query = query.where(Problem.problem_type == problem_type)
    if topic:
        query = query.where(Problem.topic == topic)
    if difficulty_level:
        query = query.where(Problem.difficulty_level == difficulty_level)
    if course_id:
        query = query.where(Problem.course_id == course_id)

    query = query.offset(skip).limit(limit).order_by(Problem.created_at.desc())

    result = await db.scalars(query)
    problems = result.all()

    return [
        ProblemResponse(
            id=str(p.id),
            problem_type=p.problem_type,
            difficulty_level=p.difficulty_level,
            original_text=p.original_text,
            original_solution=p.original_solution,
            topic=p.topic,
            moodle_question_id=p.moodle_question_id,
            course_id=p.course_id,
            quiz_id=p.quiz_id,
            metadata=p.metadata,
            created_at=p.created_at.isoformat(),
        )
        for p in problems
    ]


@router.get("/{problem_id}", response_model=ProblemResponse)
async def get_problem(
    problem_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get problem by ID.

    Args:
        problem_id: Problem ID
        db: Database session

    Returns:
        Problem details

    Raises:
        HTTPException: If problem not found
    """
    problem = await db.get(Problem, problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    return ProblemResponse(
        id=str(problem.id),
        problem_type=problem.problem_type,
        difficulty_level=problem.difficulty_level,
        original_text=problem.original_text,
        original_solution=problem.original_solution,
        topic=problem.topic,
        moodle_question_id=problem.moodle_question_id,
        course_id=problem.course_id,
        quiz_id=problem.quiz_id,
        metadata=problem.metadata,
        created_at=problem.created_at.isoformat(),
    )


@router.post("", response_model=ProblemResponse, status_code=201)
async def create_problem(
    problem_data: ProblemCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new problem.

    Args:
        problem_data: Problem creation data
        db: Database session

    Returns:
        Created problem
    """
    problem = Problem(
        problem_type=problem_data.problem_type,
        difficulty_level=problem_data.difficulty_level,
        original_text=problem_data.original_text,
        original_solution=problem_data.original_solution,
        topic=problem_data.topic,
        moodle_question_id=problem_data.moodle_question_id,
        course_id=problem_data.course_id,
        quiz_id=problem_data.quiz_id,
        metadata=problem_data.metadata,
    )

    db.add(problem)
    await db.commit()
    await db.refresh(problem)

    return ProblemResponse(
        id=str(problem.id),
        problem_type=problem.problem_type,
        difficulty_level=problem.difficulty_level,
        original_text=problem.original_text,
        original_solution=problem.original_solution,
        topic=problem.topic,
        moodle_question_id=problem.moodle_question_id,
        course_id=problem.course_id,
        quiz_id=problem.quiz_id,
        metadata=problem.metadata,
        created_at=problem.created_at.isoformat(),
    )
