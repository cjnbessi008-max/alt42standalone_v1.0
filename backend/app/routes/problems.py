from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User, UserRole
from app.models.problem import Problem
from app.models.solution import Solution
from app.schemas.problem import ProblemCreate, ProblemResponse, ProblemUpdate
from app.routes.auth import get_current_user

router = APIRouter(prefix="/problems", tags=["problems"])


@router.post("", response_model=ProblemResponse, status_code=status.HTTP_201_CREATED)
def create_problem(
    problem_data: ProblemCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Create a new problem (teachers only)"""
    if current_user.role not in [UserRole.TEACHER, UserRole.ADMIN]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only teachers can create problems")

    # Create the problem
    new_problem = Problem(
        title=problem_data.title,
        description=problem_data.description,
        problem_type=problem_data.problem_type,
        difficulty=problem_data.difficulty,
        max_score=problem_data.max_score,
        time_limit_minutes=problem_data.time_limit_minutes,
        author_id=current_user.id,
    )

    db.add(new_problem)
    db.commit()
    db.refresh(new_problem)

    # Create model solution if provided
    if problem_data.model_solution_content:
        model_solution = Solution(
            problem_id=new_problem.id,
            content=problem_data.model_solution_content,
            explanation=problem_data.model_solution_explanation,
            is_model_solution=True,
            student_id=None,
        )
        db.add(model_solution)
        db.commit()

    return new_problem


@router.get("", response_model=List[ProblemResponse])
def list_problems(
    skip: int = 0, limit: int = 100, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """List all problems"""
    problems = db.query(Problem).offset(skip).limit(limit).all()
    return problems


@router.get("/{problem_id}", response_model=ProblemResponse)
def get_problem(problem_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get a specific problem"""
    problem = db.query(Problem).filter(Problem.id == problem_id).first()

    if not problem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found")

    return problem


@router.put("/{problem_id}", response_model=ProblemResponse)
def update_problem(
    problem_id: str,
    problem_data: ProblemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a problem (author or admin only)"""
    problem = db.query(Problem).filter(Problem.id == problem_id).first()

    if not problem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found")

    # Check permission
    if problem.author_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this problem")

    # Update fields
    update_data = problem_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(problem, field, value)

    db.commit()
    db.refresh(problem)

    return problem


@router.delete("/{problem_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_problem(
    problem_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Delete a problem (author or admin only)"""
    problem = db.query(Problem).filter(Problem.id == problem_id).first()

    if not problem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found")

    # Check permission
    if problem.author_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this problem")

    db.delete(problem)
    db.commit()

    return None
