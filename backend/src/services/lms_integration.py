"""
LMS 연동 서비스
다양한 LMS 플랫폼과의 통합을 지원
"""
from typing import Optional, Dict, Any
from abc import ABC, abstractmethod
import aiohttp
from datetime import datetime


class LMSProvider(ABC):
    """LMS 제공자 인터페이스"""

    @abstractmethod
    async def get_student_info(self, student_id: str) -> Dict[str, Any]:
        """학생 정보 조회"""
        pass

    @abstractmethod
    async def get_current_course(self, student_id: str) -> Dict[str, Any]:
        """현재 수강 중인 코스 정보"""
        pass

    @abstractmethod
    async def submit_problem_result(
        self,
        student_id: str,
        problem_id: str,
        score: float,
        completed_at: datetime
    ) -> bool:
        """문제 풀이 결과 제출"""
        pass

    @abstractmethod
    async def get_student_progress(self, student_id: str) -> Dict[str, Any]:
        """학생 진도 조회"""
        pass


class MoodleLMSProvider(LMSProvider):
    """Moodle LMS 연동"""

    def __init__(self, base_url: str, api_token: str):
        self.base_url = base_url.rstrip('/')
        self.api_token = api_token
        self.headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json"
        }

    async def get_student_info(self, student_id: str) -> Dict[str, Any]:
        """Moodle에서 학생 정보 조회"""
        url = f"{self.base_url}/webservice/rest/server.php"
        params = {
            "wstoken": self.api_token,
            "wsfunction": "core_user_get_users_by_field",
            "field": "id",
            "values[0]": student_id,
            "moodlewsrestformat": "json"
        }

        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return data[0] if data else {}
                return {}

    async def get_current_course(self, student_id: str) -> Dict[str, Any]:
        """현재 수강 중인 코스 조회"""
        url = f"{self.base_url}/webservice/rest/server.php"
        params = {
            "wstoken": self.api_token,
            "wsfunction": "core_enrol_get_users_courses",
            "userid": student_id,
            "moodlewsrestformat": "json"
        }

        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    courses = await response.json()
                    # 가장 최근에 접속한 코스 반환
                    if courses:
                        return max(courses, key=lambda c: c.get("lastaccess", 0))
                return {}

    async def submit_problem_result(
        self,
        student_id: str,
        problem_id: str,
        score: float,
        completed_at: datetime
    ) -> bool:
        """문제 풀이 결과를 Moodle에 제출"""
        # Moodle의 gradebook에 성적 제출
        url = f"{self.base_url}/webservice/rest/server.php"
        params = {
            "wstoken": self.api_token,
            "wsfunction": "core_grades_update_grades",
            "source": "warmup_problem",
            "courseid": problem_id,  # 실제로는 course_id 매핑 필요
            "component": "mod_quiz",
            "activityid": problem_id,
            "itemnumber": 0,
            "grades[0][studentid]": student_id,
            "grades[0][grade]": score,
            "moodlewsrestformat": "json"
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(url, data=params) as response:
                return response.status == 200

    async def get_student_progress(self, student_id: str) -> Dict[str, Any]:
        """학생 진도 조회"""
        # Moodle completion API 사용
        url = f"{self.base_url}/webservice/rest/server.php"
        params = {
            "wstoken": self.api_token,
            "wsfunction": "core_completion_get_activities_completion_status",
            "userid": student_id,
            "moodlewsrestformat": "json"
        }

        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    return await response.json()
                return {}


class CanvasLMSProvider(LMSProvider):
    """Canvas LMS 연동"""

    def __init__(self, base_url: str, api_token: str):
        self.base_url = base_url.rstrip('/')
        self.api_token = api_token
        self.headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json"
        }

    async def get_student_info(self, student_id: str) -> Dict[str, Any]:
        """Canvas에서 학생 정보 조회"""
        url = f"{self.base_url}/api/v1/users/{student_id}/profile"

        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=self.headers) as response:
                if response.status == 200:
                    return await response.json()
                return {}

    async def get_current_course(self, student_id: str) -> Dict[str, Any]:
        """현재 수강 중인 코스 조회"""
        url = f"{self.base_url}/api/v1/users/{student_id}/courses"
        params = {"enrollment_state": "active"}

        async with aiohttp.ClientSession() as session:
            async with session.get(
                url,
                headers=self.headers,
                params=params
            ) as response:
                if response.status == 200:
                    courses = await response.json()
                    return courses[0] if courses else {}
                return {}

    async def submit_problem_result(
        self,
        student_id: str,
        problem_id: str,
        score: float,
        completed_at: datetime
    ) -> bool:
        """문제 풀이 결과를 Canvas에 제출"""
        # Canvas Submission API 사용
        # 실제 구현은 course_id와 assignment_id 매핑 필요
        url = f"{self.base_url}/api/v1/courses/{{course_id}}/assignments/{{assignment_id}}/submissions"
        payload = {
            "submission": {
                "user_id": student_id,
                "submission_type": "online_quiz",
                "score": score,
                "submitted_at": completed_at.isoformat()
            }
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                url,
                headers=self.headers,
                json=payload
            ) as response:
                return response.status == 201

    async def get_student_progress(self, student_id: str) -> Dict[str, Any]:
        """학생 진도 조회"""
        url = f"{self.base_url}/api/v1/users/{student_id}/courses"
        params = {"include[]": "total_scores"}

        async with aiohttp.ClientSession() as session:
            async with session.get(
                url,
                headers=self.headers,
                params=params
            ) as response:
                if response.status == 200:
                    return await response.json()
                return {}


class LMSIntegrationService:
    """LMS 통합 서비스"""

    def __init__(self, lms_provider: Optional[LMSProvider] = None):
        self.lms_provider = lms_provider

    def set_provider(self, lms_provider: LMSProvider):
        """LMS 제공자 설정"""
        self.lms_provider = lms_provider

    async def get_student_context(self, student_id: str) -> Dict[str, Any]:
        """
        학생의 LMS 컨텍스트 조회
        - 학생 정보
        - 현재 수강 중인 코스
        - 진도 상황
        """
        if not self.lms_provider:
            return {
                "student_id": student_id,
                "lms_connected": False,
                "message": "LMS provider not configured"
            }

        try:
            student_info = await self.lms_provider.get_student_info(student_id)
            current_course = await self.lms_provider.get_current_course(student_id)
            progress = await self.lms_provider.get_student_progress(student_id)

            return {
                "student_id": student_id,
                "lms_connected": True,
                "student_info": student_info,
                "current_course": current_course,
                "progress": progress
            }
        except Exception as e:
            return {
                "student_id": student_id,
                "lms_connected": False,
                "error": str(e)
            }

    async def sync_problem_result(
        self,
        student_id: str,
        problem_id: str,
        is_correct: bool,
        time_spent_seconds: int
    ) -> bool:
        """문제 풀이 결과를 LMS에 동기화"""
        if not self.lms_provider:
            return False

        # 점수 계산 (정답이면 100, 오답이면 0)
        score = 100.0 if is_correct else 0.0

        try:
            result = await self.lms_provider.submit_problem_result(
                student_id=student_id,
                problem_id=problem_id,
                score=score,
                completed_at=datetime.now()
            )
            return result
        except Exception as e:
            print(f"LMS sync error: {e}")
            return False


# LMS 제공자 팩토리
def create_lms_provider(
    provider_type: str,
    base_url: str,
    api_token: str
) -> LMSProvider:
    """
    LMS 제공자 인스턴스 생성

    Args:
        provider_type: 'moodle', 'canvas' 등
        base_url: LMS 기본 URL
        api_token: API 인증 토큰

    Returns:
        LMSProvider 인스턴스
    """
    providers = {
        "moodle": MoodleLMSProvider,
        "canvas": CanvasLMSProvider,
    }

    provider_class = providers.get(provider_type.lower())
    if not provider_class:
        raise ValueError(f"Unsupported LMS provider: {provider_type}")

    return provider_class(base_url, api_token)
