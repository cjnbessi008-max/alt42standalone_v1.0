"""
Moodle 3.7 Web Services API Client

This module provides integration with Moodle 3.7 LMS to fetch quiz questions
and problems for reverse reconstruction.

Supports:
- PHP 7.1.9
- MySQL 5.7
- Moodle 3.7 Web Services API
"""

import os
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum
import httpx
from urllib.parse import urljoin


class QuestionType(str, Enum):
    """Moodle question types"""
    MULTICHOICE = "multichoice"
    TRUEFALSE = "truefalse"
    SHORTANSWER = "shortanswer"
    NUMERICAL = "numerical"
    ESSAY = "essay"
    MATCHING = "matching"
    CALCULATED = "calculated"


@dataclass
class MoodleQuestion:
    """Represents a question from Moodle question bank"""
    id: int
    name: str
    question_text: str
    question_type: QuestionType
    category_id: int
    difficulty_level: Optional[float] = None
    time_created: Optional[int] = None
    time_modified: Optional[int] = None

    # Question-specific data
    options: Optional[Dict[str, Any]] = None
    answers: Optional[List[Dict[str, Any]]] = None

    # Complexity metrics (to be calculated)
    condition_count: int = 0
    nesting_depth: int = 0
    entity_count: int = 0
    has_cyclical_dependencies: bool = False


@dataclass
class MoodleQuiz:
    """Represents a quiz from Moodle"""
    id: int
    course_id: int
    name: str
    intro: str
    time_limit: Optional[int] = None
    questions: List[MoodleQuestion] = None


class MoodleAPIError(Exception):
    """Moodle API related errors"""
    pass


class MoodleClient:
    """
    Client for Moodle 3.7 Web Services API

    Usage:
        client = MoodleClient(
            base_url="https://moodle.example.com",
            token="your_webservice_token"
        )

        questions = await client.get_quiz_questions(quiz_id=123)
        question = await client.get_question_by_id(question_id=456)
    """

    def __init__(
        self,
        base_url: str,
        token: str,
        timeout: float = 30.0
    ):
        """
        Initialize Moodle API client

        Args:
            base_url: Moodle site base URL (e.g., https://moodle.example.com)
            token: Web service token (from Moodle site administration)
            timeout: Request timeout in seconds
        """
        self.base_url = base_url.rstrip('/')
        self.token = token
        self.timeout = timeout

        # Moodle Web Services endpoint
        self.ws_endpoint = f"{self.base_url}/webservice/rest/server.php"

    async def _call_api(
        self,
        function: str,
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Call Moodle Web Services API

        Args:
            function: Moodle web service function name
            params: Function parameters

        Returns:
            API response data

        Raises:
            MoodleAPIError: If API call fails
        """
        if params is None:
            params = {}

        # Build request parameters
        request_params = {
            'wstoken': self.token,
            'wsfunction': function,
            'moodlewsrestformat': 'json',
            **params
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    self.ws_endpoint,
                    data=request_params
                )
                response.raise_for_status()

                data = response.json()

                # Check for Moodle error response
                if isinstance(data, dict) and 'exception' in data:
                    raise MoodleAPIError(
                        f"Moodle API error: {data.get('message', 'Unknown error')}"
                    )

                return data

            except httpx.HTTPError as e:
                raise MoodleAPIError(f"HTTP error calling Moodle API: {str(e)}")
            except Exception as e:
                raise MoodleAPIError(f"Error calling Moodle API: {str(e)}")

    async def get_quiz_by_id(self, quiz_id: int) -> MoodleQuiz:
        """
        Get quiz details by ID

        Args:
            quiz_id: Moodle quiz ID

        Returns:
            MoodleQuiz object
        """
        data = await self._call_api(
            'mod_quiz_get_quizzes_by_courses',
            {}
        )

        # Find the specific quiz
        for quiz_data in data.get('quizzes', []):
            if quiz_data['id'] == quiz_id:
                return MoodleQuiz(
                    id=quiz_data['id'],
                    course_id=quiz_data['course'],
                    name=quiz_data['name'],
                    intro=quiz_data.get('intro', ''),
                    time_limit=quiz_data.get('timelimit')
                )

        raise MoodleAPIError(f"Quiz with ID {quiz_id} not found")

    async def get_quiz_questions(self, quiz_id: int) -> List[MoodleQuestion]:
        """
        Get all questions in a quiz

        Args:
            quiz_id: Moodle quiz ID

        Returns:
            List of MoodleQuestion objects
        """
        # Get quiz structure
        data = await self._call_api(
            'mod_quiz_get_quiz_structure',
            {'quizid': quiz_id}
        )

        questions = []
        for slot in data.get('slots', []):
            question_data = slot.get('question', {})

            question = MoodleQuestion(
                id=question_data.get('id'),
                name=question_data.get('name', ''),
                question_text=question_data.get('questiontext', ''),
                question_type=QuestionType(question_data.get('type', 'multichoice')),
                category_id=question_data.get('category', 0),
                time_created=question_data.get('timecreated'),
                time_modified=question_data.get('timemodified'),
                options=question_data.get('options'),
                answers=question_data.get('answers', [])
            )

            questions.append(question)

        return questions

    async def get_question_by_id(self, question_id: int) -> MoodleQuestion:
        """
        Get a specific question by ID

        Args:
            question_id: Moodle question ID

        Returns:
            MoodleQuestion object
        """
        # Note: Moodle 3.7 doesn't have a direct web service for single question
        # This is a simplified implementation
        # In production, you may need to use core_question_get_question_data

        data = await self._call_api(
            'core_question_get_question_data',
            {'questionid': question_id}
        )

        return MoodleQuestion(
            id=data.get('id'),
            name=data.get('name', ''),
            question_text=data.get('questiontext', ''),
            question_type=QuestionType(data.get('qtype', 'multichoice')),
            category_id=data.get('category', 0),
            time_created=data.get('timecreated'),
            time_modified=data.get('timemodified'),
            options=data.get('options'),
            answers=data.get('answers', [])
        )

    async def get_questions_by_category(
        self,
        category_id: int
    ) -> List[MoodleQuestion]:
        """
        Get all questions in a category

        Args:
            category_id: Moodle question category ID

        Returns:
            List of MoodleQuestion objects
        """
        data = await self._call_api(
            'core_question_get_random_question_summaries',
            {'categoryid': category_id}
        )

        questions = []
        for q_data in data.get('questions', []):
            question = MoodleQuestion(
                id=q_data.get('id'),
                name=q_data.get('name', ''),
                question_text=q_data.get('questiontext', ''),
                question_type=QuestionType(q_data.get('qtype', 'multichoice')),
                category_id=category_id
            )
            questions.append(question)

        return questions

    async def test_connection(self) -> bool:
        """
        Test connection to Moodle API

        Returns:
            True if connection is successful

        Raises:
            MoodleAPIError: If connection fails
        """
        try:
            await self._call_api('core_webservice_get_site_info', {})
            return True
        except MoodleAPIError:
            raise


# Singleton instance (configured via environment variables)
_moodle_client_instance: Optional[MoodleClient] = None


def get_moodle_client() -> MoodleClient:
    """
    Get configured Moodle client instance

    Environment variables:
    - MOODLE_BASE_URL: Moodle site base URL
    - MOODLE_WS_TOKEN: Web service token

    Returns:
        Configured MoodleClient instance

    Raises:
        ValueError: If environment variables are not set
    """
    global _moodle_client_instance

    if _moodle_client_instance is None:
        base_url = os.getenv('MOODLE_BASE_URL')
        token = os.getenv('MOODLE_WS_TOKEN')

        if not base_url or not token:
            raise ValueError(
                "Moodle configuration missing. Set MOODLE_BASE_URL and MOODLE_WS_TOKEN "
                "environment variables."
            )

        _moodle_client_instance = MoodleClient(
            base_url=base_url,
            token=token
        )

    return _moodle_client_instance
