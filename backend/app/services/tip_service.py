"""Perspective Shift Tip Service - 맞춤 관점 전환 팁 추천"""
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
import random


class TipRecommendationEngine:
    """팁 추천 엔진 - 학생 프로필과 문제 유형에 따라 최적의 팁 선택"""

    def __init__(self, db_session):
        self.db_session = db_session

    async def recommend_tip(
        self,
        student_id: UUID,
        problem_id: UUID,
        problem_type_id: UUID,
        attempt_number: int,
        time_spent_seconds: Optional[int] = None,
        previous_answers: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        학생에게 최적의 관점 전환 팁 추천

        추천 알고리즘:
        1. 학생의 학습 프로필 조회 (선호하는 관점, 약점/강점)
        2. 문제 유형에 맞는 팁 목록 조회
        3. 시도 횟수와 소요 시간 고려
        4. 학생별 팁 효과성 기록 고려
        5. 최적 팁 선택 및 대안 팁 제시
        """

        # 1. 학생 학습 프로필 조회
        learning_profile = await self._get_learning_profile(student_id, problem_type_id)

        # 2. 문제 유형에 맞는 팁 후보 조회
        candidate_tips = await self._get_candidate_tips(problem_type_id, attempt_number)

        if not candidate_tips:
            # 기본 팁 반환
            return await self._get_default_tip(problem_type_id)

        # 3. 팁 스코어링
        scored_tips = self._score_tips(
            candidate_tips,
            learning_profile,
            attempt_number,
            time_spent_seconds
        )

        # 4. 최고 점수 팁 선택
        best_tip = scored_tips[0]
        alternative_tips = scored_tips[1:3]  # 상위 2-3개 대안

        # 5. 추천 기록 저장
        recommendation_id = await self._log_recommendation(
            student_id,
            problem_id,
            best_tip["tip"]["id"],
            best_tip["reason"]
        )

        return {
            "tip": best_tip["tip"],
            "recommendation_id": recommendation_id,
            "confidence_score": best_tip["score"],
            "personalized": learning_profile is not None,
            "alternative_tips": [t["tip"] for t in alternative_tips]
        }

    async def _get_learning_profile(
        self,
        student_id: UUID,
        problem_type_id: UUID
    ) -> Optional[Dict[str, Any]]:
        """학생의 학습 프로필 조회"""
        # 실제로는 DB 쿼리
        # SELECT * FROM student_learning_profiles
        # WHERE student_id = ? AND problem_type_id = ?

        # 예시 데이터
        return {
            "preferred_perspective_type": "visual",
            "weak_areas": ["algebraic_manipulation", "abstract_concepts"],
            "strong_areas": ["geometric_visualization"],
            "tip_effectiveness": {}  # tip_id -> effectiveness score
        }

    async def _get_candidate_tips(
        self,
        problem_type_id: UUID,
        attempt_number: int
    ) -> List[Dict[str, Any]]:
        """문제 유형과 시도 횟수에 맞는 팁 후보 조회"""
        # 실제로는 DB 쿼리
        # SELECT * FROM perspective_tips
        # WHERE problem_type_id = ?
        # AND (trigger_conditions->'min_attempts')::int <= ?
        # ORDER BY effectiveness_score DESC

        # 시도 횟수에 따라 팁 레벨 조정
        tip_level = min(3, (attempt_number // 2) + 1)

        # 예시: 실제로는 DB에서 조회
        return []

    def _score_tips(
        self,
        candidate_tips: List[Dict[str, Any]],
        learning_profile: Optional[Dict[str, Any]],
        attempt_number: int,
        time_spent_seconds: Optional[int]
    ) -> List[Dict[str, Any]]:
        """
        팁에 점수 부여하여 정렬

        점수 계산 요소:
        - 학생의 선호 관점과 일치도 (40%)
        - 과거 팁 효과성 (30%)
        - 전체 사용자 효과성 점수 (20%)
        - 시도 횟수/시간 적합도 (10%)
        """
        scored = []

        for tip in candidate_tips:
            score = 0.0
            reasons = []

            # 1. 선호 관점 일치도
            if learning_profile and tip.get("perspective_type") == learning_profile.get("preferred_perspective_type"):
                score += 0.4
                reasons.append(f"선호하는 {tip['perspective_type']} 관점")

            # 2. 과거 효과성
            if learning_profile and tip["id"] in learning_profile.get("tip_effectiveness", {}):
                effectiveness = learning_profile["tip_effectiveness"][tip["id"]]
                score += 0.3 * effectiveness
                if effectiveness > 0.7:
                    reasons.append("이전에 도움이 되었던 팁")

            # 3. 전체 사용자 효과성
            score += 0.2 * tip.get("effectiveness_score", 0.5)

            # 4. 시도 횟수 적합도
            trigger = tip.get("trigger_conditions", {})
            min_attempts = trigger.get("min_attempts", 1)
            max_attempts = trigger.get("max_attempts", 10)

            if min_attempts <= attempt_number <= max_attempts:
                score += 0.1
                reasons.append(f"{attempt_number}번째 시도에 적합")

            # 시간 기반 조정
            if time_spent_seconds and time_spent_seconds > 300:  # 5분 이상
                if tip.get("perspective_type") == "conceptual":
                    score += 0.05
                    reasons.append("깊이 있는 이해 필요")

            scored.append({
                "tip": tip,
                "score": min(1.0, score),
                "reason": ", ".join(reasons) if reasons else "일반 추천"
            })

        # 점수순 정렬
        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored

    async def _get_default_tip(self, problem_type_id: UUID) -> Dict[str, Any]:
        """기본 팁 반환 (후보가 없을 때)"""
        return {
            "tip": {
                "id": UUID("00000000-0000-0000-0000-000000000000"),
                "title": "문제를 다시 읽어보세요",
                "title_ko": "문제를 다시 읽어보세요",
                "content": "문제에서 주어진 조건과 요구사항을 다시 확인해보세요.",
                "content_ko": "문제에서 주어진 조건과 요구사항을 다시 확인해보세요.",
                "perspective_type": "conceptual"
            },
            "recommendation_id": None,
            "confidence_score": 0.3,
            "personalized": False,
            "alternative_tips": []
        }

    async def _log_recommendation(
        self,
        student_id: UUID,
        problem_id: UUID,
        tip_id: UUID,
        reason: str
    ) -> UUID:
        """팁 추천 기록 저장"""
        # 실제로는 DB INSERT
        # INSERT INTO tip_recommendations ...
        from uuid import uuid4
        return uuid4()

    async def record_tip_feedback(
        self,
        recommendation_id: UUID,
        was_helpful: bool,
        student_feedback: Optional[str] = None
    ):
        """
        학생이 팁이 도움되었는지 피드백 기록
        이를 통해 학습 프로필 업데이트
        """
        # 1. 추천 기록 업데이트
        # UPDATE tip_recommendations SET was_helpful = ?, student_feedback = ?

        # 2. 학습 프로필 업데이트
        # UPDATE student_learning_profiles SET tip_effectiveness = ...

        # 3. 전체 팁 효과성 점수 업데이트
        # UPDATE perspective_tips SET effectiveness_score = ...
        pass

    async def get_tip_analytics(
        self,
        problem_type_id: UUID,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """팁 효과성 분석 데이터"""
        return {
            "total_tips_shown": 0,
            "helpful_rate": 0.0,
            "most_effective_tips": [],
            "least_effective_tips": [],
            "perspective_type_breakdown": {
                "visual": {"shown": 0, "helpful_rate": 0.0},
                "algebraic": {"shown": 0, "helpful_rate": 0.0},
                "geometric": {"shown": 0, "helpful_rate": 0.0},
                "conceptual": {"shown": 0, "helpful_rate": 0.0},
            }
        }


class ProblemTypeClassifier:
    """문제 유형 자동 분류기"""

    KEYWORDS_MAP = {
        "이차함수": ["이차함수", "포물선", "y=ax^2", "x²", "최댓값", "최솟값", "꼭짓점"],
        "평면도형": ["삼각형", "사각형", "원", "둘레", "넓이", "각도", "평행", "수직"],
        "입체도형": ["직육면체", "원기둥", "구", "부피", "겉넓이", "각기둥", "각뿔"],
        "삼각함수": ["sin", "cos", "tan", "사인", "코사인", "탄젠트", "라디안"],
        "지수와 로그": ["지수", "로그", "log", "ln", "밑"],
        "수열": ["등차수열", "등비수열", "수열", "일반항", "Σ", "시그마"],
        "확률": ["확률", "경우의 수", "조합", "순열", "C", "P"],
        "통계": ["평균", "분산", "표준편차", "중앙값", "최빈값"],
        "벡터": ["벡터", "내적", "외적", "크기", "방향"],
        "미분": ["미분", "도함수", "접선", "극값", "f'", "dy/dx"],
        "적분": ["적분", "부정적분", "정적분", "∫", "넓이"]
    }

    @classmethod
    async def classify(cls, problem_content: str) -> Optional[str]:
        """문제 내용에서 유형 자동 분류"""
        scores = {}

        for problem_type, keywords in cls.KEYWORDS_MAP.items():
            score = sum(1 for keyword in keywords if keyword in problem_content)
            if score > 0:
                scores[problem_type] = score

        if not scores:
            return None

        # 가장 높은 점수의 유형 반환
        return max(scores.items(), key=lambda x: x[1])[0]
