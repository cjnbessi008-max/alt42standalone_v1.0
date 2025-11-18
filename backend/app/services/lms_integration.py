"""
LMS Integration Service
Supports LTI 1.3 and platform-specific integrations (Canvas, Moodle, KAIST)
"""
import logging
import hmac
import hashlib
import json
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from uuid import UUID

logger = logging.getLogger(__name__)


class LMSIntegrationService:
    """LMS 통합 서비스"""

    def __init__(self, config: Dict[str, Any]):
        """
        Args:
            config: LMS integration configuration
        """
        self.config = config
        self.supported_lms = ['canvas', 'moodle', 'kaist', 'generic_lti']

    # ========================================================================
    # LTI 1.3 Integration
    # ========================================================================

    def validate_lti_launch(
        self,
        id_token: str,
        client_id: str,
        deployment_id: str
    ) -> Dict[str, Any]:
        """
        LTI 1.3 Launch 요청 검증

        Args:
            id_token: JWT ID token from LMS
            client_id: OAuth2 client ID
            deployment_id: LTI deployment ID

        Returns:
            Validated user and context information

        Raises:
            ValueError: If validation fails
        """
        # TODO: Implement full LTI 1.3 JWT validation
        # - Verify JWT signature using platform's JWKS
        # - Validate claims (iss, aud, exp, nonce)
        # - Extract user and context information

        logger.info(f"Validating LTI launch for client {client_id}")

        # Mock validation for now
        return {
            'user_id': 'lms_user_123',
            'user_name': '학생A',
            'user_email': 'student@example.com',
            'course_id': 'course_123',
            'course_name': '수학 3-1',
            'roles': ['Learner'],
            'resource_link_id': 'link_123'
        }

    def generate_lti_deep_link_response(
        self,
        content_items: list,
        deployment_id: str,
        message_hint: str
    ) -> Dict[str, Any]:
        """
        LTI Deep Linking Response 생성

        Args:
            content_items: Items to embed in LMS
            deployment_id: LTI deployment ID
            message_hint: Message hint from original request

        Returns:
            Deep linking JWT response
        """
        # TODO: Implement full Deep Linking response
        logger.info(f"Generating deep link response for deployment {deployment_id}")

        return {
            'type': 'ltiDeepLinkingResponse',
            'content_items': content_items,
            'message': 'Module embedded successfully'
        }

    # ========================================================================
    # Grade Passback (LTI Outcomes / Assignment & Grade Services)
    # ========================================================================

    async def send_grade_to_lms(
        self,
        integration_id: UUID,
        student_id: UUID,
        submission_id: UUID,
        grade_value: float,
        lms_lineitem_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        LMS에 성적 전송

        Args:
            integration_id: LMS integration configuration ID
            student_id: Student UUID
            submission_id: Answer submission UUID
            grade_value: Grade (0-100)
            lms_lineitem_id: LTI lineitem ID (optional)

        Returns:
            Passback result
        """
        # TODO: Get integration config from database
        integration_config = await self._get_integration_config(integration_id)

        lms_type = integration_config['lms_type']
        logger.info(
            f"Sending grade {grade_value} to {lms_type} LMS "
            f"for student {student_id}"
        )

        try:
            if lms_type == 'canvas':
                result = await self._send_grade_to_canvas(
                    integration_config, student_id, grade_value
                )
            elif lms_type == 'moodle':
                result = await self._send_grade_to_moodle(
                    integration_config, student_id, grade_value
                )
            elif lms_type in ['kaist', 'generic_lti']:
                result = await self._send_grade_via_lti(
                    integration_config, student_id, grade_value, lms_lineitem_id
                )
            else:
                raise ValueError(f"Unsupported LMS type: {lms_type}")

            # Log passback
            await self._log_grade_passback(
                integration_id=integration_id,
                submission_id=submission_id,
                student_id=student_id,
                grade_value=grade_value,
                status='success',
                response=result
            )

            return result

        except Exception as e:
            logger.error(f"Grade passback failed: {str(e)}")

            # Log failure
            await self._log_grade_passback(
                integration_id=integration_id,
                submission_id=submission_id,
                student_id=student_id,
                grade_value=grade_value,
                status='failed',
                error=str(e)
            )

            raise

    async def _send_grade_via_lti(
        self,
        config: Dict[str, Any],
        student_id: UUID,
        grade_value: float,
        lineitem_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """LTI Assignment & Grade Services를 통한 성적 전송"""
        # TODO: Implement LTI AGS (Assignment and Grade Services) integration
        # - Get OAuth2 access token
        # - POST score to lineitem endpoint
        # - Handle response

        logger.info(f"Sending grade via LTI AGS for student {student_id}")

        # Mock implementation
        return {
            'status': 'success',
            'score': grade_value,
            'timestamp': datetime.utcnow().isoformat()
        }

    async def _send_grade_to_canvas(
        self,
        config: Dict[str, Any],
        student_id: UUID,
        grade_value: float
    ) -> Dict[str, Any]:
        """Canvas LMS API를 통한 성적 전송"""
        # TODO: Implement Canvas API integration
        # - Use Canvas API token
        # - PUT /api/v1/courses/{course_id}/assignments/{assignment_id}/submissions/{user_id}

        logger.info(f"Sending grade to Canvas for student {student_id}")

        # Mock implementation
        return {
            'status': 'success',
            'platform': 'canvas',
            'score': grade_value
        }

    async def _send_grade_to_moodle(
        self,
        config: Dict[str, Any],
        student_id: UUID,
        grade_value: float
    ) -> Dict[str, Any]:
        """Moodle LMS API를 통한 성적 전송"""
        # TODO: Implement Moodle Web Services API integration
        # - Use Moodle token
        # - Call mod_assign_save_grade function

        logger.info(f"Sending grade to Moodle for student {student_id}")

        # Mock implementation
        return {
            'status': 'success',
            'platform': 'moodle',
            'score': grade_value
        }

    # ========================================================================
    # Roster Sync
    # ========================================================================

    async def sync_course_roster(
        self,
        integration_id: UUID
    ) -> Dict[str, Any]:
        """
        LMS에서 수강생 명단 동기화

        Args:
            integration_id: LMS integration configuration ID

        Returns:
            Sync results (added, updated, removed counts)
        """
        integration_config = await self._get_integration_config(integration_id)
        lms_type = integration_config['lms_type']

        logger.info(f"Syncing roster from {lms_type} LMS")

        try:
            if lms_type == 'canvas':
                students = await self._fetch_canvas_roster(integration_config)
            elif lms_type == 'moodle':
                students = await self._fetch_moodle_roster(integration_config)
            elif lms_type == 'kaist':
                students = await self._fetch_kaist_roster(integration_config)
            else:
                raise ValueError(f"Roster sync not supported for {lms_type}")

            # Update local database
            result = await self._update_local_roster(integration_id, students)

            # Log sync
            await self._log_roster_sync(
                integration_id=integration_id,
                status='success',
                result=result
            )

            return result

        except Exception as e:
            logger.error(f"Roster sync failed: {str(e)}")

            await self._log_roster_sync(
                integration_id=integration_id,
                status='failed',
                error=str(e)
            )

            raise

    async def _fetch_canvas_roster(self, config: Dict[str, Any]) -> list:
        """Canvas에서 수강생 명단 조회"""
        # TODO: Implement Canvas API call
        # GET /api/v1/courses/{course_id}/users
        return []

    async def _fetch_moodle_roster(self, config: Dict[str, Any]) -> list:
        """Moodle에서 수강생 명단 조회"""
        # TODO: Implement Moodle Web Services call
        # core_enrol_get_enrolled_users
        return []

    async def _fetch_kaist_roster(self, config: Dict[str, Any]) -> list:
        """KAIST 시스템에서 수강생 명단 조회"""
        # TODO: Implement KAIST-specific API call
        return []

    # ========================================================================
    # Helper Methods
    # ========================================================================

    async def _get_integration_config(self, integration_id: UUID) -> Dict[str, Any]:
        """데이터베이스에서 LMS 통합 설정 조회"""
        # TODO: Implement actual database query
        return {
            'id': str(integration_id),
            'lms_type': 'generic_lti',
            'lms_course_id': 'course_123',
            'consumer_key': 'key123',
            'shared_secret': 'secret123'
        }

    async def _update_local_roster(
        self,
        integration_id: UUID,
        students: list
    ) -> Dict[str, int]:
        """로컬 데이터베이스의 수강생 명단 업데이트"""
        # TODO: Implement actual database update
        return {
            'added': len(students),
            'updated': 0,
            'removed': 0,
            'total': len(students)
        }

    async def _log_grade_passback(
        self,
        integration_id: UUID,
        submission_id: UUID,
        student_id: UUID,
        grade_value: float,
        status: str,
        response: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None
    ):
        """성적 전송 로그 기록"""
        # TODO: Implement database logging
        logger.info(
            f"Grade passback logged: {status} - "
            f"submission={submission_id}, grade={grade_value}"
        )

    async def _log_roster_sync(
        self,
        integration_id: UUID,
        status: str,
        result: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None
    ):
        """명단 동기화 로그 기록"""
        # TODO: Implement database logging
        logger.info(f"Roster sync logged: {status} - integration={integration_id}")

    # ========================================================================
    # Security & Validation
    # ========================================================================

    def verify_lti_message(
        self,
        message: Dict[str, Any],
        shared_secret: str
    ) -> bool:
        """
        LTI 1.1 메시지 서명 검증 (OAuth 1.0 서명)

        Args:
            message: LTI launch parameters
            shared_secret: LTI shared secret

        Returns:
            True if signature is valid
        """
        # TODO: Implement OAuth 1.0 signature validation
        # - Extract oauth_signature from message
        # - Compute expected signature
        # - Compare signatures

        logger.info("Verifying LTI message signature")
        return True  # Mock validation

    def generate_oauth_signature(
        self,
        method: str,
        url: str,
        params: Dict[str, str],
        shared_secret: str
    ) -> str:
        """
        OAuth 1.0 서명 생성

        Args:
            method: HTTP method (GET, POST)
            url: Request URL
            params: Request parameters
            shared_secret: Shared secret for HMAC

        Returns:
            Base64-encoded signature
        """
        # TODO: Implement OAuth 1.0 signature generation
        # - Create base string
        # - HMAC-SHA1 with shared_secret
        # - Base64 encode

        import base64

        base_string = f"{method}&{url}&{json.dumps(params)}"
        signature = hmac.new(
            shared_secret.encode(),
            base_string.encode(),
            hashlib.sha1
        ).digest()

        return base64.b64encode(signature).decode()


# ============================================================================
# LMS-specific Utilities
# ============================================================================

def map_lms_user_to_local(lms_user: Dict[str, Any], lms_type: str) -> Dict[str, Any]:
    """
    LMS 사용자 정보를 로컬 데이터 모델로 변환

    Args:
        lms_user: LMS user data
        lms_type: LMS platform type

    Returns:
        Local user data
    """
    if lms_type == 'canvas':
        return {
            'name': lms_user.get('name'),
            'email': lms_user.get('email') or lms_user.get('login_id'),
            'lms_user_id': str(lms_user.get('id')),
            'avatar_url': lms_user.get('avatar_url')
        }
    elif lms_type == 'moodle':
        return {
            'name': lms_user.get('fullname'),
            'email': lms_user.get('email'),
            'lms_user_id': str(lms_user.get('id')),
            'avatar_url': lms_user.get('profileimageurl')
        }
    else:
        # Generic mapping
        return {
            'name': lms_user.get('name') or lms_user.get('fullname'),
            'email': lms_user.get('email'),
            'lms_user_id': str(lms_user.get('id'))
        }


def calculate_grade_from_classification(
    is_correct: bool,
    classification_type: Optional[str] = None,
    confidence: Optional[float] = None
) -> float:
    """
    답안 결과를 LMS 성적(0-100)으로 변환

    Args:
        is_correct: 정답 여부
        classification_type: 오답 분류 (개념/계산/조건누락)
        confidence: 분류 신뢰도

    Returns:
        Grade value (0-100)
    """
    if is_correct:
        return 100.0

    # 오답의 경우 부분 점수 부여 (선택사항)
    # 예: 계산 실수는 개념 오류보다 높은 점수
    if classification_type == '계산':
        return 50.0  # 계산 실수
    elif classification_type == '조건누락':
        return 40.0  # 조건 누락
    elif classification_type == '개념':
        return 20.0  # 개념 오류
    else:
        return 0.0   # 분류 실패
