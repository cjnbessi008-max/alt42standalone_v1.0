"""
World Model Reconstruction Engine
Processes teacher natural language requests using Claude API
"""

import os
from typing import Dict, Any
from anthropic import Anthropic
from pydantic import UUID4
import json

from utils.logger import setup_logger

logger = setup_logger("WorldModelEngine")

class WorldModelEngine:
    """
    Reconstructs educational world model from teacher requests
    Uses Claude to understand domain, concepts, relationships, and events
    """

    def __init__(self):
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable not set")

        self.client = Anthropic(api_key=api_key)
        self.model = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-5-20250929")

    async def process(self, teacher_request: str, module_id: UUID4) -> Dict[str, Any]:
        """
        Process teacher request and generate world model

        Args:
            teacher_request: Natural language description from teacher
            module_id: UUID of the module being generated

        Returns:
            Dict containing world model with:
            - domain_model: Core concepts and entities
            - concept_graph: Relationships between concepts
            - event_flows: Sequential events and processes
            - constraints: Rules and limitations
        """
        logger.info(f"Generating world model for module {module_id}")

        prompt = self._build_world_model_prompt(teacher_request)

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )

            # Extract text content
            content = response.content[0].text if response.content else ""

            # Parse JSON response
            world_model = json.loads(content)

            logger.info(f"World model generated successfully for module {module_id}")

            return world_model

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Claude response as JSON: {str(e)}")
            raise

        except Exception as e:
            logger.error(f"World model generation failed: {str(e)}")
            raise

    def _build_world_model_prompt(self, teacher_request: str) -> str:
        """Build structured prompt for Claude"""

        return f"""You are an educational system designer. Analyze the following teacher request and generate a comprehensive world model for an educational module.

Teacher Request:
{teacher_request}

Generate a JSON response with the following structure:

{{
  "domain_model": {{
    "subject": "mathematics|science|language|etc",
    "topic": "specific topic (e.g., fractions, photosynthesis)",
    "grade_level": 1-12,
    "learning_objectives": ["objective 1", "objective 2", ...],
    "key_concepts": [
      {{
        "name": "concept name",
        "definition": "clear definition",
        "importance": "why this matters",
        "prerequisites": ["prerequisite concepts"]
      }}
    ]
  }},
  "concept_graph": {{
    "nodes": [
      {{
        "id": "concept_id",
        "name": "concept name",
        "type": "fundamental|derived|application"
      }}
    ],
    "edges": [
      {{
        "from": "concept_id",
        "to": "concept_id",
        "relationship": "requires|leads_to|related_to"
      }}
    ]
  }},
  "event_flows": [
    {{
      "name": "learning sequence name",
      "steps": [
        {{
          "order": 1,
          "action": "what student does",
          "system_response": "how system responds",
          "success_criteria": "how to measure success"
        }}
      ]
    }}
  ],
  "data_requirements": {{
    "entities": [
      {{
        "name": "entity name (e.g., Problem, StudentAnswer)",
        "attributes": [
          {{
            "name": "attribute name",
            "type": "string|number|boolean|date",
            "required": true|false,
            "description": "what this represents"
          }}
        ]
      }}
    ],
    "relationships": [
      {{
        "from": "entity name",
        "to": "entity name",
        "type": "one-to-one|one-to-many|many-to-many"
      }}
    ]
  }},
  "interaction_patterns": [
    {{
      "pattern_type": "input|feedback|visualization|assessment",
      "description": "what this interaction accomplishes",
      "ui_components": ["component types needed"]
    }}
  ],
  "constraints": {{
    "pedagogical": ["constraint 1", "constraint 2"],
    "technical": ["constraint 1", "constraint 2"],
    "accessibility": ["requirement 1", "requirement 2"]
  }}
}}

Ensure the response is valid JSON only, without any markdown formatting or explanations."""

if __name__ == "__main__":
    # Test
    import asyncio

    async def test():
        engine = WorldModelEngine()
        result = await engine.process(
            "Create a fractions learning module for 4th graders where students practice adding fractions with visual pie chart representations",
            "test-module-id"
        )
        print(json.dumps(result, indent=2))

    asyncio.run(test())
