"""AI-powered alternative solution generator using Claude API."""
import json
import logging
from typing import Any, Optional

from anthropic import Anthropic, APIError

from app.core.config import settings

logger = logging.getLogger(__name__)


class SolutionGeneratorError(Exception):
    """Solution generator error."""

    pass


class AISolutionGenerator:
    """Generate alternative problem-solving strategies using Claude AI."""

    def __init__(self, api_key: Optional[str] = None):
        """Initialize AI solution generator.

        Args:
            api_key: Anthropic API key (uses settings if not provided)
        """
        self.api_key = api_key or settings.ANTHROPIC_API_KEY
        if not self.api_key:
            raise ValueError("Anthropic API key is required")

        self.client = Anthropic(api_key=self.api_key)
        self.model = settings.CLAUDE_MODEL
        self.max_tokens = settings.CLAUDE_MAX_TOKENS
        self.temperature = settings.CLAUDE_TEMPERATURE

    def _build_system_prompt(self) -> str:
        """Build system prompt for Claude."""
        return """You are an expert math educator who specializes in teaching multiple problem-solving strategies. Your goal is to help students develop flexible thinking by showing them various approaches to solving problems.

For each problem, you generate alternative solving strategies that:
1. Use different mathematical or logical approaches
2. Help students understand the underlying concepts
3. Build problem-solving flexibility
4. Are appropriate for the student's level

Each strategy should include:
- A clear, descriptive name
- When and why to use this approach
- Step-by-step solution with explanations
- Advantages of this method
- Prerequisites and difficulty level

Return your response as valid JSON with this structure:
{
  "strategies": [
    {
      "strategy_type": "algebraic|graphical|numerical|visual|logical|reverse|decomposition",
      "strategy_name": "Short descriptive name",
      "description": "When to use this approach and why it's valuable",
      "difficulty_modifier": -2 to +2 (relative to original problem),
      "prerequisites": ["list", "of", "required", "knowledge"],
      "solution_steps": [
        {
          "step_number": 1,
          "instruction": "What to do in this step",
          "work": "Mathematical work or calculation",
          "explanation": "Why we do this step"
        }
      ],
      "final_answer": "The solution",
      "verification": "How to check the answer",
      "advantages": "Why this method is useful"
    }
  ]
}"""

    def _build_user_prompt(
        self,
        problem_text: str,
        problem_type: str,
        original_solution: Optional[str] = None,
        difficulty_level: int = 3,
        student_mastery: str = "intermediate",
        weak_strategies: Optional[list[str]] = None,
        num_strategies: int = 5,
    ) -> str:
        """Build user prompt for Claude.

        Args:
            problem_text: The problem statement
            problem_type: Type of problem (math, coding, logic, etc.)
            original_solution: Original solution if available
            difficulty_level: Problem difficulty (1-5)
            student_mastery: Student's mastery level
            weak_strategies: Strategies student needs to practice
            num_strategies: Number of strategies to generate

        Returns:
            Formatted prompt string
        """
        prompt = f"""Problem Type: {problem_type}
Difficulty Level: {difficulty_level}/5
Student Level: {student_mastery}

Problem:
{problem_text}
"""

        if original_solution:
            prompt += f"\nOriginal Solution:\n{original_solution}\n"

        if weak_strategies:
            prompt += f"\nStudent's Weak Areas: {', '.join(weak_strategies)}\n"
            prompt += "Please prioritize strategies that address these weak areas.\n"

        prompt += f"""
Generate {num_strategies} alternative solving strategies for this problem.
Focus on diverse approaches that help the student develop well-rounded problem-solving skills.

IMPORTANT: Return ONLY valid JSON in the exact format specified in the system prompt. Do not include any text before or after the JSON."""

        return prompt

    async def generate_strategies(
        self,
        problem_text: str,
        problem_type: str,
        original_solution: Optional[str] = None,
        difficulty_level: int = 3,
        student_mastery: str = "intermediate",
        weak_strategies: Optional[list[str]] = None,
        num_strategies: int = 5,
    ) -> list[dict[str, Any]]:
        """Generate alternative solving strategies for a problem.

        Args:
            problem_text: The problem statement
            problem_type: Type of problem (math, coding, logic, etc.)
            original_solution: Original solution if available
            difficulty_level: Problem difficulty (1-5)
            student_mastery: Student's mastery level (novice|developing|proficient|expert)
            weak_strategies: List of strategy types student needs to practice
            num_strategies: Number of strategies to generate (default: 5)

        Returns:
            List of strategy dictionaries

        Raises:
            SolutionGeneratorError: If generation fails
        """
        try:
            system_prompt = self._build_system_prompt()
            user_prompt = self._build_user_prompt(
                problem_text=problem_text,
                problem_type=problem_type,
                original_solution=original_solution,
                difficulty_level=difficulty_level,
                student_mastery=student_mastery,
                weak_strategies=weak_strategies,
                num_strategies=num_strategies,
            )

            logger.info(f"Generating {num_strategies} strategies for {problem_type} problem")

            response = self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                system=system_prompt,
                messages=[
                    {
                        "role": "user",
                        "content": user_prompt,
                    }
                ],
            )

            # Extract text from response
            response_text = ""
            for block in response.content:
                if hasattr(block, "text"):
                    response_text += block.text

            # Parse JSON response
            try:
                result = json.loads(response_text)
                strategies = result.get("strategies", [])

                if not strategies:
                    raise SolutionGeneratorError("No strategies generated")

                logger.info(f"Successfully generated {len(strategies)} strategies")
                return strategies

            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON response: {e}")
                logger.debug(f"Response text: {response_text}")
                raise SolutionGeneratorError(f"Invalid JSON response: {str(e)}")

        except APIError as e:
            logger.error(f"Claude API error: {e}")
            raise SolutionGeneratorError(f"AI API error: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error generating strategies: {e}")
            raise SolutionGeneratorError(f"Unexpected error: {str(e)}")

    async def generate_similar_problem(
        self,
        original_problem: str,
        problem_type: str,
        difficulty_level: int = 3,
        variation_type: str = "analogous",
    ) -> dict[str, Any]:
        """Generate a similar problem based on the original.

        Args:
            original_problem: Original problem text
            problem_type: Type of problem
            difficulty_level: Difficulty level (1-5)
            variation_type: Type of variation (analogous|harder|easier|reverse)

        Returns:
            Dictionary with new problem and solution

        Raises:
            SolutionGeneratorError: If generation fails
        """
        system_prompt = """You are an expert educator who creates practice problems.
Generate a new problem based on the given example.

Return valid JSON:
{
  "problem_text": "The new problem statement",
  "solution": "Step-by-step solution",
  "difficulty_level": 1-5,
  "learning_objectives": ["objective1", "objective2"]
}"""

        user_prompt = f"""Original Problem:
{original_problem}

Problem Type: {problem_type}
Target Difficulty: {difficulty_level}/5
Variation Type: {variation_type}

Generate a {variation_type} variation of this problem.
- If "analogous": Similar structure, different context
- If "harder": Increase complexity or add constraints
- If "easier": Simplify or remove steps
- If "reverse": Given answer, find the question

Return ONLY valid JSON."""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}],
            )

            response_text = ""
            for block in response.content:
                if hasattr(block, "text"):
                    response_text += block.text

            result = json.loads(response_text)
            logger.info(f"Generated {variation_type} problem variation")
            return result

        except (APIError, json.JSONDecodeError) as e:
            logger.error(f"Error generating similar problem: {e}")
            raise SolutionGeneratorError(f"Failed to generate problem: {str(e)}")

    async def analyze_student_solution(
        self,
        problem_text: str,
        correct_solution: str,
        student_solution: str,
    ) -> dict[str, Any]:
        """Analyze a student's solution and provide feedback.

        Args:
            problem_text: The problem statement
            correct_solution: Correct solution
            student_solution: Student's attempted solution

        Returns:
            Dictionary with analysis and feedback

        Raises:
            SolutionGeneratorError: If analysis fails
        """
        system_prompt = """You are a supportive math tutor analyzing student solutions.
Provide constructive feedback that helps students learn.

Return valid JSON:
{
  "is_correct": true/false,
  "correctness_percentage": 0-100,
  "strengths": ["what they did well"],
  "errors": [{"type": "error type", "description": "what went wrong", "location": "where"}],
  "suggestions": ["how to improve"],
  "alternative_approaches": ["other methods they could try"],
  "encouraging_message": "positive, encouraging feedback"
}"""

        user_prompt = f"""Problem:
{problem_text}

Correct Solution:
{correct_solution}

Student's Solution:
{student_solution}

Analyze the student's work and provide constructive feedback.
Return ONLY valid JSON."""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                temperature=0.3,  # Lower temperature for more consistent analysis
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}],
            )

            response_text = ""
            for block in response.content:
                if hasattr(block, "text"):
                    response_text += block.text

            result = json.loads(response_text)
            logger.info("Analyzed student solution")
            return result

        except (APIError, json.JSONDecodeError) as e:
            logger.error(f"Error analyzing solution: {e}")
            raise SolutionGeneratorError(f"Failed to analyze solution: {str(e)}")
