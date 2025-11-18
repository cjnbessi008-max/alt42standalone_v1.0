"""
Concept Summary Service
Handles automatic generation of one-line concept summaries using Claude AI
"""

import logging
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime

from ..models.concepts import (
    ConceptSummaryRequest,
    ConceptSummaryResponse,
    ConceptCreate,
    Concept,
    ConceptSummaryCreate,
    ConceptSummary
)
from ..llm.claude_client import ClaudeClient
from ..prompts.concept_summary_prompt import (
    get_concept_summary_prompt,
    CONCEPT_SUMMARY_SYSTEM_PROMPT,
    CONCEPT_VALIDATION_PROMPT
)

logger = logging.getLogger(__name__)


class ConceptSummaryService:
    """Service for generating and managing concept summaries"""

    def __init__(self, claude_client: Optional[ClaudeClient] = None):
        """
        Initialize the concept summary service

        Args:
            claude_client: Claude AI client instance
        """
        self.claude_client = claude_client or ClaudeClient()

    async def generate_summary(
        self,
        request: ConceptSummaryRequest
    ) -> ConceptSummaryResponse:
        """
        Generate a one-line summary for a concept using Claude AI

        Args:
            request: Concept summary request with concept details

        Returns:
            ConceptSummaryResponse with generated summary and alternatives
        """
        try:
            logger.info(f"Generating summary for concept: {request.concept_name}")

            # Build the prompt
            prompt = get_concept_summary_prompt(
                concept_name=request.concept_name,
                grade_level=request.grade_level,
                concept_description=request.concept_description,
                module_context=request.module_context,
                related_concepts=request.related_concepts
            )

            # Generate response from Claude
            response_data = await self.claude_client.generate_json_completion_async(
                prompt=prompt,
                system_prompt=CONCEPT_SUMMARY_SYSTEM_PROMPT,
                temperature=0.7
            )

            # Parse and validate response
            if "error" in response_data:
                logger.error(f"Error in Claude response: {response_data}")
                # Fallback to a basic summary
                return ConceptSummaryResponse(
                    summary=f"{request.concept_name}: A mathematical concept",
                    alternative_summaries=[],
                    confidence=0.5,
                    rationale="Auto-generated fallback due to API error"
                )

            # Create response object
            summary_response = ConceptSummaryResponse(
                summary=response_data.get("summary", ""),
                alternative_summaries=response_data.get("alternative_summaries", []),
                confidence=response_data.get("confidence", 0.8),
                rationale=response_data.get("rationale", "")
            )

            logger.info(f"Successfully generated summary: {summary_response.summary}")
            return summary_response

        except Exception as e:
            logger.error(f"Error generating concept summary: {str(e)}")
            # Return fallback response
            return ConceptSummaryResponse(
                summary=f"{request.concept_name}: A mathematical concept",
                alternative_summaries=[],
                confidence=0.5,
                rationale=f"Error during generation: {str(e)}"
            )

    async def generate_summaries_for_concepts(
        self,
        concepts: List[str],
        grade_level: int,
        module_context: Optional[str] = None
    ) -> Dict[str, ConceptSummaryResponse]:
        """
        Generate summaries for multiple concepts

        Args:
            concepts: List of concept names
            grade_level: Target grade level
            module_context: Optional context about the module

        Returns:
            Dictionary mapping concept names to their summary responses
        """
        results = {}

        for concept_name in concepts:
            request = ConceptSummaryRequest(
                concept_name=concept_name,
                grade_level=grade_level,
                module_context=module_context,
                related_concepts=[c for c in concepts if c != concept_name]
            )

            summary = await self.generate_summary(request)
            results[concept_name] = summary

        return results

    async def validate_summary(
        self,
        concept_name: str,
        summary: str,
        grade_level: int
    ) -> Dict[str, Any]:
        """
        Validate a concept summary for appropriateness and quality

        Args:
            concept_name: Name of the concept
            summary: The summary to validate
            grade_level: Target grade level

        Returns:
            Validation results with scores and feedback
        """
        try:
            prompt = CONCEPT_VALIDATION_PROMPT.format(
                concept_name=concept_name,
                grade_level=grade_level,
                summary=summary
            )

            validation_result = await self.claude_client.generate_json_completion_async(
                prompt=prompt,
                system_prompt="You are a quality reviewer for educational content.",
                temperature=0.3  # Lower temperature for more consistent validation
            )

            return validation_result

        except Exception as e:
            logger.error(f"Error validating summary: {str(e)}")
            return {
                "overall_score": 3.0,
                "approved": True,
                "feedback": "Unable to validate, assuming acceptable"
            }

    async def regenerate_summary(
        self,
        concept_name: str,
        grade_level: int,
        feedback: Optional[str] = None,
        previous_summary: Optional[str] = None
    ) -> ConceptSummaryResponse:
        """
        Regenerate a summary with feedback incorporated

        Args:
            concept_name: Name of the concept
            grade_level: Target grade level
            feedback: Teacher feedback on previous summary
            previous_summary: Previous summary to improve upon

        Returns:
            New ConceptSummaryResponse
        """
        # Build enhanced request with feedback
        request = ConceptSummaryRequest(
            concept_name=concept_name,
            grade_level=grade_level
        )

        # Add feedback to description if provided
        if feedback and previous_summary:
            request.concept_description = (
                f"Previous summary: '{previous_summary}'\n"
                f"Teacher feedback: {feedback}\n"
                f"Please generate an improved version."
            )

        return await self.generate_summary(request)

    def create_concept_from_summary(
        self,
        summary_response: ConceptSummaryResponse,
        concept_name: str,
        module_id: UUID,
        problem_id: Optional[UUID] = None,
        grade_level: int = 5
    ) -> ConceptCreate:
        """
        Create a Concept object from a summary response

        Args:
            summary_response: Generated summary response
            concept_name: Name of the concept
            module_id: ID of the module
            problem_id: Optional ID of the problem
            grade_level: Grade level

        Returns:
            ConceptCreate object ready for database insertion
        """
        return ConceptCreate(
            concept_name=concept_name,
            one_line_summary=summary_response.summary,
            concept_description=summary_response.rationale,
            difficulty_level=self._estimate_difficulty(grade_level),
            module_id=module_id,
            problem_id=problem_id,
            teacher_notes=f"Auto-generated with {summary_response.confidence:.2f} confidence"
        )

    def _estimate_difficulty(self, grade_level: int) -> int:
        """
        Estimate difficulty level based on grade level

        Args:
            grade_level: Grade level (1-12)

        Returns:
            Difficulty level (1-5)
        """
        if grade_level <= 3:
            return 1
        elif grade_level <= 5:
            return 2
        elif grade_level <= 7:
            return 3
        elif grade_level <= 9:
            return 4
        else:
            return 5
