"""
AI-powered mistake pattern analysis service using Claude API
"""
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from uuid import UUID
import anthropic
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from ..models.database import StudentAttempt, MistakePattern, Problem
from ..models.schemas import MistakePatternCreate


class PatternAnalyzerService:
    """
    Analyzes student mistake patterns using AI and historical data
    """

    def __init__(self, db: Session, anthropic_api_key: str):
        self.db = db
        self.client = anthropic.Anthropic(api_key=anthropic_api_key)

    async def analyze_student_patterns(
        self,
        student_id: UUID,
        module_id: Optional[UUID] = None,
        days_back: int = 30,
        min_frequency: int = 2
    ) -> List[MistakePattern]:
        """
        Analyze mistake patterns for a student using AI

        Args:
            student_id: Student's UUID
            module_id: Optional module filter
            days_back: Number of days to look back
            min_frequency: Minimum occurrences to consider a pattern

        Returns:
            List of detected mistake patterns
        """
        # Fetch recent incorrect attempts
        cutoff_date = datetime.utcnow() - timedelta(days=days_back)

        query = self.db.query(StudentAttempt, Problem).join(
            Problem, StudentAttempt.problem_id == Problem.id
        ).filter(
            and_(
                StudentAttempt.student_id == student_id,
                StudentAttempt.is_correct == False,
                StudentAttempt.attempted_at >= cutoff_date
            )
        )

        if module_id:
            query = query.filter(StudentAttempt.module_id == module_id)

        incorrect_attempts = query.order_by(StudentAttempt.attempted_at.desc()).all()

        if len(incorrect_attempts) < min_frequency:
            return []

        # Prepare data for AI analysis
        attempts_data = []
        for attempt, problem in incorrect_attempts:
            attempts_data.append({
                "attempt_id": str(attempt.id),
                "problem_type": problem.problem_type,
                "problem_content": problem.content,
                "correct_answer": problem.correct_answer,
                "submitted_answer": attempt.submitted_answer,
                "attempted_at": attempt.attempted_at.isoformat(),
                "time_spent": attempt.time_spent_seconds
            })

        # Call Claude API for pattern analysis
        patterns = await self._analyze_with_claude(attempts_data, min_frequency)

        # Save or update patterns in database
        saved_patterns = []
        for pattern_data in patterns:
            pattern = await self._save_or_update_pattern(
                student_id=student_id,
                module_id=module_id,
                pattern_data=pattern_data
            )
            saved_patterns.append(pattern)

        return saved_patterns

    async def _analyze_with_claude(
        self,
        attempts_data: List[Dict],
        min_frequency: int
    ) -> List[Dict]:
        """
        Use Claude API to identify mistake patterns
        """
        prompt = f"""Analyze the following student's incorrect problem attempts and identify common mistake patterns.

Data:
{json.dumps(attempts_data, indent=2, ensure_ascii=False)}

Please identify:
1. Common mistake types (e.g., calculation errors, conceptual misunderstandings, careless mistakes)
2. Recurring error patterns across multiple problems
3. Problem types where mistakes are most frequent
4. Severity of each pattern (low, medium, high)
5. Specific feedback that could help prevent these mistakes

Only include patterns that occur at least {min_frequency} times.

Return your analysis as a JSON array with this structure:
[
  {{
    "pattern_type": "calculation_error",
    "pattern_category": "arithmetic",
    "description": "Detailed description of the pattern",
    "severity": "medium",
    "frequency": 3,
    "problem_types": ["addition", "multiplication"],
    "example_attempt_ids": ["uuid1", "uuid2"],
    "suggested_warning": "Clear warning message to show the student",
    "pattern_details": {{
      "specific_error": "Details about the specific error",
      "likely_cause": "What might be causing this mistake"
    }}
  }}
]

Respond ONLY with valid JSON, no additional text."""

        try:
            message = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=4096,
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )

            response_text = message.content[0].text
            patterns = json.loads(response_text)
            return patterns

        except Exception as e:
            print(f"Error analyzing with Claude: {e}")
            return []

    async def _save_or_update_pattern(
        self,
        student_id: UUID,
        module_id: Optional[UUID],
        pattern_data: Dict
    ) -> MistakePattern:
        """
        Save a new pattern or update existing one
        """
        # Check if pattern already exists
        existing_pattern = self.db.query(MistakePattern).filter(
            and_(
                MistakePattern.student_id == student_id,
                MistakePattern.pattern_type == pattern_data["pattern_type"],
                MistakePattern.is_active == True
            )
        ).first()

        if existing_pattern:
            # Update existing pattern
            existing_pattern.frequency = pattern_data["frequency"]
            existing_pattern.severity = pattern_data["severity"]
            existing_pattern.last_occurrence = datetime.utcnow()
            existing_pattern.pattern_data = pattern_data.get("pattern_details", {})
            existing_pattern.description = pattern_data["description"]
            self.db.commit()
            return existing_pattern
        else:
            # Create new pattern
            new_pattern = MistakePattern(
                student_id=student_id,
                module_id=module_id,
                pattern_type=pattern_data["pattern_type"],
                pattern_category=pattern_data.get("pattern_category"),
                description=pattern_data["description"],
                frequency=pattern_data["frequency"],
                severity=pattern_data["severity"],
                problem_types=pattern_data.get("problem_types", []),
                example_attempts=[UUID(id) for id in pattern_data.get("example_attempt_ids", [])],
                pattern_data=pattern_data.get("pattern_details", {}),
                first_occurrence=datetime.utcnow(),
                last_occurrence=datetime.utcnow()
            )
            self.db.add(new_pattern)
            self.db.commit()
            self.db.refresh(new_pattern)
            return new_pattern

    async def check_for_warnings(
        self,
        student_id: UUID,
        problem_id: UUID,
        problem_content: Dict
    ) -> Tuple[List[MistakePattern], List[str]]:
        """
        Check if current problem matches any of student's mistake patterns

        Returns:
            Tuple of (matching_patterns, warning_messages)
        """
        # Get active patterns for student
        active_patterns = self.db.query(MistakePattern).filter(
            and_(
                MistakePattern.student_id == student_id,
                MistakePattern.is_active == True
            )
        ).all()

        if not active_patterns:
            return [], []

        # Get problem info
        problem = self.db.query(Problem).filter(Problem.id == problem_id).first()
        if not problem:
            return [], []

        matching_patterns = []
        warning_messages = []

        for pattern in active_patterns:
            # Check if problem type matches pattern
            if problem.problem_type in pattern.problem_types:
                matching_patterns.append(pattern)

                # Generate contextual warning using Claude
                warning = await self._generate_warning_message(
                    pattern=pattern,
                    problem_content=problem_content,
                    problem_type=problem.problem_type
                )
                warning_messages.append(warning)

        return matching_patterns, warning_messages

    async def _generate_warning_message(
        self,
        pattern: MistakePattern,
        problem_content: Dict,
        problem_type: str
    ) -> str:
        """
        Generate a contextual warning message for a specific problem
        """
        prompt = f"""Generate a helpful, encouraging warning message for a student about to solve a problem.

Pattern Information:
- Pattern Type: {pattern.pattern_type}
- Pattern Category: {pattern.pattern_category}
- Description: {pattern.description}
- Severity: {pattern.severity}
- Frequency: {pattern.frequency} times

Current Problem:
- Type: {problem_type}
- Content: {json.dumps(problem_content, ensure_ascii=False)}

Generate a SHORT (2-3 sentences), friendly warning message that:
1. Alerts the student to be careful about this specific mistake
2. Provides a quick tip to avoid the error
3. Is encouraging and not discouraging
4. Is specific to this problem type

Respond with ONLY the warning message text, nothing else."""

        try:
            message = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=256,
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )

            return message.content[0].text.strip()

        except Exception as e:
            print(f"Error generating warning: {e}")
            return f"주의: 이 유형의 문제에서 과거에 {pattern.frequency}번 실수한 적이 있습니다. {pattern.description}"

    async def get_student_mistake_summary(
        self,
        student_id: UUID,
        module_id: Optional[UUID] = None
    ) -> Dict:
        """
        Get a summary of student's mistake patterns
        """
        query = self.db.query(MistakePattern).filter(
            and_(
                MistakePattern.student_id == student_id,
                MistakePattern.is_active == True
            )
        )

        if module_id:
            query = query.filter(MistakePattern.module_id == module_id)

        patterns = query.all()

        # Calculate statistics
        total_patterns = len(patterns)
        high_severity = len([p for p in patterns if p.severity == "high"])
        medium_severity = len([p for p in patterns if p.severity == "medium"])
        low_severity = len([p for p in patterns if p.severity == "low"])

        # Group by category
        by_category = {}
        for pattern in patterns:
            category = pattern.pattern_category or "other"
            if category not in by_category:
                by_category[category] = []
            by_category[category].append(pattern)

        return {
            "total_patterns": total_patterns,
            "severity_breakdown": {
                "high": high_severity,
                "medium": medium_severity,
                "low": low_severity
            },
            "by_category": {
                category: len(patterns)
                for category, patterns in by_category.items()
            },
            "patterns": patterns
        }
