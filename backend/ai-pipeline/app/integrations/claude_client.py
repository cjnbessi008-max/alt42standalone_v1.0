"""
Claude API Client for AI Education Pipeline
Handles all interactions with Anthropic's Claude API
"""

import os
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime

import anthropic
from anthropic import Anthropic, HUMAN_PROMPT, AI_PROMPT

logger = logging.getLogger(__name__)


class ClaudeClient:
    """
    Client for interacting with Claude API
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Claude client

        Args:
            api_key: Anthropic API key (defaults to env var)
        """
        self.api_key = api_key or os.getenv("CLAUDE_API_KEY")
        if not self.api_key:
            raise ValueError("CLAUDE_API_KEY not found in environment")

        self.client = Anthropic(api_key=self.api_key)
        self.model = os.getenv("CLAUDE_MODEL", "claude-3-sonnet-20240229")
        self.max_tokens = int(os.getenv("CLAUDE_MAX_TOKENS", "4000"))

    async def generate_world_model(self, teacher_request: str) -> Dict[str, Any]:
        """
        Generate world model from teacher's natural language request

        Args:
            teacher_request: Teacher's description of the module

        Returns:
            Dict containing concepts, relationships, and operations
        """
        prompt = self._build_world_model_prompt(teacher_request)

        try:
            response = await self._call_claude(prompt, temperature=0.3)
            world_model = self._parse_json_response(response)

            logger.info(
                "World model generated",
                extra={
                    "concepts_count": len(world_model.get("concepts", [])),
                    "operations_count": len(world_model.get("operations", [])),
                },
            )

            return world_model

        except Exception as e:
            logger.error(f"Failed to generate world model: {e}")
            raise

    async def generate_rules(self, world_model: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate business rules from world model

        Args:
            world_model: Generated world model

        Returns:
            Dict containing validation, calculation, and progression rules
        """
        prompt = self._build_rules_prompt(world_model)

        try:
            response = await self._call_claude(prompt, temperature=0.2)
            rules = self._parse_json_response(response)

            logger.info(
                "Rules generated",
                extra={
                    "validation_rules": len(rules.get("validation_rules", [])),
                    "calculation_rules": len(rules.get("calculation_rules", [])),
                },
            )

            return rules

        except Exception as e:
            logger.error(f"Failed to generate rules: {e}")
            raise

    async def generate_database_schema(
        self, world_model: Dict[str, Any], rules: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate database schema from world model and rules

        Args:
            world_model: Generated world model
            rules: Generated rules

        Returns:
            Dict containing table definitions and SQL scripts
        """
        prompt = self._build_schema_prompt(world_model, rules)

        try:
            response = await self._call_claude(prompt, temperature=0.1)
            schema = self._parse_json_response(response)

            logger.info(
                "Database schema generated",
                extra={"tables_count": len(schema.get("tables", []))},
            )

            return schema

        except Exception as e:
            logger.error(f"Failed to generate schema: {e}")
            raise

    async def generate_input_strategy(
        self, world_model: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate input strategy for data collection

        Args:
            world_model: Generated world model

        Returns:
            Dict containing input methods and validation strategies
        """
        prompt = self._build_input_strategy_prompt(world_model)

        try:
            response = await self._call_claude(prompt, temperature=0.3)
            strategy = self._parse_json_response(response)

            logger.info(
                "Input strategy generated",
                extra={"input_methods": len(strategy.get("input_methods", []))},
            )

            return strategy

        except Exception as e:
            logger.error(f"Failed to generate input strategy: {e}")
            raise

    async def generate_ui_components(
        self, world_model: Dict[str, Any], input_strategy: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate React UI components

        Args:
            world_model: Generated world model
            input_strategy: Generated input strategy

        Returns:
            Dict containing React component code
        """
        prompt = self._build_ui_prompt(world_model, input_strategy)

        try:
            response = await self._call_claude(prompt, temperature=0.4)
            ui_components = self._parse_json_response(response)

            logger.info(
                "UI components generated",
                extra={"components_count": len(ui_components.get("components", []))},
            )

            return ui_components

        except Exception as e:
            logger.error(f"Failed to generate UI components: {e}")
            raise

    async def _call_claude(
        self, prompt: str, temperature: float = 0.5, max_retries: int = 3
    ) -> str:
        """
        Make API call to Claude with retry logic

        Args:
            prompt: The prompt to send
            temperature: Sampling temperature (0-1)
            max_retries: Number of retry attempts

        Returns:
            Claude's response text
        """
        for attempt in range(max_retries):
            try:
                start_time = datetime.now()

                message = self.client.messages.create(
                    model=self.model,
                    max_tokens=self.max_tokens,
                    temperature=temperature,
                    messages=[{"role": "user", "content": prompt}],
                )

                latency = (datetime.now() - start_time).total_seconds() * 1000

                # Extract text from response
                response_text = message.content[0].text

                logger.debug(
                    "Claude API call successful",
                    extra={
                        "model": self.model,
                        "tokens": message.usage.input_tokens
                        + message.usage.output_tokens,
                        "latency_ms": latency,
                    },
                )

                return response_text

            except anthropic.APIError as e:
                logger.warning(
                    f"Claude API error (attempt {attempt + 1}/{max_retries}): {e}"
                )
                if attempt == max_retries - 1:
                    raise
                # Exponential backoff
                await asyncio.sleep(2**attempt)

            except Exception as e:
                logger.error(f"Unexpected error calling Claude: {e}")
                raise

    def _parse_json_response(self, response: str) -> Dict[str, Any]:
        """
        Parse JSON from Claude's response

        Args:
            response: Raw response text

        Returns:
            Parsed JSON dict
        """
        try:
            # Try to extract JSON from code blocks
            if "```json" in response:
                json_start = response.find("```json") + 7
                json_end = response.find("```", json_start)
                json_str = response[json_start:json_end].strip()
            elif "```" in response:
                json_start = response.find("```") + 3
                json_end = response.find("```", json_start)
                json_str = response[json_start:json_end].strip()
            else:
                json_str = response.strip()

            return json.loads(json_str)

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON: {e}\nResponse: {response}")
            raise ValueError(f"Invalid JSON in Claude response: {e}")

    def _build_world_model_prompt(self, teacher_request: str) -> str:
        """Build prompt for world model generation"""
        return f"""You are an expert educational system architect specializing in mathematics education.

A teacher has requested the following module:
{teacher_request}

Your task is to construct a complete semantic world model that represents this educational domain.

Output a JSON object with the following structure:

{{
  "concepts": [
    {{
      "name": "ConceptName",
      "attributes": ["attribute1", "attribute2"],
      "description": "Brief description"
    }}
  ],
  "relationships": [
    {{
      "from": "ConceptA",
      "to": "ConceptB",
      "type": "has-a|is-a|uses|requires",
      "description": "Relationship description"
    }}
  ],
  "operations": [
    {{
      "name": "operation_name",
      "inputs": ["InputConcept1", "InputConcept2"],
      "output": "OutputConcept",
      "description": "What this operation does"
    }}
  ],
  "learning_objectives": [
    "Objective 1",
    "Objective 2"
  ],
  "domain_constraints": [
    "Constraint 1",
    "Constraint 2"
  ]
}}

Focus on:
1. Core mathematical concepts
2. Visual representations (for elementary students)
3. Interactive operations students will perform
4. Natural progression from understanding to practice

Output ONLY valid JSON, no additional text.
"""

    def _build_rules_prompt(self, world_model: Dict[str, Any]) -> str:
        """Build prompt for rules generation"""
        return f"""You are an expert in converting educational requirements into executable rules.

Given this world model:
{json.dumps(world_model, indent=2)}

Generate comprehensive business rules for this educational module.

Output a JSON object with the following structure:

{{
  "validation_rules": [
    {{
      "name": "rule_name",
      "field": "field_to_validate",
      "condition": "validation condition",
      "error_message": "User-friendly error message in Korean"
    }}
  ],
  "calculation_rules": [
    {{
      "name": "rule_name",
      "description": "What this calculates",
      "complexity": "simple|medium|complex",
      "pseudocode": "Step-by-step logic"
    }}
  ],
  "progression_rules": [
    {{
      "name": "rule_name",
      "condition": "when to trigger",
      "action": "what happens",
      "description": "Educational rationale"
    }}
  ],
  "feedback_rules": [
    {{
      "trigger": "when to show feedback",
      "message_template": "Feedback message with placeholders",
      "type": "success|error|hint|encouragement"
    }}
  ]
}}

Guidelines:
1. Validation rules must prevent invalid inputs
2. Calculation rules should be pedagogically sound
3. Progression rules should support mastery-based learning
4. Feedback should be encouraging and instructive

Output ONLY valid JSON, no additional text.
"""

    def _build_schema_prompt(
        self, world_model: Dict[str, Any], rules: Dict[str, Any]
    ) -> str:
        """Build prompt for database schema generation"""
        return f"""You are a database architect specializing in PostgreSQL.

World Model:
{json.dumps(world_model, indent=2)}

Rules:
{json.dumps(rules, indent=2)}

Generate a PostgreSQL database schema to support this educational module.

Output a JSON object:

{{
  "tables": [
    {{
      "name": "table_name",
      "description": "Purpose of this table",
      "columns": [
        {{
          "name": "column_name",
          "type": "PostgreSQL type",
          "constraints": ["NOT NULL", "UNIQUE", etc],
          "description": "What this stores"
        }}
      ],
      "indexes": ["index1", "index2"],
      "foreign_keys": [
        {{
          "column": "column_name",
          "references": "other_table(column)"
        }}
      ]
    }}
  ],
  "sql_script": "Complete CREATE TABLE statements"
}}

Requirements:
1. Use UUID for primary keys
2. Include created_at, updated_at timestamps
3. Use JSONB for flexible data
4. Follow normalization (3NF)
5. Prefix all tables with "mod_" to avoid conflicts

Output ONLY valid JSON, no additional text.
"""

    def _build_input_strategy_prompt(self, world_model: Dict[str, Any]) -> str:
        """Build prompt for input strategy generation"""
        return f"""You are a UX designer specializing in educational interfaces.

World Model:
{json.dumps(world_model, indent=2)}

Design an input strategy for collecting student data and interactions.

Output a JSON object:

{{
  "input_methods": [
    {{
      "data_field": "field_name",
      "method": "manual_input|behavior_tracking|interactive_prompt",
      "ui_type": "text|number|select|fraction_input|drag_drop|drawing",
      "label": "Korean label",
      "placeholder": "Hint text",
      "validation": {{
        "required": true,
        "min": 0,
        "max": 100,
        "pattern": "regex if needed"
      }},
      "help_text": "Explanation for students"
    }}
  ],
  "interaction_flows": [
    {{
      "step": 1,
      "action": "What student does",
      "data_captured": ["field1", "field2"],
      "feedback_trigger": "When to show feedback"
    }}
  ]
}}

Focus on:
1. Age-appropriate UI (elementary students)
2. Minimize typing, maximize interaction
3. Visual feedback
4. Accessibility

Output ONLY valid JSON, no additional text.
"""

    def _build_ui_prompt(
        self, world_model: Dict[str, Any], input_strategy: Dict[str, Any]
    ) -> str:
        """Build prompt for UI component generation"""
        return f"""You are an expert React developer specializing in educational applications.

World Model:
{json.dumps(world_model, indent=2)}

Input Strategy:
{json.dumps(input_strategy, indent=2)}

Generate React + TypeScript components for this module.

Output a JSON object:

{{
  "components": [
    {{
      "name": "ComponentName",
      "description": "What this component does",
      "props": {{
        "propName": "propType"
      }},
      "code": "Complete React component code with TypeScript",
      "styling": "Tailwind CSS classes",
      "accessibility": ["ARIA labels", "keyboard navigation"]
    }}
  ],
  "pages": [
    {{
      "name": "PageName",
      "route": "/route",
      "components_used": ["Component1", "Component2"],
      "layout": "description of layout"
    }}
  ]
}}

Requirements:
1. Use React 18+ with TypeScript
2. Use Tailwind CSS for styling
3. Include ARIA labels
4. Mobile-responsive
5. Korean language UI
6. Follow React best practices (hooks, composition)

Output ONLY valid JSON, no additional text.
"""


# Singleton instance
_claude_client: Optional[ClaudeClient] = None


def get_claude_client() -> ClaudeClient:
    """Get or create Claude client singleton"""
    global _claude_client
    if _claude_client is None:
        _claude_client = ClaudeClient()
    return _claude_client


# For async usage
import asyncio
