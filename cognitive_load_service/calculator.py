"""
인지 부하 계산기
"""

import re
from typing import Dict, List
from .models import (
    ProblemAnalysisRequest,
    ProblemType,
    DifficultyLevel,
    CognitiveLoadScore,
    RuleBasedAnalysis,
    AIAnalysisResult
)


class CognitiveLoadCalculator:
    """
    인지 부하 계산 엔진
    """

    # 문제 유형별 가중치
    TYPE_WEIGHTS = {
        ProblemType.CALCULATION: {
            'intrinsic': 0.3,
            'extraneous': 0.5,
            'germane': 0.2
        },
        ProblemType.WORD_PROBLEM: {
            'intrinsic': 0.4,
            'extraneous': 0.4,
            'germane': 0.2
        },
        ProblemType.MULTISTEP: {
            'intrinsic': 0.5,
            'extraneous': 0.3,
            'germane': 0.2
        },
        ProblemType.CONCEPTUAL: {
            'intrinsic': 0.3,
            'extraneous': 0.2,
            'germane': 0.5
        },
        ProblemType.PROBLEM_SOLVING: {
            'intrinsic': 0.6,
            'extraneous': 0.2,
            'germane': 0.2
        },
        ProblemType.PROOF: {
            'intrinsic': 0.7,
            'extraneous': 0.1,
            'germane': 0.2
        },
    }

    # 학년별 기준 복잡도 조정
    GRADE_ADJUSTMENTS = {
        range(1, 3): 0.7,   # 1-2학년: 70%로 조정
        range(3, 5): 0.85,  # 3-4학년: 85%로 조정
        range(5, 7): 1.0,   # 5-6학년: 조정 없음
        range(7, 9): 1.15,  # 7-8학년: 115%로 조정
        range(9, 13): 1.3,  # 9-12학년: 130%로 조정
    }

    def __init__(self):
        self.math_keywords = self._load_math_keywords()

    def _load_math_keywords(self) -> Dict[str, List[str]]:
        """수학 키워드 사전"""
        return {
            'arithmetic': ['더하기', '빼기', '곱하기', '나누기', 'add', 'subtract', 'multiply', 'divide', '+', '-', '×', '÷'],
            'fractions': ['분수', 'fraction', '분자', '분모', 'numerator', 'denominator'],
            'geometry': ['삼각형', '사각형', '원', 'triangle', 'square', 'circle', '넓이', 'area', '둘레', 'perimeter'],
            'algebra': ['방정식', 'equation', '변수', 'variable', 'x', 'y', '미지수'],
            'logic': ['증명', 'proof', '논리', 'logic', '귀납법', 'induction'],
        }

    def calculate_rule_based(self, request: ProblemAnalysisRequest) -> RuleBasedAnalysis:
        """
        규칙 기반 인지 부하 계산
        """
        text = request.question_text
        html = request.question_html or ""

        # 기본 텍스트 분석
        text_length = len(text)
        word_count = len(text.split())
        sentence_count = max(1, text.count('.') + text.count('?') + text.count('!'))

        # 수식 및 숫자 개수
        equation_count = len(re.findall(r'[+\-*/=×÷]', text))
        number_count = len(re.findall(r'\d+', text))

        # HTML 요소 분석
        has_diagram = bool(re.search(r'<img|<svg', html, re.IGNORECASE))
        has_table = bool(re.search(r'<table', html, re.IGNORECASE))

        # 복잡도 점수 계산
        # 언어적 복잡도: 단어 수 기반 (100단어 = 10점)
        linguistic_complexity = min(10, (word_count / 10))

        # 정보 밀도: 문장당 단어 수 기반
        words_per_sentence = word_count / sentence_count
        information_density = min(10, (words_per_sentence / 5) * 2)

        return RuleBasedAnalysis(
            linguistic_complexity=round(linguistic_complexity, 2),
            information_density=round(information_density, 2),
            equation_count=equation_count,
            number_count=number_count,
            word_count=word_count,
            sentence_count=sentence_count,
            has_diagram=has_diagram,
            has_table=has_table
        )

    def compute_final_score(
        self,
        ai_analysis: AIAnalysisResult,
        rule_analysis: RuleBasedAnalysis,
        problem_type: ProblemType,
        grade_level: int
    ) -> Dict:
        """
        AI 분석과 규칙 기반 분석을 결합하여 최종 점수 계산
        """
        # 내재적 부하 계산
        intrinsic = (
            ai_analysis.intrinsic.concept_complexity * 0.3 +
            ai_analysis.intrinsic.relationship_complexity * 0.3 +
            ai_analysis.intrinsic.required_steps * 0.2 +
            ai_analysis.intrinsic.prerequisite_knowledge * 0.2
        )

        # 외재적 부하 계산
        extraneous = (
            ai_analysis.extraneous.information_density * 0.4 +
            ai_analysis.extraneous.visual_complexity * 0.3 +
            ai_analysis.extraneous.linguistic_complexity * 0.3
        )

        # 본유적 부하 계산
        germane = (
            ai_analysis.germane.abstraction_level * 0.4 +
            ai_analysis.germane.pattern_recognition * 0.3 +
            ai_analysis.germane.transfer_potential * 0.3
        )

        # 규칙 기반 분석으로 조정
        if rule_analysis.has_diagram or rule_analysis.has_table:
            extraneous = min(10, extraneous + 1.5)

        if rule_analysis.word_count > 100:
            extraneous = min(10, extraneous + 1.0)

        # 문제 유형별 가중치 적용
        weights = self.TYPE_WEIGHTS.get(problem_type, {
            'intrinsic': 0.5,
            'extraneous': 0.3,
            'germane': 0.2
        })

        # 총점 계산 (0-100 스케일)
        total_score = (
            intrinsic * weights['intrinsic'] +
            extraneous * weights['extraneous'] +
            germane * weights['germane']
        ) * 10

        # 학년별 조정
        grade_adjustment = self._get_grade_adjustment(grade_level)
        adjusted_total = total_score * grade_adjustment

        # 난이도 레벨 결정
        difficulty_level = self._determine_difficulty_level(adjusted_total)

        return {
            'intrinsic': round(intrinsic, 2),
            'extraneous': round(extraneous, 2),
            'germane': round(germane, 2),
            'total': round(adjusted_total, 2),
            'level': difficulty_level,
            'details': {
                'ai_analysis': ai_analysis.dict(),
                'rule_analysis': rule_analysis.dict(),
                'estimated_time': ai_analysis.estimated_time_minutes,
                'recommendations': ai_analysis.recommendations,
                'weights_applied': weights,
                'grade_adjustment': grade_adjustment
            }
        }

    def _get_grade_adjustment(self, grade_level: int) -> float:
        """학년별 조정 계수"""
        for grade_range, adjustment in self.GRADE_ADJUSTMENTS.items():
            if grade_level in grade_range:
                return adjustment
        return 1.0

    def _determine_difficulty_level(self, score: float) -> DifficultyLevel:
        """점수를 기반으로 난이도 레벨 결정"""
        if score <= 20:
            return DifficultyLevel.VERY_LOW
        elif score <= 40:
            return DifficultyLevel.LOW
        elif score <= 60:
            return DifficultyLevel.MEDIUM
        elif score <= 80:
            return DifficultyLevel.HIGH
        else:
            return DifficultyLevel.VERY_HIGH

    def analyze_quiz_balance(self, cognitive_loads: List[float]) -> Dict:
        """
        퀴즈의 인지 부하 균형 분석

        이상적인 퀴즈는:
        - 낮은 부하 문제로 시작 (워밍업)
        - 중간 부하 문제가 대다수
        - 높은 부하 문제가 일부 포함 (도전)
        - 전체적으로 점진적 난이도 증가
        """
        if not cognitive_loads:
            return {'balance_score': 0, 'warnings': ['No problems to analyze']}

        avg_load = sum(cognitive_loads) / len(cognitive_loads)

        # 분포 계산
        very_low = sum(1 for x in cognitive_loads if x <= 20)
        low = sum(1 for x in cognitive_loads if 20 < x <= 40)
        medium = sum(1 for x in cognitive_loads if 40 < x <= 60)
        high = sum(1 for x in cognitive_loads if 60 < x <= 80)
        very_high = sum(1 for x in cognitive_loads if x > 80)

        total = len(cognitive_loads)

        # 이상적인 분포: 10% 매우 쉬움, 30% 쉬움, 40% 중간, 15% 어려움, 5% 매우 어려움
        ideal_dist = {
            'very_low': 0.10,
            'low': 0.30,
            'medium': 0.40,
            'high': 0.15,
            'very_high': 0.05
        }

        actual_dist = {
            'very_low': very_low / total,
            'low': low / total,
            'medium': medium / total,
            'high': high / total,
            'very_high': very_high / total
        }

        # 균형 점수 계산 (분포 차이의 역수)
        dist_diff = sum(abs(ideal_dist[k] - actual_dist[k]) for k in ideal_dist.keys())
        balance_score = max(0, 100 - (dist_diff * 100))

        # 경고 생성
        warnings = []
        if very_high / total > 0.2:
            warnings.append("너무 많은 매우 어려운 문제 (20% 초과)")
        if medium / total < 0.2:
            warnings.append("중간 난이도 문제가 부족 (20% 미만)")
        if avg_load > 70:
            warnings.append("전체 평균 인지 부하가 높음 (70 초과)")
        if len(cognitive_loads) > 3:
            # 난이도 변동성 체크
            std_dev = (sum((x - avg_load) ** 2 for x in cognitive_loads) / len(cognitive_loads)) ** 0.5
            if std_dev > 25:
                warnings.append("난이도 변동성이 큼 (표준편차 > 25)")

        return {
            'balance_score': round(balance_score, 2),
            'average_load': round(avg_load, 2),
            'distribution': {
                'very_low': very_low,
                'low': low,
                'medium': medium,
                'high': high,
                'very_high': very_high
            },
            'warnings': warnings
        }

    def estimate_experienced_load(
        self,
        time_spent: int,
        num_attempts: int,
        is_correct: bool,
        expected_load: float
    ) -> float:
        """
        학생이 실제로 경험한 인지 부하 추정

        Args:
            time_spent: 소요 시간 (초)
            num_attempts: 시도 횟수
            is_correct: 정답 여부
            expected_load: 예상 인지 부하

        Returns:
            경험한 인지 부하 점수 (0-100)
        """
        # 기본: 예상 부하에서 시작
        experienced = expected_load

        # 시간 요인: 예상보다 오래 걸리면 증가
        expected_time = self._estimate_time_from_load(expected_load)
        time_ratio = time_spent / (expected_time * 60) if expected_time > 0 else 1

        if time_ratio > 1.5:  # 50% 이상 초과
            experienced += (time_ratio - 1) * 10
        elif time_ratio < 0.5:  # 50% 이하로 빠름
            experienced -= (1 - time_ratio) * 10

        # 시도 횟수: 여러 번 시도하면 부하 증가
        if num_attempts > 1:
            experienced += (num_attempts - 1) * 5

        # 정답 여부: 틀리면 부하 증가
        if not is_correct:
            experienced += 10

        return max(0, min(100, round(experienced, 2)))

    def _estimate_time_from_load(self, load: float) -> int:
        """
        인지 부하로부터 예상 소요 시간 추정 (분)
        """
        # 선형 모델: 부하 20 = 2분, 부하 100 = 15분
        return int(2 + (load / 100) * 13)
