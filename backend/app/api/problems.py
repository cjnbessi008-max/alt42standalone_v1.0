"""
Problem endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import json
from ..models import get_db, Problem, PatternType
from ..models.problem import DifficultyLevel
from ..schemas import ProblemCreate, ProblemResponse, ProblemDetailResponse, PatternTypeResponse

router = APIRouter(prefix="/problems", tags=["problems"])


@router.get("/pattern-types", response_model=List[PatternTypeResponse])
async def get_pattern_types(db: Session = Depends(get_db)):
    """Get all pattern types"""
    pattern_types = db.query(PatternType).all()
    return pattern_types


@router.get("/", response_model=List[ProblemResponse])
async def get_problems(
    difficulty: Optional[DifficultyLevel] = None,
    pattern_type_id: Optional[int] = None,
    is_active: bool = True,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get problems with optional filters"""
    query = db.query(Problem)

    if difficulty:
        query = query.filter(Problem.difficulty_level == difficulty)
    if pattern_type_id:
        query = query.filter(Problem.pattern_type_id == pattern_type_id)
    if is_active is not None:
        query = query.filter(Problem.is_active == is_active)

    problems = query.offset(skip).limit(limit).all()

    # Parse JSON sequences
    result = []
    for problem in problems:
        problem_dict = {
            "id": problem.id,
            "pattern_type_id": problem.pattern_type_id,
            "moodle_question_id": problem.moodle_question_id,
            "title": problem.title,
            "description": problem.description,
            "initial_sequence": json.loads(problem.initial_sequence),
            "pattern_hint": problem.pattern_hint,
            "difficulty_level": problem.difficulty_level,
            "time_limit_seconds": problem.time_limit_seconds,
            "max_attempts": problem.max_attempts,
            "points": problem.points,
            "is_active": problem.is_active,
            "created_at": problem.created_at,
            "updated_at": problem.updated_at
        }
        result.append(ProblemResponse(**problem_dict))

    return result


@router.get("/{problem_id}", response_model=ProblemDetailResponse)
async def get_problem(problem_id: int, db: Session = Depends(get_db)):
    """Get problem by ID with full details"""
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Problem not found"
        )

    problem_dict = {
        "id": problem.id,
        "pattern_type_id": problem.pattern_type_id,
        "moodle_question_id": problem.moodle_question_id,
        "title": problem.title,
        "description": problem.description,
        "initial_sequence": json.loads(problem.initial_sequence),
        "pattern_hint": problem.pattern_hint,
        "difficulty_level": problem.difficulty_level,
        "time_limit_seconds": problem.time_limit_seconds,
        "max_attempts": problem.max_attempts,
        "points": problem.points,
        "is_active": problem.is_active,
        "created_at": problem.created_at,
        "updated_at": problem.updated_at,
        "pattern_type": problem.pattern_type
    }

    return ProblemDetailResponse(**problem_dict)


@router.post("/", response_model=ProblemResponse, status_code=status.HTTP_201_CREATED)
async def create_problem(problem: ProblemCreate, db: Session = Depends(get_db)):
    """Create a new problem"""
    # Verify pattern type exists
    pattern_type = db.query(PatternType).filter(PatternType.id == problem.pattern_type_id).first()
    if not pattern_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pattern type not found"
        )

    problem_dict = problem.dict()
    # Convert sequences to JSON strings
    problem_dict["initial_sequence"] = json.dumps(problem.initial_sequence)
    problem_dict["target_sequence"] = json.dumps(problem.target_sequence)

    db_problem = Problem(**problem_dict)
    db.add(db_problem)
    db.commit()
    db.refresh(db_problem)

    # Convert back for response
    response_dict = {
        "id": db_problem.id,
        "pattern_type_id": db_problem.pattern_type_id,
        "moodle_question_id": db_problem.moodle_question_id,
        "title": db_problem.title,
        "description": db_problem.description,
        "initial_sequence": json.loads(db_problem.initial_sequence),
        "pattern_hint": db_problem.pattern_hint,
        "difficulty_level": db_problem.difficulty_level,
        "time_limit_seconds": db_problem.time_limit_seconds,
        "max_attempts": db_problem.max_attempts,
        "points": db_problem.points,
        "is_active": db_problem.is_active,
        "created_at": db_problem.created_at,
        "updated_at": db_problem.updated_at
    }

    return ProblemResponse(**response_dict)


@router.get("/random/next", response_model=ProblemDetailResponse)
async def get_random_problem(
    difficulty: Optional[DifficultyLevel] = None,
    pattern_type_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get a random problem for practice"""
    from sqlalchemy import func

    query = db.query(Problem).filter(Problem.is_active == True)

    if difficulty:
        query = query.filter(Problem.difficulty_level == difficulty)
    if pattern_type_id:
        query = query.filter(Problem.pattern_type_id == pattern_type_id)

    problem = query.order_by(func.rand()).first()

    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No problems found matching criteria"
        )

    problem_dict = {
        "id": problem.id,
        "pattern_type_id": problem.pattern_type_id,
        "moodle_question_id": problem.moodle_question_id,
        "title": problem.title,
        "description": problem.description,
        "initial_sequence": json.loads(problem.initial_sequence),
        "pattern_hint": problem.pattern_hint,
        "difficulty_level": problem.difficulty_level,
        "time_limit_seconds": problem.time_limit_seconds,
        "max_attempts": problem.max_attempts,
        "points": problem.points,
        "is_active": problem.is_active,
        "created_at": problem.created_at,
        "updated_at": problem.updated_at,
        "pattern_type": problem.pattern_type
    }

    return ProblemDetailResponse(**problem_dict)
