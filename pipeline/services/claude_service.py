"""
Claude AI Service for educational content generation
"""

from anthropic import Anthropic, AsyncAnthropic
from typing import List, Dict, Optional
from loguru import logger
from config import settings


class ClaudeService:
    """Service for interacting with Claude AI"""

    def __init__(self):
        self.client = AsyncAnthropic(api_key=settings.claude_api_key)
        self.model = settings.claude_model
        self.max_tokens = settings.claude_max_tokens

    async def generate_completion(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> str:
        """
        Generate a completion from Claude

        Args:
            messages: List of message dictionaries with 'role' and 'content'
            system_prompt: Optional system prompt
            temperature: Sampling temperature (0-1)
            max_tokens: Maximum tokens to generate

        Returns:
            Generated text response
        """
        try:
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens or self.max_tokens,
                temperature=temperature,
                system=system_prompt if system_prompt else "",
                messages=messages
            )

            return response.content[0].text

        except Exception as e:
            logger.error(f"Claude API error: {e}")
            raise

    async def generate_inverse_function(
        self,
        original_function: str,
        function_type: str
    ) -> Dict[str, Any]:
        """
        Generate inverse function analysis using Claude

        Args:
            original_function: The original function expression
            function_type: Type of function (linear, quadratic, etc.)

        Returns:
            Dictionary with inverse function details
        """
        system_prompt = """You are a mathematical education expert specializing in inverse functions.
        Generate accurate inverse functions with pedagogical explanations suitable for students."""

        user_message = f"""
        Analyze the following function and provide its inverse:

        Original Function: f(x) = {original_function}
        Function Type: {function_type}

        Please provide:
        1. The inverse function f⁻¹(x)
        2. Domain restrictions (if any)
        3. Range restrictions (if any)
        4. Step-by-step solution for finding the inverse
        5. Key concepts students should understand

        Format your response as JSON with the following structure:
        {{
            "inverse_function": "expression",
            "domain_min": number or null,
            "domain_max": number or null,
            "range_min": number or null,
            "range_max": number or null,
            "solution_steps": ["step1", "step2", ...],
            "key_concepts": ["concept1", "concept2", ...],
            "hints": ["hint1", "hint2", ...],
            "verification": "explanation of how to verify f(f⁻¹(x)) = x"
        }}
        """

        messages = [{"role": "user", "content": user_message}]

        response_text = await self.generate_completion(
            messages=messages,
            system_prompt=system_prompt,
            temperature=0.3  # Lower temperature for mathematical accuracy
        )

        # Parse JSON response
        import json
        import re

        # Extract JSON from response (handles markdown code blocks)
        json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
        if json_match:
            json_text = json_match.group(1)
        else:
            # Try to find JSON object directly
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            json_text = json_match.group(0) if json_match else response_text

        try:
            result = json.loads(json_text)
            return result
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Claude response as JSON: {e}")
            logger.error(f"Response text: {response_text}")
            raise ValueError("Invalid JSON response from Claude")

    async def generate_problem_set(
        self,
        function_types: List[str],
        difficulty_level: str,
        count: int = 5
    ) -> List[Dict]:
        """
        Generate a set of inverse function problems

        Args:
            function_types: Types of functions to include
            difficulty_level: 'easy', 'medium', or 'hard'
            count: Number of problems to generate

        Returns:
            List of problem dictionaries
        """
        system_prompt = """You are a mathematics curriculum designer creating engaging
        inverse function problems for students."""

        user_message = f"""
        Generate {count} inverse function problems with the following criteria:

        Function Types: {', '.join(function_types)}
        Difficulty Level: {difficulty_level}

        For each problem, provide:
        - Original function expression
        - Function type
        - Appropriate domain/range
        - Educational hints
        - Tags for categorization

        Format as JSON array.
        """

        messages = [{"role": "user", "content": user_message}]

        response_text = await self.generate_completion(
            messages=messages,
            system_prompt=system_prompt,
            temperature=0.8  # Higher temperature for variety
        )

        # Parse response
        import json
        import re

        json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
        if json_match:
            json_text = json_match.group(1)
        else:
            json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
            json_text = json_match.group(0) if json_match else response_text

        try:
            problems = json.loads(json_text)
            return problems
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse problem set JSON: {e}")
            raise ValueError("Invalid JSON response from Claude")
