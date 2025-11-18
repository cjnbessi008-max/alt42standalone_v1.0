"""
Hint generation service using Claude API
Generates thinking direction hints without revealing answers
"""
from anthropic import Anthropic
from typing import List, Optional
import uuid
from datetime import datetime

from ..core.config import settings
from ..models import (
    HintRequest,
    HintResponse,
    HintType,
    ProblemContext
)


class HintGenerator:
    """
    Generates educational hints that guide student thinking
    without revealing the answer
    """

    def __init__(self):
        self.client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = settings.HINT_MODEL
        self.temperature = settings.HINT_TEMPERATURE
        self.max_tokens = settings.MAX_TOKENS

    def _build_system_prompt(self) -> str:
        """Build the system prompt for hint generation"""
        return """You are a Socratic educational assistant for mathematics learning.

Your role is to provide HINTS that guide student thinking, NOT to give answers.

CRITICAL RULES:
1. NEVER provide the final answer directly
2. NEVER show the complete solution steps
3. ALWAYS guide students to think through the problem themselves
4. Focus on helping students understand the PROCESS, not just the result
5. Ask guiding questions when appropriate
6. Relate to concepts they already know
7. Encourage metacognition (thinking about their thinking)

HINT LEVELS:
- Level 1 (Most Subtle): Ask questions, point to relevant concepts
- Level 2: Identify what type of problem this is
- Level 3: Suggest a general strategy or approach
- Level 4: Point to specific steps without showing how to do them
- Level 5 (Most Direct): Show a similar but different example

Always maintain an encouraging, supportive tone in Korean or English based on the request."""

    def _build_user_prompt(self, request: HintRequest, context: Optional[ProblemContext] = None) -> str:
        """Build the user prompt with problem context"""
        prompt_parts = [
            f"Subject: {request.subject}",
            f"Grade Level: {request.grade_level or 'Not specified'}",
            f"Problem: {request.problem_description}",
        ]

        if request.student_work:
            prompt_parts.append(f"\nStudent's Work So Far:\n{request.student_work}")

        if request.previous_hints:
            hints_text = "\n".join([f"- {hint}" for hint in request.previous_hints])
            prompt_parts.append(f"\nPrevious Hints Given:\n{hints_text}")

        if context:
            prompt_parts.append(f"\nConcepts Involved: {', '.join(context.concepts)}")
            if context.common_mistakes:
                prompt_parts.append(f"\nCommon Mistakes to Watch For: {', '.join(context.common_mistakes)}")

        prompt_parts.append(f"\nHint Level Requested: {request.hint_level}/5")
        prompt_parts.append(
            "\nGenerate a hint that helps the student think about the problem without giving away the answer. "
            "The hint should be appropriate for the hint level (1=most subtle, 5=most direct but still not the answer)."
        )

        return "\n".join(prompt_parts)

    async def generate_hint(
        self,
        request: HintRequest,
        context: Optional[ProblemContext] = None
    ) -> HintResponse:
        """
        Generate a thinking-direction hint for the student

        Args:
            request: The hint request with problem and student context
            context: Optional additional problem context (not shown to student)

        Returns:
            HintResponse with the generated hint
        """
        system_prompt = self._build_system_prompt()
        user_prompt = self._build_user_prompt(request, context)

        # Call Claude API
        message = self.client.messages.create(
            model=self.model,
            max_tokens=self.max_tokens,
            temperature=self.temperature,
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": user_prompt
                }
            ]
        )

        hint_text = message.content[0].text

        # Determine hint type based on content analysis
        hint_type = self._classify_hint_type(hint_text)

        # Check if more hints are available
        next_hint_available = request.hint_level < settings.MAX_HINT_STEPS

        return HintResponse(
            hint_id=str(uuid.uuid4()),
            hint_text=hint_text,
            hint_type=hint_type,
            hint_level=request.hint_level,
            next_hint_available=next_hint_available,
            created_at=datetime.utcnow()
        )

    def _classify_hint_type(self, hint_text: str) -> HintType:
        """
        Classify the type of hint based on its content

        This is a simple heuristic-based classifier.
        Could be enhanced with NLP analysis.
        """
        hint_lower = hint_text.lower()

        # Check for question marks (often conceptual)
        if "?" in hint_text and hint_text.count("?") >= 2:
            return HintType.CONCEPTUAL

        # Check for strategy keywords
        strategy_keywords = ["전략", "방법", "접근", "strategy", "approach", "method", "way to"]
        if any(keyword in hint_lower for keyword in strategy_keywords):
            return HintType.STRATEGIC

        # Check for procedural keywords
        procedural_keywords = ["단계", "먼저", "다음", "step", "first", "then", "next"]
        if any(keyword in hint_lower for keyword in procedural_keywords):
            return HintType.PROCEDURAL

        # Default to conceptual
        return HintType.CONCEPTUAL

    async def validate_hint(self, hint_text: str, problem_answer: Optional[str] = None) -> dict:
        """
        Validate that a hint doesn't reveal the answer

        Args:
            hint_text: The generated hint
            problem_answer: The correct answer (if available)

        Returns:
            dict with validation results
        """
        if not problem_answer:
            return {"valid": True, "reason": "No answer provided for validation"}

        # Simple validation: check if answer is directly in hint
        answer_revealed = problem_answer.lower() in hint_text.lower()

        if answer_revealed:
            return {
                "valid": False,
                "reason": "Hint appears to contain the answer"
            }

        return {"valid": True, "reason": "Hint does not reveal answer"}


# Singleton instance
hint_generator = HintGenerator()
