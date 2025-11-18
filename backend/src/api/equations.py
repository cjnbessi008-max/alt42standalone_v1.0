"""
Equations API Endpoints
FastAPI routes for equation simplification and animation
Part of KAIST Touch Math Academy AI Education System
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
import uuid

from ..services.equation_simplifier import EquationSimplifier, EquationStep as ServiceEquationStep


# Request/Response Models
class SimplificationStrategy(str, Enum):
    """Available simplification strategies"""
    AUTO = "auto"
    EXPAND = "expand"
    FACTOR = "factor"
    COLLECT = "collect"


class EquationSimplifyRequest(BaseModel):
    """Request model for equation simplification"""
    equation: str = Field(..., description="Equation to simplify (LaTeX or plain text)")
    strategy: SimplificationStrategy = Field(
        default=SimplificationStrategy.AUTO,
        description="Simplification strategy to use"
    )
    module_id: Optional[str] = Field(None, description="Module ID this equation belongs to")
    topic: str = Field(default="algebra", description="Mathematical topic")
    grade_level: str = Field(default="7", description="Target grade level")
    difficulty: int = Field(default=3, ge=1, le=5, description="Difficulty level (1-5)")

    class Config:
        json_schema_extra = {
            "example": {
                "equation": "(x + 2) * (x + 3)",
                "strategy": "auto",
                "topic": "polynomials",
                "grade_level": "8",
                "difficulty": 3
            }
        }


class EquationSolveRequest(BaseModel):
    """Request model for solving equations"""
    equation: str = Field(..., description="Equation to solve (e.g., '2*x + 5 = 13')")
    variable: str = Field(default="x", description="Variable to solve for")
    module_id: Optional[str] = Field(None, description="Module ID")
    topic: str = Field(default="linear_equations", description="Mathematical topic")
    grade_level: str = Field(default="7", description="Target grade level")
    difficulty: int = Field(default=3, ge=1, le=5, description="Difficulty level (1-5)")

    class Config:
        json_schema_extra = {
            "example": {
                "equation": "2*x + 5 = 13",
                "variable": "x",
                "topic": "linear_equations",
                "grade_level": "7",
                "difficulty": 2
            }
        }


class EquationStepResponse(BaseModel):
    """Response model for a single equation step"""
    id: str
    equation: str
    description: str
    rule: str
    delay: int
    changedElements: List[str]
    highlightColor: str


class EquationProblemResponse(BaseModel):
    """Response model for complete equation problem"""
    id: str
    original: str
    simplified: str
    steps: List[EquationStepResponse]
    difficulty: int
    topic: str
    gradeLevel: str
    moduleId: Optional[str]


class ErrorResponse(BaseModel):
    """Error response model"""
    error: str
    detail: Optional[str] = None


# Create router
router = APIRouter(
    prefix="/api/equations",
    tags=["equations"],
    responses={
        400: {"model": ErrorResponse, "description": "Bad request"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)


@router.post(
    "/simplify",
    response_model=EquationProblemResponse,
    status_code=status.HTTP_200_OK,
    summary="Simplify an equation",
    description="Simplify a mathematical equation and return step-by-step animation data"
)
async def simplify_equation(request: EquationSimplifyRequest) -> EquationProblemResponse:
    """
    Simplify an equation with step-by-step explanation

    - **equation**: Mathematical equation (LaTeX or plain text)
    - **strategy**: Simplification approach (auto, expand, factor, collect)
    - **topic**: Mathematical topic for categorization
    - **grade_level**: Target grade level
    - **difficulty**: Difficulty rating (1-5)

    Returns complete problem data with animation steps
    """
    try:
        simplifier = EquationSimplifier()
        steps = simplifier.simplify_with_steps(
            equation_str=request.equation,
            strategy=request.strategy.value
        )

        # Generate problem ID
        problem_id = str(uuid.uuid4())

        # Convert steps to response format
        step_responses = [
            EquationStepResponse(
                id=step.id,
                equation=step.equation,
                description=step.description,
                rule=step.rule,
                delay=step.delay,
                changedElements=step.changed_elements,
                highlightColor=step.highlight_color
            )
            for step in steps
        ]

        # Create response
        return EquationProblemResponse(
            id=problem_id,
            original=steps[0].equation if steps else request.equation,
            simplified=steps[-1].equation if steps else request.equation,
            steps=step_responses,
            difficulty=request.difficulty,
            topic=request.topic,
            gradeLevel=request.grade_level,
            moduleId=request.module_id
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid equation: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Simplification failed: {str(e)}"
        )


@router.post(
    "/solve",
    response_model=EquationProblemResponse,
    status_code=status.HTTP_200_OK,
    summary="Solve an equation",
    description="Solve a mathematical equation and return step-by-step solution"
)
async def solve_equation(request: EquationSolveRequest) -> EquationProblemResponse:
    """
    Solve an equation with step-by-step explanation

    - **equation**: Mathematical equation with = sign (e.g., "2*x + 5 = 13")
    - **variable**: Variable to solve for (default: 'x')
    - **topic**: Mathematical topic for categorization
    - **grade_level**: Target grade level
    - **difficulty**: Difficulty rating (1-5)

    Returns complete problem data with solution steps
    """
    try:
        simplifier = EquationSimplifier()
        steps = simplifier.solve_linear_equation(
            equation_str=request.equation,
            variable=request.variable
        )

        # Generate problem ID
        problem_id = str(uuid.uuid4())

        # Convert steps to response format
        step_responses = [
            EquationStepResponse(
                id=step.id,
                equation=step.equation,
                description=step.description,
                rule=step.rule,
                delay=step.delay,
                changedElements=step.changed_elements,
                highlightColor=step.highlight_color
            )
            for step in steps
        ]

        # Create response
        return EquationProblemResponse(
            id=problem_id,
            original=steps[0].equation if steps else request.equation,
            simplified=steps[-1].equation if steps else request.equation,
            steps=step_responses,
            difficulty=request.difficulty,
            topic=request.topic,
            gradeLevel=request.grade_level,
            moduleId=request.module_id
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid equation: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Equation solving failed: {str(e)}"
        )


@router.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="Health check",
    description="Check if the equations API is operational"
)
async def health_check() -> Dict[str, str]:
    """
    Health check endpoint

    Returns service status
    """
    return {
        "status": "healthy",
        "service": "equations-api",
        "version": "1.0.0"
    }
