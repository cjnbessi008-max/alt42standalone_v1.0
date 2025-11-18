"""
LMS 연동 기본 인터페이스
Adapter 패턴을 사용하여 다양한 LMS 플랫폼 지원
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from uuid import UUID


class LMSAdapter(ABC):
    """LMS 어댑터 기본 클래스"""

    def __init__(self, config: Dict[str, Any]):
        """
        Args:
            config: LMS 연동 설정
                - instance_url: LMS 인스턴스 URL
                - auth_credentials: 인증 정보
                - course_id: 코스 ID
                - assignment_id: 과제 ID (선택)
        """
        self.config = config
        self.instance_url = config.get("instance_url")
        self.auth_credentials = config.get("auth_credentials", {})
        self.course_id = config.get("course_id")
        self.assignment_id = config.get("assignment_id")

    @abstractmethod
    async def authenticate(self) -> bool:
        """
        LMS 인증

        Returns:
            인증 성공 여부
        """
        pass

    @abstractmethod
    async def sync_growth_log(self, growth_log: Dict[str, Any]) -> Dict[str, Any]:
        """
        성장로그를 LMS에 동기화

        Args:
            growth_log: 성장로그 데이터

        Returns:
            동기화 결과
        """
        pass

    @abstractmethod
    async def sync_milestone(self, milestone: Dict[str, Any]) -> Dict[str, Any]:
        """
        성장 마일스톤을 LMS에 동기화

        Args:
            milestone: 마일스톤 데이터

        Returns:
            동기화 결과
        """
        pass

    @abstractmethod
    async def get_students(self) -> List[Dict[str, Any]]:
        """
        LMS에서 학생 목록 가져오기

        Returns:
            학생 목록
        """
        pass

    @abstractmethod
    async def create_or_update_grade(
        self,
        student_id: str,
        score: float,
        comment: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        성적 생성 또는 업데이트

        Args:
            student_id: LMS 학생 ID
            score: 점수 (0-100)
            comment: 코멘트 (성장 피드백)

        Returns:
            성적 생성/업데이트 결과
        """
        pass

    @abstractmethod
    async def post_announcement(
        self,
        title: str,
        message: str
    ) -> Dict[str, Any]:
        """
        공지사항 게시 (예: 마일스톤 달성)

        Args:
            title: 제목
            message: 내용

        Returns:
            게시 결과
        """
        pass

    async def validate_connection(self) -> bool:
        """
        LMS 연결 유효성 검사

        Returns:
            연결 유효 여부
        """
        try:
            authenticated = await self.authenticate()
            if not authenticated:
                return False

            # 학생 목록 조회로 연결 테스트
            students = await self.get_students()
            return len(students) >= 0

        except Exception as e:
            print(f"LMS 연결 검증 실패: {e}")
            return False

    def transform_growth_score_to_grade(self, growth_score: float) -> float:
        """
        성장 점수를 LMS 성적 형식으로 변환

        우리 시스템의 성장 점수는 0-100이지만,
        의미가 전통적인 점수와 다르므로 매핑 필요

        Args:
            growth_score: 성장 점수 (0-100)

        Returns:
            LMS 성적 (0-100)
        """
        # 성장 점수는 이미 0-100 스케일이므로 그대로 사용
        # 단, LMS에서는 이것이 "성장 지표"임을 코멘트에 명시해야 함
        return min(100.0, max(0.0, growth_score))

    def format_growth_feedback_for_lms(
        self,
        growth_log: Dict[str, Any]
    ) -> str:
        """
        성장 피드백을 LMS 코멘트 형식으로 변환

        Args:
            growth_log: 성장로그 데이터

        Returns:
            LMS 코멘트 텍스트
        """
        feedback_parts = []

        # 성장 카테고리
        category_kr = {
            "first_success": "첫 성공",
            "persistent_learning": "끈기있는 학습",
            "concept_exploration": "개념 탐구",
            "partial_understanding": "부분 이해",
            "misconception_identified": "오개념 발견",
            "strategy_refinement": "전략 개선",
        }

        category = growth_log.get("growth_category", "concept_exploration")
        feedback_parts.append(f"🌱 성장 유형: {category_kr.get(category, category)}")

        # 성장 점수
        growth_score = growth_log.get("growth_score", 0)
        effort_score = growth_log.get("effort_score", 0)
        feedback_parts.append(f"📊 성장 점수: {growth_score} / 노력 점수: {effort_score}")
        feedback_parts.append("(※ 이 점수는 정답률이 아닌 학습 과정의 성장 정도를 나타냅니다)")

        # AI 피드백
        if ai_feedback := growth_log.get("ai_feedback"):
            feedback_parts.append(f"\n💬 피드백:\n{ai_feedback}")

        # 교사 코멘트
        if teacher_comment := growth_log.get("teacher_comment"):
            feedback_parts.append(f"\n👩‍🏫 교사 코멘트:\n{teacher_comment}")

        return "\n\n".join(feedback_parts)


class LMSError(Exception):
    """LMS 연동 관련 오류"""
    pass


class AuthenticationError(LMSError):
    """인증 오류"""
    pass


class SyncError(LMSError):
    """동기화 오류"""
    pass
