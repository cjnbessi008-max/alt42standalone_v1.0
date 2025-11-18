"""
API endpoints for concept summary generation
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from uuid import UUID

from ..models.concepts import (
    ConceptSummaryRequest,
    ConceptSummaryResponse,
    ConceptCreate,
    Concept,
    ConceptUpdate,
    ConceptWithSummaries
)
from ..services.concept_summary_service import ConceptSummaryService
from ..llm.claude_client import ClaudeClient

router = APIRouter(prefix="/api/concepts", tags=["concepts"])


def get_concept_service() -> ConceptSummaryService:
    """Dependency to get concept summary service"""
    return ConceptSummaryService(ClaudeClient())


@router.post("/generate-summary", response_model=ConceptSummaryResponse)
async def generate_concept_summary(
    request: ConceptSummaryRequest,
    service: ConceptSummaryService = Depends(get_concept_service)
) -> ConceptSummaryResponse:
    """
    Generate a one-line summary for a concept using AI

    Args:
        request: Concept details including name, grade level, and context

    Returns:
        Generated summary with alternatives and confidence score
    """
    try:
        summary = await service.generate_summary(request)
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")


@router.post("/generate-batch", response_model=dict)
async def generate_batch_summaries(
    concepts: List[str],
    grade_level: int,
    module_context: Optional[str] = None,
    service: ConceptSummaryService = Depends(get_concept_service)
) -> dict:
    """
    Generate summaries for multiple concepts at once

    Args:
        concepts: List of concept names
        grade_level: Target grade level
        module_context: Optional context about the module

    Returns:
        Dictionary mapping concept names to their summaries
    """
    try:
        summaries = await service.generate_summaries_for_concepts(
            concepts=concepts,
            grade_level=grade_level,
            module_context=module_context
        )
        return summaries
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating batch summaries: {str(e)}")


@router.post("/validate-summary")
async def validate_concept_summary(
    concept_name: str,
    summary: str,
    grade_level: int,
    service: ConceptSummaryService = Depends(get_concept_service)
):
    """
    Validate a concept summary for quality and appropriateness

    Args:
        concept_name: Name of the concept
        summary: The summary to validate
        grade_level: Target grade level

    Returns:
        Validation results with scores and feedback
    """
    try:
        validation = await service.validate_summary(
            concept_name=concept_name,
            summary=summary,
            grade_level=grade_level
        )
        return validation
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error validating summary: {str(e)}")


@router.post("/regenerate-summary", response_model=ConceptSummaryResponse)
async def regenerate_concept_summary(
    concept_name: str,
    grade_level: int,
    feedback: Optional[str] = None,
    previous_summary: Optional[str] = None,
    service: ConceptSummaryService = Depends(get_concept_service)
) -> ConceptSummaryResponse:
    """
    Regenerate a concept summary with teacher feedback

    Args:
        concept_name: Name of the concept
        grade_level: Target grade level
        feedback: Teacher feedback on previous summary
        previous_summary: Previous summary to improve upon

    Returns:
        New generated summary
    """
    try:
        summary = await service.regenerate_summary(
            concept_name=concept_name,
            grade_level=grade_level,
            feedback=feedback,
            previous_summary=previous_summary
        )
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error regenerating summary: {str(e)}")


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "concept-summary-service"}
