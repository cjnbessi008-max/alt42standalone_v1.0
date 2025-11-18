"""
Deviation Analyzer
Compares individual student thinking routines against top-tier average
and calculates deviations to identify improvement areas
"""

import numpy as np
from typing import Dict, List, Tuple
from dataclasses import dataclass, asdict
import logging
from student_analyzer import ThinkingRoutine, PerformanceMetrics

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class DeviationMetrics:
    """Represents deviation from top-tier average"""
    user_id: int
    student_name: str
    overall_deviation_score: float  # 0-100, lower is better aligned
    time_deviation: float  # percentage difference
    accuracy_deviation: float  # percentage difference
    consistency_deviation: float  # percentage difference
    engagement_deviation: float  # percentage difference
    learning_velocity_deviation: float  # percentage difference
    pattern_match: str  # how well pattern matches top-tier
    improvement_recommendations: List[str]
    strengths: List[str]
    weaknesses: List[str]
    percentile_rank: float  # 0-100, where student ranks overall


@dataclass
class ComparisonReport:
    """Comprehensive comparison report"""
    student_routine: ThinkingRoutine
    top_tier_average: ThinkingRoutine
    deviation_metrics: DeviationMetrics
    detailed_breakdown: Dict[str, Dict]
    actionable_insights: List[str]


class DeviationAnalyzer:
    """Analyzes deviations between student and top-tier thinking routines"""

    def __init__(self):
        """Initialize deviation analyzer"""
        self.deviation_thresholds = {
            'excellent': 10,  # < 10% deviation
            'good': 25,  # < 25% deviation
            'average': 50,  # < 50% deviation
            'needs_improvement': 100  # < 100% deviation
        }

    def calculate_deviation(self, student_routine: ThinkingRoutine,
                             top_tier_average: ThinkingRoutine,
                             student_metrics: PerformanceMetrics,
                             student_name: str = "") -> DeviationMetrics:
        """
        Calculate comprehensive deviation metrics

        Args:
            student_routine: Individual student's thinking routine
            top_tier_average: Average routine of top-tier students
            student_metrics: Student's performance metrics
            student_name: Student's display name

        Returns:
            DeviationMetrics object with detailed comparison
        """
        # Calculate individual component deviations
        time_dev = self._calculate_percentage_deviation(
            student_routine.avg_time_per_question,
            top_tier_average.avg_time_per_question
        )

        accuracy_dev = self._calculate_percentage_deviation(
            student_routine.accuracy_rate,
            top_tier_average.accuracy_rate
        )

        consistency_dev = self._calculate_percentage_deviation(
            student_routine.consistency_score,
            top_tier_average.consistency_score
        )

        engagement_dev = self._calculate_percentage_deviation(
            student_routine.engagement_score,
            top_tier_average.engagement_score
        )

        learning_velocity_dev = self._calculate_percentage_deviation(
            student_routine.learning_velocity,
            top_tier_average.learning_velocity
        )

        # Calculate overall deviation score (weighted average)
        overall_deviation = (
            abs(accuracy_dev) * 0.30 +
            abs(consistency_dev) * 0.25 +
            abs(time_dev) * 0.20 +
            abs(engagement_dev) * 0.15 +
            abs(learning_velocity_dev) * 0.10
        )

        # Pattern matching
        pattern_match = self._evaluate_pattern_match(
            student_routine.attempt_pattern,
            top_tier_average.attempt_pattern
        )

        # Generate recommendations
        recommendations = self._generate_recommendations(
            student_routine, top_tier_average,
            time_dev, accuracy_dev, consistency_dev,
            engagement_dev, learning_velocity_dev
        )

        # Identify strengths and weaknesses
        strengths, weaknesses = self._identify_strengths_weaknesses(
            student_routine, top_tier_average,
            time_dev, accuracy_dev, consistency_dev,
            engagement_dev, learning_velocity_dev
        )

        # Calculate percentile rank (0 = bottom, 100 = top)
        percentile = self._calculate_percentile(overall_deviation)

        return DeviationMetrics(
            user_id=student_routine.user_id,
            student_name=student_name,
            overall_deviation_score=overall_deviation,
            time_deviation=time_dev,
            accuracy_deviation=accuracy_dev,
            consistency_deviation=consistency_dev,
            engagement_deviation=engagement_dev,
            learning_velocity_deviation=learning_velocity_dev,
            pattern_match=pattern_match,
            improvement_recommendations=recommendations,
            strengths=strengths,
            weaknesses=weaknesses,
            percentile_rank=percentile
        )

    def generate_comparison_report(self, student_routine: ThinkingRoutine,
                                     top_tier_average: ThinkingRoutine,
                                     student_metrics: PerformanceMetrics,
                                     student_name: str = "") -> ComparisonReport:
        """
        Generate comprehensive comparison report

        Args:
            student_routine: Individual student's routine
            top_tier_average: Top-tier average routine
            student_metrics: Student's performance metrics
            student_name: Student's name

        Returns:
            ComparisonReport with detailed analysis
        """
        # Calculate deviation metrics
        deviation = self.calculate_deviation(
            student_routine, top_tier_average,
            student_metrics, student_name
        )

        # Create detailed breakdown
        detailed_breakdown = self._create_detailed_breakdown(
            student_routine, top_tier_average, deviation
        )

        # Generate actionable insights
        insights = self._generate_actionable_insights(
            student_routine, top_tier_average, deviation, student_metrics
        )

        return ComparisonReport(
            student_routine=student_routine,
            top_tier_average=top_tier_average,
            deviation_metrics=deviation,
            detailed_breakdown=detailed_breakdown,
            actionable_insights=insights
        )

    def batch_analyze_deviations(self, all_routines: List[Tuple[ThinkingRoutine, PerformanceMetrics, str]],
                                   top_tier_average: ThinkingRoutine) -> List[DeviationMetrics]:
        """
        Analyze deviations for multiple students

        Args:
            all_routines: List of tuples (routine, metrics, name)
            top_tier_average: Top-tier average routine

        Returns:
            List of DeviationMetrics for all students
        """
        deviations = []

        for routine, metrics, name in all_routines:
            deviation = self.calculate_deviation(
                routine, top_tier_average, metrics, name
            )
            deviations.append(deviation)

        # Sort by overall deviation (best to worst)
        deviations.sort(key=lambda x: x.overall_deviation_score)

        logger.info(f"Analyzed deviations for {len(deviations)} students")
        return deviations

    # Helper methods

    def _calculate_percentage_deviation(self, student_value: float,
                                          reference_value: float) -> float:
        """
        Calculate percentage deviation from reference

        Positive = student is higher than reference
        Negative = student is lower than reference
        """
        if reference_value == 0:
            return 0.0

        deviation = ((student_value - reference_value) / reference_value) * 100
        return deviation

    def _evaluate_pattern_match(self, student_pattern: str,
                                  top_tier_pattern: str) -> str:
        """Evaluate how well student pattern matches top-tier"""
        if student_pattern == top_tier_pattern:
            return 'exact_match'
        elif student_pattern in ['quick_solver', 'methodical'] and \
             top_tier_pattern in ['quick_solver', 'methodical']:
            return 'similar'
        else:
            return 'different'

    def _generate_recommendations(self, student: ThinkingRoutine,
                                    top_tier: ThinkingRoutine,
                                    time_dev: float, accuracy_dev: float,
                                    consistency_dev: float, engagement_dev: float,
                                    learning_velocity_dev: float) -> List[str]:
        """Generate improvement recommendations"""
        recommendations = []

        # Accuracy recommendations
        if accuracy_dev < -20:
            recommendations.append(
                "✓ 정확도 향상 필요: 문제를 풀기 전에 문제를 충분히 읽고 이해하는 시간을 가지세요. "
                f"현재 정확도 {student.accuracy_rate:.1f}%를 목표 {top_tier.accuracy_rate:.1f}%로 향상시켜야 합니다."
            )
            recommendations.append(
                "✓ 오답 노트 작성: 틀린 문제를 다시 풀어보고 왜 틀렸는지 분석하세요."
            )

        # Time management recommendations
        if time_dev > 50:
            recommendations.append(
                "✓ 시간 관리 개선: 문제당 평균 시간이 너무 깁니다. "
                f"현재 {student.avg_time_per_question:.0f}초를 {top_tier.avg_time_per_question:.0f}초로 단축하세요."
            )
            recommendations.append(
                "✓ 시간 제한 연습: 타이머를 설정하고 문제를 푸는 연습을 하세요."
            )
        elif time_dev < -50:
            recommendations.append(
                "✓ 신중함 필요: 문제를 너무 빨리 풀고 있습니다. 더 신중하게 접근하세요."
            )

        # Consistency recommendations
        if consistency_dev < -20:
            recommendations.append(
                "✓ 일관성 향상: 성적 편차가 큽니다. 꾸준한 학습 패턴을 유지하세요."
            )
            recommendations.append(
                "✓ 체계적 학습: 매일 같은 시간에 학습하고, 복습 주기를 정하세요."
            )

        # Engagement recommendations
        if engagement_dev < -20:
            recommendations.append(
                "✓ 참여도 증가: 더 다양한 학습 활동에 참여하세요. "
                "토론, 퀴즈, 추가 자료 읽기 등을 시도하세요."
            )

        # Learning velocity recommendations
        if learning_velocity_dev < -20:
            recommendations.append(
                "✓ 학습 속도 개선: 시간이 지나도 성적 향상이 더딥니다. "
                "학습 전략을 재평가하고 효과적인 방법을 찾으세요."
            )

        # Pattern-specific recommendations
        if student.attempt_pattern == 'rusher':
            recommendations.append(
                "✓ 급하게 푸는 습관 개선: 답을 제출하기 전에 한 번 더 검토하세요."
            )
        elif student.attempt_pattern == 'struggler':
            recommendations.append(
                "✓ 기초 개념 복습: 기본 개념을 다시 학습하고 이해를 강화하세요."
            )
            recommendations.append(
                "✓ 도움 요청: 어려운 부분은 선생님이나 동료에게 도움을 청하세요."
            )

        # Question type specific
        for qtype, perf in student.question_type_performance.items():
            if qtype in top_tier.question_type_performance:
                if perf < top_tier.question_type_performance[qtype] - 15:
                    recommendations.append(
                        f"✓ {qtype} 문제 유형 집중 연습: 이 유형의 문제에서 약점이 보입니다."
                    )

        return recommendations[:8]  # Return top 8 recommendations

    def _identify_strengths_weaknesses(self, student: ThinkingRoutine,
                                         top_tier: ThinkingRoutine,
                                         time_dev: float, accuracy_dev: float,
                                         consistency_dev: float, engagement_dev: float,
                                         learning_velocity_dev: float) -> Tuple[List[str], List[str]]:
        """Identify student's strengths and weaknesses"""
        strengths = []
        weaknesses = []

        # Analyze each metric
        metrics = [
            ('정확도', accuracy_dev, student.accuracy_rate, top_tier.accuracy_rate),
            ('일관성', consistency_dev, student.consistency_score * 100, top_tier.consistency_score * 100),
            ('참여도', engagement_dev, student.engagement_score * 100, top_tier.engagement_score * 100),
            ('학습 속도', learning_velocity_dev, student.learning_velocity, top_tier.learning_velocity),
        ]

        for name, deviation, student_val, top_val in metrics:
            if deviation >= -10:  # Within 10% or better
                strengths.append(f"{name}: 우수함 ({student_val:.1f} vs 목표 {top_val:.1f})")
            elif deviation < -30:  # More than 30% below
                weaknesses.append(f"{name}: 개선 필요 ({student_val:.1f} vs 목표 {top_val:.1f})")

        # Time analysis (lower is not always better)
        if -10 <= time_dev <= 10:
            strengths.append(f"시간 관리: 적절함")
        elif time_dev > 30:
            weaknesses.append(f"시간 관리: 너무 느림")
        elif time_dev < -30:
            weaknesses.append(f"시간 관리: 너무 빠름 (신중함 필요)")

        # Pattern analysis
        if student.attempt_pattern == top_tier.attempt_pattern:
            strengths.append(f"학습 패턴: 최상위권과 일치 ({student.attempt_pattern})")
        elif student.attempt_pattern in ['quick_solver', 'methodical']:
            strengths.append(f"학습 패턴: 긍정적 ({student.attempt_pattern})")
        else:
            weaknesses.append(f"학습 패턴: 개선 필요 ({student.attempt_pattern})")

        return strengths[:5], weaknesses[:5]

    def _calculate_percentile(self, overall_deviation: float) -> float:
        """
        Calculate percentile rank based on overall deviation
        Lower deviation = higher percentile
        """
        # Use inverse relationship: lower deviation = higher percentile
        # Assume 100% deviation = 0th percentile, 0% deviation = 100th percentile
        percentile = max(0, min(100, 100 - overall_deviation))
        return percentile

    def _create_detailed_breakdown(self, student: ThinkingRoutine,
                                     top_tier: ThinkingRoutine,
                                     deviation: DeviationMetrics) -> Dict[str, Dict]:
        """Create detailed breakdown of all metrics"""
        return {
            '성과_지표': {
                '정확도': {
                    '학생': f"{student.accuracy_rate:.1f}%",
                    '최상위권_평균': f"{top_tier.accuracy_rate:.1f}%",
                    '편차': f"{deviation.accuracy_deviation:+.1f}%"
                },
                '일관성': {
                    '학생': f"{student.consistency_score:.2f}",
                    '최상위권_평균': f"{top_tier.consistency_score:.2f}",
                    '편차': f"{deviation.consistency_deviation:+.1f}%"
                },
                '문제당_평균_시간': {
                    '학생': f"{student.avg_time_per_question:.0f}초",
                    '최상위권_평균': f"{top_tier.avg_time_per_question:.0f}초",
                    '편차': f"{deviation.time_deviation:+.1f}%"
                }
            },
            '학습_패턴': {
                '학생_패턴': student.attempt_pattern,
                '최상위권_패턴': top_tier.attempt_pattern,
                '일치도': deviation.pattern_match
            },
            '참여도': {
                '학생': f"{student.engagement_score:.2f}",
                '최상위권_평균': f"{top_tier.engagement_score:.2f}",
                '편차': f"{deviation.engagement_deviation:+.1f}%"
            },
            '학습_속도': {
                '학생': f"{student.learning_velocity:.2f}",
                '최상위권_평균': f"{top_tier.learning_velocity:.2f}",
                '편차': f"{deviation.learning_velocity_deviation:+.1f}%"
            },
            '종합_평가': {
                '전체_편차_점수': f"{deviation.overall_deviation_score:.1f}",
                '백분위_순위': f"{deviation.percentile_rank:.1f}%ile",
                '등급': self._get_grade(deviation.overall_deviation_score)
            }
        }

    def _generate_actionable_insights(self, student: ThinkingRoutine,
                                        top_tier: ThinkingRoutine,
                                        deviation: DeviationMetrics,
                                        metrics: PerformanceMetrics) -> List[str]:
        """Generate actionable insights"""
        insights = []

        # Overall performance insight
        grade = self._get_grade(deviation.overall_deviation_score)
        insights.append(
            f"📊 종합 평가: {grade} (편차 {deviation.overall_deviation_score:.1f}점, "
            f"상위 {100 - deviation.percentile_rank:.0f}%)"
        )

        # Top strength
        if deviation.strengths:
            insights.append(f"💪 최고 강점: {deviation.strengths[0]}")

        # Top weakness
        if deviation.weaknesses:
            insights.append(f"🎯 우선 개선 영역: {deviation.weaknesses[0]}")

        # Trend insight
        if metrics.improvement_trend > 0:
            insights.append(
                f"📈 긍정적 추세: 시간이 지남에 따라 성적이 향상되고 있습니다 "
                f"(기울기: {metrics.improvement_trend:.2f})"
            )
        elif metrics.improvement_trend < -0.5:
            insights.append(
                f"📉 주의: 최근 성적이 하락하고 있습니다. 학습 전략을 재검토하세요."
            )

        # Time of day insight
        if metrics.peak_performance_time != 'unknown':
            insights.append(
                f"⏰ 최적 학습 시간: {metrics.peak_performance_time}에 성과가 가장 좋습니다"
            )

        # Specific action
        if deviation.improvement_recommendations:
            insights.append(f"🚀 즉시 실행 사항: {deviation.improvement_recommendations[0]}")

        return insights

    def _get_grade(self, deviation_score: float) -> str:
        """Get letter grade based on deviation score"""
        if deviation_score < 10:
            return 'S (최상위권 수준)'
        elif deviation_score < 25:
            return 'A (우수)'
        elif deviation_score < 40:
            return 'B (양호)'
        elif deviation_score < 60:
            return 'C (보통)'
        else:
            return 'D (개선 필요)'


# Export helper function
def export_deviation_report_json(report: ComparisonReport) -> Dict:
    """Export comparison report as JSON-serializable dictionary"""
    return {
        'student_routine': asdict(report.student_routine),
        'top_tier_average': asdict(report.top_tier_average),
        'deviation_metrics': asdict(report.deviation_metrics),
        'detailed_breakdown': report.detailed_breakdown,
        'actionable_insights': report.actionable_insights
    }
