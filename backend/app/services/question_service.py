"""Business logic for question suggestion generation."""
from typing import List, Dict, Any, Optional
from uuid import UUID
import asyncpg
from datetime import datetime, timedelta

from app.services.claude_service import claude_service


class QuestionService:
    """Service for managing question suggestions."""

    async def generate_suggestions(
        self,
        conn: asyncpg.Connection,
        student_id: UUID,
        problem_id: UUID,
        current_attempt_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate personalized question suggestions for a student.

        Args:
            conn: Database connection
            student_id: Student UUID
            problem_id: Problem UUID
            current_attempt_data: Current attempt information

        Returns:
            Dictionary with suggestion_id and suggested questions
        """
        # 1. Fetch problem context
        problem_context = await self._get_problem_context(conn, problem_id)

        # 2. Fetch student context (concept mastery, learning profile)
        student_context = await self._get_student_context(conn, student_id, problem_id)

        # 3. Fetch attempt history
        attempt_history = await self._get_attempt_history(conn, student_id, problem_id)

        # 4. Generate questions using Claude
        suggestions = await claude_service.generate_question_suggestions(
            problem_context=problem_context,
            student_context=student_context,
            attempt_history=attempt_history
        )

        # 5. Store suggestions in database
        suggestion_id = await self._store_suggestions(
            conn=conn,
            student_id=student_id,
            problem_id=problem_id,
            suggestions=suggestions,
            context={
                "problem": problem_context,
                "student": student_context,
                "attempts_count": len(attempt_history)
            }
        )

        return {
            "suggestion_id": suggestion_id,
            "student_id": student_id,
            "problem_id": problem_id,
            "suggestions": suggestions,
            "context_used": {
                "total_attempts": len(attempt_history),
                "struggling_concepts": student_context.get("struggling_concepts", [])
            }
        }

    async def record_feedback(
        self,
        conn: asyncpg.Connection,
        suggestion_id: UUID,
        student_id: UUID,
        accepted_suggestion: Optional[int],
        helpfulness_rating: int,
        comment: Optional[str] = None
    ) -> bool:
        """
        Record student feedback on suggestions.

        Args:
            conn: Database connection
            suggestion_id: Suggestion UUID
            student_id: Student UUID
            accepted_suggestion: Which suggestion was selected (1-3)
            helpfulness_rating: Rating 1-5
            comment: Optional feedback comment

        Returns:
            True if successful
        """
        # Update suggestion record
        await conn.execute(
            """
            UPDATE question_suggestions
            SET accepted_suggestion = $1,
                feedback = $2
            WHERE id = $3 AND student_id = $4
            """,
            accepted_suggestion,
            comment,
            suggestion_id,
            student_id
        )

        # Insert feedback record
        await conn.execute(
            """
            INSERT INTO suggestion_feedback
            (suggestion_id, student_id, helpfulness_rating, comment)
            VALUES ($1, $2, $3, $4)
            """,
            suggestion_id,
            student_id,
            helpfulness_rating,
            comment
        )

        return True

    async def _get_problem_context(
        self,
        conn: asyncpg.Connection,
        problem_id: UUID
    ) -> Dict[str, Any]:
        """Fetch problem information."""
        row = await conn.fetchrow(
            """
            SELECT id, title, description, problem_type, difficulty_level, content
            FROM problems
            WHERE id = $1
            """,
            problem_id
        )

        if not row:
            raise ValueError(f"Problem {problem_id} not found")

        return {
            "problem_id": str(row["id"]),
            "title": row["title"],
            "description": row["description"],
            "problem_type": row["problem_type"],
            "difficulty_level": row["difficulty_level"],
            "content": row["content"]
        }

    async def _get_student_context(
        self,
        conn: asyncpg.Connection,
        student_id: UUID,
        problem_id: UUID
    ) -> Dict[str, Any]:
        """Fetch student learning context."""
        # Get module_id from problem
        module_row = await conn.fetchrow(
            "SELECT module_id FROM problems WHERE id = $1",
            problem_id
        )

        if not module_row:
            return {"struggling_concepts": [], "recent_errors": []}

        module_id = module_row["module_id"]

        # Get concept mastery
        concept_rows = await conn.fetch(
            """
            SELECT concept_name, mastery_level, attempts_count
            FROM student_concepts
            WHERE student_id = $1 AND module_id = $2
            ORDER BY mastery_level ASC
            LIMIT 5
            """,
            student_id,
            module_id
        )

        struggling_concepts = [
            row["concept_name"]
            for row in concept_rows
            if row["mastery_level"] < 0.5
        ]

        # Get recent errors (from attempts in the last 24 hours)
        recent_errors = await conn.fetch(
            """
            SELECT interaction_data
            FROM student_attempts
            WHERE student_id = $1
              AND is_correct = false
              AND attempted_at > NOW() - INTERVAL '24 hours'
            ORDER BY attempted_at DESC
            LIMIT 5
            """,
            student_id
        )

        error_patterns = []
        for row in recent_errors:
            if row["interaction_data"] and isinstance(row["interaction_data"], dict):
                error_type = row["interaction_data"].get("error_type", "Unknown")
                if error_type not in error_patterns:
                    error_patterns.append(error_type)

        return {
            "struggling_concepts": struggling_concepts,
            "recent_errors": error_patterns,
            "concept_mastery": [
                {
                    "concept": row["concept_name"],
                    "mastery": float(row["mastery_level"]),
                    "attempts": row["attempts_count"]
                }
                for row in concept_rows
            ]
        }

    async def _get_attempt_history(
        self,
        conn: asyncpg.Connection,
        student_id: UUID,
        problem_id: UUID
    ) -> List[Dict[str, Any]]:
        """Fetch student's attempt history for this problem."""
        rows = await conn.fetch(
            """
            SELECT id, answer, is_correct, time_spent_seconds,
                   interaction_data, attempted_at
            FROM student_attempts
            WHERE student_id = $1 AND problem_id = $2
            ORDER BY attempted_at DESC
            LIMIT 10
            """,
            student_id,
            problem_id
        )

        return [
            {
                "attempt_id": str(row["id"]),
                "answer": row["answer"],
                "is_correct": row["is_correct"],
                "time_spent_seconds": row["time_spent_seconds"],
                "interaction_data": row["interaction_data"],
                "attempted_at": row["attempted_at"].isoformat() if row["attempted_at"] else None
            }
            for row in rows
        ]

    async def _store_suggestions(
        self,
        conn: asyncpg.Connection,
        student_id: UUID,
        problem_id: UUID,
        suggestions: List[Dict[str, str]],
        context: Dict[str, Any]
    ) -> UUID:
        """Store generated suggestions in the database."""
        row = await conn.fetchrow(
            """
            INSERT INTO question_suggestions
            (student_id, problem_id, suggestions, context)
            VALUES ($1, $2, $3, $4)
            RETURNING id
            """,
            student_id,
            problem_id,
            suggestions,  # JSONB array
            context  # JSONB context
        )

        return row["id"]


# Singleton instance
question_service = QuestionService()
