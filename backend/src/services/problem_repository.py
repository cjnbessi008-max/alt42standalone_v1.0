"""
문제 저장소 (Repository Pattern)
데이터베이스 추상화 레이어
"""
from typing import List, Optional, Dict
from datetime import datetime
from ..models.problem import (
    Problem,
    DifficultyLevel,
    ProblemType,
    Subject
)


class InMemoryProblemRepository:
    """
    메모리 기반 문제 저장소 (개발/테스트용)
    추후 PostgreSQL로 교체 가능
    """

    def __init__(self):
        self.problems: Dict[str, Problem] = {}
        self.student_attempts: List[Dict] = []
        self._initialize_sample_data()

    def _initialize_sample_data(self):
        """샘플 워밍업 문제 데이터 초기화"""
        sample_problems = [
            # 분수 관련 문제들
            Problem(
                id="prob_001",
                title="분수의 덧셈 - 기초",
                content="1/4 + 1/4 = ?",
                problem_type=ProblemType.CALCULATION,
                subject=Subject.MATH,
                difficulty=DifficultyLevel.VERY_EASY,
                grade_level=3,
                tags=["분수", "덧셈", "기초", "워밍업"],
                estimated_time_minutes=2,
                correct_answer="1/2",
                explanation="같은 분모를 가진 분수의 덧셈은 분자끼리 더합니다. 1+1=2이므로 답은 2/4 = 1/2입니다."
            ),
            Problem(
                id="prob_002",
                title="분수의 덧셈 - 연습",
                content="1/3 + 1/3 = ?",
                problem_type=ProblemType.CALCULATION,
                subject=Subject.MATH,
                difficulty=DifficultyLevel.EASY,
                grade_level=3,
                tags=["분수", "덧셈", "워밍업"],
                estimated_time_minutes=3,
                correct_answer="2/3",
                explanation="같은 분모 1/3 + 1/3 = 2/3"
            ),
            Problem(
                id="prob_003",
                title="분수의 덧셈 - 응용",
                content="2/5 + 1/5 = ?",
                problem_type=ProblemType.CALCULATION,
                subject=Subject.MATH,
                difficulty=DifficultyLevel.EASY,
                grade_level=3,
                tags=["분수", "덧셈", "워밍업"],
                estimated_time_minutes=3,
                correct_answer="3/5",
                explanation="2 + 1 = 3이므로 답은 3/5입니다."
            ),

            # 곱셈 관련 문제들
            Problem(
                id="prob_004",
                title="곱셈 구구단 - 2단",
                content="2 × 3 = ?",
                problem_type=ProblemType.CALCULATION,
                subject=Subject.MATH,
                difficulty=DifficultyLevel.VERY_EASY,
                grade_level=2,
                tags=["곱셈", "구구단", "2단", "워밍업"],
                estimated_time_minutes=1,
                correct_answer="6",
                explanation="2 × 3 = 6"
            ),
            Problem(
                id="prob_005",
                title="곱셈 구구단 - 3단",
                content="3 × 4 = ?",
                problem_type=ProblemType.CALCULATION,
                subject=Subject.MATH,
                difficulty=DifficultyLevel.EASY,
                grade_level=2,
                tags=["곱셈", "구구단", "3단", "워밍업"],
                estimated_time_minutes=2,
                correct_answer="12",
                explanation="3 × 4 = 12"
            ),

            # 나눗셈 관련 문제들
            Problem(
                id="prob_006",
                title="나눗셈 기초",
                content="6 ÷ 2 = ?",
                problem_type=ProblemType.CALCULATION,
                subject=Subject.MATH,
                difficulty=DifficultyLevel.VERY_EASY,
                grade_level=3,
                tags=["나눗셈", "기초", "워밍업"],
                estimated_time_minutes=2,
                correct_answer="3",
                explanation="6을 2로 나누면 3입니다."
            ),
            Problem(
                id="prob_007",
                title="나눗셈 연습",
                content="12 ÷ 3 = ?",
                problem_type=ProblemType.CALCULATION,
                subject=Subject.MATH,
                difficulty=DifficultyLevel.EASY,
                grade_level=3,
                tags=["나눗셈", "워밍업"],
                estimated_time_minutes=2,
                correct_answer="4",
                explanation="12를 3으로 나누면 4입니다."
            ),

            # 선택형 문제들
            Problem(
                id="prob_008",
                title="도형의 이름",
                content="세 변을 가진 도형의 이름은?\nA) 사각형\nB) 삼각형\nC) 오각형\nD) 원",
                problem_type=ProblemType.MULTIPLE_CHOICE,
                subject=Subject.MATH,
                difficulty=DifficultyLevel.VERY_EASY,
                grade_level=1,
                tags=["도형", "기초", "워밍업"],
                estimated_time_minutes=1,
                correct_answer="B",
                explanation="세 개의 변을 가진 도형은 삼각형입니다."
            ),
            Problem(
                id="prob_009",
                title="짝수와 홀수",
                content="다음 중 짝수는?\nA) 3\nB) 5\nC) 6\nD) 7",
                problem_type=ProblemType.MULTIPLE_CHOICE,
                subject=Subject.MATH,
                difficulty=DifficultyLevel.EASY,
                grade_level=2,
                tags=["수", "짝수", "홀수", "워밍업"],
                estimated_time_minutes=2,
                correct_answer="C",
                explanation="짝수는 2로 나누어떨어지는 수입니다. 6은 2로 나누어떨어지므로 짝수입니다."
            ),

            # 참/거짓 문제들
            Problem(
                id="prob_010",
                title="덧셈 확인",
                content="2 + 2 = 5이다. (참/거짓)",
                problem_type=ProblemType.TRUE_FALSE,
                subject=Subject.MATH,
                difficulty=DifficultyLevel.VERY_EASY,
                grade_level=1,
                tags=["덧셈", "기초", "워밍업"],
                estimated_time_minutes=1,
                correct_answer="거짓",
                explanation="2 + 2 = 4이므로 거짓입니다."
            )
        ]

        for problem in sample_problems:
            self.problems[problem.id] = problem

    def get_by_id(self, problem_id: str) -> Optional[Problem]:
        """ID로 문제 조회"""
        return self.problems.get(problem_id)

    def find_problems(self, criteria: dict) -> List[Problem]:
        """
        조건에 맞는 문제 검색

        Args:
            criteria: 검색 조건
                - difficulty: 난이도 (단일 값 또는 리스트)
                - problem_type: 문제 유형
                - subject: 과목
                - grade_level: 학년
                - estimated_time_minutes_max: 최대 예상 시간

        Returns:
            조건에 맞는 문제 리스트
        """
        results = list(self.problems.values())

        # 난이도 필터
        if "difficulty" in criteria:
            difficulty = criteria["difficulty"]
            if isinstance(difficulty, list):
                results = [p for p in results if p.difficulty in difficulty]
            else:
                results = [p for p in results if p.difficulty == difficulty]

        # 문제 유형 필터
        if "problem_type" in criteria:
            results = [
                p for p in results
                if p.problem_type == criteria["problem_type"]
            ]

        # 과목 필터
        if "subject" in criteria:
            results = [p for p in results if p.subject == criteria["subject"]]

        # 학년 필터
        if "grade_level" in criteria:
            results = [
                p for p in results
                if p.grade_level == criteria["grade_level"]
            ]

        # 예상 시간 필터
        if "estimated_time_minutes_max" in criteria:
            max_time = criteria["estimated_time_minutes_max"]
            results = [
                p for p in results
                if p.estimated_time_minutes <= max_time
            ]

        return results

    def get_student_history(self, student_id: str) -> List[Dict]:
        """학생의 문제 풀이 이력 조회"""
        return [
            attempt for attempt in self.student_attempts
            if attempt.get("student_id") == student_id
        ]

    def save_attempt(
        self,
        student_id: str,
        problem_id: str,
        answer: str,
        is_correct: bool,
        time_spent_seconds: int
    ):
        """학생의 문제 풀이 기록 저장"""
        problem = self.get_by_id(problem_id)

        attempt = {
            "id": f"attempt_{len(self.student_attempts) + 1}",
            "student_id": student_id,
            "problem_id": problem_id,
            "problem_type": problem.problem_type if problem else None,
            "answer": answer,
            "is_correct": is_correct,
            "time_spent_seconds": time_spent_seconds,
            "attempted_at": datetime.now()
        }

        self.student_attempts.append(attempt)
        return attempt

    def get_all_problems(self) -> List[Problem]:
        """모든 문제 조회"""
        return list(self.problems.values())

    def count_problems(self) -> int:
        """전체 문제 수"""
        return len(self.problems)
