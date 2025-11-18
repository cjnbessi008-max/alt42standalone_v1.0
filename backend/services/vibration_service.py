"""
Vibration Service for LMS Wrong Answer Alerts

This service handles:
1. Risk assessment for student answers
2. Vibration configuration management
3. Pattern selection based on context
4. Analytics and event logging
"""

from typing import Dict, List, Optional, Tuple
from uuid import UUID
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class RiskLevel(str, Enum):
    """Risk levels for wrong answer assessment"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class VibrationPattern(str, Enum):
    """Available vibration patterns"""
    SHORT_PULSE = "short_pulse"
    DOUBLE_PULSE = "double_pulse"
    WARNING_PATTERN = "warning_pattern"
    CRITICAL_ALERT = "critical_alert"
    SUCCESS_PULSE = "success_pulse"
    ENCOURAGEMENT = "encouragement"


class VibrationConfig(BaseModel):
    """Vibration configuration response model"""
    trigger: bool = Field(default=False, description="Whether to trigger vibration")
    pattern: VibrationPattern = Field(description="Pattern name")
    duration_ms: int = Field(description="Total duration in milliseconds")
    intensity: int = Field(ge=1, le=10, description="Intensity level 1-10")
    pulses: List[int] = Field(description="Array of pulse durations in ms")


class VibrationSettings(BaseModel):
    """Module vibration settings"""
    module_id: UUID
    is_enabled: bool = True
    trigger_on_wrong_answer: bool = True
    trigger_on_correct_answer: bool = False
    intensity_level: int = Field(default=5, ge=1, le=10)
    duration_ms: int = 200
    pattern: str = "short_pulse"
    risk_threshold: RiskLevel = RiskLevel.MEDIUM


class StudentAttempt(BaseModel):
    """Student attempt data"""
    student_id: UUID
    module_id: UUID
    problem_id: UUID
    answer_numerator: Optional[int] = None
    answer_denominator: Optional[int] = None
    is_correct: bool
    time_spent_seconds: Optional[int] = None
    attempt_number: int = 1


class ProblemMetadata(BaseModel):
    """Problem metadata for risk assessment"""
    problem_id: UUID
    module_id: UUID
    concept_importance: float = Field(ge=0.0, le=1.0)
    difficulty_level: str = "medium"
    prerequisite_concepts: List[str] = []
    vibration_recommended: bool = True


# Pattern definitions with pulse arrays
PATTERN_DEFINITIONS: Dict[VibrationPattern, List[int]] = {
    VibrationPattern.SHORT_PULSE: [200],
    VibrationPattern.DOUBLE_PULSE: [100, 50, 100],
    VibrationPattern.WARNING_PATTERN: [150, 75, 150, 75, 150],
    VibrationPattern.CRITICAL_ALERT: [200, 100, 200, 100, 200, 100, 200],
    VibrationPattern.SUCCESS_PULSE: [200],
    VibrationPattern.ENCOURAGEMENT: [50, 50, 50, 50, 50],
}


# Risk level to pattern mapping
RISK_PATTERN_MAP: Dict[RiskLevel, VibrationPattern] = {
    RiskLevel.LOW: VibrationPattern.SHORT_PULSE,
    RiskLevel.MEDIUM: VibrationPattern.DOUBLE_PULSE,
    RiskLevel.HIGH: VibrationPattern.WARNING_PATTERN,
}


class VibrationService:
    """Service for managing vibration alerts in LMS"""

    def __init__(self, db_connection):
        """
        Initialize vibration service

        Args:
            db_connection: Database connection or session
        """
        self.db = db_connection

    async def assess_risk_level(
        self,
        student_id: UUID,
        problem_id: UUID,
        module_id: UUID,
        is_correct: bool
    ) -> Tuple[RiskLevel, Dict]:
        """
        Assess the risk level of a wrong answer

        Args:
            student_id: Student UUID
            problem_id: Problem UUID
            module_id: Module UUID
            is_correct: Whether answer was correct

        Returns:
            Tuple of (RiskLevel, assessment_details dict)
        """
        if is_correct:
            return RiskLevel.LOW, {"reason": "correct_answer"}

        # Get attempt history
        attempt_count = await self._get_attempt_count(student_id, problem_id)

        # Get problem metadata
        problem_metadata = await self._get_problem_metadata(problem_id)

        # Get concept importance
        concept_importance = problem_metadata.get("concept_importance", 0.5)

        # Get time spent on this problem
        time_spent = await self._get_average_time_spent(student_id, module_id)

        # Calculate risk score
        risk_score = self._calculate_risk_score(
            attempt_count=attempt_count,
            concept_importance=concept_importance,
            time_spent=time_spent,
            problem_metadata=problem_metadata
        )

        # Determine risk level
        risk_level = self._risk_score_to_level(risk_score)

        assessment_details = {
            "attempt_count": attempt_count,
            "concept_importance": concept_importance,
            "time_spent_seconds": time_spent,
            "risk_score": risk_score,
            "difficulty_level": problem_metadata.get("difficulty_level", "medium")
        }

        return risk_level, assessment_details

    def _calculate_risk_score(
        self,
        attempt_count: int,
        concept_importance: float,
        time_spent: int,
        problem_metadata: Dict
    ) -> float:
        """
        Calculate numerical risk score (0.0 to 1.0)

        Higher scores indicate higher risk requiring stronger feedback
        """
        score = 0.0

        # Attempt count factor (0-0.4)
        if attempt_count == 1:
            score += 0.1
        elif attempt_count == 2:
            score += 0.2
        elif attempt_count == 3:
            score += 0.3
        elif attempt_count >= 4:
            score += 0.4

        # Concept importance factor (0-0.3)
        score += concept_importance * 0.3

        # Difficulty factor (0-0.2)
        difficulty_level = problem_metadata.get("difficulty_level", "medium")
        if difficulty_level == "hard":
            score += 0.2
        elif difficulty_level == "medium":
            score += 0.1

        # Time spent factor (0-0.1)
        # If student spent a lot of time but still got it wrong, higher risk
        if time_spent > 300:  # More than 5 minutes
            score += 0.1
        elif time_spent > 180:  # More than 3 minutes
            score += 0.05

        return min(score, 1.0)

    def _risk_score_to_level(self, risk_score: float) -> RiskLevel:
        """Convert numerical risk score to risk level"""
        if risk_score >= 0.7:
            return RiskLevel.HIGH
        elif risk_score >= 0.4:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.LOW

    async def generate_vibration_config(
        self,
        student_id: UUID,
        problem_id: UUID,
        module_id: UUID,
        is_correct: bool,
        custom_settings: Optional[VibrationSettings] = None
    ) -> Optional[VibrationConfig]:
        """
        Generate vibration configuration based on assessment

        Args:
            student_id: Student UUID
            problem_id: Problem UUID
            module_id: Module UUID
            is_correct: Whether answer was correct
            custom_settings: Optional custom vibration settings

        Returns:
            VibrationConfig if vibration should be triggered, None otherwise
        """
        # Get module settings
        settings = custom_settings or await self._get_vibration_settings(module_id)

        if not settings.is_enabled:
            return None

        # Check if we should trigger based on correctness
        if is_correct and not settings.trigger_on_correct_answer:
            return None
        if not is_correct and not settings.trigger_on_wrong_answer:
            return None

        # Assess risk level
        risk_level, assessment = await self.assess_risk_level(
            student_id, problem_id, module_id, is_correct
        )

        # Check if risk meets threshold
        if self._risk_below_threshold(risk_level, settings.risk_threshold):
            return None

        # Select appropriate pattern
        pattern = self._select_pattern(risk_level, is_correct, settings)

        # Get pulse array
        pulses = PATTERN_DEFINITIONS.get(pattern, [200])

        # Calculate intensity based on risk level
        intensity = self._calculate_intensity(risk_level, settings.intensity_level)

        # Apply intensity multiplier to pulses
        adjusted_pulses = self._apply_intensity_to_pulses(pulses, intensity)

        # Calculate total duration
        duration = sum(adjusted_pulses)

        return VibrationConfig(
            trigger=True,
            pattern=pattern,
            duration_ms=duration,
            intensity=intensity,
            pulses=adjusted_pulses
        )

    def _select_pattern(
        self,
        risk_level: RiskLevel,
        is_correct: bool,
        settings: VibrationSettings
    ) -> VibrationPattern:
        """Select appropriate vibration pattern"""
        if is_correct:
            return VibrationPattern.SUCCESS_PULSE

        # Use risk-based pattern for wrong answers
        return RISK_PATTERN_MAP.get(risk_level, VibrationPattern.DOUBLE_PULSE)

    def _calculate_intensity(self, risk_level: RiskLevel, base_intensity: int) -> int:
        """Calculate intensity based on risk level"""
        if risk_level == RiskLevel.HIGH:
            return min(base_intensity + 2, 10)
        elif risk_level == RiskLevel.MEDIUM:
            return base_intensity
        else:
            return max(base_intensity - 1, 1)

    def _apply_intensity_to_pulses(
        self,
        pulses: List[int],
        intensity: int
    ) -> List[int]:
        """Apply intensity multiplier to pulse durations"""
        intensity_multipliers = {
            1: 0.3, 2: 0.4, 3: 0.5, 4: 0.6, 5: 0.7,
            6: 0.8, 7: 0.9, 8: 1.0, 9: 1.1, 10: 1.2
        }

        multiplier = intensity_multipliers.get(intensity, 1.0)
        return [int(pulse * multiplier) for pulse in pulses]

    def _risk_below_threshold(
        self,
        risk_level: RiskLevel,
        threshold: RiskLevel
    ) -> bool:
        """Check if risk level is below threshold"""
        risk_order = {RiskLevel.LOW: 0, RiskLevel.MEDIUM: 1, RiskLevel.HIGH: 2}
        return risk_order[risk_level] < risk_order[threshold]

    async def log_vibration_event(
        self,
        student_id: UUID,
        problem_id: UUID,
        module_id: UUID,
        is_correct: bool,
        vibration_config: VibrationConfig,
        device_supported: bool,
        user_agent: str,
        risk_level: RiskLevel,
        attempt_number: int
    ) -> UUID:
        """
        Log vibration event to database for analytics

        Returns:
            UUID of created event record
        """
        event_data = {
            "student_id": student_id,
            "problem_id": problem_id,
            "module_id": module_id,
            "is_correct": is_correct,
            "pattern": vibration_config.pattern.value,
            "intensity": vibration_config.intensity,
            "duration_ms": vibration_config.duration_ms,
            "device_supported": device_supported,
            "user_agent": user_agent,
            "risk_level": risk_level.value,
            "attempt_number": attempt_number,
            "recorded_at": datetime.utcnow()
        }

        # Insert into database (pseudo-code)
        # event_id = await self.db.insert("vibration_events", event_data)
        # return event_id

        # For now, just log
        print(f"Vibration event logged: {event_data}")
        return UUID('00000000-0000-0000-0000-000000000000')

    async def update_student_attempt(
        self,
        attempt_id: UUID,
        vibration_triggered: bool,
        vibration_pattern: str,
        risk_level: RiskLevel
    ):
        """Update student attempt record with vibration data"""
        update_data = {
            "vibration_triggered": vibration_triggered,
            "vibration_pattern": vibration_pattern,
            "risk_level": risk_level.value
        }

        # Update database (pseudo-code)
        # await self.db.update("student_attempts", attempt_id, update_data)
        print(f"Student attempt updated: {update_data}")

    # Helper methods for database queries (to be implemented with actual DB)

    async def _get_attempt_count(self, student_id: UUID, problem_id: UUID) -> int:
        """Get number of attempts for this problem"""
        # Query: SELECT COUNT(*) FROM student_attempts
        #        WHERE student_id = ? AND problem_id = ?
        return 1  # Placeholder

    async def _get_problem_metadata(self, problem_id: UUID) -> Dict:
        """Get problem metadata"""
        # Query: SELECT * FROM problem_metadata WHERE problem_id = ?
        return {
            "concept_importance": 0.8,
            "difficulty_level": "medium",
            "prerequisite_concepts": [],
            "vibration_recommended": True
        }  # Placeholder

    async def _get_average_time_spent(
        self,
        student_id: UUID,
        module_id: UUID
    ) -> int:
        """Get average time spent by student on module problems"""
        # Query: SELECT AVG(time_spent_seconds) FROM student_attempts
        #        WHERE student_id = ? AND module_id = ?
        return 120  # Placeholder

    async def _get_vibration_settings(self, module_id: UUID) -> VibrationSettings:
        """Get vibration settings for module"""
        # Query: SELECT * FROM vibration_settings WHERE module_id = ?
        return VibrationSettings(
            module_id=module_id,
            is_enabled=True,
            trigger_on_wrong_answer=True,
            trigger_on_correct_answer=False,
            intensity_level=5,
            duration_ms=200,
            pattern="double_pulse",
            risk_threshold=RiskLevel.MEDIUM
        )  # Placeholder


# Factory function for dependency injection
def create_vibration_service(db_connection) -> VibrationService:
    """Create vibration service instance"""
    return VibrationService(db_connection)
