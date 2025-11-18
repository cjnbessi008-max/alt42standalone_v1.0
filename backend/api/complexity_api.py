"""
FastAPI endpoints for complexity assessment and focus card management

Provides REST API for LMS integration
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import sys
import os

# Add parent directory to path to import services
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.complexity_analyzer import (
    ComplexityAnalyzer,
    ComplexityLevel as ComplexityLevelEnum,
)
from services.moodle_client import (
    MoodleClient,
    MoodleQuestion,
    MoodleAPIError,
    get_moodle_client,
)
from services.reverse_problem_reconstructor import (
    ReverseProblemReconstructor,
    ReconstructionStrategy,
    ReconstructedProblem,
)

app = FastAPI(
    title="AI Education System - Complexity Assessment API",
    description="API for assessing problem complexity and managing focus cards",
    version="1.0.0",
)

# CORS configuration for LMS integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response Models
class ProblemComplexityRequest(BaseModel):
    """Request model for complexity assessment"""

    condition_count: int = Field(
        default=0, ge=0, description="Number of logical conditions"
    )
    nesting_depth: int = Field(default=0, ge=0, description="Depth of nested logic")
    entity_count: int = Field(
        default=0, ge=0, description="Number of entities/concepts involved"
    )
    has_cyclical_dependencies: bool = Field(
        default=False, description="Whether problem has circular dependencies"
    )
    language: str = Field(
        default="ko", regex="^(ko|en)$", description="Language for messages"
    )

    class Config:
        schema_extra = {
            "example": {
                "condition_count": 6,
                "nesting_depth": 4,
                "entity_count": 5,
                "has_cyclical_dependencies": False,
                "language": "ko",
            }
        }


class ComplexityMetricsResponse(BaseModel):
    """Response model for complexity metrics"""

    condition_count: int
    nesting_depth: int
    entity_count: int
    has_cyclical_dependencies: bool


class ComplexityAssessmentResponse(BaseModel):
    """Response model for complete complexity assessment"""

    metrics: ComplexityMetricsResponse
    level: str
    requires_focus_card: bool
    recommendations: list[str]
    focus_message: Optional[str] = None

    class Config:
        schema_extra = {
            "example": {
                "metrics": {
                    "condition_count": 6,
                    "nesting_depth": 4,
                    "entity_count": 5,
                    "has_cyclical_dependencies": False,
                },
                "level": "complex",
                "requires_focus_card": True,
                "recommendations": [
                    "Break down the conditions into smaller logical groups",
                    "Consider simplifying the nested logic or using visual aids",
                ],
                "focus_message": "🎯 잠깐! 이 문제는 복잡도가 높습니다.\n\n심호흡을 하고 차근차근 풀어봅시다.",
            }
        }


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "complexity-assessment-api"}


# Complexity assessment endpoint
@app.post(
    "/api/v1/assess-complexity",
    response_model=ComplexityAssessmentResponse,
    tags=["Complexity Assessment"],
)
async def assess_complexity(request: ProblemComplexityRequest):
    """
    Assess the complexity of a problem and determine if a focus card is needed

    Based on PRD FR-2.2 complexity thresholds:
    - Condition count > 5 = complex
    - Nesting depth > 3 = complex
    - Entity count > 4 = complex
    - Cyclical dependencies = complex

    Returns complexity assessment with recommendations and focus message
    """
    try:
        analyzer = ComplexityAnalyzer(language=request.language)

        assessment = analyzer.analyze_problem(
            condition_count=request.condition_count,
            nesting_depth=request.nesting_depth,
            entity_count=request.entity_count,
            has_cyclical_dependencies=request.has_cyclical_dependencies,
        )

        return ComplexityAssessmentResponse(**assessment.to_dict())

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Assessment failed: {str(e)}")


# Batch assessment endpoint
class BatchAssessmentRequest(BaseModel):
    """Request model for batch complexity assessment"""

    problems: list[ProblemComplexityRequest] = Field(
        ..., max_items=100, description="List of problems to assess (max 100)"
    )


class BatchAssessmentResponse(BaseModel):
    """Response model for batch assessment"""

    assessments: list[ComplexityAssessmentResponse]
    summary: dict


@app.post(
    "/api/v1/assess-complexity/batch",
    response_model=BatchAssessmentResponse,
    tags=["Complexity Assessment"],
)
async def assess_complexity_batch(request: BatchAssessmentRequest):
    """
    Assess multiple problems in a single request

    Useful for LMS integration when loading a problem set
    """
    try:
        assessments = []
        summary = {
            "total": len(request.problems),
            "requires_focus_card": 0,
            "by_level": {
                "simple": 0,
                "moderate": 0,
                "complex": 0,
                "very_complex": 0,
            },
        }

        for problem in request.problems:
            analyzer = ComplexityAnalyzer(language=problem.language)
            assessment = analyzer.analyze_problem(
                condition_count=problem.condition_count,
                nesting_depth=problem.nesting_depth,
                entity_count=problem.entity_count,
                has_cyclical_dependencies=problem.has_cyclical_dependencies,
            )

            response = ComplexityAssessmentResponse(**assessment.to_dict())
            assessments.append(response)

            if response.requires_focus_card:
                summary["requires_focus_card"] += 1

            summary["by_level"][response.level] += 1

        return BatchAssessmentResponse(assessments=assessments, summary=summary)

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Batch assessment failed: {str(e)}"
        )


# LMS integration endpoint
class LMSProblemMetadata(BaseModel):
    """Metadata from LMS about a problem"""

    problem_id: str
    problem_type: str
    difficulty_level: Optional[int] = Field(None, ge=1, le=5)
    estimated_time_minutes: Optional[int] = None
    prerequisites: list[str] = []


@app.post(
    "/api/v1/lms/problem-metadata",
    response_model=ComplexityAssessmentResponse,
    tags=["LMS Integration"],
)
async def assess_from_lms_metadata(
    metadata: LMSProblemMetadata, language: str = Query("ko", regex="^(ko|en)$")
):
    """
    Assess complexity based on LMS problem metadata

    Maps LMS difficulty levels to complexity metrics for assessment
    """
    try:
        # Map LMS difficulty to complexity metrics
        # This is a heuristic mapping that can be refined
        difficulty = metadata.difficulty_level or 1

        condition_count = min(difficulty * 2, 10)
        nesting_depth = min(difficulty - 1, 5)
        entity_count = min(difficulty + 1, 7)
        has_cyclical_dependencies = difficulty >= 5

        analyzer = ComplexityAnalyzer(language=language)
        assessment = analyzer.analyze_problem(
            condition_count=condition_count,
            nesting_depth=nesting_depth,
            entity_count=entity_count,
            has_cyclical_dependencies=has_cyclical_dependencies,
        )

        return ComplexityAssessmentResponse(**assessment.to_dict())

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"LMS metadata assessment failed: {str(e)}"
        )


# Statistics endpoint
@app.get("/api/v1/statistics", tags=["Statistics"])
async def get_statistics():
    """
    Get statistics about complexity thresholds and levels

    Useful for LMS administrators to understand the system
    """
    return {
        "thresholds": {
            "condition_count": {"complex_threshold": 5},
            "nesting_depth": {"complex_threshold": 3},
            "entity_count": {"complex_threshold": 4},
            "cyclical_dependencies": {"any_is_complex": True},
        },
        "complexity_levels": {
            "simple": "Problems with low complexity across all metrics",
            "moderate": "Problems with some complexity in one or two metrics",
            "complex": "Problems exceeding one or more complexity thresholds",
            "very_complex": "Problems with cyclical dependencies or multiple high metrics",
        },
        "focus_card_triggers": ["complex", "very_complex"],
    }


# Moodle LMS Integration Endpoints
@app.get("/api/v1/moodle/test-connection", tags=["Moodle LMS"])
async def test_moodle_connection():
    """
    Test connection to Moodle LMS

    Requires environment variables:
    - MOODLE_BASE_URL: Moodle site base URL
    - MOODLE_WS_TOKEN: Web service token
    """
    try:
        client = get_moodle_client()
        await client.test_connection()

        return {
            "status": "connected",
            "message": "Successfully connected to Moodle LMS"
        }
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Configuration error: {str(e)}"
        )
    except MoodleAPIError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Moodle connection failed: {str(e)}"
        )


class MoodleQuestionResponse(BaseModel):
    """Response model for Moodle question"""
    id: int
    name: str
    question_text: str
    question_type: str
    complexity_metrics: ComplexityMetricsResponse
    complexity_assessment: ComplexityAssessmentResponse


@app.get(
    "/api/v1/moodle/quiz/{quiz_id}/questions",
    response_model=list[MoodleQuestionResponse],
    tags=["Moodle LMS"],
)
async def get_moodle_quiz_questions(
    quiz_id: int,
    language: str = Query("ko", regex="^(ko|en)$")
):
    """
    Fetch all questions from a Moodle quiz and assess their complexity

    Args:
        quiz_id: Moodle quiz ID
        language: Language for assessment messages (ko or en)

    Returns:
        List of questions with complexity assessments
    """
    try:
        client = get_moodle_client()
        reconstructor = ReverseProblemReconstructor(language=language)

        # Fetch questions from Moodle
        questions = await client.get_quiz_questions(quiz_id)

        # Analyze each question
        response_questions = []
        for question in questions:
            metrics, assessment = reconstructor.analyze_question_complexity(question)

            response_questions.append(
                MoodleQuestionResponse(
                    id=question.id,
                    name=question.name,
                    question_text=question.question_text,
                    question_type=question.question_type.value,
                    complexity_metrics=ComplexityMetricsResponse(
                        condition_count=metrics.condition_count,
                        nesting_depth=metrics.nesting_depth,
                        entity_count=metrics.entity_count,
                        has_cyclical_dependencies=metrics.has_cyclical_dependencies,
                    ),
                    complexity_assessment=ComplexityAssessmentResponse(
                        **assessment.to_dict()
                    ),
                )
            )

        return response_questions

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Configuration error: {str(e)}"
        )
    except MoodleAPIError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch quiz questions: {str(e)}"
        )


@app.get(
    "/api/v1/moodle/question/{question_id}",
    response_model=MoodleQuestionResponse,
    tags=["Moodle LMS"],
)
async def get_moodle_question(
    question_id: int,
    language: str = Query("ko", regex="^(ko|en)$")
):
    """
    Fetch a specific question from Moodle and assess its complexity

    Args:
        question_id: Moodle question ID
        language: Language for assessment messages (ko or en)

    Returns:
        Question with complexity assessment
    """
    try:
        client = get_moodle_client()
        reconstructor = ReverseProblemReconstructor(language=language)

        # Fetch question from Moodle
        question = await client.get_question_by_id(question_id)

        # Analyze complexity
        metrics, assessment = reconstructor.analyze_question_complexity(question)

        return MoodleQuestionResponse(
            id=question.id,
            name=question.name,
            question_text=question.question_text,
            question_type=question.question_type.value,
            complexity_metrics=ComplexityMetricsResponse(
                condition_count=metrics.condition_count,
                nesting_depth=metrics.nesting_depth,
                entity_count=metrics.entity_count,
                has_cyclical_dependencies=metrics.has_cyclical_dependencies,
            ),
            complexity_assessment=ComplexityAssessmentResponse(
                **assessment.to_dict()
            ),
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Configuration error: {str(e)}"
        )
    except MoodleAPIError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch question: {str(e)}"
        )


class ReconstructProblemRequest(BaseModel):
    """Request model for reverse problem reconstruction"""
    question_id: int
    strategy: str = Field(
        default="reverse_solution",
        description="Reconstruction strategy: reverse_solution, decompose_recompose, complexity_variation, pattern_extraction"
    )
    language: str = Field(default="ko", regex="^(ko|en)$")


class ReconstructedProblemResponse(BaseModel):
    """Response model for reconstructed problem"""
    original_id: int
    original_text: str
    reconstructed_text: str
    strategy: str
    structure: dict
    complexity_metrics: ComplexityMetricsResponse
    complexity_assessment: ComplexityAssessmentResponse
    variations: list[str]


@app.post(
    "/api/v1/moodle/reconstruct",
    response_model=ReconstructedProblemResponse,
    tags=["Moodle LMS", "Reverse Problem"],
)
async def reconstruct_moodle_problem(request: ReconstructProblemRequest):
    """
    Reconstruct a Moodle problem in reverse

    This endpoint fetches a problem from Moodle and reconstructs it using
    various strategies:

    - **reverse_solution**: Create problem by working backwards from solution
    - **decompose_recompose**: Break down problem and reassemble in new form
    - **complexity_variation**: Generate easier/harder versions
    - **pattern_extraction**: Extract pattern and apply to new context

    Args:
        request: Reconstruction request with question ID and strategy

    Returns:
        Reconstructed problem with complexity analysis
    """
    try:
        # Validate strategy
        try:
            strategy = ReconstructionStrategy(request.strategy)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid strategy. Must be one of: {[s.value for s in ReconstructionStrategy]}"
            )

        client = get_moodle_client()
        reconstructor = ReverseProblemReconstructor(language=request.language)

        # Fetch question from Moodle
        question = await client.get_question_by_id(request.question_id)

        # Reconstruct in reverse
        reconstructed = reconstructor.reconstruct_reverse(question, strategy)

        return ReconstructedProblemResponse(
            original_id=reconstructed.original_id,
            original_text=reconstructed.original_text,
            reconstructed_text=reconstructed.reconstructed_text,
            strategy=reconstructed.strategy.value,
            structure={
                "topic": reconstructed.structure.topic,
                "operation": reconstructed.structure.operation,
                "entities": reconstructed.structure.entities,
                "conditions": reconstructed.structure.conditions,
                "solution_steps": reconstructed.structure.solution_steps,
                "complexity_level": reconstructed.structure.complexity_level,
            },
            complexity_metrics=ComplexityMetricsResponse(
                condition_count=reconstructed.complexity_metrics.condition_count,
                nesting_depth=reconstructed.complexity_metrics.nesting_depth,
                entity_count=reconstructed.complexity_metrics.entity_count,
                has_cyclical_dependencies=reconstructed.complexity_metrics.has_cyclical_dependencies,
            ),
            complexity_assessment=ComplexityAssessmentResponse(
                **reconstructed.complexity_assessment.to_dict()
            ),
            variations=reconstructed.variations,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Configuration error: {str(e)}"
        )
    except MoodleAPIError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to reconstruct problem: {str(e)}"
        )


class BatchReconstructRequest(BaseModel):
    """Request model for batch reconstruction"""
    quiz_id: int
    strategy: str = Field(default="reverse_solution")
    language: str = Field(default="ko", regex="^(ko|en)$")


class BatchReconstructResponse(BaseModel):
    """Response model for batch reconstruction"""
    quiz_id: int
    total_questions: int
    reconstructed_problems: list[ReconstructedProblemResponse]
    summary: dict


@app.post(
    "/api/v1/moodle/reconstruct/batch",
    response_model=BatchReconstructResponse,
    tags=["Moodle LMS", "Reverse Problem"],
)
async def batch_reconstruct_quiz(request: BatchReconstructRequest):
    """
    Reconstruct all problems in a Moodle quiz

    Fetches all questions from a quiz and reconstructs them using the
    specified strategy. Useful for processing entire problem sets.

    Args:
        request: Batch reconstruction request with quiz ID and strategy

    Returns:
        All reconstructed problems with summary statistics
    """
    try:
        # Validate strategy
        try:
            strategy = ReconstructionStrategy(request.strategy)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid strategy. Must be one of: {[s.value for s in ReconstructionStrategy]}"
            )

        client = get_moodle_client()
        reconstructor = ReverseProblemReconstructor(language=request.language)

        # Fetch all questions from quiz
        questions = await client.get_quiz_questions(request.quiz_id)

        # Reconstruct each question
        reconstructed_problems = []
        summary = {
            "by_complexity": {
                "simple": 0,
                "moderate": 0,
                "complex": 0,
                "very_complex": 0,
            },
            "by_topic": {},
            "by_operation": {},
        }

        for question in questions:
            reconstructed = reconstructor.reconstruct_reverse(question, strategy)

            reconstructed_problems.append(
                ReconstructedProblemResponse(
                    original_id=reconstructed.original_id,
                    original_text=reconstructed.original_text,
                    reconstructed_text=reconstructed.reconstructed_text,
                    strategy=reconstructed.strategy.value,
                    structure={
                        "topic": reconstructed.structure.topic,
                        "operation": reconstructed.structure.operation,
                        "entities": reconstructed.structure.entities,
                        "conditions": reconstructed.structure.conditions,
                        "solution_steps": reconstructed.structure.solution_steps,
                        "complexity_level": reconstructed.structure.complexity_level,
                    },
                    complexity_metrics=ComplexityMetricsResponse(
                        condition_count=reconstructed.complexity_metrics.condition_count,
                        nesting_depth=reconstructed.complexity_metrics.nesting_depth,
                        entity_count=reconstructed.complexity_metrics.entity_count,
                        has_cyclical_dependencies=reconstructed.complexity_metrics.has_cyclical_dependencies,
                    ),
                    complexity_assessment=ComplexityAssessmentResponse(
                        **reconstructed.complexity_assessment.to_dict()
                    ),
                    variations=reconstructed.variations,
                )
            )

            # Update summary
            complexity_level = reconstructed.structure.complexity_level
            if complexity_level in summary["by_complexity"]:
                summary["by_complexity"][complexity_level] += 1

            topic = reconstructed.structure.topic
            summary["by_topic"][topic] = summary["by_topic"].get(topic, 0) + 1

            operation = reconstructed.structure.operation
            summary["by_operation"][operation] = summary["by_operation"].get(operation, 0) + 1

        return BatchReconstructResponse(
            quiz_id=request.quiz_id,
            total_questions=len(questions),
            reconstructed_problems=reconstructed_problems,
            summary=summary,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Configuration error: {str(e)}"
        )
    except MoodleAPIError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to batch reconstruct quiz: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
