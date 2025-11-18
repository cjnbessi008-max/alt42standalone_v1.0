import anthropic
import json
import logging
from typing import Dict, List, Any
from ..config.settings import settings

logger = logging.getLogger(__name__)


class ReasoningAnalyzer:
    """AI-powered reasoning and fallacy detection service using Claude API"""

    def __init__(self):
        self.client = anthropic.Anthropic(api_key=settings.claude_api_key)
        self.model = settings.claude_model

    def analyze_argument(self, content: str) -> Dict[str, Any]:
        """
        Analyze an argument for logical fallacies and reasoning errors.

        Args:
            content: The argument text to analyze

        Returns:
            Dictionary containing analysis results
        """
        try:
            logger.info(f"Starting analysis for argument (length: {len(content)})")

            # Create the analysis prompt
            system_prompt = self._build_system_prompt()
            user_prompt = self._build_user_prompt(content)

            # Call Claude API
            message = self.client.messages.create(
                model=self.model,
                max_tokens=settings.claude_max_tokens,
                temperature=settings.claude_temperature,
                system=system_prompt,
                messages=[
                    {
                        "role": "user",
                        "content": user_prompt
                    }
                ]
            )

            # Parse the response
            response_text = message.content[0].text
            analysis_result = self._parse_response(response_text)

            logger.info(f"Analysis completed. Fallacies detected: {len(analysis_result.get('fallacies', []))}")

            return analysis_result

        except Exception as e:
            logger.error(f"Error during argument analysis: {e}")
            raise

    def _build_system_prompt(self) -> str:
        """Build the system prompt for Claude"""
        return """You are an expert in logic, critical thinking, and argumentation analysis. Your role is to analyze arguments for logical fallacies, reasoning errors, and structural weaknesses.

When analyzing an argument, you should:

1. **Identify the logical structure**: Break down the argument into premises and conclusions
2. **Detect fallacies**: Identify any logical fallacies present (ad hominem, straw man, false dichotomy, hasty generalization, etc.)
3. **Analyze premises**: Evaluate whether the premises are sound and well-supported
4. **Evaluate conclusion**: Determine if the conclusion logically follows from the premises
5. **Provide refutation**: Explain what's wrong with the reasoning and how to improve it
6. **Guide learning**: Ask questions that help the student think more critically

Be constructive, educational, and precise in your analysis. Your goal is to help students improve their reasoning skills."""

    def _build_user_prompt(self, content: str) -> str:
        """Build the user prompt with the argument to analyze"""
        return f"""Please analyze the following argument for logical fallacies and reasoning errors:

<argument>
{content}
</argument>

Provide your analysis in the following JSON format:

{{
  "logical_structure": {{
    "premises": ["premise 1", "premise 2", ...],
    "conclusion": "the main conclusion",
    "argument_type": "deductive/inductive/abductive"
  }},
  "premise_analysis": {{
    "sound_premises": ["list of sound premises"],
    "questionable_premises": [
      {{"premise": "...", "issue": "..."}}
    ]
  }},
  "conclusion_analysis": {{
    "is_valid": true/false,
    "explanation": "explanation of whether conclusion follows from premises"
  }},
  "fallacies": [
    {{
      "name": "fallacy name",
      "category": "formal/informal/statistical/causal",
      "excerpt": "the specific part of the argument",
      "explanation": "why this is a fallacy",
      "severity": "low/medium/high/critical",
      "position_start": 0,
      "position_end": 50
    }}
  ],
  "analysis_summary": "brief summary of the overall argument quality",
  "refutation_text": "detailed explanation of the logical errors and how they undermine the argument",
  "correct_reasoning": "how the argument could be improved or what correct reasoning would look like",
  "guided_questions": [
    "question 1 to help the student think deeper",
    "question 2 to challenge assumptions",
    "question 3 to explore alternative explanations"
  ],
  "confidence_score": 0.85
}}

Ensure the JSON is valid and complete. The confidence_score should be between 0 and 1, representing how confident you are in your analysis."""

    def _parse_response(self, response_text: str) -> Dict[str, Any]:
        """Parse Claude's response into structured data"""
        try:
            # Try to find JSON in the response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1

            if start_idx == -1 or end_idx == 0:
                # No JSON found, create a basic structure
                logger.warning("No JSON found in response, creating basic structure")
                return {
                    "analysis_summary": response_text,
                    "refutation_text": response_text,
                    "fallacies": [],
                    "confidence_score": 0.5
                }

            json_str = response_text[start_idx:end_idx]
            result = json.loads(json_str)

            # Validate and set defaults
            if "confidence_score" not in result:
                result["confidence_score"] = 0.75

            if "fallacies" not in result:
                result["fallacies"] = []

            if "analysis_summary" not in result:
                result["analysis_summary"] = "Analysis completed"

            if "refutation_text" not in result:
                result["refutation_text"] = "Please review the identified issues"

            return result

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            # Return a basic structure if parsing fails
            return {
                "analysis_summary": "Analysis completed but response format was unexpected",
                "refutation_text": response_text,
                "fallacies": [],
                "confidence_score": 0.5,
                "raw_response": response_text
            }

    def get_fallacy_suggestions(self, fallacy_name: str) -> Dict[str, Any]:
        """Get detailed information and suggestions for a specific fallacy"""
        try:
            prompt = f"""Provide detailed educational content about the "{fallacy_name}" logical fallacy.

Include:
1. A clear definition
2. Why it's a problem in reasoning
3. Common examples
4. How to avoid it
5. How to recognize it in arguments

Format the response as JSON with keys: definition, why_problematic, examples (array), how_to_avoid, how_to_recognize"""

            message = self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}]
            )

            response_text = message.content[0].text
            return self._parse_response(response_text)

        except Exception as e:
            logger.error(f"Error getting fallacy suggestions: {e}")
            return {
                "definition": f"Information about {fallacy_name}",
                "error": str(e)
            }


# Global analyzer instance
analyzer = ReasoningAnalyzer()
