from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.problem import Problem
from app.models.schemas import (
    ProblemCreate,
    ProblemResponse,
    LogicSummaryRequest,
    LogicSummaryResponse,
    PropositionItem
)
from app.services.proposition_extractor import PropositionExtractor

router = APIRouter(prefix="/api/problems", tags=["problems"])

# Initialize proposition extractor (will be created per request in production)
def get_extractor():
    return PropositionExtractor()


@router.post("/", response_model=ProblemResponse, status_code=status.HTTP_201_CREATED)
async def create_problem(
    problem: ProblemCreate,
    db: Session = Depends(get_db)
):
    """Create a new problem without logic analysis"""
    db_problem = Problem(
        title=problem.title,
        content=problem.content,
        problem_type=problem.problem_type,
        grade_level=problem.grade_level
    )
    db.add(db_problem)
    db.commit()
    db.refresh(db_problem)
    return db_problem


@router.get("/", response_model=List[ProblemResponse])
async def list_problems(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all problems"""
    problems = db.query(Problem).offset(skip).limit(limit).all()
    return problems


@router.get("/{problem_id}", response_model=ProblemResponse)
async def get_problem(
    problem_id: int,
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


@router.post("/{problem_id}/analyze", response_model=LogicSummaryResponse)
async def analyze_problem(
    problem_id: int,
    db: Session = Depends(get_db),
    extractor: PropositionExtractor = Depends(get_extractor)
):
    """
    Analyze a problem and generate logic summary using AI.
    This extracts propositions, creates a summary, and stores the results.
    """
    # Get the problem
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Problem with id {problem_id} not found"
        )

    # Extract propositions using Claude AI
    try:
        analysis_result = await extractor.extract_propositions(
            problem_content=problem.content,
            problem_title=problem.title,
            grade_level=problem.grade_level
        )

        # Update problem with analysis results
        problem.propositions = analysis_result.get("propositions", [])
        problem.logic_summary = analysis_result.get("logic_summary", "")

        db.commit()
        db.refresh(problem)

        # Convert propositions to Pydantic models
        proposition_items = [
            PropositionItem(**prop) for prop in analysis_result.get("propositions", [])
        ]

        return LogicSummaryResponse(
            problem_id=problem.id,
            propositions=proposition_items,
            logic_summary=analysis_result.get("logic_summary", ""),
            visualization_data=analysis_result.get("visualization_data")
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing problem: {str(e)}"
        )


@router.delete("/{problem_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_problem(
    problem_id: int,
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
