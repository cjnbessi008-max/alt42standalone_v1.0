"""
Moodle LMS Client
Integrates with Moodle 3.7 web services API
"""

import httpx
from typing import Dict, Optional
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class MoodleClient:
    """Moodle LMS API client"""

    def __init__(self):
        self.base_url = settings.MOODLE_URL
        self.token = settings.MOODLE_TOKEN
        self.endpoint = f"{self.base_url}/webservice/rest/server.php"

    async def _call(self, function: str, params: Dict = None) -> Optional[Dict]:
        """Make API call to Moodle"""
        if params is None:
            params = {}

        params.update({
            'wstoken': self.token,
            'wsfunction': function,
            'moodlewsrestformat': 'json'
        })

        try:
            async with httpx.AsyncClient(verify=False) as client:
                response = await client.post(self.endpoint, data=params, timeout=30.0)
                response.raise_for_status()
                data = response.json()

                if isinstance(data, dict) and 'exception' in data:
                    logger.error(f"Moodle API error: {data.get('message', 'Unknown error')}")
                    return None

                return data

        except httpx.HTTPError as e:
            logger.error(f"HTTP error calling Moodle API: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Error calling Moodle API: {str(e)}")
            return None

    async def get_question_data(self, question_id: int) -> Optional[Dict]:
        """Get question data from Moodle"""
        logger.info(f"Fetching question {question_id} from Moodle")

        result = await self._call(
            'core_question_get_question_data',
            {'questionid': question_id}
        )

        return result

    async def get_quiz_questions(self, quiz_id: int) -> Optional[list]:
        """Get all questions from a quiz"""
        logger.info(f"Fetching quiz {quiz_id} questions from Moodle")

        result = await self._call(
            'mod_quiz_get_quiz_questions',
            {'quizid': quiz_id}
        )

        return result

    async def get_user_attempts(self, quiz_id: int, user_id: int) -> Optional[list]:
        """Get user attempts for a quiz"""
        result = await self._call(
            'mod_quiz_get_user_attempts',
            {
                'quizid': quiz_id,
                'userid': user_id
            }
        )

        return result

    def extract_problem_text(self, question_data: Dict) -> tuple[str, Optional[str]]:
        """Extract problem text and LaTeX from Moodle question data"""
        if not question_data:
            return "", None

        # Get question text
        question_text = question_data.get('questiontext', '')

        # Strip HTML tags for plain text
        import re
        plain_text = re.sub(r'<[^>]+>', '', question_text)

        # Extract LaTeX
        latex = None

        # Look for MathJax delimiters
        latex_patterns = [
            r'\$\$(.*?)\$\$',
            r'\\\[(.*?)\\\]',
            r'\$(.*?)\$'
        ]

        for pattern in latex_patterns:
            match = re.search(pattern, question_text, re.DOTALL)
            if match:
                latex = match.group(1).strip()
                break

        return plain_text.strip(), latex
