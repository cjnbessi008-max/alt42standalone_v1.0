"""
워밍업 문제 추천 서비스
동일 유형의 쉬운 문제를 즉시 추천하는 로직
"""
from typing import Optional, List
import random
from ..models.problem import (
    Problem,
    WarmupRecommendationRequest,
    WarmupRecommendationResponse,
    DifficultyLevel,
    ProblemType,
    Subject
)


class WarmupRecommender:
    """워밍업 문제 추천 엔진"""

    def __init__(self, problem_repository):
        """
        Args:
            problem_repository: 문제 저장소 (데이터베이스 인터페이스)
        """
        self.problem_repository = problem_repository

    def recommend_warmup_problem(
        self,
        request: WarmupRecommendationRequest
    ) -> WarmupRecommendationResponse:
        """
        워밍업 문제 1개를 즉시 추천

        추천 전략:
        1. 현재 문제와 동일한 유형 선택
        2. 난이도를 더 쉽게 조정 (easy 또는 very_easy)
        3. 예상 소요 시간이 짧은 문제 우선
        4. 학생의 최근 성공률 고려

        Args:
            request: 추천 요청 데이터

        Returns:
            WarmupRecommendationResponse: 추천된 문제와 메타데이터
        """
        # 1. 현재 문제 정보 가져오기 (제공된 경우)
        current_problem = None
        if request.current_problem_id:
            current_problem = self.problem_repository.get_by_id(
                request.current_problem_id
            )

        # 2. 검색 기준 설정
        criteria = self._build_search_criteria(request, current_problem)

        # 3. 후보 문제 검색
        candidate_problems = self.problem_repository.find_problems(criteria)

        # 4. 학생의 기존 풀이 기록 가져오기
        student_history = self.problem_repository.get_student_history(
            request.student_id
        )

        # 5. 이미 푼 문제 제외
        unsolved_problems = self._filter_solved_problems(
            candidate_problems,
            student_history
        )

        # 6. 최적 문제 선택
        if not unsolved_problems:
            # 풀지 않은 문제가 없으면 전체 후보에서 선택
            unsolved_problems = candidate_problems

        if not unsolved_problems:
            raise ValueError("추천 가능한 워밍업 문제가 없습니다.")

        selected_problem = self._select_best_warmup(unsolved_problems)

        # 7. 추천 이유 생성
        reason = self._generate_recommendation_reason(
            selected_problem,
            current_problem
        )

        # 8. 신뢰도 점수 계산
        confidence = self._calculate_confidence_score(
            selected_problem,
            current_problem,
            student_history
        )

        return WarmupRecommendationResponse(
            recommended_problem=selected_problem,
            reason=reason,
            confidence_score=confidence
        )

    def _build_search_criteria(
        self,
        request: WarmupRecommendationRequest,
        current_problem: Optional[Problem]
    ) -> dict:
        """검색 기준 구성"""
        criteria = {
            "difficulty": [DifficultyLevel.VERY_EASY, DifficultyLevel.EASY],
            "estimated_time_minutes_max": 5  # 5분 이하
        }

        # 동일 유형 필터
        if current_problem:
            criteria["problem_type"] = current_problem.problem_type
            criteria["subject"] = current_problem.subject
            criteria["grade_level"] = current_problem.grade_level
        else:
            if request.problem_type:
                criteria["problem_type"] = request.problem_type
            if request.subject:
                criteria["subject"] = request.subject
            if request.grade_level:
                criteria["grade_level"] = request.grade_level

        return criteria

    def _filter_solved_problems(
        self,
        problems: List[Problem],
        student_history: List[dict]
    ) -> List[Problem]:
        """이미 푼 문제 제외"""
        solved_problem_ids = {
            attempt["problem_id"]
            for attempt in student_history
            if attempt.get("is_correct", False)
        }

        return [
            problem for problem in problems
            if problem.id not in solved_problem_ids
        ]

    def _select_best_warmup(self, problems: List[Problem]) -> Problem:
        """
        최적의 워밍업 문제 선택

        우선순위:
        1. 난이도가 가장 쉬운 것
        2. 예상 시간이 짧은 것
        3. 무작위 선택 (다양성 확보)
        """
        # 난이도별 그룹화
        difficulty_order = {
            DifficultyLevel.VERY_EASY: 1,
            DifficultyLevel.EASY: 2,
            DifficultyLevel.MEDIUM: 3,
            DifficultyLevel.HARD: 4,
            DifficultyLevel.VERY_HARD: 5
        }

        # 가장 쉬운 난이도 찾기
        easiest_difficulty = min(
            (difficulty_order[p.difficulty] for p in problems)
        )

        # 가장 쉬운 문제들 필터링
        easiest_problems = [
            p for p in problems
            if difficulty_order[p.difficulty] == easiest_difficulty
        ]

        # 예상 시간으로 정렬
        easiest_problems.sort(key=lambda p: p.estimated_time_minutes)

        # 상위 3개 중 무작위 선택 (다양성)
        top_candidates = easiest_problems[:min(3, len(easiest_problems))]
        return random.choice(top_candidates)

    def _generate_recommendation_reason(
        self,
        selected: Problem,
        current: Optional[Problem]
    ) -> str:
        """추천 이유 생성"""
        if current:
            type_match = "동일 유형" if selected.problem_type == current.problem_type else "유사 유형"
            return (
                f"{type_match}({selected.problem_type.value})의 쉬운 문제로 "
                f"워밍업에 적합합니다. 예상 소요 시간: {selected.estimated_time_minutes}분"
            )
        else:
            return (
                f"{selected.subject.value} 과목의 기초 문제로 "
                f"워밍업에 적합합니다. (난이도: {selected.difficulty.value})"
            )

    def _calculate_confidence_score(
        self,
        selected: Problem,
        current: Optional[Problem],
        student_history: List[dict]
    ) -> float:
        """
        추천 신뢰도 점수 계산 (0-1)

        고려 요소:
        - 문제 유형 일치도: 0.4
        - 난이도 적합성: 0.3
        - 학생 이력 매칭: 0.3
        """
        score = 0.5  # 기본 점수

        # 문제 유형 일치
        if current and selected.problem_type == current.problem_type:
            score += 0.3

        # 난이도가 very_easy면 추가 점수
        if selected.difficulty == DifficultyLevel.VERY_EASY:
            score += 0.15
        elif selected.difficulty == DifficultyLevel.EASY:
            score += 0.1

        # 학생이 유사 문제를 성공한 이력이 있으면 감점
        similar_attempts = [
            h for h in student_history
            if h.get("problem_type") == selected.problem_type
        ]

        if similar_attempts:
            success_rate = sum(
                1 for h in similar_attempts if h.get("is_correct", False)
            ) / len(similar_attempts)

            # 성공률이 높으면 약간 감점 (이미 잘하는 유형)
            if success_rate > 0.8:
                score -= 0.05

        return min(1.0, max(0.0, score))  # 0-1 범위로 클리핑
