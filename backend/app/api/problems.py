"""
Problems API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.models.problem import Problem
from app.api.schemas import ProblemCreate, ProblemUpdate, ProblemResponse

router = APIRouter(prefix="/problems", tags=["problems"])


@router.post("", response_model=ProblemResponse, status_code=status.HTTP_201_CREATED)
async def create_problem(
    problem_data: ProblemCreate,
    db: Session = Depends(get_db)
):
    """Create a new problem"""
    problem = Problem(**problem_data.model_dump())
    db.add(problem)
    db.commit()
    db.refresh(problem)
    return problem


@router.get("", response_model=List[ProblemResponse])
async def list_problems(
    skip: int = 0,
    limit: int = 100,
    subject: str = None,
    difficulty: str = None,
    db: Session = Depends(get_db)
):
    """List all problems with optional filters"""
    query = db.query(Problem)

    if subject:
        query = query.filter(Problem.subject == subject)
    if difficulty:
        query = query.filter(Problem.difficulty == difficulty)

    problems = query.offset(skip).limit(limit).all()
    return problems


@router.get("/{problem_id}", response_model=ProblemResponse)
async def get_problem(
    problem_id: UUID,
    db: Session = Depends(get_db)
):
    """Get a specific problem by ID"""
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Problem with id {problem_id} not found"
        )
    return problem


@router.put("/{problem_id}", response_model=ProblemResponse)
async def update_problem(
    problem_id: UUID,
    problem_data: ProblemUpdate,
    db: Session = Depends(get_db)
):
    """Update a problem"""
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Problem with id {problem_id} not found"
        )

    update_data = problem_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(problem, field, value)

    db.commit()
    db.refresh(problem)
    return problem


@router.delete("/{problem_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_problem(
    problem_id: UUID,
    db: Session = Depends(get_db)
):
    """Delete a problem"""
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Problem with id {problem_id} not found"
        )

    db.delete(problem)
    db.commit()
    return None
