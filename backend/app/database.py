"""
In-memory database for Learning Stress Indicators
학습 스트레스 지표 저장용 인메모리 데이터베이스
"""
from datetime import datetime
from typing import List, Optional
from collections import defaultdict

from .models import StressIndicator, StressMetrics, StressLevel


class StressDatabase:
    """학습 스트레스 지표 인메모리 데이터베이스"""

    def __init__(self):
        self.indicators: List[StressIndicator] = []
        self.student_index: defaultdict[str, List[StressIndicator]] = defaultdict(list)
        self.module_index: defaultdict[str, List[StressIndicator]] = defaultdict(list)

    def save_indicator(self, indicator: StressIndicator) -> None:
        """스트레스 지표 저장"""
        self.indicators.append(indicator)
        self.student_index[indicator.student_id].append(indicator)
        self.module_index[indicator.module_id].append(indicator)

    def get_indicators_by_student(
        self,
        student_id: str,
        module_id: Optional[str] = None,
        limit: int = 10
    ) -> List[StressIndicator]:
        """학생별 스트레스 지표 조회"""
        student_indicators = self.student_index.get(student_id, [])

        if module_id:
            student_indicators = [
                i for i in student_indicators
                if i.module_id == module_id
            ]

        # 최신순 정렬
        student_indicators.sort(key=lambda x: x.timestamp, reverse=True)

        return student_indicators[:limit]

    def get_indicators_by_module(
        self,
        module_id: str,
        stress_level: Optional[StressLevel] = None,
        limit: int = 50
    ) -> List[StressIndicator]:
        """모듈별 스트레스 지표 조회"""
        module_indicators = self.module_index.get(module_id, [])

        if stress_level:
            module_indicators = [
                i for i in module_indicators
                if i.stress_level == stress_level
            ]

        # 최신순 정렬
        module_indicators.sort(key=lambda x: x.timestamp, reverse=True)

        return module_indicators[:limit]

    def get_all_indicators(self, limit: int = 100) -> List[StressIndicator]:
        """모든 스트레스 지표 조회"""
        sorted_indicators = sorted(self.indicators, key=lambda x: x.timestamp, reverse=True)
        return sorted_indicators[:limit]

    def get_metrics(
        self,
        module_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> StressMetrics:
        """스트레스 메트릭 통계 계산"""
        # 필터링할 지표 선택
        if module_id:
            indicators = self.module_index.get(module_id, [])
        else:
            indicators = self.indicators

        # 날짜 필터링
        if start_date:
            indicators = [i for i in indicators if i.timestamp >= start_date]
        if end_date:
            indicators = [i for i in indicators if i.timestamp <= end_date]

        return self.calculate_metrics_from_indicators(indicators)

    @staticmethod
    def calculate_metrics_from_indicators(indicators: List[StressIndicator]) -> StressMetrics:
        """지표 목록으로부터 메트릭 계산"""
        if not indicators:
            return StressMetrics(
                total_students=0,
                low_stress_count=0,
                medium_stress_count=0,
                high_stress_count=0,
                average_stress_score=0.0,
                timestamp=datetime.now()
            )

        # 고유 학생 수 계산
        unique_students = set(i.student_id for i in indicators)

        # 스트레스 레벨별 카운트
        low_count = sum(1 for i in indicators if i.stress_level == StressLevel.LOW)
        medium_count = sum(1 for i in indicators if i.stress_level == StressLevel.MEDIUM)
        high_count = sum(1 for i in indicators if i.stress_level == StressLevel.HIGH)

        # 평균 스트레스 점수
        average_score = sum(i.stress_score for i in indicators) / len(indicators)

        return StressMetrics(
            total_students=len(unique_students),
            low_stress_count=low_count,
            medium_stress_count=medium_count,
            high_stress_count=high_count,
            average_stress_score=round(average_score, 2),
            timestamp=datetime.now()
        )

    def reset(self) -> None:
        """데이터베이스 초기화"""
        self.indicators.clear()
        self.student_index.clear()
        self.module_index.clear()
