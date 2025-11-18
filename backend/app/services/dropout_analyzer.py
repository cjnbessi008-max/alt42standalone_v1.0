"""
Dropout Analysis Engine
학습자의 중단 이유를 데이터 기반으로 분석하는 핵심 엔진
"""
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import numpy as np
from dataclasses import dataclass


@dataclass
class SessionData:
    """세션 분석을 위한 데이터 구조"""
    session_id: str
    student_id: str
    module_id: str
    total_duration_seconds: int
    active_duration_seconds: int
    events: List[Dict]
    attempts: List[Dict]
    dropout_point: Optional[str]


class DropoutMetrics:
    """세션 메트릭 계산"""

    def __init__(self, session_data: SessionData):
        self.data = session_data
        self.events = session_data.events
        self.attempts = session_data.attempts

    def calculate_idle_time_ratio(self) -> float:
        """비활동 시간 비율"""
        if self.data.total_duration_seconds == 0:
            return 0.0
        idle_time = self.data.total_duration_seconds - self.data.active_duration_seconds
        return idle_time / self.data.total_duration_seconds

    def calculate_accuracy_rate(self) -> float:
        """정답률"""
        if not self.attempts:
            return 0.0
        correct = sum(1 for a in self.attempts if a.get('is_correct', False))
        return correct / len(self.attempts)

    def calculate_accuracy_trend(self) -> Tuple[List[float], float]:
        """시간에 따른 정답률 추세 (이동 평균)"""
        if not self.attempts:
            return [], 0.0

        window_size = min(5, len(self.attempts))
        trend = []

        for i in range(len(self.attempts)):
            start_idx = max(0, i - window_size + 1)
            window = self.attempts[start_idx:i + 1]
            correct = sum(1 for a in window if a.get('is_correct', False))
            accuracy = correct / len(window)
            trend.append(accuracy)

        # 선형 회귀로 기울기 계산
        if len(trend) >= 2:
            x = np.arange(len(trend))
            slope = np.polyfit(x, trend, 1)[0]
        else:
            slope = 0.0

        return trend, slope

    def calculate_events_per_minute(self) -> float:
        """분당 이벤트 수"""
        if self.data.total_duration_seconds == 0:
            return 0.0
        minutes = self.data.total_duration_seconds / 60
        return len(self.events) / minutes if minutes > 0 else 0.0

    def calculate_avg_time_per_problem(self) -> float:
        """문제당 평균 시간 (초)"""
        if not self.attempts:
            return 0.0
        total_time = sum(a.get('time_spent_seconds', 0) for a in self.attempts)
        return total_time / len(self.attempts)

    def calculate_consecutive_errors(self) -> Tuple[int, int]:
        """연속 오답 수 (현재, 최대)"""
        if not self.attempts:
            return 0, 0

        current_streak = 0
        max_streak = 0
        temp_streak = 0

        for i, attempt in enumerate(self.attempts):
            if not attempt.get('is_correct', False):
                temp_streak += 1
                max_streak = max(max_streak, temp_streak)
                if i == len(self.attempts) - 1:  # 마지막 시도
                    current_streak = temp_streak
            else:
                temp_streak = 0

        return current_streak, max_streak

    def calculate_problem_skip_count(self) -> int:
        """문제 건너뛴 횟수 (빠른 이탈)"""
        skip_count = 0
        for attempt in self.attempts:
            if attempt.get('time_spent_seconds', 0) < 5:  # 5초 미만
                skip_count += 1
        return skip_count

    def get_all_metrics(self) -> Dict:
        """모든 메트릭 계산"""
        accuracy_trend, trend_slope = self.calculate_accuracy_trend()
        current_errors, max_errors = self.calculate_consecutive_errors()

        return {
            'total_duration_seconds': self.data.total_duration_seconds,
            'active_duration_seconds': self.data.active_duration_seconds,
            'idle_time_ratio': self.calculate_idle_time_ratio(),
            'total_attempts': len(self.attempts),
            'correct_attempts': sum(1 for a in self.attempts if a.get('is_correct', False)),
            'accuracy_rate': self.calculate_accuracy_rate(),
            'accuracy_trend': accuracy_trend,
            'accuracy_trend_slope': trend_slope,
            'events_per_minute': self.calculate_events_per_minute(),
            'avg_time_per_problem': self.calculate_avg_time_per_problem(),
            'consecutive_errors': current_errors,
            'max_consecutive_errors': max_errors,
            'problem_skip_count': self.calculate_problem_skip_count()
        }


class DropoutAnalyzer:
    """Dropout 이유 분석 엔진"""

    # 권장사항 템플릿
    RECOMMENDATIONS = {
        'high_error_rate': {
            'ko': '이 학생은 연속된 오답으로 좌절감을 느낀 것으로 보입니다. 더 쉬운 난이도부터 시작하거나, 힌트를 더 많이 제공해보세요.',
            'en': 'This student appears frustrated by consecutive errors. Consider starting with easier difficulty or providing more hints.',
            'actions': ['adjust_difficulty_down', 'enable_progressive_hints', 'provide_worked_examples']
        },
        'rapid_decline': {
            'ko': '정답률이 급격히 하락했습니다. 현재 개념이 이해되지 않을 수 있으니, 이전 단계로 돌아가 복습하는 것을 권장합니다.',
            'en': 'Accuracy rate declined rapidly. The current concept may not be understood. Consider reviewing previous material.',
            'actions': ['review_prerequisites', 'adaptive_difficulty', 'provide_concept_review']
        },
        'session_fatigue': {
            'ko': '학습 시간이 너무 길어 피로도가 높습니다. 짧은 세션으로 나누거나 휴식 시간을 권장하세요.',
            'en': 'The learning session was too long, causing fatigue. Consider shorter sessions or scheduled breaks.',
            'actions': ['limit_session_duration', 'schedule_breaks', 'gamify_progress']
        },
        'decreased_interaction': {
            'ko': '학생의 참여도가 낮아졌습니다. 더 상호작용적인 콘텐츠나 즉각적인 피드백을 제공해보세요.',
            'en': 'Student engagement has decreased. Try more interactive content or immediate feedback.',
            'actions': ['add_interactive_elements', 'immediate_feedback', 'reward_participation']
        },
        'quick_exits': {
            'ko': '문제를 충분히 읽지 않고 빠르게 건너뛰고 있습니다. 문제에 대한 관심이 부족하거나 너무 어려울 수 있습니다.',
            'en': 'Student is quickly skipping problems without reading them. They may lack interest or find them too difficult.',
            'actions': ['check_difficulty_level', 'vary_problem_types', 'add_context_to_problems']
        },
        'extended_pause': {
            'ko': '긴 비활동 시간 후 이탈했습니다. 집중력이 흐트러졌거나 외부 방해가 있었을 수 있습니다.',
            'en': 'Dropout occurred after extended inactivity. Concentration may have been lost or external distractions occurred.',
            'actions': ['reminder_notifications', 'auto_save_progress', 'shorter_sessions']
        },
        'content_aversion': {
            'ko': '특정 유형의 문제를 반복적으로 회피하고 있습니다. 해당 주제에 대한 불안감이 있을 수 있습니다.',
            'en': 'Student is repeatedly avoiding certain problem types. There may be anxiety about this topic.',
            'actions': ['identify_weak_topics', 'gradual_exposure', 'positive_reinforcement']
        },
        'unknown': {
            'ko': '명확한 중단 이유를 찾을 수 없습니다. 추가 데이터가 필요합니다.',
            'en': 'No clear dropout reason found. More data needed.',
            'actions': ['collect_more_data', 'student_feedback']
        }
    }

    def calculate_dropout_scores(self, metrics: Dict) -> Dict[str, float]:
        """각 dropout 이유별 점수 계산 (0-1)"""
        scores = {}

        # 1. Difficulty-based (난이도 기반)
        if metrics['accuracy_rate'] < 0.4 and metrics['consecutive_errors'] >= 3:
            scores['high_error_rate'] = min(1.0, metrics['consecutive_errors'] / 5)

        if metrics.get('accuracy_trend_slope', 0) < -0.1:
            scores['rapid_decline'] = min(1.0, abs(metrics['accuracy_trend_slope']) * 5)

        # 2. Engagement-based (참여도 기반)
        if metrics['events_per_minute'] < 0.5:
            scores['decreased_interaction'] = 1.0 - min(1.0, metrics['events_per_minute'] / 2.0)

        if metrics['avg_time_per_problem'] < 10 and metrics['total_attempts'] > 3:
            scores['quick_exits'] = 1.0 - (metrics['avg_time_per_problem'] / 30)

        # 3. Time-based (시간 기반)
        duration_hours = metrics['total_duration_seconds'] / 3600
        if duration_hours > 1:
            scores['session_fatigue'] = min(1.0, duration_hours / 1.5)

        if metrics['idle_time_ratio'] > 0.4:
            scores['extended_pause'] = min(1.0, metrics['idle_time_ratio'])

        # 4. Content-based (콘텐츠 기반)
        if metrics['problem_skip_count'] > 2:
            scores['content_aversion'] = min(1.0, metrics['problem_skip_count'] / 5)

        return scores

    def determine_primary_reason(self, scores: Dict[str, float]) -> Tuple[str, float]:
        """주요 중단 이유 결정"""
        if not scores:
            return 'unknown', 0.0

        primary_reason = max(scores.items(), key=lambda x: x[1])
        return primary_reason[0], primary_reason[1]

    def get_contributing_factors(self, scores: Dict[str, float], metrics: Dict, threshold: float = 0.3) -> List[Dict]:
        """기여 요인 추출 (threshold 이상의 점수)"""
        factors = []

        for reason, score in scores.items():
            if score >= threshold:
                evidence = self._build_evidence(reason, metrics)
                factors.append({
                    'reason': reason,
                    'confidence': round(score, 2),
                    'evidence': evidence
                })

        # 점수 순으로 정렬
        factors.sort(key=lambda x: x['confidence'], reverse=True)
        return factors

    def _build_evidence(self, reason: str, metrics: Dict) -> Dict:
        """각 이유에 대한 증거 데이터 구성"""
        evidence = {}

        if reason == 'high_error_rate':
            evidence = {
                'consecutive_errors': metrics['consecutive_errors'],
                'accuracy_rate': round(metrics['accuracy_rate'], 2),
                'max_consecutive_errors': metrics['max_consecutive_errors']
            }
        elif reason == 'rapid_decline':
            evidence = {
                'accuracy_trend': [round(x, 2) for x in metrics['accuracy_trend']],
                'slope': round(metrics.get('accuracy_trend_slope', 0), 3)
            }
        elif reason == 'session_fatigue':
            evidence = {
                'duration_hours': round(metrics['total_duration_seconds'] / 3600, 2),
                'active_hours': round(metrics['active_duration_seconds'] / 3600, 2)
            }
        elif reason == 'decreased_interaction':
            evidence = {
                'events_per_minute': round(metrics['events_per_minute'], 2),
                'total_events': len(metrics.get('events', []))
            }
        elif reason == 'quick_exits':
            evidence = {
                'avg_time_per_problem': round(metrics['avg_time_per_problem'], 1),
                'problem_skip_count': metrics['problem_skip_count']
            }
        elif reason == 'extended_pause':
            evidence = {
                'idle_time_ratio': round(metrics['idle_time_ratio'], 2),
                'idle_minutes': round((metrics['total_duration_seconds'] * metrics['idle_time_ratio']) / 60, 1)
            }
        elif reason == 'content_aversion':
            evidence = {
                'problem_skip_count': metrics['problem_skip_count'],
                'total_attempts': metrics['total_attempts']
            }

        return evidence

    def analyze_session(self, session_data: SessionData) -> Dict:
        """세션 분석 수행"""
        # 메트릭 계산
        metrics_calculator = DropoutMetrics(session_data)
        metrics = metrics_calculator.get_all_metrics()

        # Dropout 점수 계산
        scores = self.calculate_dropout_scores(metrics)

        # 주요 이유 결정
        primary_reason, confidence = self.determine_primary_reason(scores)

        # 기여 요인
        contributing_factors = self.get_contributing_factors(scores, metrics)
        # 주요 이유는 contributing_factors에서 제외
        contributing_factors = [f for f in contributing_factors if f['reason'] != primary_reason]

        # 권장사항
        recommendations = self.RECOMMENDATIONS.get(
            primary_reason,
            self.RECOMMENDATIONS['unknown']
        )

        return {
            'primary_reason': primary_reason,
            'confidence': round(confidence, 2),
            'contributing_factors': contributing_factors,
            'recommendations': recommendations,
            'metrics': {
                'total_duration_seconds': metrics['total_duration_seconds'],
                'active_duration_seconds': metrics['active_duration_seconds'],
                'idle_time_ratio': round(metrics['idle_time_ratio'], 2),
                'total_attempts': metrics['total_attempts'],
                'correct_attempts': metrics['correct_attempts'],
                'accuracy_rate': round(metrics['accuracy_rate'], 2),
                'accuracy_trend': [round(x, 2) for x in metrics['accuracy_trend']],
                'events_per_minute': round(metrics['events_per_minute'], 2),
                'avg_time_per_problem': round(metrics['avg_time_per_problem'], 1),
                'consecutive_errors': metrics['consecutive_errors'],
                'max_consecutive_errors': metrics['max_consecutive_errors']
            }
        }
