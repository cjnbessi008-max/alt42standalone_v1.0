"""
Moodle integration service
"""
import httpx
from typing import Dict, Any, Optional, List
import logging

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class MoodleService:
    """Service for Moodle API integration"""

    def __init__(self):
        self.base_url = settings.MOODLE_URL.rstrip('/')
        self.token = settings.MOODLE_TOKEN
        self.ws_url = f"{self.base_url}/webservice/rest/server.php"

    async def call_function(self, function: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Call a Moodle web service function

        Args:
            function: Moodle web service function name
            params: Function parameters

        Returns:
            Response data
        """
        if not self.token:
            logger.warning("Moodle token not configured")
            return {}

        request_params = {
            'wstoken': self.token,
            'wsfunction': function,
            'moodlewsrestformat': 'json'
        }

        if params:
            request_params.update(params)

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(self.ws_url, data=request_params)
                response.raise_for_status()
                return response.json()

        except httpx.HTTPError as e:
            logger.error(f"Moodle API error: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error calling Moodle function {function}: {str(e)}")
            raise

    async def get_user_info(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Get user information from Moodle"""
        try:
            result = await self.call_function(
                'core_user_get_users_by_field',
                {'field': 'id', 'values[0]': user_id}
            )
            return result[0] if result else None
        except Exception as e:
            logger.error(f"Error getting user info: {str(e)}")
            return None

    async def get_assignment_submissions(self, assignment_id: int) -> List[Dict[str, Any]]:
        """Get assignment submissions from Moodle"""
        try:
            result = await self.call_function(
                'mod_assign_get_submissions',
                {'assignmentids[0]': assignment_id}
            )
            return result.get('assignments', [{}])[0].get('submissions', [])
        except Exception as e:
            logger.error(f"Error getting submissions: {str(e)}")
            return []

    async def get_course_students(self, course_id: int) -> List[Dict[str, Any]]:
        """Get students enrolled in a course"""
        try:
            result = await self.call_function(
                'core_enrol_get_enrolled_users',
                {'courseid': course_id}
            )
            return result if isinstance(result, list) else []
        except Exception as e:
            logger.error(f"Error getting course students: {str(e)}")
            return []

    async def update_grade(self, assignment_id: int, user_id: int, grade: float, feedback: str = "") -> bool:
        """Update assignment grade in Moodle"""
        try:
            await self.call_function(
                'mod_assign_save_grade',
                {
                    'assignmentid': assignment_id,
                    'userid': user_id,
                    'grade': grade,
                    'plugindata[assignfeedbackcomments_editor][text]': feedback,
                    'plugindata[assignfeedbackcomments_editor][format]': 1
                }
            )
            return True
        except Exception as e:
            logger.error(f"Error updating grade: {str(e)}")
            return False

    async def send_feedback(self, user_id: int, subject: str, message: str) -> bool:
        """Send message to user via Moodle"""
        try:
            await self.call_function(
                'core_message_send_instant_messages',
                {
                    'messages[0][touserid]': user_id,
                    'messages[0][text]': message,
                    'messages[0][textformat]': 1
                }
            )
            return True
        except Exception as e:
            logger.error(f"Error sending feedback: {str(e)}")
            return False
