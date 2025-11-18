"""
Bottleneck Detection Service

This service analyzes student performance and detects bottlenecks
(problem types where students struggle the most)
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import logging

from ..models import (
    Student,
    ProblemType,
    StudentAttempt,
    BottleneckDetection,
    PerformanceMetric,
    Notification
)

logger = logging.getLogger(__name__)


class BottleneckDetector:
    """
    Detects learning bottlenecks for students based on their performance
    """

    # Detection thresholds
    ACCURACY_THRESHOLD = 60.0  # Below 60% accuracy = potential bottleneck
    TIME_MULTIPLIER_THRESHOLD = 1.5  # 150% of expected time
    AVG_ATTEMPTS_THRESHOLD = 3.0  # More than 3 attempts on average
    ABANDONMENT_THRESHOLD = 30.0  # 30% abandonment rate
    DIFFICULTY_SCORE_THRESHOLD = 70.0  # Overall difficulty score > 70 = bottleneck

    # Weights for difficulty score calculation
    WEIGHT_ACCURACY = 0.35
    WEIGHT_TIME = 0.25
    WEIGHT_ATTEMPTS = 0.20
    WEIGHT_ABANDONMENT = 0.20

    def __init__(self, db: AsyncSession):
        self.db = db

    async def analyze_student(
        self,
        student_id: str,
        lookback_days: int = 30,
        min_attempts: int = 5
    ) -> List[BottleneckDetection]:
        """
        Analyze a student's performance and detect bottlenecks

        Args:
            student_id: Student UUID
            lookback_days: Number of days to look back for analysis
            min_attempts: Minimum attempts required for analysis

        Returns:
            List of detected bottlenecks
        """
        logger.info(f"Analyzing student {student_id} for bottlenecks")

        # Get student's attempts in the lookback period
        cutoff_date = datetime.utcnow() - timedelta(days=lookback_days)

        # Query attempts grouped by problem type
        query = (
            select(
                StudentAttempt.problem_type_id,
                func.count(StudentAttempt.id).label('total_attempts'),
                func.sum(func.cast(StudentAttempt.is_correct, Integer)).label('correct_attempts'),
                func.avg(
                    func.extract('epoch', StudentAttempt.submitted_at - StudentAttempt.started_at)
                ).label('avg_time_seconds'),
                func.sum(func.cast(StudentAttempt.gave_up, Integer)).label('gave_up_count'),
                func.avg(StudentAttempt.attempt_number).label('avg_attempts')
            )
            .where(
                and_(
                    StudentAttempt.student_id == student_id,
                    StudentAttempt.submitted_at >= cutoff_date
                )
            )
            .group_by(StudentAttempt.problem_type_id)
            .having(func.count(StudentAttempt.id) >= min_attempts)
        )

        result = await self.db.execute(query)
        performance_data = result.all()

        bottlenecks = []

        for row in performance_data:
            # Calculate metrics
            problem_type_id = row.problem_type_id
            total_attempts = row.total_attempts
            correct_attempts = row.correct_attempts or 0
            avg_time = int(row.avg_time_seconds or 0)
            gave_up_count = row.gave_up_count or 0
            avg_attempts = float(row.avg_attempts or 1.0)

            accuracy_rate = (correct_attempts / total_attempts * 100) if total_attempts > 0 else 0
            abandonment_rate = (gave_up_count / total_attempts * 100) if total_attempts > 0 else 0

            # Get expected solve time for this problem type
            problem_type_query = select(ProblemType).where(ProblemType.id == problem_type_id)
            problem_type_result = await self.db.execute(problem_type_query)
            problem_type = problem_type_result.scalar_one_or_none()

            if not problem_type:
                continue

            expected_time = problem_type.expected_solve_time_seconds or 120
            time_ratio = avg_time / expected_time if expected_time > 0 else 1.0

            # Calculate difficulty score (0-100)
            difficulty_score = self._calculate_difficulty_score(
                accuracy_rate,
                time_ratio,
                avg_attempts,
                abandonment_rate
            )

            # Determine if this is a bottleneck
            is_bottleneck, severity, reason = self._is_bottleneck(
                accuracy_rate,
                time_ratio,
                avg_attempts,
                abandonment_rate,
                difficulty_score
            )

            if is_bottleneck:
                # Check if bottleneck already exists and is active
                existing_query = select(BottleneckDetection).where(
                    and_(
                        BottleneckDetection.student_id == student_id,
                        BottleneckDetection.problem_type_id == problem_type_id,
                        BottleneckDetection.is_active == True
                    )
                )
                existing_result = await self.db.execute(existing_query)
                existing = existing_result.scalar_one_or_none()

                if existing:
                    # Update existing bottleneck
                    existing.accuracy_rate = accuracy_rate
                    existing.avg_solve_time_seconds = avg_time
                    existing.avg_attempts = avg_attempts
                    existing.abandonment_rate = abandonment_rate
                    existing.difficulty_score = difficulty_score
                    existing.total_attempts = total_attempts
                    existing.correct_attempts = correct_attempts
                    existing.severity = severity
                    existing.detection_reason = reason
                    existing.detected_at = datetime.utcnow()
                    bottleneck = existing
                else:
                    # Create new bottleneck detection
                    bottleneck = BottleneckDetection(
                        student_id=student_id,
                        problem_type_id=problem_type_id,
                        accuracy_rate=accuracy_rate,
                        avg_solve_time_seconds=avg_time,
                        avg_attempts=avg_attempts,
                        abandonment_rate=abandonment_rate,
                        difficulty_score=difficulty_score,
                        total_attempts=total_attempts,
                        correct_attempts=correct_attempts,
                        detection_reason=reason,
                        severity=severity,
                        is_active=True,
                        recommended_actions=self._generate_recommendations(
                            problem_type,
                            accuracy_rate,
                            time_ratio,
                            avg_attempts
                        )
                    )
                    self.db.add(bottleneck)

                    # Create notification
                    await self._create_notification(student_id, bottleneck, problem_type)

                bottlenecks.append(bottleneck)

        await self.db.commit()
        logger.info(f"Detected {len(bottlenecks)} bottlenecks for student {student_id}")

        return bottlenecks

    def _calculate_difficulty_score(
        self,
        accuracy_rate: float,
        time_ratio: float,
        avg_attempts: float,
        abandonment_rate: float
    ) -> float:
        """
        Calculate overall difficulty score (0-100)
        Higher score = more difficult

        Args:
            accuracy_rate: Accuracy percentage (0-100)
            time_ratio: Actual time / Expected time
            avg_attempts: Average number of attempts
            abandonment_rate: Percentage of abandoned problems (0-100)

        Returns:
            Difficulty score (0-100)
        """
        # Convert accuracy to difficulty (inverse)
        accuracy_difficulty = 100 - accuracy_rate

        # Time difficulty (capped at 100)
        time_difficulty = min(100, (time_ratio - 1) * 100)

        # Attempts difficulty (normalize to 0-100)
        attempts_difficulty = min(100, (avg_attempts - 1) * 33.33)

        # Abandonment is already 0-100

        # Weighted sum
        score = (
            self.WEIGHT_ACCURACY * accuracy_difficulty +
            self.WEIGHT_TIME * time_difficulty +
            self.WEIGHT_ATTEMPTS * attempts_difficulty +
            self.WEIGHT_ABANDONMENT * abandonment_rate
        )

        return round(score, 2)

    def _is_bottleneck(
        self,
        accuracy_rate: float,
        time_ratio: float,
        avg_attempts: float,
        abandonment_rate: float,
        difficulty_score: float
    ) -> tuple[bool, str, str]:
        """
        Determine if metrics indicate a bottleneck

        Returns:
            (is_bottleneck, severity, reason)
        """
        reasons = []

        if accuracy_rate < self.ACCURACY_THRESHOLD:
            reasons.append(f"낮은 정답률 ({accuracy_rate:.1f}%)")

        if time_ratio >= self.TIME_MULTIPLIER_THRESHOLD:
            reasons.append(f"예상보다 {time_ratio:.1f}배 긴 해결 시간")

        if avg_attempts >= self.AVG_ATTEMPTS_THRESHOLD:
            reasons.append(f"평균 {avg_attempts:.1f}회 시도")

        if abandonment_rate >= self.ABANDONMENT_THRESHOLD:
            reasons.append(f"높은 포기율 ({abandonment_rate:.1f}%)")

        # Determine severity
        if difficulty_score >= 90:
            severity = "critical"
        elif difficulty_score >= 80:
            severity = "high"
        elif difficulty_score >= self.DIFFICULTY_SCORE_THRESHOLD:
            severity = "medium"
        else:
            severity = "low"

        is_bottleneck = difficulty_score >= self.DIFFICULTY_SCORE_THRESHOLD or len(reasons) >= 2

        reason = " / ".join(reasons) if reasons else "종합 난이도 점수 기준"

        return is_bottleneck, severity, reason

    def _generate_recommendations(
        self,
        problem_type: ProblemType,
        accuracy_rate: float,
        time_ratio: float,
        avg_attempts: float
    ) -> Dict:
        """
        Generate personalized recommendations based on bottleneck

        Returns:
            Dictionary of recommended actions
        """
        recommendations = {
            "focus_areas": [],
            "suggested_resources": [],
            "practice_strategy": ""
        }

        if accuracy_rate < 40:
            recommendations["focus_areas"].append("기본 개념 복습 필요")
            recommendations["practice_strategy"] = "더 쉬운 난이도부터 시작하여 점진적으로 난이도를 높이세요"
        elif accuracy_rate < 60:
            recommendations["focus_areas"].append("추가 연습 필요")
            recommendations["practice_strategy"] = "비슷한 유형의 문제를 더 풀어보세요"

        if time_ratio > 2.0:
            recommendations["focus_areas"].append("문제 해결 속도 개선")
            recommendations["suggested_resources"].append("시간 제한 연습")

        if avg_attempts > 4:
            recommendations["focus_areas"].append("문제 이해도 향상")
            recommendations["suggested_resources"].append("단계별 풀이 가이드")

        # Add specific resources based on problem type
        recommendations["suggested_resources"].append(f"{problem_type.name} 관련 학습 자료")
        recommendations["suggested_resources"].append(f"{problem_type.name} 예제 문제")

        return recommendations

    async def _create_notification(
        self,
        student_id: str,
        bottleneck: BottleneckDetection,
        problem_type: ProblemType
    ):
        """Create notification for detected bottleneck"""
        severity_map = {
            "low": "info",
            "medium": "warning",
            "high": "warning",
            "critical": "critical"
        }

        notification = Notification(
            student_id=student_id,
            bottleneck_id=bottleneck.id,
            type="bottleneck_detected",
            title=f"학습 병목 지점 발견: {problem_type.name}",
            message=f"{problem_type.name} 유형에서 어려움을 겪고 있습니다. "
                    f"정답률: {bottleneck.accuracy_rate:.1f}%, "
                    f"난이도 점수: {bottleneck.difficulty_score:.1f}점",
            severity=severity_map.get(bottleneck.severity, "info"),
            metadata={
                "problem_type_name": problem_type.name,
                "difficulty_score": float(bottleneck.difficulty_score),
                "recommendations": bottleneck.recommended_actions
            }
        )

        self.db.add(notification)

    async def resolve_bottleneck(
        self,
        bottleneck_id: str,
        student_id: str
    ) -> bool:
        """
        Mark a bottleneck as resolved

        Args:
            bottleneck_id: Bottleneck UUID
            student_id: Student UUID for verification

        Returns:
            True if resolved successfully
        """
        query = select(BottleneckDetection).where(
            and_(
                BottleneckDetection.id == bottleneck_id,
                BottleneckDetection.student_id == student_id,
                BottleneckDetection.is_active == True
            )
        )

        result = await self.db.execute(query)
        bottleneck = result.scalar_one_or_none()

        if bottleneck:
            bottleneck.is_active = False
            bottleneck.resolved_at = datetime.utcnow()
            await self.db.commit()
            logger.info(f"Resolved bottleneck {bottleneck_id} for student {student_id}")
            return True

        return False
