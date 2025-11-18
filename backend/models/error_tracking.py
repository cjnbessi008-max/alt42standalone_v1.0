"""
Error Tracking Database Models

This module defines the database models for tracking student errors
and identifying recurring error patterns in the educational system.
"""

from datetime import datetime
from typing import Optional, List
from enum import Enum
from uuid import uuid4


class ErrorSeverity(str, Enum):
    """Severity levels for student errors"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ErrorCategory(str, Enum):
    """Categories of educational errors"""
    CONCEPTUAL = "conceptual"  # Misunderstanding of core concept
    PROCEDURAL = "procedural"  # Incorrect procedure/method
    CALCULATION = "calculation"  # Mathematical calculation error
    INPUT = "input"  # Input format or validation error
    LOGICAL = "logical"  # Logical reasoning error


class StudentError:
    """
    Tracks individual student errors during learning activities

    This model captures each error instance, including context,
    student information, and error details for pattern analysis.
    """

    def __init__(
        self,
        id: Optional[str] = None,
        student_id: str = None,
        module_id: str = None,
        problem_id: str = None,
        error_type: ErrorCategory = None,
        error_description: str = None,
        incorrect_answer: str = None,
        correct_answer: str = None,
        concept_id: Optional[str] = None,
        severity: ErrorSeverity = ErrorSeverity.MEDIUM,
        context: Optional[dict] = None,
        occurred_at: Optional[datetime] = None,
        session_id: Optional[str] = None,
        attempt_number: int = 1
    ):
        self.id = id or str(uuid4())
        self.student_id = student_id
        self.module_id = module_id
        self.problem_id = problem_id
        self.error_type = error_type
        self.error_description = error_description
        self.incorrect_answer = incorrect_answer
        self.correct_answer = correct_answer
        self.concept_id = concept_id
        self.severity = severity
        self.context = context or {}
        self.occurred_at = occurred_at or datetime.now()
        self.session_id = session_id
        self.attempt_number = attempt_number


class ErrorPattern:
    """
    Identified patterns in student errors across multiple occurrences

    This model aggregates similar errors to identify common
    misconceptions and recurring problem areas.
    """

    def __init__(
        self,
        id: Optional[str] = None,
        pattern_name: str = None,
        pattern_description: str = None,
        error_category: ErrorCategory = None,
        concept_ids: Optional[List[str]] = None,
        module_id: str = None,
        occurrence_count: int = 0,
        affected_student_count: int = 0,
        recurrence_rate: float = 0.0,
        average_severity: float = 0.0,
        first_detected: Optional[datetime] = None,
        last_detected: Optional[datetime] = None,
        is_active: bool = True,
        resolution_strategy: Optional[str] = None
    ):
        self.id = id or str(uuid4())
        self.pattern_name = pattern_name
        self.pattern_description = pattern_description
        self.error_category = error_category
        self.concept_ids = concept_ids or []
        self.module_id = module_id
        self.occurrence_count = occurrence_count
        self.affected_student_count = affected_student_count
        self.recurrence_rate = recurrence_rate
        self.average_severity = average_severity
        self.first_detected = first_detected or datetime.now()
        self.last_detected = last_detected or datetime.now()
        self.is_active = is_active
        self.resolution_strategy = resolution_strategy


class RecurringErrorPoint:
    """
    High-recurrence error points that need special attention

    These are the critical error patterns that occur frequently
    and should be highlighted in the UI for intervention.
    """

    def __init__(
        self,
        id: Optional[str] = None,
        pattern_id: str = None,
        module_id: str = None,
        concept_id: str = None,
        error_title: str = None,
        error_summary: str = None,
        recurrence_rate: float = 0.0,
        total_occurrences: int = 0,
        unique_students: int = 0,
        severity_score: float = 0.0,
        priority_rank: int = 0,
        recommended_action: Optional[str] = None,
        visualization_data: Optional[dict] = None,
        is_highlighted: bool = True,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None
    ):
        self.id = id or str(uuid4())
        self.pattern_id = pattern_id
        self.module_id = module_id
        self.concept_id = concept_id
        self.error_title = error_title
        self.error_summary = error_summary
        self.recurrence_rate = recurrence_rate
        self.total_occurrences = total_occurrences
        self.unique_students = unique_students
        self.severity_score = severity_score
        self.priority_rank = priority_rank
        self.recommended_action = recommended_action
        self.visualization_data = visualization_data or {}
        self.is_highlighted = is_highlighted
        self.created_at = created_at or datetime.now()
        self.updated_at = updated_at or datetime.now()


class ErrorAnalytics:
    """
    Analytics and metrics for error tracking system

    Provides aggregated insights for teachers and administrators
    about error patterns and student performance.
    """

    def __init__(
        self,
        id: Optional[str] = None,
        module_id: str = None,
        analysis_period_start: datetime = None,
        analysis_period_end: datetime = None,
        total_errors: int = 0,
        unique_error_patterns: int = 0,
        students_affected: int = 0,
        average_recurrence_rate: float = 0.0,
        top_error_categories: Optional[dict] = None,
        improvement_trends: Optional[dict] = None,
        intervention_effectiveness: Optional[dict] = None,
        created_at: Optional[datetime] = None
    ):
        self.id = id or str(uuid4())
        self.module_id = module_id
        self.analysis_period_start = analysis_period_start or datetime.now()
        self.analysis_period_end = analysis_period_end or datetime.now()
        self.total_errors = total_errors
        self.unique_error_patterns = unique_error_patterns
        self.students_affected = students_affected
        self.average_recurrence_rate = average_recurrence_rate
        self.top_error_categories = top_error_categories or {}
        self.improvement_trends = improvement_trends or {}
        self.intervention_effectiveness = intervention_effectiveness or {}
        self.created_at = created_at or datetime.now()


class LMSIntegrationLog:
    """
    Logs LMS integration activities and data synchronization

    Tracks all interactions with external LMS systems for
    audit and troubleshooting purposes.
    """

    def __init__(
        self,
        id: Optional[str] = None,
        lms_system: str = None,
        integration_type: str = None,
        sync_status: str = None,
        records_synced: int = 0,
        errors_encountered: int = 0,
        sync_started_at: Optional[datetime] = None,
        sync_completed_at: Optional[datetime] = None,
        error_details: Optional[dict] = None,
        metadata: Optional[dict] = None
    ):
        self.id = id or str(uuid4())
        self.lms_system = lms_system
        self.integration_type = integration_type
        self.sync_status = sync_status
        self.records_synced = records_synced
        self.errors_encountered = errors_encountered
        self.sync_started_at = sync_started_at or datetime.now()
        self.sync_completed_at = sync_completed_at
        self.error_details = error_details or {}
        self.metadata = metadata or {}
