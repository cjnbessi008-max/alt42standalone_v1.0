"""LMS Integration Service"""
import asyncio
from typing import Optional, List, Dict, Any
from uuid import UUID
import httpx
from datetime import datetime


class LMSIntegration:
    """LMS 연동 기본 클래스"""

    def __init__(self, api_endpoint: str, api_key: str, lms_type: str):
        self.api_endpoint = api_endpoint
        self.api_key = api_key
        self.lms_type = lms_type
        self.client = httpx.AsyncClient(
            base_url=api_endpoint,
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=30.0
        )

    async def get_students(self, course_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """LMS에서 학생 목록 가져오기"""
        raise NotImplementedError("Subclass must implement get_students")

    async def get_problems(self, course_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """LMS에서 문제 목록 가져오기"""
        raise NotImplementedError("Subclass must implement get_problems")

    async def submit_grade(self, student_id: str, problem_id: str, score: float) -> bool:
        """LMS에 성적 제출"""
        raise NotImplementedError("Subclass must implement submit_grade")

    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()


class CanvasLMSIntegration(LMSIntegration):
    """Canvas LMS 연동"""

    def __init__(self, api_endpoint: str, api_key: str):
        super().__init__(api_endpoint, api_key, "canvas")

    async def get_students(self, course_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Canvas에서 학생 목록 가져오기"""
        try:
            response = await self.client.get(f"/api/v1/courses/{course_id}/students")
            response.raise_for_status()
            students = response.json()

            return [
                {
                    "external_student_id": str(student["id"]),
                    "name": student.get("name", ""),
                    "metadata": {
                        "email": student.get("email"),
                        "sis_user_id": student.get("sis_user_id"),
                    }
                }
                for student in students
            ]
        except httpx.HTTPError as e:
            print(f"Canvas API error: {e}")
            return []

    async def get_problems(self, course_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Canvas에서 문제(assignment) 목록 가져오기"""
        try:
            response = await self.client.get(f"/api/v1/courses/{course_id}/assignments")
            response.raise_for_status()
            assignments = response.json()

            return [
                {
                    "external_problem_id": str(assignment["id"]),
                    "title": assignment.get("name", ""),
                    "content": {
                        "description": assignment.get("description", ""),
                        "points_possible": assignment.get("points_possible", 0),
                    },
                    "metadata": {
                        "due_at": assignment.get("due_at"),
                        "assignment_group_id": assignment.get("assignment_group_id"),
                    }
                }
                for assignment in assignments
            ]
        except httpx.HTTPError as e:
            print(f"Canvas API error: {e}")
            return []

    async def submit_grade(self, student_id: str, problem_id: str, score: float) -> bool:
        """Canvas에 성적 제출"""
        try:
            # Canvas Gradebook API 사용
            response = await self.client.put(
                f"/api/v1/courses/{{course_id}}/assignments/{problem_id}/submissions/{student_id}",
                json={"submission": {"posted_grade": score}}
            )
            response.raise_for_status()
            return True
        except httpx.HTTPError as e:
            print(f"Canvas grade submission error: {e}")
            return False


class MoodleLMSIntegration(LMSIntegration):
    """Moodle LMS 연동"""

    def __init__(self, api_endpoint: str, api_key: str):
        super().__init__(api_endpoint, api_key, "moodle")

    async def get_students(self, course_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Moodle에서 학생 목록 가져오기"""
        try:
            response = await self.client.post(
                "/webservice/rest/server.php",
                data={
                    "wstoken": self.api_key,
                    "wsfunction": "core_enrol_get_enrolled_users",
                    "moodlewsrestformat": "json",
                    "courseid": course_id
                }
            )
            response.raise_for_status()
            students = response.json()

            return [
                {
                    "external_student_id": str(student["id"]),
                    "name": student.get("fullname", ""),
                    "metadata": {
                        "email": student.get("email"),
                        "username": student.get("username"),
                    }
                }
                for student in students
            ]
        except httpx.HTTPError as e:
            print(f"Moodle API error: {e}")
            return []

    async def get_problems(self, course_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Moodle에서 문제(quiz) 목록 가져오기"""
        try:
            response = await self.client.post(
                "/webservice/rest/server.php",
                data={
                    "wstoken": self.api_key,
                    "wsfunction": "mod_quiz_get_quizzes_by_courses",
                    "moodlewsrestformat": "json",
                    "courseids[0]": course_id
                }
            )
            response.raise_for_status()
            quizzes = response.json().get("quizzes", [])

            return [
                {
                    "external_problem_id": str(quiz["id"]),
                    "title": quiz.get("name", ""),
                    "content": {
                        "intro": quiz.get("intro", ""),
                        "grade": quiz.get("grade", 0),
                    },
                    "metadata": {
                        "timeopen": quiz.get("timeopen"),
                        "timeclose": quiz.get("timeclose"),
                    }
                }
                for quiz in quizzes
            ]
        except httpx.HTTPError as e:
            print(f"Moodle API error: {e}")
            return []

    async def submit_grade(self, student_id: str, problem_id: str, score: float) -> bool:
        """Moodle에 성적 제출 (quiz attempt를 통해)"""
        # Moodle의 경우 더 복잡한 프로세스 필요
        # 실제 구현에서는 mod_quiz_process_attempt 등 사용
        return False


class LMSService:
    """LMS 연동 통합 서비스"""

    @staticmethod
    def create_integration(lms_type: str, api_endpoint: str, api_key: str) -> LMSIntegration:
        """LMS 타입에 따라 적절한 연동 객체 생성"""
        integrations = {
            "canvas": CanvasLMSIntegration,
            "moodle": MoodleLMSIntegration,
        }

        integration_class = integrations.get(lms_type.lower())
        if not integration_class:
            raise ValueError(f"Unsupported LMS type: {lms_type}")

        return integration_class(api_endpoint, api_key)

    @staticmethod
    async def sync_students(
        lms_integration: LMSIntegration,
        course_id: str,
        db_session
    ) -> int:
        """LMS에서 학생 정보 동기화"""
        students = await lms_integration.get_students(course_id)
        synced_count = 0

        for student_data in students:
            # 실제로는 DB에 저장하는 로직 필요
            # await db_session.execute(insert_student_query, student_data)
            synced_count += 1

        return synced_count

    @staticmethod
    async def sync_problems(
        lms_integration: LMSIntegration,
        course_id: str,
        db_session
    ) -> int:
        """LMS에서 문제 정보 동기화"""
        problems = await lms_integration.get_problems(course_id)
        synced_count = 0

        for problem_data in problems:
            # 문제 유형 자동 분류 로직 추가 가능
            # problem_type = await classify_problem(problem_data["content"])
            synced_count += 1

        return synced_count
