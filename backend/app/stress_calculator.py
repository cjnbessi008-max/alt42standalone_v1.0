"""
Learning Stress Calculator
학습 스트레스 지표 계산 로직
"""
from typing import Tuple
from .models import LearningActivity, StressLevel, StressIndicator


class StressCalculator:
    """학습 스트레스 계산기"""

    # 스트레스 점수 가중치
    WEIGHT_ERROR_RATE = 0.35  # 오답률
    WEIGHT_TIME_SPENT = 0.25  # 학습 시간
    WEIGHT_RETRY_COUNT = 0.20  # 재시도 횟수
    WEIGHT_RESPONSE_TREND = 0.20  # 응답 시간 추세

    # 스트레스 레벨 임계값
    THRESHOLD_HIGH = 60.0  # 60점 이상 = 높은 스트레스
    THRESHOLD_MEDIUM = 35.0  # 35-60점 = 보통 스트레스

    @staticmethod
    def calculate_error_rate_score(activity: LearningActivity) -> float:
        """오답률 기반 스트레스 점수 (0-100)"""
        if activity.problems_attempted == 0:
            return 0.0

        error_rate = 1.0 - (activity.problems_correct / activity.problems_attempted)
        # 오답률이 높을수록 스트레스 증가
        return error_rate * 100

    @staticmethod
    def calculate_time_spent_score(activity: LearningActivity) -> float:
        """학습 시간 기반 스트레스 점수 (0-100)"""
        # 30분 이하: 낮은 스트레스
        # 30-60분: 보통 스트레스
        # 60분 이상: 높은 스트레스
        if activity.time_spent_minutes <= 30:
            return (activity.time_spent_minutes / 30) * 30
        elif activity.time_spent_minutes <= 60:
            return 30 + ((activity.time_spent_minutes - 30) / 30) * 40
        else:
            # 최대 100점까지, 120분에서 100점
            return min(70 + ((activity.time_spent_minutes - 60) / 60) * 30, 100)

    @staticmethod
    def calculate_retry_score(activity: LearningActivity) -> float:
        """재시도 횟수 기반 스트레스 점수 (0-100)"""
        if activity.problems_attempted == 0:
            return 0.0

        retry_ratio = activity.retry_count / activity.problems_attempted
        # 재시도 비율이 높을수록 스트레스 증가
        # 문제당 평균 2회 재시도 시 높은 스트레스
        return min(retry_ratio / 2.0 * 100, 100)

    @staticmethod
    def calculate_response_trend_score(activity: LearningActivity) -> float:
        """응답 시간 추세 기반 스트레스 점수 (0-100)"""
        # response_time_trend: -1 (느려짐) to 1 (빨라짐)
        # 느려질수록 스트레스 증가
        # -1 (매우 느려짐) = 100점
        # 0 (변화없음) = 50점
        # 1 (빨라짐) = 0점
        normalized_trend = (1 - activity.response_time_trend) / 2.0
        return normalized_trend * 100

    @classmethod
    def calculate_stress(cls, activity: LearningActivity) -> StressIndicator:
        """학습 활동으로부터 스트레스 지표 계산"""

        # 각 요인별 점수 계산
        error_score = cls.calculate_error_rate_score(activity)
        time_score = cls.calculate_time_spent_score(activity)
        retry_score = cls.calculate_retry_score(activity)
        response_score = cls.calculate_response_trend_score(activity)

        # 가중 평균으로 최종 스트레스 점수 계산
        stress_score = (
            error_score * cls.WEIGHT_ERROR_RATE +
            time_score * cls.WEIGHT_TIME_SPENT +
            retry_score * cls.WEIGHT_RETRY_COUNT +
            response_score * cls.WEIGHT_RESPONSE_TREND
        )

        # 스트레스 레벨 결정
        stress_level, recommendations = cls._determine_stress_level_and_recommendations(
            stress_score, error_score, time_score, retry_score, response_score
        )

        # 요인 분석
        factors = {
            "error_rate": {
                "score": round(error_score, 2),
                "weight": cls.WEIGHT_ERROR_RATE,
                "value": round((1.0 - (activity.problems_correct / activity.problems_attempted)) * 100, 2)
                    if activity.problems_attempted > 0 else 0.0,
                "unit": "percent"
            },
            "time_spent": {
                "score": round(time_score, 2),
                "weight": cls.WEIGHT_TIME_SPENT,
                "value": round(activity.time_spent_minutes, 2),
                "unit": "minutes"
            },
            "retry_count": {
                "score": round(retry_score, 2),
                "weight": cls.WEIGHT_RETRY_COUNT,
                "value": activity.retry_count,
                "unit": "count"
            },
            "response_trend": {
                "score": round(response_score, 2),
                "weight": cls.WEIGHT_RESPONSE_TREND,
                "value": round(activity.response_time_trend, 2),
                "unit": "trend"
            }
        }

        return StressIndicator(
            student_id=activity.student_id,
            module_id=activity.module_id,
            session_id=activity.session_id,
            stress_level=stress_level,
            stress_score=round(stress_score, 2),
            factors=factors,
            timestamp=activity.timestamp,
            recommendations=recommendations
        )

    @classmethod
    def _determine_stress_level_and_recommendations(
        cls,
        stress_score: float,
        error_score: float,
        time_score: float,
        retry_score: float,
        response_score: float
    ) -> Tuple[StressLevel, list[str]]:
        """스트레스 레벨 결정 및 권장사항 생성"""

        recommendations = []

        if stress_score >= cls.THRESHOLD_HIGH:
            stress_level = StressLevel.HIGH

            # 높은 스트레스 - 구체적인 권장사항 제공
            if error_score > 60:
                recommendations.append("오답률이 높습니다. 개념 복습이 필요할 수 있습니다.")
            if time_score > 60:
                recommendations.append("장시간 학습 중입니다. 휴식을 권장합니다.")
            if retry_score > 60:
                recommendations.append("재시도가 많습니다. 교사의 도움이 필요할 수 있습니다.")
            if response_score > 60:
                recommendations.append("응답 시간이 느려지고 있습니다. 피로도가 증가하는 것으로 보입니다.")

            if not recommendations:
                recommendations.append("학습에 어려움을 겪고 있습니다. 교사의 개입이 권장됩니다.")

        elif stress_score >= cls.THRESHOLD_MEDIUM:
            stress_level = StressLevel.MEDIUM
            recommendations.append("적절한 수준의 도전과 노력이 이루어지고 있습니다.")

            # 보통 스트레스 - 예방적 권장사항
            if time_score > 50:
                recommendations.append("적절한 휴식 시간을 가지세요.")
            if error_score > 50:
                recommendations.append("어려운 부분은 다시 한번 복습해보세요.")

        else:
            stress_level = StressLevel.LOW
            recommendations.append("원활하게 학습이 진행되고 있습니다.")

            # 낮은 스트레스 - 격려 메시지
            if activity_is_excellent(error_score, time_score):
                recommendations.append("훌륭합니다! 다음 단계로 진행할 준비가 되었습니다.")

        return stress_level, recommendations


def activity_is_excellent(error_score: float, time_score: float) -> bool:
    """우수한 학습 활동인지 판단"""
    return error_score < 20 and time_score < 40
