"""
Moodle Web Services API Client
Handles communication with Moodle LMS

Compatible with: Moodle 3.7
"""

import requests
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger('dmn_api.moodle')


class MoodleClient:
    """Client for Moodle Web Services API"""

    def __init__(self, config):
        """Initialize Moodle client"""
        self.config = config

        self.base_url = config.get('moodle_url')
        self.token = config.get('moodle_token')

        if not self.base_url or not self.token:
            logger.warning("Moodle URL or token not configured")

        # API endpoint
        self.api_endpoint = f"{self.base_url}/webservice/rest/server.php"

        logger.info(f"Moodle client initialized for {self.base_url}")

    def _call_api(self, function_name: str, params: Dict[str, Any] = None) -> Any:
        """
        Call Moodle Web Services API

        Args:
            function_name: Moodle web service function name
            params: Function parameters

        Returns:
            API response data
        """
        if not self.base_url or not self.token:
            raise Exception("Moodle URL or token not configured")

        # Build request parameters
        request_params = {
            'wstoken': self.token,
            'wsfunction': function_name,
            'moodlewsrestformat': 'json'
        }

        # Add function parameters
        if params:
            request_params.update(params)

        try:
            response = requests.get(self.api_endpoint, params=request_params, timeout=30)
            response.raise_for_status()

            data = response.json()

            # Check for Moodle API errors
            if isinstance(data, dict) and 'exception' in data:
                logger.error(f"Moodle API error: {data.get('message')}")
                raise Exception(f"Moodle API error: {data.get('message')}")

            return data

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to call Moodle API: {e}")
            raise

    def get_enrolled_students(self, course_id: int) -> List[Dict]:
        """
        Get students enrolled in a course

        Args:
            course_id: Moodle course ID

        Returns:
            List of student data
        """
        try:
            data = self._call_api(
                'core_enrol_get_enrolled_users',
                {'courseid': course_id}
            )

            # Filter to only students (not teachers/admins)
            students = [
                user for user in data
                if any(role.get('shortname') == 'student' for role in user.get('roles', []))
            ]

            logger.info(f"Retrieved {len(students)} students from course {course_id}")
            return students

        except Exception as e:
            logger.error(f"Failed to get enrolled students: {e}")
            return []

    def get_teacher_courses(self, teacher_id: int) -> List[Dict]:
        """
        Get courses for a teacher

        Args:
            teacher_id: Moodle user ID of teacher

        Returns:
            List of course data
        """
        try:
            data = self._call_api(
                'core_enrol_get_users_courses',
                {'userid': teacher_id}
            )

            logger.info(f"Retrieved {len(data)} courses for teacher {teacher_id}")
            return data

        except Exception as e:
            logger.error(f"Failed to get teacher courses: {e}")
            return []

    def get_course_activities(self, course_id: int) -> List[Dict]:
        """
        Get activities/modules in a course

        Args:
            course_id: Moodle course ID

        Returns:
            List of activity data
        """
        try:
            data = self._call_api(
                'core_course_get_contents',
                {'courseid': course_id}
            )

            # Flatten modules from sections
            activities = []
            for section in data:
                activities.extend(section.get('modules', []))

            logger.info(f"Retrieved {len(activities)} activities from course {course_id}")
            return activities

        except Exception as e:
            logger.error(f"Failed to get course activities: {e}")
            return []

    def get_user_info(self, user_id: int) -> Optional[Dict]:
        """
        Get user information

        Args:
            user_id: Moodle user ID

        Returns:
            User data or None
        """
        try:
            data = self._call_api(
                'core_user_get_users_by_field',
                {
                    'field': 'id',
                    'values[0]': user_id
                }
            )

            return data[0] if data else None

        except Exception as e:
            logger.error(f"Failed to get user info: {e}")
            return None

    def get_quiz_attempts(self, quiz_id: int, user_id: int = None) -> List[Dict]:
        """
        Get quiz attempts

        Args:
            quiz_id: Moodle quiz ID
            user_id: Optional user ID to filter

        Returns:
            List of quiz attempts
        """
        try:
            params = {'quizid': quiz_id}

            if user_id:
                params['userid'] = user_id

            data = self._call_api('mod_quiz_get_user_attempts', params)

            logger.info(f"Retrieved {len(data.get('attempts', []))} quiz attempts")
            return data.get('attempts', [])

        except Exception as e:
            logger.error(f"Failed to get quiz attempts: {e}")
            return []

    def send_message(self, user_id: int, subject: str, message: str) -> bool:
        """
        Send message to user

        Args:
            user_id: Recipient Moodle user ID
            subject: Message subject
            message: Message content

        Returns:
            True if successful
        """
        try:
            self._call_api(
                'core_message_send_instant_messages',
                {
                    'messages[0][touserid]': user_id,
                    'messages[0][text]': message,
                    'messages[0][textformat]': 1  # HTML format
                }
            )

            logger.info(f"Sent message to user {user_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to send message: {e}")
            return False

    def test_connection(self) -> bool:
        """
        Test Moodle connection

        Returns:
            True if connection successful
        """
        try:
            data = self._call_api('core_webservice_get_site_info')

            if data and 'sitename' in data:
                logger.info(f"Successfully connected to Moodle: {data['sitename']}")
                return True

            return False

        except Exception as e:
            logger.error(f"Moodle connection test failed: {e}")
            return False
