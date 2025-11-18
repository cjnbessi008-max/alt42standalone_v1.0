"""
World Model Service
Handles semantic model construction from teacher requests
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime

from app.integrations.claude_client import get_claude_client

logger = logging.getLogger(__name__)


class WorldModelService:
    """
    Service for generating and managing world models
    """

    def __init__(self):
        self.claude = get_claude_client()

    async def generate(
        self, teacher_request: str, context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate world model from teacher's request

        Args:
            teacher_request: Natural language description from teacher
            context: Optional context (grade level, subject, etc.)

        Returns:
            World model dict
        """
        logger.info("Starting world model generation", extra={"context": context})

        try:
            # Enhance request with context
            enhanced_request = self._enhance_request(teacher_request, context)

            # Generate world model using Claude
            world_model = await self.claude.generate_world_model(enhanced_request)

            # Validate world model structure
            self._validate_world_model(world_model)

            # Enrich with metadata
            world_model["metadata"] = {
                "generated_at": datetime.utcnow().isoformat(),
                "original_request": teacher_request,
                "context": context or {},
            }

            logger.info(
                "World model generated successfully",
                extra={
                    "concepts": len(world_model.get("concepts", [])),
                    "operations": len(world_model.get("operations", [])),
                },
            )

            return world_model

        except Exception as e:
            logger.error(f"World model generation failed: {e}", exc_info=True)
            raise

    def _enhance_request(
        self, request: str, context: Optional[Dict[str, Any]]
    ) -> str:
        """
        Enhance teacher request with additional context

        Args:
            request: Original request
            context: Additional context

        Returns:
            Enhanced request
        """
        if not context:
            return request

        enhancements = []

        if grade_level := context.get("grade_level"):
            enhancements.append(f"대상 학년: {grade_level}")

        if subject := context.get("subject"):
            enhancements.append(f"과목: {subject}")

        if learning_style := context.get("learning_style"):
            enhancements.append(f"학습 스타일: {learning_style}")

        if enhancements:
            return f"{request}\n\n추가 정보:\n" + "\n".join(enhancements)

        return request

    def _validate_world_model(self, world_model: Dict[str, Any]) -> None:
        """
        Validate world model structure

        Args:
            world_model: Generated world model

        Raises:
            ValueError: If validation fails
        """
        required_fields = ["concepts", "relationships", "operations"]

        for field in required_fields:
            if field not in world_model:
                raise ValueError(f"Missing required field: {field}")

        # Validate concepts
        if not isinstance(world_model["concepts"], list):
            raise ValueError("concepts must be a list")

        for concept in world_model["concepts"]:
            if "name" not in concept:
                raise ValueError("Each concept must have a name")

        # Validate operations
        if not isinstance(world_model["operations"], list):
            raise ValueError("operations must be a list")

        for operation in world_model["operations"]:
            if "name" not in operation:
                raise ValueError("Each operation must have a name")

        logger.debug("World model validation passed")

    async def refine(
        self, world_model: Dict[str, Any], teacher_feedback: str
    ) -> Dict[str, Any]:
        """
        Refine world model based on teacher feedback

        Args:
            world_model: Current world model
            teacher_feedback: Teacher's feedback/corrections

        Returns:
            Refined world model
        """
        logger.info("Refining world model based on feedback")

        # Build refinement prompt
        prompt = f"""Current world model:
{world_model}

Teacher feedback:
{teacher_feedback}

Please update the world model to incorporate this feedback.
Output the complete refined world model in the same JSON format.
"""

        try:
            refined_model = await self.claude.generate_world_model(prompt)
            self._validate_world_model(refined_model)

            # Add refinement metadata
            refined_model["metadata"] = {
                **world_model.get("metadata", {}),
                "refined_at": datetime.utcnow().isoformat(),
                "refinement_feedback": teacher_feedback,
            }

            logger.info("World model refined successfully")
            return refined_model

        except Exception as e:
            logger.error(f"World model refinement failed: {e}", exc_info=True)
            raise

    def extract_key_concepts(self, world_model: Dict[str, Any]) -> list[str]:
        """
        Extract list of key concept names

        Args:
            world_model: World model

        Returns:
            List of concept names
        """
        return [concept["name"] for concept in world_model.get("concepts", [])]

    def get_concept_graph(self, world_model: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a graph representation of concepts and relationships

        Args:
            world_model: World model

        Returns:
            Graph dict suitable for visualization
        """
        nodes = [
            {
                "id": concept["name"],
                "label": concept["name"],
                "attributes": concept.get("attributes", []),
            }
            for concept in world_model.get("concepts", [])
        ]

        edges = [
            {
                "from": rel["from"],
                "to": rel["to"],
                "type": rel["type"],
                "label": rel.get("description", ""),
            }
            for rel in world_model.get("relationships", [])
        ]

        return {"nodes": nodes, "edges": edges}
