"""
Rule Generation Engine
Generates business rules and validations from world model
"""

import os
from typing import Dict, Any, List
from anthropic import Anthropic
from pydantic import UUID4
import json

from utils.logger import setup_logger

logger = setup_logger("RuleGeneratorEngine")

class RuleGeneratorEngine:
    """
    Generates business rules, validations, and logic from world model
    """

    def __init__(self):
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable not set")

        self.client = Anthropic(api_key=api_key)
        self.model = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-5-20250929")

    async def process(self, world_model: Dict[str, Any], module_id: UUID4) -> Dict[str, Any]:
        """
        Generate rules from world model

        Args:
            world_model: World model from previous stage
            module_id: Module UUID

        Returns:
            Dict containing generated rules
        """
        logger.info(f"Generating rules for module {module_id}")

        prompt = self._build_rule_prompt(world_model)

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

            content = response.content[0].text if response.content else ""
            rules = json.loads(content)

            logger.info(f"Rules generated successfully for module {module_id}")

            return rules

        except Exception as e:
            logger.error(f"Rule generation failed: {str(e)}")
            raise

    def _build_rule_prompt(self, world_model: Dict[str, Any]) -> str:
        """Build prompt for rule generation"""

        return f"""Based on the following world model, generate comprehensive business rules and validations for the educational module.

World Model:
{json.dumps(world_model, indent=2)}

Generate a JSON response with the following structure:

{{
  "validation_rules": [
    {{
      "name": "rule name",
      "type": "input_validation|state_validation|progress_validation",
      "condition": "when this rule applies",
      "rule_logic": "plain English description of the rule",
      "error_message": "user-friendly error message",
      "severity": "error|warning|info",
      "complexity_score": 0-100
    }}
  ],
  "calculation_rules": [
    {{
      "name": "rule name",
      "description": "what this calculates",
      "inputs": ["input1", "input2"],
      "formula": "mathematical or logical formula",
      "output": "what is produced",
      "complexity_score": 0-100
    }}
  ],
  "progression_rules": [
    {{
      "name": "rule name",
      "from_state": "current state",
      "to_state": "next state",
      "conditions": ["condition 1", "condition 2"],
      "actions": ["action 1", "action 2"],
      "complexity_score": 0-100
    }}
  ],
  "feedback_rules": [
    {{
      "name": "rule name",
      "trigger": "what triggers this feedback",
      "feedback_type": "positive|corrective|hint|encouragement",
      "message_template": "feedback message with {{variables}}",
      "complexity_score": 0-100
    }}
  ],
  "complex_rules_for_ontology": [
    {{
      "name": "rule name",
      "description": "complex rule requiring ontology",
      "why_complex": "explanation of complexity",
      "recommended_approach": "how to implement",
      "complexity_score": 80-100
    }}
  ]
}}

Ensure complexity_score is calculated as:
- 0-30: Simple rules (basic comparisons, arithmetic)
- 31-60: Moderate rules (multiple conditions, basic logic)
- 61-80: Complex rules (nested logic, multiple calculations)
- 81-100: Very complex (requires ontology, advanced reasoning)

Response must be valid JSON only."""
