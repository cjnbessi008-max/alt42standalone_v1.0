"""Solution strategies API endpoints."""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models import Problem, SolutionStrategy
from app.services.ai_solution_generator import AISolutionGenerator

router = APIRouter()


class StrategyGenerateRequest(BaseModel):
    """Request to generate alternative strategies."""

    problem_id: UUID
    num_strategies: int = Field(default=5, ge=1, le=10)
    student_mastery: str = Field(default="intermediate", example="intermediate")
    weak_strategies: Optional[list[str]] = Field(default=None, example=["graphical", "numerical"])


class StrategyResponse(BaseModel):
    """Strategy response schema."""

    id: str
    problem_id: str
    strategy_type: str
    strategy_name: str
    description: Optional[str]
    solution_steps: dict
    difficulty_modifier: int
    generated_by: str
    created_at: str

    class Config:
        from_attributes = True


@router.post("/generate", response_model=list[StrategyResponse])
async def generate_strategies(
    request: StrategyGenerateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Generate alternative solving strategies for a problem using AI.

    Args:
        request: Strategy generation request
        db: Database session

    Returns:
        List of generated strategies

    Raises:
        HTTPException: If problem not found or generation fails
    """
    # Get problem
    problem = await db.get(Problem, request.problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    try:
        # Generate strategies using AI
        generator = AISolutionGenerator()
        strategies_data = await generator.generate_strategies(
            problem_text=problem.original_text,
            problem_type=problem.problem_type,
            original_solution=problem.original_solution,
            difficulty_level=problem.difficulty_level,
            student_mastery=request.student_mastery,
            weak_strategies=request.weak_strategies,
            num_strategies=request.num_strategies,
        )

        # Save strategies to database
        created_strategies = []
        for strategy_data in strategies_data:
            strategy = SolutionStrategy(
                problem_id=request.problem_id,
                strategy_type=strategy_data.get("strategy_type", "unknown"),
                strategy_name=strategy_data.get("strategy_name", "Alternative Method"),
                description=strategy_data.get("description"),
                solution_steps={
                    "steps": strategy_data.get("solution_steps", []),
                    "final_answer": strategy_data.get("final_answer", ""),
                    "verification": strategy_data.get("verification", ""),
                    "advantages": strategy_data.get("advantages", ""),
                    "prerequisites": strategy_data.get("prerequisites", []),
                },
                difficulty_modifier=strategy_data.get("difficulty_modifier", 0),
                generated_by="ai",
            )

            db.add(strategy)
            created_strategies.append(strategy)

        await db.commit()

        # Refresh and return
        response = []
        for strategy in created_strategies:
            await db.refresh(strategy)
            response.append(
                StrategyResponse(
                    id=str(strategy.id),
                    problem_id=str(strategy.problem_id),
                    strategy_type=strategy.strategy_type,
                    strategy_name=strategy.strategy_name,
                    description=strategy.description,
                    solution_steps=strategy.solution_steps,
                    difficulty_modifier=strategy.difficulty_modifier,
                    generated_by=strategy.generated_by,
                    created_at=strategy.created_at.isoformat(),
                )
            )

        return response

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to generate strategies: {str(e)}"
        )


@router.get("/problem/{problem_id}", response_model=list[StrategyResponse])
async def get_problem_strategies(
    problem_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get all strategies for a problem.

    Args:
        problem_id: Problem ID
        db: Database session

    Returns:
        List of strategies for the problem
    """
    result = await db.scalars(
        select(SolutionStrategy)
        .where(SolutionStrategy.problem_id == problem_id)
        .order_by(SolutionStrategy.created_at)
    )
    strategies = result.all()

    return [
        StrategyResponse(
            id=str(s.id),
            problem_id=str(s.problem_id),
            strategy_type=s.strategy_type,
            strategy_name=s.strategy_name,
            description=s.description,
            solution_steps=s.solution_steps,
            difficulty_modifier=s.difficulty_modifier,
            generated_by=s.generated_by,
            created_at=s.created_at.isoformat(),
        )
        for s in strategies
    ]


@router.get("/{strategy_id}", response_model=StrategyResponse)
async def get_strategy(
    strategy_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get strategy by ID.

    Args:
        strategy_id: Strategy ID
        db: Database session

    Returns:
        Strategy details

    Raises:
        HTTPException: If strategy not found
    """
    strategy = await db.get(SolutionStrategy, strategy_id)
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")

    return StrategyResponse(
        id=str(strategy.id),
        problem_id=str(strategy.problem_id),
        strategy_type=strategy.strategy_type,
        strategy_name=strategy.strategy_name,
        description=strategy.description,
        solution_steps=strategy.solution_steps,
        difficulty_modifier=strategy.difficulty_modifier,
        generated_by=strategy.generated_by,
        created_at=strategy.created_at.isoformat(),
    )
