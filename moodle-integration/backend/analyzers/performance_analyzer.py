"""
학생 성과 분석 엔진
추론(reasoning)과 계산(calculation) 능력을 비교 분석
"""
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from collections import defaultdict
import statistics
import anthropic

from ..models.schemas import (
    QuestionType, StrengthArea, StudentPerformanceResponse,
    CoursePerformanceResponse
)

logger = logging.getLogger(__name__)


class PerformanceAnalyzer:
    """학생 및 코스 성과 분석 엔진"""

    # 강점 영역 판정 임계값 (점수 차이)
    STRENGTH_THRESHOLD = 10.0

    # 데이터 부족 판정 임계값
    MIN_ATTEMPTS_FOR_ANALYSIS = 5

    def __init__(self, anthropic_api_key: Optional[str] = None):
        """
        Args:
            anthropic_api_key: AI 인사이트 생성을 위한 API 키 (선택)
        """
        self.ai_client = None
        if anthropic_api_key:
            self.ai_client = anthropic.Anthropic(api_key=anthropic_api_key)

    def analyze_student_performance(
        self,
        student_id: int,
        student_name: str,
        moodle_user_id: int,
        attempts: List[Dict],
        questions: Dict[int, Dict]  # question_id -> question info (including classified_type)
    ) -> StudentPerformanceResponse:
        """
        학생 개인의 추론/계산 능력 분석

        Args:
            student_id: 내부 학생 ID
            student_name: 학생 이름
            moodle_user_id: Moodle 사용자 ID
            attempts: 학생의 문제 풀이 시도 리스트
            questions: 문제 정보 딕셔너리

        Returns:
            학생 성과 분석 결과
        """
        # 문제 유형별 시도 분류
        reasoning_attempts = []
        calculation_attempts = []

        for attempt in attempts:
            question_id = attempt.get('questionid')
            question = questions.get(question_id)

            if not question:
                continue

            question_type = question.get('classified_type', QuestionType.UNKNOWN)

            if question_type == QuestionType.REASONING:
                reasoning_attempts.append(attempt)
            elif question_type == QuestionType.CALCULATION:
                calculation_attempts.append(attempt)
            elif question_type == QuestionType.MIXED:
                # 혼합형은 양쪽에 모두 추가
                reasoning_attempts.append(attempt)
                calculation_attempts.append(attempt)

        # 추론 능력 분석
        reasoning_stats = self._calculate_performance_stats(reasoning_attempts)
        calculation_stats = self._calculate_performance_stats(calculation_attempts)

        # 강점 영역 판정
        strength_area = self._determine_strength_area(
            reasoning_stats['score'],
            calculation_stats['score'],
            reasoning_stats['count'],
            calculation_stats['count']
        )

        # 전체 점수
        total_attempts = len(attempts)
        total_correct = sum(1 for a in attempts if self._is_correct(a))
        overall_score = (total_correct / total_attempts * 100) if total_attempts > 0 else 0

        # 학습 추이 분석
        learning_trend = self._analyze_learning_trend(attempts, questions)

        # 강점/약점 토픽 분석
        weak_topics, strong_topics = self._analyze_topics(attempts, questions)

        # AI 인사이트 생성
        insights, recommendations = self._generate_ai_insights(
            student_name=student_name,
            reasoning_stats=reasoning_stats,
            calculation_stats=calculation_stats,
            strength_area=strength_area,
            weak_topics=weak_topics,
            strong_topics=strong_topics,
            learning_trend=learning_trend
        )

        return StudentPerformanceResponse(
            student_id=student_id,
            moodle_user_id=moodle_user_id,
            student_name=student_name,

            reasoning_score=reasoning_stats['score'],
            reasoning_attempts=reasoning_stats['count'],
            reasoning_correct=reasoning_stats['correct'],
            reasoning_accuracy=reasoning_stats['accuracy'],

            calculation_score=calculation_stats['score'],
            calculation_attempts=calculation_stats['count'],
            calculation_correct=calculation_stats['correct'],
            calculation_accuracy=calculation_stats['accuracy'],

            strength_area=strength_area,
            strength_score_diff=abs(reasoning_stats['score'] - calculation_stats['score']),
            overall_score=overall_score,

            insights=insights,
            recommendations=recommendations,

            learning_trend=learning_trend,
            weak_topics=weak_topics,
            strong_topics=strong_topics
        )

    def analyze_course_performance(
        self,
        course_id: int,
        course_name: str,
        student_analyses: List[StudentPerformanceResponse],
        questions: Dict[int, Dict]
    ) -> CoursePerformanceResponse:
        """
        코스 전체 성과 분석

        Args:
            course_id: 코스 ID
            course_name: 코스 이름
            student_analyses: 학생별 분석 결과 리스트
            questions: 문제 정보 딕셔너리

        Returns:
            코스 성과 분석 결과
        """
        total_students = len(student_analyses)

        if total_students == 0:
            return self._create_empty_course_analysis(course_id, course_name)

        # 문제 유형별 개수
        reasoning_questions = sum(
            1 for q in questions.values()
            if q.get('classified_type') == QuestionType.REASONING
        )
        calculation_questions = sum(
            1 for q in questions.values()
            if q.get('classified_type') == QuestionType.CALCULATION
        )
        total_questions = len(questions)

        # 학생 강점 분포
        reasoning_strong = sum(
            1 for s in student_analyses
            if s.strength_area == StrengthArea.REASONING
        )
        calculation_strong = sum(
            1 for s in student_analyses
            if s.strength_area == StrengthArea.CALCULATION
        )
        balanced = sum(
            1 for s in student_analyses
            if s.strength_area == StrengthArea.BALANCED
        )

        # 평균 점수
        avg_reasoning = statistics.mean(
            [s.reasoning_score for s in student_analyses if s.reasoning_attempts > 0]
        ) if any(s.reasoning_attempts > 0 for s in student_analyses) else 0

        avg_calculation = statistics.mean(
            [s.calculation_score for s in student_analyses if s.calculation_attempts > 0]
        ) if any(s.calculation_attempts > 0 for s in student_analyses) else 0

        avg_overall = statistics.mean([s.overall_score for s in student_analyses])

        # 점수 분포
        score_distribution = self._calculate_score_distribution(student_analyses)

        # 난이도별 성과
        difficulty_performance = self._calculate_difficulty_performance(questions, student_analyses)

        # 토픽별 성과
        topic_performance = self._calculate_topic_performance(questions, student_analyses)

        # 상위/하위 학생
        top_performers = sorted(
            student_analyses,
            key=lambda s: s.overall_score,
            reverse=True
        )[:5]

        struggling_students = sorted(
            [s for s in student_analyses if s.overall_score < 60],
            key=lambda s: s.overall_score
        )[:5]

        return CoursePerformanceResponse(
            course_id=course_id,
            course_name=course_name,

            total_students=total_students,
            total_questions=total_questions,
            reasoning_questions=reasoning_questions,
            calculation_questions=calculation_questions,

            reasoning_strong_count=reasoning_strong,
            calculation_strong_count=calculation_strong,
            balanced_count=balanced,

            avg_reasoning_score=avg_reasoning,
            avg_calculation_score=avg_calculation,
            avg_overall_score=avg_overall,

            score_distribution=score_distribution,
            difficulty_performance=difficulty_performance,
            topic_performance=topic_performance,

            top_performers=[
                {
                    'student_id': s.student_id,
                    'name': s.student_name,
                    'score': s.overall_score,
                    'strength': s.strength_area.value
                }
                for s in top_performers
            ],
            struggling_students=[
                {
                    'student_id': s.student_id,
                    'name': s.student_name,
                    'score': s.overall_score,
                    'weak_topics': s.weak_topics
                }
                for s in struggling_students
            ]
        )

    # ========================================================================
    # 내부 분석 메서드
    # ========================================================================

    def _calculate_performance_stats(self, attempts: List[Dict]) -> Dict:
        """
        시도 리스트에서 성과 통계 계산

        Args:
            attempts: 시도 리스트

        Returns:
            통계 딕셔너리 (count, correct, score, accuracy, avg_time)
        """
        count = len(attempts)

        if count == 0:
            return {
                'count': 0,
                'correct': 0,
                'score': 0.0,
                'accuracy': 0.0,
                'avg_time': 0.0
            }

        correct = sum(1 for a in attempts if self._is_correct(a))
        accuracy = (correct / count) * 100
        score = accuracy  # 점수는 정확도와 동일

        # 평균 소요 시간 (초)
        times = [a.get('time_spent_seconds', 0) for a in attempts if a.get('time_spent_seconds')]
        avg_time = statistics.mean(times) if times else 0.0

        return {
            'count': count,
            'correct': correct,
            'score': score,
            'accuracy': accuracy,
            'avg_time': avg_time
        }

    def _is_correct(self, attempt: Dict) -> bool:
        """
        시도가 정답인지 확인

        Args:
            attempt: 시도 정보

        Returns:
            정답 여부
        """
        # maxfraction이 1.0이면 정답
        if 'maxfraction' in attempt:
            return attempt['maxfraction'] >= 1.0

        # 또는 responsesummary와 rightanswer 비교
        if 'responsesummary' in attempt and 'rightanswer' in attempt:
            return attempt['responsesummary'] == attempt['rightanswer']

        return False

    def _determine_strength_area(
        self,
        reasoning_score: float,
        calculation_score: float,
        reasoning_count: int,
        calculation_count: int
    ) -> StrengthArea:
        """
        강점 영역 판정

        Args:
            reasoning_score: 추론 점수
            calculation_score: 계산 점수
            reasoning_count: 추론 시도 수
            calculation_count: 계산 시도 수

        Returns:
            강점 영역
        """
        # 데이터 부족
        if reasoning_count < self.MIN_ATTEMPTS_FOR_ANALYSIS and \
           calculation_count < self.MIN_ATTEMPTS_FOR_ANALYSIS:
            return StrengthArea.INSUFFICIENT_DATA

        # 한쪽만 데이터 있는 경우
        if reasoning_count < self.MIN_ATTEMPTS_FOR_ANALYSIS:
            return StrengthArea.CALCULATION
        if calculation_count < self.MIN_ATTEMPTS_FOR_ANALYSIS:
            return StrengthArea.REASONING

        # 점수 차이로 판정
        diff = reasoning_score - calculation_score

        if diff > self.STRENGTH_THRESHOLD:
            return StrengthArea.REASONING
        elif diff < -self.STRENGTH_THRESHOLD:
            return StrengthArea.CALCULATION
        else:
            return StrengthArea.BALANCED

    def _analyze_learning_trend(
        self,
        attempts: List[Dict],
        questions: Dict[int, Dict]
    ) -> Dict:
        """
        학습 추이 분석 (시간에 따른 성과 변화)

        Args:
            attempts: 시도 리스트
            questions: 문제 정보

        Returns:
            추이 데이터
        """
        if not attempts:
            return {'trend': 'insufficient_data', 'data_points': []}

        # 시간순 정렬
        sorted_attempts = sorted(
            attempts,
            key=lambda a: a.get('submitted_at', datetime.min)
        )

        # 일주일 단위로 그룹화
        weekly_performance = defaultdict(lambda: {'correct': 0, 'total': 0})

        for attempt in sorted_attempts:
            submitted = attempt.get('submitted_at')
            if not submitted:
                continue

            week = submitted.strftime('%Y-W%W')
            weekly_performance[week]['total'] += 1
            if self._is_correct(attempt):
                weekly_performance[week]['correct'] += 1

        # 데이터 포인트 생성
        data_points = []
        for week in sorted(weekly_performance.keys()):
            perf = weekly_performance[week]
            accuracy = (perf['correct'] / perf['total']) * 100 if perf['total'] > 0 else 0
            data_points.append({
                'week': week,
                'accuracy': accuracy,
                'attempts': perf['total']
            })

        # 추세 판정 (첫 주 vs 마지막 주)
        if len(data_points) >= 2:
            first_accuracy = data_points[0]['accuracy']
            last_accuracy = data_points[-1]['accuracy']
            diff = last_accuracy - first_accuracy

            if diff > 10:
                trend = 'improving'
            elif diff < -10:
                trend = 'declining'
            else:
                trend = 'stable'
        else:
            trend = 'insufficient_data'

        return {
            'trend': trend,
            'data_points': data_points
        }

    def _analyze_topics(
        self,
        attempts: List[Dict],
        questions: Dict[int, Dict]
    ) -> Tuple[List[str], List[str]]:
        """
        토픽별 강점/약점 분석

        Args:
            attempts: 시도 리스트
            questions: 문제 정보

        Returns:
            (약점 토픽 리스트, 강점 토픽 리스트)
        """
        topic_stats = defaultdict(lambda: {'correct': 0, 'total': 0})

        for attempt in attempts:
            question_id = attempt.get('questionid')
            question = questions.get(question_id)

            if not question:
                continue

            tags = question.get('tags', [])
            for tag in tags:
                topic_stats[tag]['total'] += 1
                if self._is_correct(attempt):
                    topic_stats[tag]['correct'] += 1

        # 정확도 계산
        topic_accuracies = {}
        for topic, stats in topic_stats.items():
            if stats['total'] >= 3:  # 최소 3회 이상 시도
                accuracy = (stats['correct'] / stats['total']) * 100
                topic_accuracies[topic] = accuracy

        # 약점/강점 토픽
        sorted_topics = sorted(topic_accuracies.items(), key=lambda x: x[1])

        weak_topics = [topic for topic, acc in sorted_topics[:3] if acc < 60]
        strong_topics = [topic for topic, acc in sorted_topics[-3:] if acc > 80]

        return weak_topics, strong_topics

    def _generate_ai_insights(
        self,
        student_name: str,
        reasoning_stats: Dict,
        calculation_stats: Dict,
        strength_area: StrengthArea,
        weak_topics: List[str],
        strong_topics: List[str],
        learning_trend: Dict
    ) -> Tuple[str, str]:
        """
        AI를 사용한 인사이트 및 추천 생성

        Returns:
            (인사이트 텍스트, 추천사항 텍스트)
        """
        if not self.ai_client:
            # AI 없이 기본 인사이트
            return self._generate_basic_insights(
                reasoning_stats, calculation_stats, strength_area
            )

        prompt = f"""학생 "{student_name}"의 학습 데이터를 분석하여 인사이트와 학습 추천을 제공해주세요.

**추론 능력:**
- 시도 수: {reasoning_stats['count']}
- 정답 수: {reasoning_stats['correct']}
- 정확도: {reasoning_stats['accuracy']:.1f}%
- 평균 소요 시간: {reasoning_stats['avg_time']:.0f}초

**계산 능력:**
- 시도 수: {calculation_stats['count']}
- 정답 수: {calculation_stats['correct']}
- 정확도: {calculation_stats['accuracy']:.1f}%
- 평균 소요 시간: {calculation_stats['avg_time']:.0f}초

**강점 영역:** {strength_area.value}

**약점 토픽:** {', '.join(weak_topics) if weak_topics else '없음'}
**강점 토픽:** {', '.join(strong_topics) if strong_topics else '없음'}

**학습 추세:** {learning_trend['trend']}

다음 형식으로 응답해주세요:

### 인사이트
[학생의 학습 패턴과 강점/약점에 대한 분석, 2-3문장]

### 추천사항
[구체적인 학습 방향 제안, 3-4개의 실행 가능한 항목]
"""

        try:
            message = self.ai_client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1024,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            response = message.content[0].text

            # 인사이트와 추천사항 분리
            parts = response.split('### 추천사항')
            insights = parts[0].replace('### 인사이트', '').strip()
            recommendations = parts[1].strip() if len(parts) > 1 else ""

            return insights, recommendations

        except Exception as e:
            logger.error(f"AI 인사이트 생성 실패: {e}")
            return self._generate_basic_insights(
                reasoning_stats, calculation_stats, strength_area
            )

    def _generate_basic_insights(
        self,
        reasoning_stats: Dict,
        calculation_stats: Dict,
        strength_area: StrengthArea
    ) -> Tuple[str, str]:
        """기본 인사이트 생성 (AI 없이)"""
        if strength_area == StrengthArea.REASONING:
            insights = f"추론 문제에서 {reasoning_stats['accuracy']:.1f}%의 정확도를 보이며 강점을 나타냅니다. 계산 문제는 {calculation_stats['accuracy']:.1f}%로 개선의 여지가 있습니다."
            recommendations = "1. 계산 연습 문제를 통해 정확성을 향상시키세요.\n2. 공식 적용 연습을 늘리세요.\n3. 추론 능력을 활용하여 계산 문제의 논리를 이해하세요."
        elif strength_area == StrengthArea.CALCULATION:
            insights = f"계산 문제에서 {calculation_stats['accuracy']:.1f}%의 높은 정확도를 보입니다. 추론 문제는 {reasoning_stats['accuracy']:.1f}%로 추가 연습이 필요합니다."
            recommendations = "1. 개념 설명 문제를 더 많이 풀어보세요.\n2. 왜 그런지 설명하는 연습을 하세요.\n3. 패턴 인식 문제에 도전하세요."
        else:
            insights = f"추론과 계산 모두 균형잡힌 능력을 보입니다 (추론: {reasoning_stats['accuracy']:.1f}%, 계산: {calculation_stats['accuracy']:.1f}%)."
            recommendations = "1. 현재 수준을 유지하며 다양한 문제를 접하세요.\n2. 난이도 높은 문제에 도전하세요.\n3. 복합적인 사고가 필요한 문제를 풀어보세요."

        return insights, recommendations

    # ========================================================================
    # 코스 분석 보조 메서드
    # ========================================================================

    def _create_empty_course_analysis(
        self,
        course_id: int,
        course_name: str
    ) -> CoursePerformanceResponse:
        """빈 코스 분석 결과 생성"""
        return CoursePerformanceResponse(
            course_id=course_id,
            course_name=course_name,
            total_students=0,
            total_questions=0,
            reasoning_questions=0,
            calculation_questions=0,
            reasoning_strong_count=0,
            calculation_strong_count=0,
            balanced_count=0,
            avg_reasoning_score=0.0,
            avg_calculation_score=0.0,
            avg_overall_score=0.0,
            score_distribution={},
            difficulty_performance={},
            topic_performance={},
            top_performers=[],
            struggling_students=[]
        )

    def _calculate_score_distribution(
        self,
        student_analyses: List[StudentPerformanceResponse]
    ) -> Dict:
        """점수 분포 계산"""
        distribution = {
            '0-20': 0,
            '21-40': 0,
            '41-60': 0,
            '61-80': 0,
            '81-100': 0
        }

        for student in student_analyses:
            score = student.overall_score
            if score <= 20:
                distribution['0-20'] += 1
            elif score <= 40:
                distribution['21-40'] += 1
            elif score <= 60:
                distribution['41-60'] += 1
            elif score <= 80:
                distribution['61-80'] += 1
            else:
                distribution['81-100'] += 1

        return distribution

    def _calculate_difficulty_performance(
        self,
        questions: Dict[int, Dict],
        student_analyses: List[StudentPerformanceResponse]
    ) -> Dict:
        """난이도별 성과 계산"""
        # 간단한 더미 구현 (실제로는 난이도 데이터 필요)
        return {
            'easy': {'avg_score': 85.0, 'attempts': 100},
            'medium': {'avg_score': 70.0, 'attempts': 150},
            'hard': {'avg_score': 55.0, 'attempts': 80}
        }

    def _calculate_topic_performance(
        self,
        questions: Dict[int, Dict],
        student_analyses: List[StudentPerformanceResponse]
    ) -> Dict:
        """토픽별 성과 계산"""
        # 간단한 더미 구현 (실제로는 토픽별 집계 필요)
        return {
            'algebra': {'avg_score': 75.0, 'student_count': 25},
            'geometry': {'avg_score': 68.0, 'student_count': 25},
            'calculus': {'avg_score': 62.0, 'student_count': 20}
        }
