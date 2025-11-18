from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User, UserRole
from app.models.problem import Problem
from app.models.solution import Solution
from app.schemas.solution import SolutionCreate, SolutionResponse
from app.routes.auth import get_current_user

router = APIRouter(prefix="/solutions", tags=["solutions"])


@router.post("", response_model=SolutionResponse, status_code=status.HTTP_201_CREATED)
def submit_solution(
    solution_data: SolutionCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Submit a solution to a problem"""
    # Verify problem exists
    problem = db.query(Problem).filter(Problem.id == solution_data.problem_id).first()
    if not problem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found")

    # Create solution
    new_solution = Solution(
        problem_id=solution_data.problem_id,
        student_id=current_user.id,
        content=solution_data.content,
        explanation=solution_data.explanation,
        is_model_solution=False,
    )

    db.add(new_solution)
    db.commit()
    db.refresh(new_solution)

    return new_solution


@router.get("/problem/{problem_id}", response_model=List[SolutionResponse])
def get_problem_solutions(
    problem_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get all solutions for a problem (teachers see all, students see only theirs)"""
    # Verify problem exists
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found")

    # Teachers and admins can see all solutions
    if current_user.role in [UserRole.TEACHER, UserRole.ADMIN]:
        solutions = db.query(Solution).filter(Solution.problem_id == problem_id).all()
    else:
        # Students see only their own solutions and model solutions
        solutions = (
            db.query(Solution)
            .filter(
                Solution.problem_id == problem_id,
                ((Solution.student_id == current_user.id) | (Solution.is_model_solution == True)),
            )
            .all()
        )

    return solutions


@router.get("/{solution_id}", response_model=SolutionResponse)
def get_solution(solution_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get a specific solution"""
    solution = db.query(Solution).filter(Solution.id == solution_id).first()

    if not solution:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Solution not found")

    # Check permission (students can only see their own solutions and model solutions)
    if current_user.role == UserRole.STUDENT:
        if not solution.is_model_solution and solution.student_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this solution")

    return solution


@router.get("/my/all", response_model=List[SolutionResponse])
def get_my_solutions(
    skip: int = 0, limit: int = 100, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get all solutions submitted by current user"""
    solutions = (
        db.query(Solution)
        .filter(Solution.student_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .all()
    )

    return solutions
