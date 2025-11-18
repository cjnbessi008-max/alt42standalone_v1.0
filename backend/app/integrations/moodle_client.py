"""Moodle Web Services API client."""
import logging
from typing import Any, Optional
from urllib.parse import urljoin

import httpx

logger = logging.getLogger(__name__)


class MoodleAPIError(Exception):
    """Moodle API error."""

    pass


class MoodleClient:
    """Client for Moodle Web Services REST API."""

    def __init__(self, moodle_url: str, api_token: str):
        """Initialize Moodle client.

        Args:
            moodle_url: Base URL of Moodle instance (e.g., 'https://moodle.example.com')
            api_token: Moodle web services token
        """
        self.moodle_url = moodle_url.rstrip("/")
        self.api_token = api_token
        self.webservice_url = urljoin(
            self.moodle_url, "/webservice/rest/server.php"
        )
        self.timeout = 30.0

    async def _call_api(
        self,
        function: str,
        params: Optional[dict[str, Any]] = None,
    ) -> dict[str, Any]:
        """Call Moodle Web Services API.

        Args:
            function: Moodle web service function name
            params: Additional parameters for the API call

        Returns:
            API response as dictionary

        Raises:
            MoodleAPIError: If API call fails
        """
        request_params = {
            "wstoken": self.api_token,
            "wsfunction": function,
            "moodlewsrestformat": "json",
        }

        if params:
            request_params.update(params)

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(self.webservice_url, params=request_params)
                response.raise_for_status()
                data = response.json()

                # Check for Moodle API errors
                if isinstance(data, dict) and "exception" in data:
                    error_msg = data.get("message", "Unknown Moodle API error")
                    logger.error(f"Moodle API error: {error_msg}")
                    raise MoodleAPIError(error_msg)

                return data

        except httpx.HTTPError as e:
            logger.error(f"HTTP error calling Moodle API: {e}")
            raise MoodleAPIError(f"HTTP error: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error calling Moodle API: {e}")
            raise MoodleAPIError(f"Unexpected error: {str(e)}")

    async def test_connection(self) -> bool:
        """Test connection to Moodle API.

        Returns:
            True if connection is successful
        """
        try:
            result = await self._call_api("core_webservice_get_site_info")
            logger.info(f"Successfully connected to Moodle: {result.get('sitename')}")
            return True
        except MoodleAPIError:
            return False

    async def get_courses(self) -> list[dict[str, Any]]:
        """Get list of courses.

        Returns:
            List of course dictionaries
        """
        result = await self._call_api("core_course_get_courses")
        return result if isinstance(result, list) else []

    async def get_course_by_id(self, course_id: int) -> dict[str, Any]:
        """Get course details by ID.

        Args:
            course_id: Course ID

        Returns:
            Course details dictionary
        """
        result = await self._call_api(
            "core_course_get_courses_by_field",
            {"field": "id", "value": course_id},
        )
        courses = result.get("courses", [])
        if courses:
            return courses[0]
        raise MoodleAPIError(f"Course {course_id} not found")

    async def get_quizzes_by_course(self, course_id: int) -> list[dict[str, Any]]:
        """Get quizzes for a course.

        Args:
            course_id: Course ID

        Returns:
            List of quiz dictionaries
        """
        result = await self._call_api(
            "mod_quiz_get_quizzes_by_courses",
            {"courseids[0]": course_id},
        )
        return result.get("quizzes", [])

    async def get_quiz_by_id(self, quiz_id: int) -> dict[str, Any]:
        """Get quiz details by ID.

        Args:
            quiz_id: Quiz ID

        Returns:
            Quiz details dictionary
        """
        result = await self._call_api(
            "mod_quiz_get_quiz_by_courseid",
            {"quizid": quiz_id},
        )
        return result

    async def get_quiz_questions(self, quiz_id: int) -> list[dict[str, Any]]:
        """Get questions for a quiz.

        Args:
            quiz_id: Quiz ID

        Returns:
            List of question dictionaries
        """
        # Note: This requires mod_quiz_get_quiz_access_information and
        # mod_quiz_get_attempt_data functions to be enabled
        try:
            result = await self._call_api(
                "mod_quiz_get_quiz_by_courseid",
                {"quizid": quiz_id},
            )
            # Extract questions from quiz structure
            # This is a simplified version - actual implementation depends on Moodle version
            return result.get("questions", [])
        except MoodleAPIError:
            logger.warning(f"Could not fetch questions for quiz {quiz_id}")
            return []

    async def get_user_by_id(self, user_id: int) -> dict[str, Any]:
        """Get user details by ID.

        Args:
            user_id: User ID

        Returns:
            User details dictionary
        """
        result = await self._call_api(
            "core_user_get_users_by_field",
            {"field": "id", "values[0]": user_id},
        )
        users = result if isinstance(result, list) else []
        if users:
            return users[0]
        raise MoodleAPIError(f"User {user_id} not found")

    async def get_enrolled_users(self, course_id: int) -> list[dict[str, Any]]:
        """Get enrolled users in a course.

        Args:
            course_id: Course ID

        Returns:
            List of user dictionaries
        """
        result = await self._call_api(
            "core_enrol_get_enrolled_users",
            {"courseid": course_id},
        )
        return result if isinstance(result, list) else []

    async def update_grades(
        self,
        course_id: int,
        user_id: int,
        grade_item: str,
        grade: float,
    ) -> bool:
        """Update user's grade in Moodle.

        Args:
            course_id: Course ID
            user_id: User ID
            grade_item: Grade item name
            grade: Grade value

        Returns:
            True if successful
        """
        try:
            await self._call_api(
                "core_grades_update_grades",
                {
                    "source": "lms_practice_integration",
                    "courseid": course_id,
                    "component": "mod_quiz",
                    "activityid": 0,  # Will be set based on actual quiz
                    "itemnumber": 0,
                    "grades[0][studentid]": user_id,
                    "grades[0][grade]": grade,
                },
            )
            logger.info(
                f"Updated grade for user {user_id} in course {course_id}: {grade}"
            )
            return True
        except MoodleAPIError as e:
            logger.error(f"Failed to update grades: {e}")
            return False

    async def get_question_bank(self, course_id: int) -> list[dict[str, Any]]:
        """Get questions from course question bank.

        Args:
            course_id: Course ID

        Returns:
            List of question dictionaries

        Note:
            This requires additional Moodle plugins or custom web services.
            Implementation depends on available Moodle web services.
        """
        # This is a placeholder - actual implementation depends on Moodle setup
        logger.warning(
            "get_question_bank requires custom Moodle web service or plugin"
        )
        return []

    async def create_quiz_attempt(
        self,
        quiz_id: int,
        user_id: int,
    ) -> dict[str, Any]:
        """Create a new quiz attempt for a user.

        Args:
            quiz_id: Quiz ID
            user_id: User ID

        Returns:
            Attempt details dictionary
        """
        result = await self._call_api(
            "mod_quiz_start_attempt",
            {
                "quizid": quiz_id,
                "userid": user_id,
            },
        )
        return result

    async def submit_quiz_answer(
        self,
        attempt_id: int,
        question_id: int,
        answer: str,
    ) -> bool:
        """Submit answer for a quiz question.

        Args:
            attempt_id: Attempt ID
            question_id: Question ID
            answer: Student's answer

        Returns:
            True if successful
        """
        try:
            await self._call_api(
                "mod_quiz_process_attempt",
                {
                    "attemptid": attempt_id,
                    "data[0][name]": f"q{question_id}:answer",
                    "data[0][value]": answer,
                },
            )
            return True
        except MoodleAPIError as e:
            logger.error(f"Failed to submit answer: {e}")
            return False
