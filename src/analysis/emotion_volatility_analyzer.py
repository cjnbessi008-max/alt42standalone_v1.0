"""
Emotion Volatility Analyzer
감정 기복 분석 엔진

학생들의 감정 데이터를 분석하여 시간대별 감정 기복이 심한 시간을 탐지합니다.
"""

import asyncio
from datetime import datetime, timedelta, time
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from collections import defaultdict
import statistics
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class TimeSlot:
    """시간대 정보"""
    hour: int  # 0-23
    day_of_week: int  # 0=Sunday, 6=Saturday
    label: str  # "Monday 09:00-10:00"


@dataclass
class EmotionVolatilityMetrics:
    """감정 기복 메트릭"""
    time_slot: TimeSlot
    volatility_score: float  # 표준편차 기반 점수
    avg_intensity: float  # 평균 감정 강도
    emotion_distribution: Dict[str, int]  # 감정 유형별 분포
    sample_count: int  # 샘플 개수
    volatility_level: str  # "low", "medium", "high", "extreme"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "time_slot": {
                "hour": self.time_slot.hour,
                "day_of_week": self.time_slot.day_of_week,
                "label": self.time_slot.label
            },
            "volatility_score": round(self.volatility_score, 2),
            "avg_intensity": round(self.avg_intensity, 2),
            "emotion_distribution": self.emotion_distribution,
            "sample_count": self.sample_count,
            "volatility_level": self.volatility_level
        }


class EmotionVolatilityAnalyzer:
    """감정 기복 분석 엔진"""

    # 감정 기복 레벨 임계값
    VOLATILITY_THRESHOLDS = {
        "low": 1.5,
        "medium": 2.5,
        "high": 3.5,
        "extreme": 5.0
    }

    def __init__(self, db_connection_string: str):
        self.db_connection_string = db_connection_string
        self.db_pool = None
        logger.info("Emotion Volatility Analyzer initialized")

    async def initialize(self):
        """데이터베이스 연결 초기화"""
        # asyncpg를 사용한 연결 풀 생성
        # self.db_pool = await asyncpg.create_pool(self.db_connection_string)
        logger.info("Database connection pool created for analyzer")

    async def close(self):
        """리소스 정리"""
        if self.db_pool:
            # await self.db_pool.close()
            logger.info("Database connection pool closed for analyzer")

    async def analyze_time_based_volatility(
        self,
        student_id: Optional[str] = None,
        module_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        min_samples: int = 5
    ) -> List[EmotionVolatilityMetrics]:
        """
        시간대별 감정 기복 분석

        Args:
            student_id: 특정 학생 ID (None이면 전체 학생)
            module_id: 특정 모듈 ID (None이면 전체 모듈)
            start_date: 분석 시작 날짜
            end_date: 분석 종료 날짜
            min_samples: 최소 샘플 개수 (이보다 적으면 제외)

        Returns:
            List[EmotionVolatilityMetrics]: 시간대별 감정 기복 메트릭 리스트
        """
        # 기본값 설정
        if not end_date:
            end_date = datetime.utcnow()
        if not start_date:
            start_date = end_date - timedelta(days=30)  # 최근 30일

        logger.info(
            f"Analyzing emotion volatility: student={student_id}, "
            f"module={module_id}, period={start_date} to {end_date}"
        )

        # 시간대별 감정 데이터 조회
        emotion_data_by_timeslot = await self._fetch_emotion_data_by_timeslot(
            student_id=student_id,
            module_id=module_id,
            start_date=start_date,
            end_date=end_date
        )

        # 각 시간대별 기복 계산
        volatility_metrics = []
        for time_slot, emotion_data_list in emotion_data_by_timeslot.items():
            if len(emotion_data_list) < min_samples:
                continue

            metrics = self._calculate_volatility_metrics(time_slot, emotion_data_list)
            volatility_metrics.append(metrics)

        # 기복이 높은 순으로 정렬
        volatility_metrics.sort(key=lambda x: x.volatility_score, reverse=True)

        logger.info(
            f"Volatility analysis completed: {len(volatility_metrics)} time slots analyzed"
        )

        return volatility_metrics

    async def _fetch_emotion_data_by_timeslot(
        self,
        student_id: Optional[str],
        module_id: Optional[str],
        start_date: datetime,
        end_date: datetime
    ) -> Dict[TimeSlot, List[Dict[str, Any]]]:
        """
        시간대별로 그룹화된 감정 데이터 조회

        Returns:
            Dict[TimeSlot, List]: 시간대를 키로 하는 감정 데이터 딕셔너리
        """
        query = """
            SELECT
                EXTRACT(HOUR FROM timestamp) AS hour,
                EXTRACT(DOW FROM timestamp) AS day_of_week,
                emotion_type,
                emotion_intensity,
                timestamp
            FROM emotion_logs
            WHERE timestamp BETWEEN $1 AND $2
        """

        params = [start_date, end_date]
        param_index = 3

        if student_id:
            query += f" AND student_id = ${param_index}"
            params.append(student_id)
            param_index += 1

        if module_id:
            query += f" AND module_id = ${param_index}"
            params.append(module_id)

        query += " ORDER BY timestamp"

        # 실제 DB 쿼리 실행 (예시)
        # async with self.db_pool.acquire() as conn:
        #     rows = await conn.fetch(query, *params)

        # 테스트용 더미 데이터
        rows = self._generate_dummy_emotion_data()

        # 시간대별로 그룹화
        emotion_by_timeslot = defaultdict(list)

        for row in rows:
            hour = int(row['hour'])
            day_of_week = int(row['day_of_week'])

            time_slot = TimeSlot(
                hour=hour,
                day_of_week=day_of_week,
                label=self._format_time_slot_label(hour, day_of_week)
            )

            emotion_by_timeslot[time_slot].append({
                'emotion_type': row['emotion_type'],
                'emotion_intensity': row['emotion_intensity'],
                'timestamp': row['timestamp']
            })

        return dict(emotion_by_timeslot)

    def _calculate_volatility_metrics(
        self,
        time_slot: TimeSlot,
        emotion_data_list: List[Dict[str, Any]]
    ) -> EmotionVolatilityMetrics:
        """
        특정 시간대의 감정 기복 메트릭 계산

        Args:
            time_slot: 시간대
            emotion_data_list: 해당 시간대의 감정 데이터 리스트

        Returns:
            EmotionVolatilityMetrics: 계산된 메트릭
        """
        # 감정 강도 리스트 추출
        intensities = [data['emotion_intensity'] for data in emotion_data_list]

        # 기복 점수 계산 (표준편차)
        volatility_score = statistics.stdev(intensities) if len(intensities) > 1 else 0

        # 평균 감정 강도
        avg_intensity = statistics.mean(intensities)

        # 감정 유형별 분포
        emotion_distribution = defaultdict(int)
        for data in emotion_data_list:
            emotion_distribution[data['emotion_type']] += 1

        # 기복 레벨 결정
        volatility_level = self._determine_volatility_level(volatility_score)

        return EmotionVolatilityMetrics(
            time_slot=time_slot,
            volatility_score=volatility_score,
            avg_intensity=avg_intensity,
            emotion_distribution=dict(emotion_distribution),
            sample_count=len(emotion_data_list),
            volatility_level=volatility_level
        )

    def _determine_volatility_level(self, volatility_score: float) -> str:
        """기복 점수를 레벨로 변환"""
        if volatility_score >= self.VOLATILITY_THRESHOLDS["extreme"]:
            return "extreme"
        elif volatility_score >= self.VOLATILITY_THRESHOLDS["high"]:
            return "high"
        elif volatility_score >= self.VOLATILITY_THRESHOLDS["medium"]:
            return "medium"
        else:
            return "low"

    def _format_time_slot_label(self, hour: int, day_of_week: int) -> str:
        """시간대 레이블 포맷팅"""
        days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        day_name = days[day_of_week]
        return f"{day_name} {hour:02d}:00-{hour+1:02d}:00"

    def _generate_dummy_emotion_data(self) -> List[Dict[str, Any]]:
        """테스트용 더미 데이터 생성"""
        import random

        dummy_data = []
        base_date = datetime.utcnow() - timedelta(days=7)

        emotion_types = ['happy', 'excited', 'neutral', 'confused', 'frustrated', 'anxious', 'bored', 'engaged']

        # 일주일간 매 시간마다 5-10개의 샘플 생성
        for day in range(7):
            for hour in range(8, 18):  # 8am - 6pm
                num_samples = random.randint(5, 10)

                for _ in range(num_samples):
                    timestamp = base_date + timedelta(days=day, hours=hour, minutes=random.randint(0, 59))

                    dummy_data.append({
                        'hour': hour,
                        'day_of_week': timestamp.weekday(),
                        'emotion_type': random.choice(emotion_types),
                        'emotion_intensity': random.randint(1, 10),
                        'timestamp': timestamp
                    })

        return dummy_data

    async def get_high_volatility_timeslots(
        self,
        student_id: Optional[str] = None,
        module_id: Optional[str] = None,
        threshold: str = "high",
        limit: int = 10
    ) -> List[EmotionVolatilityMetrics]:
        """
        감정 기복이 높은 시간대 조회

        Args:
            student_id: 학생 ID
            module_id: 모듈 ID
            threshold: 최소 기복 레벨 ("medium", "high", "extreme")
            limit: 최대 결과 개수

        Returns:
            List[EmotionVolatilityMetrics]: 기복이 높은 시간대 리스트
        """
        all_metrics = await self.analyze_time_based_volatility(
            student_id=student_id,
            module_id=module_id
        )

        # 임계값 이상인 시간대만 필터링
        threshold_levels = {"medium": 0, "high": 1, "extreme": 2}
        level_map = {"low": 0, "medium": 1, "high": 2, "extreme": 3}
        min_level = threshold_levels.get(threshold, 1)

        high_volatility_slots = [
            metric for metric in all_metrics
            if level_map[metric.volatility_level] >= min_level
        ]

        return high_volatility_slots[:limit]

    async def generate_volatility_report(
        self,
        student_id: Optional[str] = None,
        module_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        감정 기복 분석 리포트 생성

        Args:
            student_id: 학생 ID
            module_id: 모듈 ID

        Returns:
            Dict: 분석 리포트
        """
        volatility_metrics = await self.analyze_time_based_volatility(
            student_id=student_id,
            module_id=module_id
        )

        if not volatility_metrics:
            return {
                "status": "no_data",
                "message": "No emotion data available for analysis"
            }

        # 통계 계산
        all_volatility_scores = [m.volatility_score for m in volatility_metrics]
        avg_volatility = statistics.mean(all_volatility_scores)
        max_volatility = max(all_volatility_scores)

        # 기복이 가장 심한 시간대 Top 5
        top_volatile_slots = volatility_metrics[:5]

        # 요일별 평균 기복
        volatility_by_day = defaultdict(list)
        for metric in volatility_metrics:
            volatility_by_day[metric.time_slot.day_of_week].append(metric.volatility_score)

        day_averages = {
            day: statistics.mean(scores)
            for day, scores in volatility_by_day.items()
        }

        # 시간대별 평균 기복
        volatility_by_hour = defaultdict(list)
        for metric in volatility_metrics:
            volatility_by_hour[metric.time_slot.hour].append(metric.volatility_score)

        hour_averages = {
            hour: statistics.mean(scores)
            for hour, scores in volatility_by_hour.items()
        }

        # 가장 기복이 심한 요일과 시간대
        most_volatile_day = max(day_averages.items(), key=lambda x: x[1])
        most_volatile_hour = max(hour_averages.items(), key=lambda x: x[1])

        report = {
            "status": "success",
            "summary": {
                "total_timeslots_analyzed": len(volatility_metrics),
                "avg_volatility": round(avg_volatility, 2),
                "max_volatility": round(max_volatility, 2),
                "most_volatile_day": {
                    "day": self._get_day_name(most_volatile_day[0]),
                    "avg_volatility": round(most_volatile_day[1], 2)
                },
                "most_volatile_hour": {
                    "hour": f"{most_volatile_hour[0]:02d}:00",
                    "avg_volatility": round(most_volatile_hour[1], 2)
                }
            },
            "top_volatile_timeslots": [
                metric.to_dict() for metric in top_volatile_slots
            ],
            "volatility_by_day": {
                self._get_day_name(day): round(avg, 2)
                for day, avg in day_averages.items()
            },
            "volatility_by_hour": {
                f"{hour:02d}:00": round(avg, 2)
                for hour, avg in hour_averages.items()
            },
            "recommendations": self._generate_recommendations(top_volatile_slots)
        }

        return report

    def _get_day_name(self, day_of_week: int) -> str:
        """요일 번호를 이름으로 변환"""
        days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        return days[day_of_week]

    def _generate_recommendations(
        self,
        high_volatility_slots: List[EmotionVolatilityMetrics]
    ) -> List[str]:
        """
        높은 기복 시간대에 대한 권장사항 생성

        Args:
            high_volatility_slots: 기복이 높은 시간대 리스트

        Returns:
            List[str]: 권장사항 리스트
        """
        recommendations = []

        if not high_volatility_slots:
            recommendations.append("감정 기복이 안정적입니다. 현재 학습 방식을 유지하세요.")
            return recommendations

        # 가장 기복이 심한 시간대 분석
        top_slot = high_volatility_slots[0]

        recommendations.append(
            f"⚠️ {top_slot.time_slot.label} 시간대에 감정 기복이 가장 심합니다 "
            f"(기복 점수: {top_slot.volatility_score:.2f})."
        )

        # 감정 분포 기반 권장사항
        dominant_emotions = sorted(
            top_slot.emotion_distribution.items(),
            key=lambda x: x[1],
            reverse=True
        )[:2]

        if dominant_emotions:
            emotions_str = ", ".join([f"{e[0]} ({e[1]}회)" for e in dominant_emotions])
            recommendations.append(
                f"주요 감정: {emotions_str}. "
                "이 시간대의 학습 난이도나 활동 유형을 조정해보세요."
            )

        # 평균 강도 기반 권장사항
        if top_slot.avg_intensity > 7:
            recommendations.append(
                "평균 감정 강도가 높습니다. 학생들이 스트레스를 받고 있을 수 있으니 "
                "휴식 시간을 늘리거나 활동의 강도를 낮춰보세요."
            )
        elif top_slot.avg_intensity < 4:
            recommendations.append(
                "평균 감정 강도가 낮습니다. 학생들의 참여도를 높이기 위해 "
                "더 흥미로운 활동이나 인터랙티브 요소를 추가해보세요."
            )

        # 기복 레벨 기반 권장사항
        if top_slot.volatility_level == "extreme":
            recommendations.append(
                "⚠️ 극심한 감정 기복이 감지되었습니다. "
                "이 시간대의 학습 환경과 활동을 재검토하는 것을 강력히 권장합니다."
            )

        return recommendations


# 사용 예시
"""
async def main():
    analyzer = EmotionVolatilityAnalyzer(
        db_connection_string="postgresql://user:pass@localhost/emotion_db"
    )

    await analyzer.initialize()

    try:
        # 특정 학생의 감정 기복 분석
        report = await analyzer.generate_volatility_report(
            student_id="student-123",
            module_id="module-456"
        )

        print(json.dumps(report, indent=2, ensure_ascii=False))

        # 기복이 높은 시간대 조회
        high_volatility = await analyzer.get_high_volatility_timeslots(
            student_id="student-123",
            threshold="high",
            limit=5
        )

        for slot_metric in high_volatility:
            print(f"{slot_metric.time_slot.label}: {slot_metric.volatility_score:.2f}")

    finally:
        await analyzer.close()

if __name__ == "__main__":
    asyncio.run(main())
"""
