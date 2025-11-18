from anthropic import Anthropic
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
import time
import json

from ..models.hint import Hint
from ..models.problem import Problem
from ..config import get_settings


class HintService:
    """
    Service for generating hints using Claude API
    Implements 3-level hint system:
    - Level 1: Light hint (general direction)
    - Level 2: Medium hint (specific steps)
    - Level 3: Detailed hint (near-complete explanation)
    """

    def __init__(self):
        self.settings = get_settings()
        self.client = Anthropic(api_key=self.settings.anthropic_api_key)

    async def generate_hint(
        self,
        db: AsyncSession,
        student_id: str,
        problem_id: str,
        level: int,
        context: dict = None,
    ) -> Hint:
        """
        Generate a hint for a problem at a specific level

        Args:
            db: Database session
            student_id: Student UUID
            problem_id: Problem UUID
            level: Hint level (1, 2, or 3)
            context: Optional context (current_attempt, previous_hints, time_spent)

        Returns:
            Hint object with generated content
        """
        # Validate level
        if level not in [1, 2, 3]:
            raise ValueError("Hint level must be 1, 2, or 3")

        # Get problem from database
        result = await db.execute(select(Problem).where(Problem.id == problem_id))
        problem = result.scalar_one_or_none()

        if not problem:
            raise ValueError(f"Problem {problem_id} not found")

        # Generate hint using Claude
        start_time = time.time()
        hint_content = await self._generate_hint_with_claude(problem, level, context)
        generation_time = time.time() - start_time

        # Create hint record
        hint = Hint(
            problem_id=problem_id,
            student_id=student_id,
            level=level,
            content=hint_content,
            metadata={
                "generation_time": generation_time,
                "model_used": self.settings.claude_model,
                "context_provided": context is not None,
            },
        )

        db.add(hint)
        await db.commit()
        await db.refresh(hint)

        return hint

    async def _generate_hint_with_claude(
        self, problem: Problem, level: int, context: dict = None
    ) -> str:
        """
        Internal method to generate hint content using Claude API

        Args:
            problem: Problem object
            level: Hint level (1, 2, or 3)
            context: Optional context information

        Returns:
            Generated hint content as string
        """
        # Build prompt based on hint level
        system_prompt = self._build_system_prompt(level)
        user_prompt = self._build_user_prompt(problem, level, context)

        # Call Claude API
        message = self.client.messages.create(
            model=self.settings.claude_model,
            max_tokens=self.settings.max_hint_tokens,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )

        # Extract content from response
        hint_content = message.content[0].text

        return hint_content

    def _build_system_prompt(self, level: int) -> str:
        """Build system prompt based on hint level"""
        base_prompt = """You are an expert mathematics tutor helping students learn through guided hints.
Your goal is to help students discover the solution themselves, not to give away the answer directly.
Respond in Korean, using clear and encouraging language appropriate for the student's level."""

        level_prompts = {
            1: """
Level 1 Hint (Light): Provide a gentle nudge in the right direction.
- Point to the relevant concept or method
- Ask a guiding question
- Do NOT reveal specific steps or calculations
- Keep it brief and encouraging
""",
            2: """
Level 2 Hint (Medium): Provide specific guidance on the approach.
- Outline the steps needed (without detailed calculations)
- Identify common mistakes to avoid
- Suggest what to focus on
- Still let the student do the actual work
""",
            3: """
Level 3 Hint (Detailed): Provide a near-complete explanation.
- Show the full solution process step-by-step
- Explain the reasoning behind each step
- Include example calculations
- Ensure the student understands WHY, not just HOW
- Still encourage them to complete the final answer themselves
""",
        }

        return base_prompt + level_prompts.get(level, level_prompts[1])

    def _build_user_prompt(self, problem: Problem, level: int, context: dict = None) -> str:
        """Build user prompt with problem details and context"""
        prompt = f"""Problem Type: {problem.type}
Difficulty: {problem.difficulty}/5
Question: {problem.question}

"""

        if context:
            if context.get("current_attempt"):
                prompt += f"Student's Current Attempt: {context['current_attempt']}\n\n"

            if context.get("previous_hints"):
                prompt += f"Previous Hints Given: {len(context['previous_hints'])} hints\n\n"

            if context.get("time_spent"):
                minutes = context["time_spent"] // 60
                prompt += f"Time Spent: {minutes} minutes\n\n"

        prompt += f"Please provide a Level {level} hint for this problem."

        return prompt

    async def get_hint_history(
        self, db: AsyncSession, student_id: str, problem_id: str
    ) -> list[Hint]:
        """
        Get all hints previously given to a student for a specific problem

        Args:
            db: Database session
            student_id: Student UUID
            problem_id: Problem UUID

        Returns:
            List of Hint objects ordered by creation time
        """
        result = await db.execute(
            select(Hint)
            .where(Hint.student_id == student_id, Hint.problem_id == problem_id)
            .order_by(Hint.created_at)
        )
        return result.scalars().all()
