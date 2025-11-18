"""
World Model Service
Generates domain models from teacher requests using Claude AI
"""

import os
import json
import logging
from typing import Dict, Any
from anthropic import Anthropic

logger = logging.getLogger(__name__)


class WorldModelService:
    """Generate educational world models using Claude AI"""

    def __init__(self):
        api_key = os.getenv("CLAUDE_API_KEY")
        if not api_key:
            logger.warning("CLAUDE_API_KEY not set, using mock mode")
            self.client = None
        else:
            self.client = Anthropic(api_key=api_key)

    async def generate_world_model(
        self, description: str, grade_level: str
    ) -> Dict[str, Any]:
        """
        Generate a world model from teacher's description

        Args:
            description: Natural language description of the module
            grade_level: Target grade level

        Returns:
            World model dictionary with concepts, relationships, operations
        """

        if not self.client:
            return self._generate_mock_world_model(description, grade_level)

        try:
            prompt = self._build_world_model_prompt(description, grade_level)

            message = self.client.messages.create(
                model="claude-sonnet-4-5-20250929",
                max_tokens=3000,
                temperature=0.7,
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )

            response_text = message.content[0].text
            world_model = self._parse_world_model(response_text)

            logger.info(f"Generated world model with {len(world_model.get('concepts', []))} concepts")
            return world_model

        except Exception as e:
            logger.error(f"Error generating world model: {str(e)}")
            return self._generate_mock_world_model(description, grade_level)

    def _build_world_model_prompt(self, description: str, grade_level: str) -> str:
        """Build prompt for world model generation"""

        return f"""You are an expert educational system architect. Your task is to analyze a teacher's module request and construct a semantic world model that captures the educational domain.

## Teacher's Request

**Grade Level:** {grade_level}
**Description:** {description}

## Your Task

Create a world model that identifies:

1. **Core Concepts**: Key educational concepts that students will learn
2. **Relationships**: How concepts relate to each other
3. **Operations**: Actions students can perform (add, compare, visualize, etc.)
4. **Learning Sequence**: Suggested progression through concepts
5. **Prerequisites**: What students should know before starting

## Output Format

Return a JSON object with this structure:

```json
{{
  "concepts": [
    {{
      "name": "fraction",
      "description": "A number representing a part of a whole",
      "difficulty": "beginner",
      "visual_representation": "pie chart, pizza slices, bars",
      "real_world_examples": ["sharing pizza", "measuring ingredients"]
    }}
  ],
  "relationships": [
    {{
      "from": "fraction",
      "to": "numerator",
      "type": "has-component",
      "description": "A fraction consists of a numerator and denominator"
    }}
  ],
  "operations": [
    {{
      "name": "add_fractions",
      "description": "Combine two or more fractions",
      "complexity": "intermediate",
      "prerequisites": ["understanding_fractions", "common_denominator"]
    }}
  ],
  "learning_sequence": [
    "understand_whole_and_parts",
    "identify_numerator_denominator",
    "visualize_fractions",
    "compare_fractions",
    "add_subtract_fractions"
  ],
  "prerequisites": [
    "basic_counting",
    "number_recognition",
    "understanding_division"
  ],
  "pedagogical_approach": "visual-first, concrete-to-abstract, interactive"
}}
```

## Guidelines

- Use clear, specific concept names (lowercase_with_underscores)
- Focus on {grade_level} appropriate content
- Identify 5-10 core concepts
- Map key relationships between concepts
- Suggest logical learning progression
- Consider prerequisite knowledge

Generate the world model now:"""

    def _parse_world_model(self, response_text: str) -> Dict[str, Any]:
        """Parse Claude's response into world model"""

        try:
            # Extract JSON from response
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                json_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                json_text = response_text[json_start:json_end].strip()
            else:
                json_text = response_text.strip()

            world_model = json.loads(json_text)

            # Validate structure
            if 'concepts' not in world_model:
                world_model['concepts'] = []
            if 'relationships' not in world_model:
                world_model['relationships'] = []
            if 'operations' not in world_model:
                world_model['operations'] = []

            return world_model

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse world model JSON: {str(e)}")
            logger.debug(f"Response text: {response_text}")
            return self._generate_mock_world_model("", "")

    def _generate_mock_world_model(
        self, description: str, grade_level: str
    ) -> Dict[str, Any]:
        """Generate mock world model for development"""

        return {
            "concepts": [
                {
                    "name": "basic_concept",
                    "description": "기본 개념",
                    "difficulty": "beginner",
                    "visual_representation": "diagram",
                    "real_world_examples": ["일상 예시"]
                },
                {
                    "name": "advanced_concept",
                    "description": "심화 개념",
                    "difficulty": "intermediate",
                    "visual_representation": "interactive model",
                    "real_world_examples": ["실생활 응용"]
                }
            ],
            "relationships": [
                {
                    "from": "basic_concept",
                    "to": "advanced_concept",
                    "type": "builds-upon",
                    "description": "기본 개념을 바탕으로 심화 개념 학습"
                }
            ],
            "operations": [
                {
                    "name": "practice_basic",
                    "description": "기본 개념 연습",
                    "complexity": "simple",
                    "prerequisites": []
                },
                {
                    "name": "apply_advanced",
                    "description": "심화 개념 적용",
                    "complexity": "complex",
                    "prerequisites": ["practice_basic"]
                }
            ],
            "learning_sequence": [
                "introduce_concept",
                "visualize_concept",
                "practice_exercises",
                "apply_to_problems",
                "assess_understanding"
            ],
            "prerequisites": [
                "basic_math_skills",
                "number_recognition"
            ],
            "pedagogical_approach": "hands-on, visual, progressive"
        }
