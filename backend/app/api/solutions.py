"""
Solutions API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime

from app.core.database import get_db
from app.models.solution import Solution
from app.models.problem import Problem
from app.models.user import User
from app.api.schemas import SolutionCreate, SolutionUpdate, SolutionResponse, SolutionStatus

router = APIRouter(prefix="/solutions", tags=["solutions"])


@router.post("", response_model=SolutionResponse, status_code=status.HTTP_201_CREATED)
async def create_solution(
    solution_data: SolutionCreate,
    db: Session = Depends(get_db)
):
    """Create a new solution submission"""
    # Verify problem exists
    problem = db.query(Problem).filter(Problem.id == solution_data.problem_id).first()
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Problem with id {solution_data.problem_id} not found"
        )

    # Verify user exists
    user = db.query(User).filter(User.id == solution_data.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {solution_data.user_id} not found"
        )

    solution = Solution(**solution_data.model_dump())
    db.add(solution)
    db.commit()
    db.refresh(solution)
    return solution


@router.get("", response_model=List[SolutionResponse])
async def list_solutions(
    skip: int = 0,
    limit: int = 100,
    user_id: UUID = None,
    problem_id: UUID = None,
    status_filter: SolutionStatus = None,
    db: Session = Depends(get_db)
):
    """List solutions with optional filters"""
    query = db.query(Solution)

    if user_id:
        query = query.filter(Solution.user_id == user_id)
    if problem_id:
        query = query.filter(Solution.problem_id == problem_id)
    if status_filter:
        query = query.filter(Solution.status == status_filter)

    solutions = query.order_by(Solution.created_at.desc()).offset(skip).limit(limit).all()
    return solutions


@router.get("/{solution_id}", response_model=SolutionResponse)
async def get_solution(
    solution_id: UUID,
    db: Session = Depends(get_db)
):
    """Get a specific solution by ID"""
    solution = db.query(Solution).filter(Solution.id == solution_id).first()
    if not solution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Solution with id {solution_id} not found"
        )
    return solution


@router.put("/{solution_id}", response_model=SolutionResponse)
async def update_solution(
    solution_id: UUID,
    solution_data: SolutionUpdate,
    db: Session = Depends(get_db)
):
    """Update a solution"""
    solution = db.query(Solution).filter(Solution.id == solution_id).first()
    if not solution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Solution with id {solution_id} not found"
        )

    update_data = solution_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(solution, field, value)

    # If status is being changed to SUBMITTED, set submitted_at
    if 'status' in update_data and update_data['status'] == SolutionStatus.SUBMITTED:
        solution.submitted_at = datetime.utcnow()

    db.commit()
    db.refresh(solution)
    return solution


@router.post("/{solution_id}/submit", response_model=SolutionResponse)
async def submit_solution(
    solution_id: UUID,
    db: Session = Depends(get_db)
):
    """Submit a solution (change status to SUBMITTED)"""
    solution = db.query(Solution).filter(Solution.id == solution_id).first()
    if not solution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Solution with id {solution_id} not found"
        )

    if solution.status != SolutionStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Solution is already in {solution.status} status"
        )

    solution.status = SolutionStatus.SUBMITTED
    solution.submitted_at = datetime.utcnow()

    db.commit()
    db.refresh(solution)
    return solution


@router.delete("/{solution_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_solution(
    solution_id: UUID,
    db: Session = Depends(get_db)
):
    """Delete a solution"""
    solution = db.query(Solution).filter(Solution.id == solution_id).first()
    if not solution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Solution with id {solution_id} not found"
        )

    db.delete(solution)
    db.commit()
    return None
