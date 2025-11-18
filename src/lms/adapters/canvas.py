"""
Canvas LMS 어댑터
Canvas LMS API를 사용한 성장로그 동기화
"""

from typing import Any, Dict, List, Optional
import aiohttp

from ..base import LMSAdapter, AuthenticationError, SyncError


class CanvasLMSAdapter(LMSAdapter):
    """Canvas LMS 어댑터"""

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.api_token = self.auth_credentials.get("api_token")
        self.api_url = f"{self.instance_url}/api/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }

    async def authenticate(self) -> bool:
        """
        Canvas API 토큰 유효성 검사
        """
        if not self.api_token:
            raise AuthenticationError("Canvas API token is required")

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.api_url}/users/self",
                    headers=self.headers
                ) as response:
                    if response.status == 200:
                        return True
                    elif response.status == 401:
                        raise AuthenticationError("Invalid Canvas API token")
                    else:
                        return False

        except aiohttp.ClientError as e:
            raise AuthenticationError(f"Canvas authentication failed: {e}")

    async def sync_growth_log(self, growth_log: Dict[str, Any]) -> Dict[str, Any]:
        """
        성장로그를 Canvas 성적으로 동기화

        Canvas에서는:
        1. Assignment submission에 점수 입력
        2. 코멘트로 성장 피드백 추가
        """
        try:
            student_lms_id = await self._get_canvas_student_id(
                growth_log.get("student_id")
            )

            if not student_lms_id:
                raise SyncError("Student not found in Canvas")

            # 성장 점수를 Canvas 성적으로 변환
            growth_score = growth_log.get("growth_score", 0)
            grade = self.transform_growth_score_to_grade(float(growth_score))

            # 피드백 포맷팅
            comment = self.format_growth_feedback_for_lms(growth_log)

            # Canvas API: 성적 업데이트
            result = await self.create_or_update_grade(
                student_id=student_lms_id,
                score=grade,
                comment=comment
            )

            return {
                "success": True,
                "lms_response": result,
                "synced_at": growth_log.get("created_at")
            }

        except Exception as e:
            raise SyncError(f"Failed to sync growth log to Canvas: {e}")

    async def sync_milestone(self, milestone: Dict[str, Any]) -> Dict[str, Any]:
        """
        성장 마일스톤을 Canvas 공지사항으로 게시

        학생이 주요 성장 마일스톤을 달성했을 때 축하 공지
        """
        try:
            title = f"🎉 {milestone.get('title', '성장 마일스톤 달성')}"
            message = self._format_milestone_announcement(milestone)

            result = await self.post_announcement(title, message)

            return {
                "success": True,
                "announcement_id": result.get("id"),
                "synced_at": milestone.get("achieved_at")
            }

        except Exception as e:
            raise SyncError(f"Failed to sync milestone to Canvas: {e}")

    async def get_students(self) -> List[Dict[str, Any]]:
        """
        Canvas 코스에서 학생 목록 가져오기
        """
        if not self.course_id:
            raise ValueError("Course ID is required")

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.api_url}/courses/{self.course_id}/users",
                    headers=self.headers,
                    params={"enrollment_type": "student"}
                ) as response:
                    if response.status == 200:
                        students = await response.json()
                        return students
                    else:
                        error_text = await response.text()
                        raise SyncError(f"Failed to get students: {error_text}")

        except aiohttp.ClientError as e:
            raise SyncError(f"Failed to get students from Canvas: {e}")

    async def create_or_update_grade(
        self,
        student_id: str,
        score: float,
        comment: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Canvas에 성적 생성/업데이트
        """
        if not self.course_id or not self.assignment_id:
            raise ValueError("Course ID and Assignment ID are required")

        try:
            submission_data = {
                "submission": {
                    "posted_grade": score
                }
            }

            # 코멘트 추가
            if comment:
                submission_data["comment"] = {
                    "text_comment": comment
                }

            async with aiohttp.ClientSession() as session:
                async with session.put(
                    f"{self.api_url}/courses/{self.course_id}/assignments/{self.assignment_id}/submissions/{student_id}",
                    headers=self.headers,
                    json=submission_data
                ) as response:
                    if response.status in [200, 201]:
                        result = await response.json()
                        return result
                    else:
                        error_text = await response.text()
                        raise SyncError(f"Failed to update grade: {error_text}")

        except aiohttp.ClientError as e:
            raise SyncError(f"Failed to update grade in Canvas: {e}")

    async def post_announcement(
        self,
        title: str,
        message: str
    ) -> Dict[str, Any]:
        """
        Canvas 코스에 공지사항 게시
        """
        if not self.course_id:
            raise ValueError("Course ID is required")

        try:
            announcement_data = {
                "title": title,
                "message": message,
                "is_announcement": True
            }

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.api_url}/courses/{self.course_id}/discussion_topics",
                    headers=self.headers,
                    json=announcement_data
                ) as response:
                    if response.status in [200, 201]:
                        result = await response.json()
                        return result
                    else:
                        error_text = await response.text()
                        raise SyncError(f"Failed to post announcement: {error_text}")

        except aiohttp.ClientError as e:
            raise SyncError(f"Failed to post announcement to Canvas: {e}")

    async def _get_canvas_student_id(self, internal_student_id: str) -> Optional[str]:
        """
        내부 학생 ID를 Canvas 학생 ID로 변환

        TODO: 실제로는 매핑 테이블 또는 Canvas의 custom field 사용
        """
        # Placeholder: 실제 구현에서는 DB 매핑 테이블 참조
        return internal_student_id

    def _format_milestone_announcement(self, milestone: Dict[str, Any]) -> str:
        """
        마일스톤을 공지사항 형식으로 포맷
        """
        milestone_types_kr = {
            "concept_mastery": "개념 숙달",
            "persistent_effort": "끈기있는 노력",
            "creative_approach": "창의적 접근",
            "error_learning": "오류로부터 학습",
            "helping_others": "동료 도움",
            "self_correction": "자기 교정",
        }

        parts = []

        # 마일스톤 유형
        milestone_type = milestone.get("milestone_type", "")
        parts.append(f"**성장 유형**: {milestone_types_kr.get(milestone_type, milestone_type)}")

        # 설명
        if description := milestone.get("description"):
            parts.append(f"\n{description}")

        # 축하 메시지
        if celebration := milestone.get("celebration_message"):
            parts.append(f"\n💐 {celebration}")

        # 배지
        if badge := milestone.get("badge_earned"):
            parts.append(f"\n🏆 획득 배지: **{badge}**")

        return "\n".join(parts)

    async def get_assignment_submissions(
        self,
        assignment_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Canvas 과제 제출 내역 조회
        """
        assignment_id = assignment_id or self.assignment_id

        if not self.course_id or not assignment_id:
            raise ValueError("Course ID and Assignment ID are required")

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.api_url}/courses/{self.course_id}/assignments/{assignment_id}/submissions",
                    headers=self.headers,
                    params={"include[]": ["submission_comments", "user"]}
                ) as response:
                    if response.status == 200:
                        submissions = await response.json()
                        return submissions
                    else:
                        error_text = await response.text()
                        raise SyncError(f"Failed to get submissions: {error_text}")

        except aiohttp.ClientError as e:
            raise SyncError(f"Failed to get submissions from Canvas: {e}")
