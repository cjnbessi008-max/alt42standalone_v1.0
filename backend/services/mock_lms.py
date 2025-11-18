"""
Mock LMS Service

Simulates Moodle/LMS integration for development and testing
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)


class MockLMSService:
    """
    Mock LMS service that simulates Moodle API responses
    Used for development before real Moodle integration
    """

    def __init__(self):
        self._mock_problems = self._initialize_mock_problems()

    def _initialize_mock_problems(self) -> Dict[str, Dict[str, Any]]:
        """Initialize mock problem database"""
        return {
            "fraction-add-1": {
                "id": "fraction-add-1",
                "type": "fraction_addition",
                "title": "분수의 덧셈 - 1/2 + 1/3",
                "description": "1/2과 1/3을 더하세요. 여러 가지 방법으로 풀어볼 수 있습니다.",
                "difficulty": 2,
                "grade_level": "3학년",
                "cases": [
                    {
                        "id": "method-1",
                        "label": "방법 1: 공통분모 찾기 (6)",
                        "description": "6을 공통분모로 사용합니다",
                        "steps": [
                            "1/2 = 3/6으로 변환",
                            "1/3 = 2/6으로 변환",
                            "3/6 + 2/6 = 5/6"
                        ],
                        "difficulty": 2,
                        "timeEstimate": 60000,
                        "isRecommended": True
                    },
                    {
                        "id": "method-2",
                        "label": "방법 2: 시각적 이해",
                        "description": "피자로 시각화하여 이해합니다",
                        "visualization": "pizza-slices",
                        "difficulty": 1,
                        "timeEstimate": 90000
                    },
                    {
                        "id": "method-3",
                        "label": "방법 3: 교차곱셈",
                        "description": "교차곱셈 방식 사용",
                        "formula": "(1×3 + 2×1) / (2×3) = 5/6",
                        "difficulty": 3,
                        "timeEstimate": 45000
                    }
                ]
            },
            "fraction-multiply-1": {
                "id": "fraction-multiply-1",
                "type": "fraction_multiplication",
                "title": "분수의 곱셈 - 2/3 × 3/4",
                "description": "2/3와 3/4를 곱하세요.",
                "difficulty": 3,
                "grade_level": "4학년",
                "cases": [
                    {
                        "id": "method-1",
                        "label": "방법 1: 직접 곱하기",
                        "steps": [
                            "분자끼리: 2 × 3 = 6",
                            "분모끼리: 3 × 4 = 12",
                            "결과: 6/12 = 1/2 (약분)"
                        ],
                        "difficulty": 2,
                        "timeEstimate": 45000,
                        "isRecommended": True
                    },
                    {
                        "id": "method-2",
                        "label": "방법 2: 먼저 약분하기",
                        "steps": [
                            "2/3 × 3/4",
                            "3과 3을 약분: 2/1 × 1/4",
                            "2 × 1 = 2, 1 × 4 = 4",
                            "결과: 2/4 = 1/2"
                        ],
                        "difficulty": 3,
                        "timeEstimate": 60000
                    },
                    {
                        "id": "method-3",
                        "label": "방법 3: 시각화",
                        "description": "사각형을 이용한 시각화",
                        "visualization": "rectangle-grid",
                        "difficulty": 1,
                        "timeEstimate": 75000
                    }
                ]
            },
            "equation-solve-1": {
                "id": "equation-solve-1",
                "type": "linear_equation",
                "title": "일차방정식 - 2x + 5 = 13",
                "description": "2x + 5 = 13을 풀어 x의 값을 구하세요.",
                "difficulty": 2,
                "grade_level": "5학년",
                "cases": [
                    {
                        "id": "method-1",
                        "label": "방법 1: 이항",
                        "steps": [
                            "2x + 5 = 13",
                            "2x = 13 - 5",
                            "2x = 8",
                            "x = 4"
                        ],
                        "difficulty": 2,
                        "timeEstimate": 50000,
                        "isRecommended": True
                    },
                    {
                        "id": "method-2",
                        "label": "방법 2: 양변에 같은 수 빼기",
                        "steps": [
                            "2x + 5 = 13",
                            "양변에서 5를 뺌: 2x = 8",
                            "양변을 2로 나눔: x = 4"
                        ],
                        "difficulty": 2,
                        "timeEstimate": 55000
                    },
                    {
                        "id": "method-3",
                        "label": "방법 3: 역연산",
                        "description": "역연산을 단계별로 적용",
                        "steps": [
                            "x에 2를 곱함 → 2x",
                            "5를 더함 → 2x + 5 = 13",
                            "역순으로: 13에서 5를 뺌 → 8",
                            "8을 2로 나눔 → x = 4"
                        ],
                        "difficulty": 1,
                        "timeEstimate": 70000
                    }
                ]
            }
        }

    async def get_problem(self, problem_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch problem data from mock database

        Args:
            problem_id: Problem identifier

        Returns:
            Problem data dictionary or None if not found
        """
        problem = self._mock_problems.get(problem_id)

        if problem:
            logger.info(f"Mock LMS: Retrieved problem {problem_id}")
            return problem
        else:
            logger.warning(f"Mock LMS: Problem {problem_id} not found")
            return None

    async def get_all_problems(
        self,
        problem_type: Optional[str] = None,
        grade_level: Optional[str] = None,
        difficulty: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get all problems with optional filters

        Args:
            problem_type: Filter by problem type
            grade_level: Filter by grade level
            difficulty: Filter by difficulty (1-5)

        Returns:
            List of problem dictionaries
        """
        problems = list(self._mock_problems.values())

        # Apply filters
        if problem_type:
            problems = [p for p in problems if p.get("type") == problem_type]

        if grade_level:
            problems = [p for p in problems if p.get("grade_level") == grade_level]

        if difficulty is not None:
            problems = [p for p in problems if p.get("difficulty") == difficulty]

        logger.info(f"Mock LMS: Retrieved {len(problems)} problems")
        return problems

    async def update_student_progress(
        self,
        student_id: str,
        problem_id: str,
        progress: float,
        completed: bool = False,
        score: Optional[float] = None
    ) -> bool:
        """
        Update student progress in mock LMS

        Args:
            student_id: Student identifier
            problem_id: Problem identifier
            progress: Progress percentage (0-100)
            completed: Whether problem is completed
            score: Optional score (0-100)

        Returns:
            Success status
        """
        logger.info(
            f"Mock LMS: Updated progress for student {student_id} on problem {problem_id} - "
            f"Progress: {progress}%, Completed: {completed}, Score: {score}"
        )

        # In real Moodle integration, this would call Moodle API
        # For now, just log the update
        return True

    async def submit_grade(
        self,
        student_id: str,
        problem_id: str,
        grade: float,
        feedback: Optional[str] = None
    ) -> bool:
        """
        Submit grade to mock LMS gradebook

        Args:
            student_id: Student identifier
            problem_id: Problem identifier
            grade: Grade value (0-100)
            feedback: Optional feedback text

        Returns:
            Success status
        """
        logger.info(
            f"Mock LMS: Submitted grade for student {student_id} on problem {problem_id} - "
            f"Grade: {grade}, Feedback: {feedback}"
        )

        return True

    async def get_student_info(self, student_id: str) -> Dict[str, Any]:
        """
        Get student information from mock LMS

        Args:
            student_id: Student identifier

        Returns:
            Student info dictionary
        """
        # Mock student data
        mock_students = {
            "student-1": {
                "id": "student-1",
                "name": "김민수",
                "grade_level": "3학년",
                "email": "minsu@example.com"
            },
            "student-2": {
                "id": "student-2",
                "name": "이지은",
                "grade_level": "3학년",
                "email": "jieun@example.com"
            },
            "student-3": {
                "id": "student-3",
                "name": "박준호",
                "grade_level": "4학년",
                "email": "junho@example.com"
            }
        }

        student = mock_students.get(student_id, {
            "id": student_id,
            "name": f"학생-{student_id[:8]}",
            "grade_level": "3학년",
            "email": f"{student_id}@example.com"
        })

        logger.info(f"Mock LMS: Retrieved student info for {student_id}")
        return student

    async def record_interaction(
        self,
        student_id: str,
        problem_id: str,
        interaction_type: str,
        interaction_data: Dict[str, Any]
    ) -> bool:
        """
        Record student interaction with problem

        Args:
            student_id: Student identifier
            problem_id: Problem identifier
            interaction_type: Type of interaction
            interaction_data: Interaction details

        Returns:
            Success status
        """
        logger.info(
            f"Mock LMS: Recorded interaction for student {student_id} on problem {problem_id} - "
            f"Type: {interaction_type}"
        )

        return True


# Singleton instance
mock_lms_service = MockLMSService()
