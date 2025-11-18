"""
LMS 연동 클라이언트
Canvas, Moodle 등 주요 LMS와 연동하여 학습 상태를 공유합니다.
"""
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum
import httpx
from abc import ABC, abstractmethod


class LMSType(Enum):
    """LMS 유형"""
    CANVAS = "canvas"
    MOODLE = "moodle"
    BLACKBOARD = "blackboard"
    KAIST = "kaist"  # KAIST 자체 시스템


class StudentSession:
    """학생 학습 세션 정보"""

    def __init__(
        self,
        student_id: str,
        course_id: str,
        session_id: str,
        start_time: datetime,
        end_time: Optional[datetime] = None,
        stress_level: float = 0.0,
        break_taken: bool = False
    ):
        self.student_id = student_id
        self.course_id = course_id
        self.session_id = session_id
        self.start_time = start_time
        self.end_time = end_time
        self.stress_level = stress_level
        self.break_taken = break_taken

    def to_dict(self) -> Dict[str, Any]:
        """딕셔너리로 변환"""
        return {
            "student_id": self.student_id,
            "course_id": self.course_id,
            "session_id": self.session_id,
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "stress_level": self.stress_level,
            "break_taken": self.break_taken
        }


class BaseLMSClient(ABC):
    """LMS 클라이언트 기본 클래스"""

    def __init__(self, base_url: str, api_token: str):
        self.base_url = base_url
        self.api_token = api_token
        self.client = httpx.AsyncClient(
            timeout=30.0,
            headers={
                "Authorization": f"Bearer {api_token}",
                "Content-Type": "application/json"
            }
        )

    @abstractmethod
    async def get_student_info(self, student_id: str) -> Dict[str, Any]:
        """학생 정보 조회"""
        pass

    @abstractmethod
    async def get_course_info(self, course_id: str) -> Dict[str, Any]:
        """강좌 정보 조회"""
        pass

    @abstractmethod
    async def update_session_status(
        self,
        session: StudentSession
    ) -> bool:
        """세션 상태 업데이트"""
        pass

    @abstractmethod
    async def notify_break_suggestion(
        self,
        student_id: str,
        course_id: str,
        reason: str
    ) -> bool:
        """휴식 제안 알림"""
        pass

    async def close(self):
        """클라이언트 종료"""
        await self.client.aclose()


class CanvasLMSClient(BaseLMSClient):
    """Canvas LMS 클라이언트"""

    async def get_student_info(self, student_id: str) -> Dict[str, Any]:
        """Canvas에서 학생 정보 조회"""
        try:
            response = await self.client.get(
                f"{self.base_url}/api/v1/users/{student_id}"
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            print(f"Failed to get student info: {e}")
            return {}

    async def get_course_info(self, course_id: str) -> Dict[str, Any]:
        """Canvas에서 강좌 정보 조회"""
        try:
            response = await self.client.get(
                f"{self.base_url}/api/v1/courses/{course_id}"
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            print(f"Failed to get course info: {e}")
            return {}

    async def update_session_status(
        self,
        session: StudentSession
    ) -> bool:
        """Canvas에 세션 상태 업데이트 (Custom API Extension)"""
        try:
            # Canvas의 custom API endpoint (확장 필요)
            response = await self.client.post(
                f"{self.base_url}/api/v1/courses/{session.course_id}/sessions",
                json=session.to_dict()
            )
            response.raise_for_status()
            return True
        except httpx.HTTPError as e:
            print(f"Failed to update session status: {e}")
            return False

    async def notify_break_suggestion(
        self,
        student_id: str,
        course_id: str,
        reason: str
    ) -> bool:
        """Canvas 알림 전송"""
        try:
            # Canvas Conversations API 사용
            response = await self.client.post(
                f"{self.base_url}/api/v1/conversations",
                json={
                    "recipients[]": [student_id],
                    "subject": "Break Suggestion",
                    "body": reason,
                    "force_new": True
                }
            )
            response.raise_for_status()
            return True
        except httpx.HTTPError as e:
            print(f"Failed to send notification: {e}")
            return False


class MoodleLMSClient(BaseLMSClient):
    """Moodle LMS 클라이언트"""

    async def get_student_info(self, student_id: str) -> Dict[str, Any]:
        """Moodle에서 학생 정보 조회"""
        try:
            response = await self.client.post(
                f"{self.base_url}/webservice/rest/server.php",
                data={
                    "wstoken": self.api_token,
                    "wsfunction": "core_user_get_users_by_field",
                    "field": "id",
                    "values[0]": student_id,
                    "moodlewsrestformat": "json"
                }
            )
            response.raise_for_status()
            data = response.json()
            return data[0] if data else {}
        except httpx.HTTPError as e:
            print(f"Failed to get student info: {e}")
            return {}

    async def get_course_info(self, course_id: str) -> Dict[str, Any]:
        """Moodle에서 강좌 정보 조회"""
        try:
            response = await self.client.post(
                f"{self.base_url}/webservice/rest/server.php",
                data={
                    "wstoken": self.api_token,
                    "wsfunction": "core_course_get_courses",
                    "options[ids][0]": course_id,
                    "moodlewsrestformat": "json"
                }
            )
            response.raise_for_status()
            data = response.json()
            return data[0] if data else {}
        except httpx.HTTPError as e:
            print(f"Failed to get course info: {e}")
            return {}

    async def update_session_status(
        self,
        session: StudentSession
    ) -> bool:
        """Moodle에 세션 상태 업데이트 (Custom Plugin 필요)"""
        # Moodle custom plugin을 통해 구현
        # 여기서는 기본 구조만 제시
        try:
            response = await self.client.post(
                f"{self.base_url}/webservice/rest/server.php",
                data={
                    "wstoken": self.api_token,
                    "wsfunction": "local_alt42_update_session",  # Custom function
                    "session_data": session.to_dict(),
                    "moodlewsrestformat": "json"
                }
            )
            response.raise_for_status()
            return True
        except httpx.HTTPError as e:
            print(f"Failed to update session status: {e}")
            return False

    async def notify_break_suggestion(
        self,
        student_id: str,
        course_id: str,
        reason: str
    ) -> bool:
        """Moodle 메시지 전송"""
        try:
            response = await self.client.post(
                f"{self.base_url}/webservice/rest/server.php",
                data={
                    "wstoken": self.api_token,
                    "wsfunction": "core_message_send_instant_messages",
                    "messages[0][touserid]": student_id,
                    "messages[0][text]": reason,
                    "moodlewsrestformat": "json"
                }
            )
            response.raise_for_status()
            return True
        except httpx.HTTPError as e:
            print(f"Failed to send notification: {e}")
            return False


class KAISTLMSClient(BaseLMSClient):
    """KAIST 자체 LMS 클라이언트"""

    async def get_student_info(self, student_id: str) -> Dict[str, Any]:
        """KAIST LMS에서 학생 정보 조회"""
        try:
            response = await self.client.get(
                f"{self.base_url}/api/students/{student_id}"
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            print(f"Failed to get student info: {e}")
            return {}

    async def get_course_info(self, course_id: str) -> Dict[str, Any]:
        """KAIST LMS에서 강좌 정보 조회"""
        try:
            response = await self.client.get(
                f"{self.base_url}/api/courses/{course_id}"
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            print(f"Failed to get course info: {e}")
            return {}

    async def update_session_status(
        self,
        session: StudentSession
    ) -> bool:
        """KAIST LMS에 세션 상태 업데이트"""
        try:
            response = await self.client.put(
                f"{self.base_url}/api/sessions/{session.session_id}",
                json=session.to_dict()
            )
            response.raise_for_status()
            return True
        except httpx.HTTPError as e:
            print(f"Failed to update session status: {e}")
            return False

    async def notify_break_suggestion(
        self,
        student_id: str,
        course_id: str,
        reason: str
    ) -> bool:
        """KAIST LMS 알림 전송"""
        try:
            response = await self.client.post(
                f"{self.base_url}/api/notifications",
                json={
                    "recipient_id": student_id,
                    "course_id": course_id,
                    "type": "break_suggestion",
                    "message": reason,
                    "timestamp": datetime.now().isoformat()
                }
            )
            response.raise_for_status()
            return True
        except httpx.HTTPError as e:
            print(f"Failed to send notification: {e}")
            return False


class LMSClientFactory:
    """LMS 클라이언트 팩토리"""

    @staticmethod
    def create_client(
        lms_type: LMSType,
        base_url: str,
        api_token: str
    ) -> BaseLMSClient:
        """
        LMS 유형에 따라 적절한 클라이언트 생성

        Args:
            lms_type: LMS 유형
            base_url: LMS API 베이스 URL
            api_token: API 인증 토큰

        Returns:
            BaseLMSClient: LMS 클라이언트 인스턴스
        """
        if lms_type == LMSType.CANVAS:
            return CanvasLMSClient(base_url, api_token)
        elif lms_type == LMSType.MOODLE:
            return MoodleLMSClient(base_url, api_token)
        elif lms_type == LMSType.KAIST:
            return KAISTLMSClient(base_url, api_token)
        elif lms_type == LMSType.BLACKBOARD:
            # Blackboard 구현은 향후 추가
            raise NotImplementedError("Blackboard LMS client not yet implemented")
        else:
            raise ValueError(f"Unsupported LMS type: {lms_type}")


class LMSIntegrationService:
    """
    LMS 통합 서비스

    여러 LMS 시스템과 통합하여 학습 세션 정보를 공유하고
    휴식 제안을 전달합니다.
    """

    def __init__(self):
        self.clients: Dict[str, BaseLMSClient] = {}
        self.active_sessions: Dict[str, StudentSession] = {}

    def register_lms(
        self,
        lms_id: str,
        lms_type: LMSType,
        base_url: str,
        api_token: str
    ):
        """LMS 등록"""
        client = LMSClientFactory.create_client(lms_type, base_url, api_token)
        self.clients[lms_id] = client

    async def start_session(
        self,
        lms_id: str,
        student_id: str,
        course_id: str
    ) -> Optional[StudentSession]:
        """학습 세션 시작"""
        if lms_id not in self.clients:
            print(f"LMS client not found: {lms_id}")
            return None

        session = StudentSession(
            student_id=student_id,
            course_id=course_id,
            session_id=f"{student_id}_{course_id}_{datetime.now().timestamp()}",
            start_time=datetime.now()
        )

        # LMS에 세션 정보 전송
        client = self.clients[lms_id]
        success = await client.update_session_status(session)

        if success:
            self.active_sessions[session.session_id] = session
            return session
        else:
            return None

    async def end_session(
        self,
        lms_id: str,
        session_id: str
    ) -> bool:
        """학습 세션 종료"""
        if session_id not in self.active_sessions:
            print(f"Session not found: {session_id}")
            return False

        session = self.active_sessions[session_id]
        session.end_time = datetime.now()

        # LMS에 세션 종료 정보 전송
        client = self.clients.get(lms_id)
        if client:
            success = await client.update_session_status(session)
            if success:
                del self.active_sessions[session_id]
                return True

        return False

    async def update_session_stress(
        self,
        lms_id: str,
        session_id: str,
        stress_level: float
    ) -> bool:
        """세션 스트레스 레벨 업데이트"""
        if session_id not in self.active_sessions:
            return False

        session = self.active_sessions[session_id]
        session.stress_level = stress_level

        # LMS에 업데이트
        client = self.clients.get(lms_id)
        if client:
            return await client.update_session_status(session)

        return False

    async def send_break_notification(
        self,
        lms_id: str,
        student_id: str,
        course_id: str,
        reason: str
    ) -> bool:
        """휴식 제안 알림 전송"""
        client = self.clients.get(lms_id)
        if client:
            return await client.notify_break_suggestion(
                student_id,
                course_id,
                reason
            )
        return False

    async def close_all(self):
        """모든 LMS 클라이언트 종료"""
        for client in self.clients.values():
            await client.close()
