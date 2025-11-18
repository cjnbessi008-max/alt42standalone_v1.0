"""
Error Analysis Service

Analyzes student errors, identifies patterns, and calculates recurrence rates
for automatic highlighting in the UI.
"""

from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import statistics
from dataclasses import dataclass

from ..models.error_tracking import (
    StudentError,
    ErrorPattern,
    RecurringErrorPoint,
    ErrorCategory,
    ErrorSeverity
)


@dataclass
class ErrorAnalysisConfig:
    """Configuration for error analysis thresholds"""
    min_occurrences: int = 3  # Minimum occurrences to consider a pattern
    min_students: int = 2  # Minimum students affected for pattern
    recurrence_threshold: float = 30.0  # Percentage threshold for highlighting
    severity_weight: Dict[ErrorSeverity, float] = None
    time_window_days: int = 30  # Analysis time window

    def __post_init__(self):
        if self.severity_weight is None:
            self.severity_weight = {
                ErrorSeverity.LOW: 1.0,
                ErrorSeverity.MEDIUM: 2.0,
                ErrorSeverity.HIGH: 3.0,
                ErrorSeverity.CRITICAL: 4.0
            }


class ErrorAnalyzer:
    """
    Analyzes student errors to identify recurring patterns
    and calculate metrics for highlighting problematic areas
    """

    def __init__(self, config: Optional[ErrorAnalysisConfig] = None):
        self.config = config or ErrorAnalysisConfig()

    def analyze_module_errors(
        self,
        errors: List[StudentError],
        module_id: str
    ) -> Tuple[List[ErrorPattern], List[RecurringErrorPoint]]:
        """
        Analyze all errors for a module and identify patterns

        Args:
            errors: List of student errors
            module_id: Module identifier

        Returns:
            Tuple of (error_patterns, recurring_error_points)
        """
        # Group errors by similar characteristics
        error_groups = self._group_similar_errors(errors)

        # Analyze each group to create patterns
        patterns = []
        recurring_points = []

        for group_key, group_errors in error_groups.items():
            if len(group_errors) < self.config.min_occurrences:
                continue

            pattern = self._create_error_pattern(group_errors, module_id)
            patterns.append(pattern)

            # Check if this pattern qualifies as a recurring error point
            if pattern.recurrence_rate >= self.config.recurrence_threshold:
                recurring_point = self._create_recurring_point(pattern, group_errors)
                recurring_points.append(recurring_point)

        # Rank recurring points by priority
        self._rank_recurring_points(recurring_points)

        return patterns, recurring_points

    def _group_similar_errors(
        self,
        errors: List[StudentError]
    ) -> Dict[str, List[StudentError]]:
        """
        Group similar errors together based on multiple criteria

        Groups errors by:
        - Error type and concept
        - Similar incorrect answers
        - Same problem context
        """
        groups = defaultdict(list)

        for error in errors:
            # Create a grouping key based on error characteristics
            group_key = self._generate_group_key(error)
            groups[group_key].append(error)

        return groups

    def _generate_group_key(self, error: StudentError) -> str:
        """Generate a unique key for grouping similar errors"""
        # Combine error type, concept, and problem type
        key_parts = [
            error.error_type.value if error.error_type else "unknown",
            error.concept_id or "no_concept",
            error.problem_id or "general"
        ]
        return "|".join(key_parts)

    def _create_error_pattern(
        self,
        errors: List[StudentError],
        module_id: str
    ) -> ErrorPattern:
        """
        Create an error pattern from a group of similar errors

        Calculates statistics and creates a pattern object
        """
        # Calculate pattern statistics
        unique_students = len(set(e.student_id for e in errors))
        occurrence_count = len(errors)

        # Calculate recurrence rate
        # Formula: (total occurrences / unique students) normalized to percentage
        recurrence_rate = min((occurrence_count / unique_students) * 10, 100.0)

        # Calculate average severity
        severity_values = [
            self.config.severity_weight.get(e.severity, 2.0)
            for e in errors
        ]
        avg_severity = statistics.mean(severity_values) if severity_values else 2.0

        # Extract common characteristics
        error_types = [e.error_type for e in errors if e.error_type]
        most_common_type = Counter(error_types).most_common(1)[0][0] if error_types else ErrorCategory.LOGICAL

        concept_ids = list(set(e.concept_id for e in errors if e.concept_id))

        # Generate pattern name and description
        pattern_name = self._generate_pattern_name(errors)
        pattern_description = self._generate_pattern_description(errors)

        return ErrorPattern(
            pattern_name=pattern_name,
            pattern_description=pattern_description,
            error_category=most_common_type,
            concept_ids=concept_ids,
            module_id=module_id,
            occurrence_count=occurrence_count,
            affected_student_count=unique_students,
            recurrence_rate=recurrence_rate,
            average_severity=avg_severity,
            first_detected=min(e.occurred_at for e in errors),
            last_detected=max(e.occurred_at for e in errors),
            is_active=True
        )

    def _generate_pattern_name(self, errors: List[StudentError]) -> str:
        """Generate a human-readable name for the error pattern"""
        if not errors:
            return "Unknown Error Pattern"

        first_error = errors[0]
        error_type = first_error.error_type.value if first_error.error_type else "general"
        concept = first_error.concept_id or "concept"

        return f"{error_type.title()} Error in {concept}"

    def _generate_pattern_description(self, errors: List[StudentError]) -> str:
        """Generate a description of the error pattern"""
        if not errors:
            return "No description available"

        # Get most common incorrect answers
        incorrect_answers = [e.incorrect_answer for e in errors if e.incorrect_answer]
        common_answers = Counter(incorrect_answers).most_common(3)

        unique_students = len(set(e.student_id for e in errors))

        description = f"This error occurred {len(errors)} times across {unique_students} students. "

        if common_answers:
            common_answer_text = ", ".join([f"'{ans}' ({count}x)" for ans, count in common_answers])
            description += f"Common incorrect answers: {common_answer_text}."

        return description

    def _create_recurring_point(
        self,
        pattern: ErrorPattern,
        errors: List[StudentError]
    ) -> RecurringErrorPoint:
        """
        Create a recurring error point from a high-recurrence pattern

        These are the error points that will be highlighted in the UI
        """
        # Calculate severity score (0-100)
        severity_score = self._calculate_severity_score(pattern, errors)

        # Generate recommended action
        recommended_action = self._generate_recommendation(pattern, errors)

        # Create visualization data
        visualization_data = self._create_visualization_data(errors)

        # Use first concept ID or "general"
        concept_id = pattern.concept_ids[0] if pattern.concept_ids else "general"

        return RecurringErrorPoint(
            pattern_id=pattern.id,
            module_id=pattern.module_id,
            concept_id=concept_id,
            error_title=pattern.pattern_name,
            error_summary=pattern.pattern_description,
            recurrence_rate=pattern.recurrence_rate,
            total_occurrences=pattern.occurrence_count,
            unique_students=pattern.affected_student_count,
            severity_score=severity_score,
            recommended_action=recommended_action,
            visualization_data=visualization_data,
            is_highlighted=True
        )

    def _calculate_severity_score(
        self,
        pattern: ErrorPattern,
        errors: List[StudentError]
    ) -> float:
        """
        Calculate a severity score (0-100) based on multiple factors

        Factors:
        - Recurrence rate (40%)
        - Average severity (30%)
        - Number of students affected (20%)
        - Frequency (10%)
        """
        # Normalize recurrence rate to 0-40 range
        recurrence_component = (pattern.recurrence_rate / 100) * 40

        # Normalize average severity to 0-30 range
        severity_component = (pattern.average_severity / 4.0) * 30

        # Normalize student count to 0-20 range (cap at 20 students)
        student_component = min(pattern.affected_student_count / 20.0, 1.0) * 20

        # Normalize frequency to 0-10 range (cap at 50 occurrences)
        frequency_component = min(pattern.occurrence_count / 50.0, 1.0) * 10

        total_score = (
            recurrence_component +
            severity_component +
            student_component +
            frequency_component
        )

        return round(total_score, 2)

    def _generate_recommendation(
        self,
        pattern: ErrorPattern,
        errors: List[StudentError]
    ) -> str:
        """Generate actionable recommendations for teachers"""
        if pattern.error_category == ErrorCategory.CONCEPTUAL:
            return "Review foundational concepts with affected students. Consider using visual aids or alternative explanations."
        elif pattern.error_category == ErrorCategory.PROCEDURAL:
            return "Demonstrate the correct procedure step-by-step. Provide guided practice problems."
        elif pattern.error_category == ErrorCategory.CALCULATION:
            return "Review calculation techniques. Consider providing reference materials or calculators."
        elif pattern.error_category == ErrorCategory.INPUT:
            return "Clarify input format expectations. Add examples or hints in the problem description."
        else:
            return "Investigate the root cause with affected students. Consider one-on-one tutoring sessions."

    def _create_visualization_data(self, errors: List[StudentError]) -> Dict:
        """
        Create data for visualizing the error pattern

        Returns data suitable for charting libraries
        """
        # Timeline data
        timeline = defaultdict(int)
        for error in errors:
            date_key = error.occurred_at.strftime("%Y-%m-%d")
            timeline[date_key] += 1

        # Student distribution
        student_errors = Counter(e.student_id for e in errors)

        # Severity distribution
        severity_dist = Counter(e.severity.value for e in errors)

        return {
            "timeline": dict(timeline),
            "student_distribution": {
                "labels": ["students"],
                "values": [len(student_errors)]
            },
            "severity_distribution": dict(severity_dist),
            "total_errors": len(errors),
            "date_range": {
                "start": min(e.occurred_at for e in errors).isoformat(),
                "end": max(e.occurred_at for e in errors).isoformat()
            }
        }

    def _rank_recurring_points(self, points: List[RecurringErrorPoint]) -> None:
        """
        Rank recurring error points by priority

        Updates priority_rank field in place
        """
        # Sort by severity score (descending) then by recurrence rate
        sorted_points = sorted(
            points,
            key=lambda p: (p.severity_score, p.recurrence_rate),
            reverse=True
        )

        # Assign priority ranks
        for rank, point in enumerate(sorted_points, start=1):
            point.priority_rank = rank

    def calculate_student_recurrence_rate(
        self,
        student_id: str,
        errors: List[StudentError],
        time_window_days: Optional[int] = None
    ) -> float:
        """
        Calculate error recurrence rate for a specific student

        Args:
            student_id: Student identifier
            errors: List of student errors
            time_window_days: Optional time window for analysis

        Returns:
            Recurrence rate as a percentage
        """
        time_window = time_window_days or self.config.time_window_days
        cutoff_date = datetime.now() - timedelta(days=time_window)

        # Filter errors for this student within time window
        student_errors = [
            e for e in errors
            if e.student_id == student_id and e.occurred_at >= cutoff_date
        ]

        if not student_errors:
            return 0.0

        # Group by error type/concept
        error_groups = defaultdict(int)
        for error in student_errors:
            key = f"{error.error_type}_{error.concept_id}"
            error_groups[key] += 1

        # Calculate recurrence: average repetitions per error type
        total_repetitions = sum(count - 1 for count in error_groups.values() if count > 1)
        total_error_types = len(error_groups)

        if total_error_types == 0:
            return 0.0

        # Normalize to percentage
        recurrence_rate = (total_repetitions / total_error_types) * 100
        return min(recurrence_rate, 100.0)

    def identify_at_risk_students(
        self,
        errors: List[StudentError],
        threshold: float = 50.0
    ) -> List[Dict[str, any]]:
        """
        Identify students with high error recurrence rates

        Args:
            errors: List of all student errors
            threshold: Recurrence rate threshold for "at risk"

        Returns:
            List of student info dictionaries with recurrence rates
        """
        student_errors = defaultdict(list)
        for error in errors:
            student_errors[error.student_id].append(error)

        at_risk_students = []
        for student_id, student_error_list in student_errors.items():
            recurrence_rate = self.calculate_student_recurrence_rate(
                student_id,
                student_error_list
            )

            if recurrence_rate >= threshold:
                at_risk_students.append({
                    "student_id": student_id,
                    "recurrence_rate": recurrence_rate,
                    "total_errors": len(student_error_list),
                    "unique_error_types": len(set(e.error_type for e in student_error_list)),
                    "last_error": max(e.occurred_at for e in student_error_list)
                })

        # Sort by recurrence rate (descending)
        at_risk_students.sort(key=lambda x: x["recurrence_rate"], reverse=True)

        return at_risk_students
