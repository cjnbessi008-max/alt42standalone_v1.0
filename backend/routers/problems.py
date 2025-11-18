"""
API routes for problem management
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from uuid import UUID
from typing import List, Optional
import logging

from ..database import get_db
from ..models import (
    ProblemCreate,
    ProblemResponse,
    ErrorResponse
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/problems", tags=["problems"])


@router.post(
    "/",
    response_model=ProblemResponse,
    status_code=status.HTTP_201_CREATED,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def create_problem(
    problem: ProblemCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new problem
    """
    try:
        result = db.execute(
            text("""
                INSERT INTO problems
                (title, description, problem_type, difficulty_level, correct_answer,
                 answer_type, metadata)
                VALUES (:title, :description, :type, :difficulty, :answer, :answer_type, :metadata)
                RETURNING id, title, description, problem_type, difficulty_level,
                          correct_answer, answer_type, metadata, created_at, updated_at
            """),
            {
                "title": problem.title,
                "description": problem.description,
                "type": problem.problem_type,
                "difficulty": problem.difficulty_level,
                "answer": problem.correct_answer,
                "answer_type": problem.answer_type,
                "metadata": problem.metadata
            }
        )
        db.commit()

        row = result.fetchone()

        return ProblemResponse(
            id=row.id,
            title=row.title,
            description=row.description,
            problem_type=row.problem_type,
            difficulty_level=row.difficulty_level,
            correct_answer=row.correct_answer,
            answer_type=row.answer_type,
            metadata=row.metadata,
            created_at=row.created_at,
            updated_at=row.updated_at
        )

    except Exception as e:
        logger.error(f"Error creating problem: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create problem: {str(e)}"
        )


@router.get(
    "/{problem_id}",
    response_model=ProblemResponse,
    responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def get_problem(
    problem_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get problem details by ID
    """
    try:
        result = db.execute(
            text("""
                SELECT id, title, description, problem_type, difficulty_level,
                       correct_answer, answer_type, metadata, created_at, updated_at
                FROM problems
                WHERE id = :problem_id
            """),
            {"problem_id": str(problem_id)}
        )

        row = result.fetchone()

        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Problem with id {problem_id} not found"
            )

        return ProblemResponse(
            id=row.id,
            title=row.title,
            description=row.description,
            problem_type=row.problem_type,
            difficulty_level=row.difficulty_level,
            correct_answer=row.correct_answer,
            answer_type=row.answer_type,
            metadata=row.metadata,
            created_at=row.created_at,
            updated_at=row.updated_at
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching problem: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch problem: {str(e)}"
        )


@router.get(
    "/",
    response_model=List[ProblemResponse],
    responses={500: {"model": ErrorResponse}}
)
async def list_problems(
    problem_type: Optional[str] = None,
    difficulty: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    List problems with optional filtering by type and difficulty
    """
    try:
        query = """
            SELECT id, title, description, problem_type, difficulty_level,
                   correct_answer, answer_type, metadata, created_at, updated_at
            FROM problems
            WHERE 1=1
        """
        params = {"limit": limit, "skip": skip}

        if problem_type:
            query += " AND problem_type = :problem_type"
            params["problem_type"] = problem_type

        if difficulty:
            query += " AND difficulty_level = :difficulty"
            params["difficulty"] = difficulty

        query += " ORDER BY created_at DESC LIMIT :limit OFFSET :skip"

        result = db.execute(text(query), params)
        rows = result.fetchall()

        return [
            ProblemResponse(
                id=row.id,
                title=row.title,
                description=row.description,
                problem_type=row.problem_type,
                difficulty_level=row.difficulty_level,
                correct_answer=row.correct_answer,
                answer_type=row.answer_type,
                metadata=row.metadata,
                created_at=row.created_at,
                updated_at=row.updated_at
            )
            for row in rows
        ]

    except Exception as e:
        logger.error(f"Error listing problems: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list problems: {str(e)}"
        )


@router.get(
    "/random/next",
    response_model=ProblemResponse,
    responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def get_random_problem(
    problem_type: Optional[str] = None,
    difficulty: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get a random problem, optionally filtered by type and difficulty
    """
    try:
        query = """
            SELECT id, title, description, problem_type, difficulty_level,
                   correct_answer, answer_type, metadata, created_at, updated_at
            FROM problems
            WHERE 1=1
        """
        params = {}

        if problem_type:
            query += " AND problem_type = :problem_type"
            params["problem_type"] = problem_type

        if difficulty:
            query += " AND difficulty_level = :difficulty"
            params["difficulty"] = difficulty

        query += " ORDER BY RANDOM() LIMIT 1"

        result = db.execute(text(query), params)
        row = result.fetchone()

        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No problems found matching the criteria"
            )

        return ProblemResponse(
            id=row.id,
            title=row.title,
            description=row.description,
            problem_type=row.problem_type,
            difficulty_level=row.difficulty_level,
            correct_answer=row.correct_answer,
            answer_type=row.answer_type,
            metadata=row.metadata,
            created_at=row.created_at,
            updated_at=row.updated_at
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting random problem: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get random problem: {str(e)}"
        )
