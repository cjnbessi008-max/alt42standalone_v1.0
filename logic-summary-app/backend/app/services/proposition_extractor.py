import os
import json
from typing import List, Dict, Any
from anthropic import Anthropic

class PropositionExtractor:
    """Service for extracting logical propositions from problems using Claude API"""

    def __init__(self):
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is required")
        self.client = Anthropic(api_key=api_key)

    async def extract_propositions(
        self,
        problem_content: str,
        problem_title: str = "",
        grade_level: str = None
    ) -> Dict[str, Any]:
        """
        Extract logical propositions from a problem using Claude AI.

        Args:
            problem_content: The text content of the problem
            problem_title: Optional title of the problem
            grade_level: Optional grade level for context

        Returns:
            Dictionary containing:
                - propositions: List of extracted propositions
                - logic_summary: Human-readable summary
                - visualization_data: Optional graph/tree structure
        """

        # Construct the prompt
        prompt = self._build_extraction_prompt(problem_content, problem_title, grade_level)

        # Call Claude API
        message = self.client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=2000,
            temperature=0.3,  # Lower temperature for more consistent analysis
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        # Parse the response
        response_text = message.content[0].text

        # Extract JSON from response (Claude returns it in markdown code blocks)
        result = self._parse_claude_response(response_text)

        return result

    def _build_extraction_prompt(
        self,
        problem_content: str,
        problem_title: str,
        grade_level: str
    ) -> str:
        """Build the prompt for Claude to extract propositions"""

        context = f"Grade Level: {grade_level}" if grade_level else "General education context"

        prompt = f"""You are an expert in logical reasoning and educational content analysis.

Analyze the following problem and extract all logical propositions, premises, assumptions, and conclusions.

**Problem Title:** {problem_title if problem_title else "Untitled"}

**Problem Content:**
{problem_content}

**Context:** {context}

Please provide a detailed analysis in the following JSON format:

{{
  "propositions": [
    {{
      "id": "P1",
      "text": "Clear statement of the proposition",
      "type": "premise|assumption|conclusion|constraint|operation",
      "confidence": 0.95
    }}
  ],
  "logic_summary": "A clear, human-readable summary of the logical structure of the problem. Explain how the propositions relate to each other and what the problem is asking.",
  "visualization_data": {{
    "nodes": [
      {{"id": "P1", "label": "Proposition text", "type": "premise"}}
    ],
    "edges": [
      {{"from": "P1", "to": "P2", "relationship": "implies|supports|contradicts"}}
    ]
  }}
}}

**Guidelines:**
1. Extract ALL explicit and implicit propositions
2. Identify premises (given facts), assumptions (unstated but necessary), and conclusions (what needs to be proven/found)
3. For math problems, identify constraints, operations, and relationships
4. Assign confidence scores (0.0-1.0) based on how clearly stated each proposition is
5. Create visualization data showing how propositions connect (cause-effect, implies, etc.)
6. Write the logic_summary in a way that a student at the specified grade level could understand

Return ONLY the JSON, no additional text.
"""

        return prompt

    def _parse_claude_response(self, response_text: str) -> Dict[str, Any]:
        """Parse Claude's response and extract the JSON structure"""

        # Remove markdown code blocks if present
        cleaned = response_text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]

        cleaned = cleaned.strip()

        try:
            result = json.loads(cleaned)
            return result
        except json.JSONDecodeError as e:
            # Fallback: return a basic structure
            return {
                "propositions": [
                    {
                        "id": "P1",
                        "text": "Unable to parse propositions automatically",
                        "type": "error",
                        "confidence": 0.0
                    }
                ],
                "logic_summary": f"Error parsing AI response: {str(e)}. Raw response: {response_text[:200]}",
                "visualization_data": None
            }
