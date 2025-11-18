"""
Moodle integration utilities
"""
import httpx
from typing import Dict, Any, Optional, List
from ..core.config import settings


class MoodleClient:
    """Client for interacting with Moodle Web Services API"""

    def __init__(self):
        self.base_url = settings.MOODLE_URL
        self.token = settings.MOODLE_API_TOKEN
        self.ws_endpoint = f"{self.base_url}/webservice/rest/server.php"

    async def _call_function(
        self,
        function_name: str,
        parameters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Call a Moodle web service function

        Args:
            function_name: Name of the Moodle function to call
            parameters: Function parameters

        Returns:
            Response data from Moodle
        """
        params = {
            "wstoken": self.token,
            "wsfunction": function_name,
            "moodlewsrestformat": "json"
        }

        if parameters:
            params.update(parameters)

        async with httpx.AsyncClient() as client:
            response = await client.get(self.ws_endpoint, params=params)
            response.raise_for_status()
            return response.json()

    async def get_user_info(self, user_id: int) -> Dict[str, Any]:
        """
        Get user information from Moodle

        Args:
            user_id: Moodle user ID

        Returns:
            User information
        """
        data = await self._call_function(
            "core_user_get_users_by_field",
            {"field": "id", "values[0]": user_id}
        )
        return data[0] if data else {}

    async def get_question(self, question_id: int) -> Dict[str, Any]:
        """
        Get question details from Moodle

        Args:
            question_id: Moodle question ID

        Returns:
            Question data
        """
        # This is a simplified version - actual Moodle API might differ
        data = await self._call_function(
            "core_question_get_question",
            {"questionid": question_id}
        )
        return data

    async def submit_grade(
        self,
        user_id: int,
        assignment_id: int,
        grade: float,
        feedback: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Submit a grade to Moodle

        Args:
            user_id: Moodle user ID
            assignment_id: Moodle assignment ID
            grade: Grade value
            feedback: Optional feedback text

        Returns:
            Submission result
        """
        params = {
            "assignmentid": assignment_id,
            "userid": user_id,
            "grade": grade
        }

        if feedback:
            params["plugindata[assignfeedbackcomments_editor][text]"] = feedback
            params["plugindata[assignfeedbackcomments_editor][format]"] = 1

        data = await self._call_function(
            "mod_assign_save_grade",
            params
        )
        return data

    async def get_course_problems(self, course_id: int) -> List[Dict[str, Any]]:
        """
        Get all problems/questions for a course

        Args:
            course_id: Moodle course ID

        Returns:
            List of problems
        """
        # Simplified - actual implementation depends on Moodle question bank structure
        data = await self._call_function(
            "core_question_get_questions",
            {"courseid": course_id}
        )
        return data if isinstance(data, list) else []


# Singleton instance
moodle_client = MoodleClient()
