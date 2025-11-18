"""API routes for vector transformation problems."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID
import math
from decimal import Decimal

from ..database import get_db
from ..models.vector_problem import VectorProblem, Module, StudentAttempt
from ..schemas.vector_problem import (
    VectorProblemResponse,
    StudentAttemptCreate,
    StudentAttemptResponse,
    ModuleResponse,
)

router = APIRouter(prefix="/api/vector-problems", tags=["Vector Problems"])


@router.get("/modules", response_model=List[ModuleResponse])
async def get_modules(db: AsyncSession = Depends(get_db)):
    """Get all modules."""
    result = await db.execute(
        select(Module).where(Module.module_type == "vector_transformation")
    )
    modules = result.scalars().all()
    return modules


@router.get("/", response_model=List[VectorProblemResponse])
async def get_problems(
    module_id: UUID = None,
    problem_type: str = None,
    difficulty: int = None,
    db: AsyncSession = Depends(get_db)
):
    """Get vector transformation problems with optional filters."""
    query = select(VectorProblem)

    if module_id:
        query = query.where(VectorProblem.module_id == module_id)
    if problem_type:
        query = query.where(VectorProblem.problem_type == problem_type)
    if difficulty:
        query = query.where(VectorProblem.difficulty_level == difficulty)

    result = await db.execute(query)
    problems = result.scalars().all()
    return problems


@router.get("/{problem_id}", response_model=VectorProblemResponse)
async def get_problem(problem_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get a specific vector transformation problem."""
    result = await db.execute(
        select(VectorProblem).where(VectorProblem.id == problem_id)
    )
    problem = result.scalar_one_or_none()

    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    return problem


@router.post("/attempts", response_model=StudentAttemptResponse)
async def submit_attempt(
    attempt: StudentAttemptCreate,
    db: AsyncSession = Depends(get_db)
):
    """Submit a student attempt for a vector problem."""
    # Get the problem to check the answer
    result = await db.execute(
        select(VectorProblem).where(VectorProblem.id == attempt.problem_id)
    )
    problem = result.scalar_one_or_none()

    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    # Check if answer is correct (with tolerance)
    tolerance = Decimal("0.1")
    is_correct = (
        abs(attempt.answer_x - problem.expected_x) <= tolerance and
        abs(attempt.answer_y - problem.expected_y) <= tolerance
    )

    # Create attempt record
    db_attempt = StudentAttempt(
        student_id=attempt.student_id,
        problem_id=attempt.problem_id,
        answer_x=attempt.answer_x,
        answer_y=attempt.answer_y,
        is_correct=is_correct,
        time_spent_seconds=attempt.time_spent_seconds,
        hint_used=attempt.hint_used,
    )

    db.add(db_attempt)
    await db.commit()
    await db.refresh(db_attempt)

    return db_attempt


@router.get("/random/{difficulty_level}", response_model=VectorProblemResponse)
async def get_random_problem(
    difficulty_level: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a random problem of specified difficulty."""
    result = await db.execute(
        select(VectorProblem)
        .where(VectorProblem.difficulty_level == difficulty_level)
        .order_by(func.random())
        .limit(1)
    )
    problem = result.scalar_one_or_none()

    if not problem:
        raise HTTPException(
            status_code=404,
            detail=f"No problems found for difficulty level {difficulty_level}"
        )

    return problem
