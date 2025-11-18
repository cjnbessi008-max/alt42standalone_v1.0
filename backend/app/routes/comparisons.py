from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User, UserRole
from app.models.solution import Solution
from app.models.comparison import Comparison
from app.schemas.comparison import ComparisonRequest, ComparisonResponse
from app.routes.auth import get_current_user
from app.services.comparison import ComparisonService

router = APIRouter(prefix="/comparisons", tags=["comparisons"])


@router.post("", response_model=ComparisonResponse, status_code=status.HTTP_201_CREATED)
async def create_comparison(
    comparison_request: ComparisonRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Compare a student solution with a model solution using AI"""
    # Get student solution
    student_solution = db.query(Solution).filter(Solution.id == comparison_request.student_solution_id).first()

    if not student_solution:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student solution not found")

    # Check permission (students can only compare their own solutions)
    if current_user.role == UserRole.STUDENT and student_solution.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to compare this solution"
        )

    # Get model solution
    if comparison_request.model_solution_id:
        model_solution = db.query(Solution).filter(Solution.id == comparison_request.model_solution_id).first()
    else:
        # Find the default model solution for this problem
        model_solution = (
            db.query(Solution)
            .filter(Solution.problem_id == student_solution.problem_id, Solution.is_model_solution == True)
            .first()
        )

    if not model_solution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Model solution not found for this problem"
        )

    # Get problem details
    problem = student_solution.problem

    # Use AI service to compare
    comparison_service = ComparisonService()
    ai_result = await comparison_service.compare_solutions(
        student_solution=student_solution.content,
        model_solution=model_solution.content,
        problem_description=problem.description,
        student_explanation=student_solution.explanation,
        model_explanation=model_solution.explanation,
    )

    # Save comparison result
    new_comparison = Comparison(
        student_solution_id=student_solution.id,
        model_solution_id=model_solution.id,
        similarity_score=ai_result["similarity_score"],
        feedback=ai_result["feedback"],
        strengths=ai_result["strengths"],
        improvements=ai_result["improvements"],
        differences=ai_result["differences"],
    )

    db.add(new_comparison)
    db.commit()
    db.refresh(new_comparison)

    return new_comparison


@router.get("/solution/{solution_id}", response_model=List[ComparisonResponse])
def get_solution_comparisons(
    solution_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get all comparisons for a solution"""
    solution = db.query(Solution).filter(Solution.id == solution_id).first()

    if not solution:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Solution not found")

    # Check permission
    if current_user.role == UserRole.STUDENT and solution.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view these comparisons"
        )

    comparisons = db.query(Comparison).filter(Comparison.student_solution_id == solution_id).all()

    return comparisons


@router.get("/{comparison_id}", response_model=ComparisonResponse)
def get_comparison(
    comparison_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get a specific comparison"""
    comparison = db.query(Comparison).filter(Comparison.id == comparison_id).first()

    if not comparison:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comparison not found")

    # Check permission
    if current_user.role == UserRole.STUDENT:
        student_solution = comparison.student_solution
        if student_solution.student_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this comparison"
            )

    return comparison
