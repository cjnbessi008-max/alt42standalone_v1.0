"""Service for integrating with Moodle LMS via Web Services API."""
import httpx
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class MoodleAPIError(Exception):
    """Custom exception for Moodle API errors."""

    pass


class MoodleService:
    """Service class for interacting with Moodle Web Services API."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_token: Optional[str] = None,
    ):
        """
        Initialize Moodle service.

        Args:
            base_url: Moodle instance base URL (defaults to settings)
            api_token: Moodle web service token (defaults to settings)
        """
        self.base_url = (base_url or settings.MOODLE_BASE_URL).rstrip("/")
        self.api_token = api_token or settings.MOODLE_API_TOKEN
        self.api_endpoint = f"{self.base_url}/webservice/rest/server.php"

    async def _make_request(
        self,
        function: str,
        params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Make an API request to Moodle.

        Args:
            function: Moodle web service function name
            params: Additional parameters for the request

        Returns:
            JSON response from Moodle

        Raises:
            MoodleAPIError: If the request fails
        """
        request_params = {
            "wstoken": self.api_token,
            "wsfunction": function,
            "moodlewsrestformat": "json",
        }

        if params:
            request_params.update(params)

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(self.api_endpoint, params=request_params)
                response.raise_for_status()
                data = response.json()

                # Check for Moodle API errors
                if isinstance(data, dict) and "exception" in data:
                    error_msg = data.get("message", "Unknown Moodle API error")
                    logger.error(f"Moodle API error: {error_msg}")
                    raise MoodleAPIError(error_msg)

                return data

        except httpx.HTTPError as e:
            logger.error(f"HTTP error when calling Moodle API: {e}")
            raise MoodleAPIError(f"HTTP error: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error calling Moodle API: {e}")
            raise MoodleAPIError(f"Unexpected error: {str(e)}")

    async def test_connection(self) -> bool:
        """
        Test the connection to Moodle API.

        Returns:
            True if connection is successful
        """
        try:
            result = await self._make_request("core_webservice_get_site_info")
            return "sitename" in result
        except MoodleAPIError:
            return False

    async def get_site_info(self) -> Dict[str, Any]:
        """
        Get Moodle site information.

        Returns:
            Site information dictionary
        """
        return await self._make_request("core_webservice_get_site_info")

    async def get_courses(self) -> List[Dict[str, Any]]:
        """
        Retrieve all courses from Moodle.

        Returns:
            List of course dictionaries
        """
        result = await self._make_request("core_course_get_courses")
        return result if isinstance(result, list) else []

    async def get_course_by_id(self, course_id: int) -> Dict[str, Any]:
        """
        Get a specific course by ID.

        Args:
            course_id: Moodle course ID

        Returns:
            Course information dictionary
        """
        params = {"options[ids][0]": course_id}
        result = await self._make_request("core_course_get_courses", params)

        if isinstance(result, list) and len(result) > 0:
            return result[0]
        return {}

    async def get_enrolled_users(self, course_id: int) -> List[Dict[str, Any]]:
        """
        Get all users enrolled in a course.

        Args:
            course_id: Moodle course ID

        Returns:
            List of user dictionaries
        """
        params = {"courseid": course_id}
        result = await self._make_request(
            "core_enrol_get_enrolled_users",
            params,
        )
        return result if isinstance(result, list) else []

    async def get_course_quizzes(self, course_id: int) -> List[Dict[str, Any]]:
        """
        Get all quizzes in a course.

        Args:
            course_id: Moodle course ID

        Returns:
            List of quiz dictionaries
        """
        params = {"courseid": course_id}
        result = await self._make_request(
            "mod_quiz_get_quizzes_by_courses",
            params,
        )

        if isinstance(result, dict) and "quizzes" in result:
            return result["quizzes"]
        return []

    async def get_quiz_attempts(
        self,
        quiz_id: int,
        user_id: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        Get quiz attempts for a quiz, optionally filtered by user.

        Args:
            quiz_id: Moodle quiz ID
            user_id: Optional user ID to filter attempts

        Returns:
            List of quiz attempt dictionaries
        """
        params = {"quizid": quiz_id}
        if user_id:
            params["userid"] = user_id

        result = await self._make_request("mod_quiz_get_user_attempts", params)

        if isinstance(result, dict) and "attempts" in result:
            return result["attempts"]
        return []

    async def get_attempt_review(self, attempt_id: int) -> Dict[str, Any]:
        """
        Get detailed review data for a quiz attempt.

        Args:
            attempt_id: Moodle attempt ID

        Returns:
            Attempt review data including questions and answers
        """
        params = {"attemptid": attempt_id}
        result = await self._make_request("mod_quiz_get_attempt_review", params)
        return result if isinstance(result, dict) else {}

    async def get_user_grades(
        self,
        course_id: int,
        user_id: int,
    ) -> Dict[str, Any]:
        """
        Get grades for a user in a course.

        Args:
            course_id: Moodle course ID
            user_id: Moodle user ID

        Returns:
            User grades dictionary
        """
        params = {"courseid": course_id, "userid": user_id}
        result = await self._make_request("gradereport_user_get_grade_items", params)
        return result if isinstance(result, dict) else {}

    async def get_course_modules(self, course_id: int) -> List[Dict[str, Any]]:
        """
        Get all course modules (activities) for a course.

        Args:
            course_id: Moodle course ID

        Returns:
            List of course module dictionaries
        """
        params = {"courseid": course_id}
        result = await self._make_request("core_course_get_contents", params)
        return result if isinstance(result, list) else []

    async def get_user_by_id(self, user_id: int) -> Dict[str, Any]:
        """
        Get user information by user ID.

        Args:
            user_id: Moodle user ID

        Returns:
            User information dictionary
        """
        params = {"criteria[0][key]": "id", "criteria[0][value]": user_id}
        result = await self._make_request("core_user_get_users", params)

        if isinstance(result, dict) and "users" in result and len(result["users"]) > 0:
            return result["users"][0]
        return {}

    async def get_recent_courses(
        self,
        user_id: int,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        Get recently accessed courses for a user.

        Args:
            user_id: Moodle user ID
            limit: Maximum number of courses to return

        Returns:
            List of recent course dictionaries
        """
        params = {"userid": user_id, "limit": limit}
        result = await self._make_request("core_course_get_recent_courses", params)
        return result if isinstance(result, list) else []


# Singleton instance
_moodle_service: Optional[MoodleService] = None


def get_moodle_service() -> MoodleService:
    """
    Get or create the Moodle service singleton.

    Returns:
        MoodleService instance
    """
    global _moodle_service
    if _moodle_service is None:
        _moodle_service = MoodleService()
    return _moodle_service
