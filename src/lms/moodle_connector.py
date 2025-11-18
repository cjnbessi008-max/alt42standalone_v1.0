"""
Moodle API Connector
====================
Connects to Moodle 3.7 Web Services API to fetch student data and responses.

Compatible with:
- Moodle 3.7
- PHP 7.1.9
- MySQL 5.7

Author: AI Agent (Claude)
Date: 2025-11-18
Version: 1.0.0
"""

import requests
import logging
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
import json
from urllib.parse import urljoin


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ResponseType(Enum):
    """Types of student responses in Moodle"""
    ASSIGNMENT = "assignment"
    QUIZ = "quiz"
    FORUM = "forum"
    WORKSHOP = "workshop"
    OTHER = "other"


@dataclass
class MoodleConfig:
    """Moodle connection configuration"""
    moodle_url: str
    ws_token: str
    ws_endpoint: str = "/webservice/rest/server.php"
    format: str = "json"
    timeout: int = 30


@dataclass
class StudentResponse:
    """Student response data structure"""
    moodle_user_id: int
    response_type: ResponseType
    activity_id: int
    activity_name: str
    response_text: str
    response_html: Optional[str] = None
    submitted_at: datetime = None
    question_text: Optional[str] = None
    max_points: Optional[float] = None
    metadata: Dict[str, Any] = None


class MoodleAPIError(Exception):
    """Custom exception for Moodle API errors"""
    pass


class MoodleConnector:
    """
    Moodle Web Services API Connector

    Provides methods to:
    - Authenticate with Moodle
    - Fetch student roster
    - Retrieve student responses (assignments, quizzes, forums)
    - Get course information
    """

    def __init__(self, config: MoodleConfig):
        """
        Initialize Moodle connector

        Args:
            config: MoodleConfig with connection details
        """
        self.config = config
        self.base_url = config.moodle_url
        self.ws_token = config.ws_token
        self.ws_endpoint = urljoin(self.base_url, config.ws_endpoint)
        self.session = requests.Session()

        # Add user agent
        self.session.headers.update({
            'User-Agent': 'Alt42-LMS-Integration/1.0.0'
        })

        logger.info(f"Initialized Moodle connector for {self.base_url}")

    def _call_api(
        self,
        function: str,
        params: Dict[str, Any] = None,
        method: str = "GET"
    ) -> Dict[str, Any]:
        """
        Call Moodle Web Services API

        Args:
            function: Moodle web service function name
            params: Additional parameters for the function
            method: HTTP method (GET or POST)

        Returns:
            API response as dictionary

        Raises:
            MoodleAPIError: If API call fails
        """
        # Build request parameters
        request_params = {
            'wstoken': self.ws_token,
            'wsfunction': function,
            'moodlewsrestformat': self.config.format
        }

        # Add function-specific parameters
        if params:
            request_params.update(params)

        try:
            # Make API request
            if method.upper() == "GET":
                response = self.session.get(
                    self.ws_endpoint,
                    params=request_params,
                    timeout=self.config.timeout
                )
            else:
                response = self.session.post(
                    self.ws_endpoint,
                    data=request_params,
                    timeout=self.config.timeout
                )

            response.raise_for_status()

            # Parse response
            data = response.json()

            # Check for Moodle API errors
            if isinstance(data, dict) and 'exception' in data:
                error_msg = data.get('message', 'Unknown Moodle API error')
                logger.error(f"Moodle API error: {error_msg}")
                raise MoodleAPIError(error_msg)

            logger.debug(f"API call successful: {function}")
            return data

        except requests.exceptions.RequestException as e:
            logger.error(f"HTTP error calling {function}: {str(e)}")
            raise MoodleAPIError(f"HTTP error: {str(e)}")
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error: {str(e)}")
            raise MoodleAPIError(f"Invalid JSON response: {str(e)}")

    def test_connection(self) -> bool:
        """
        Test Moodle connection and token validity

        Returns:
            True if connection successful, False otherwise
        """
        try:
            result = self._call_api('core_webservice_get_site_info')
            site_name = result.get('sitename', 'Unknown')
            version = result.get('version', 'Unknown')
            logger.info(f"Connected to Moodle: {site_name} (Version: {version})")
            return True
        except MoodleAPIError:
            logger.error("Failed to connect to Moodle")
            return False

    def get_courses(self) -> List[Dict[str, Any]]:
        """
        Get all courses accessible with current token

        Returns:
            List of course dictionaries
        """
        try:
            courses = self._call_api('core_course_get_courses')
            logger.info(f"Retrieved {len(courses)} courses")
            return courses
        except MoodleAPIError as e:
            logger.error(f"Error fetching courses: {e}")
            return []

    def get_course_students(self, course_id: int) -> List[Dict[str, Any]]:
        """
        Get enrolled students for a course

        Args:
            course_id: Moodle course ID

        Returns:
            List of student dictionaries
        """
        try:
            params = {
                'courseid': course_id
            }

            enrolled_users = self._call_api(
                'core_enrol_get_enrolled_users',
                params=params
            )

            # Filter only students (role id usually 5)
            students = [
                user for user in enrolled_users
                if any(role.get('roleid') == 5 for role in user.get('roles', []))
            ]

            logger.info(f"Retrieved {len(students)} students from course {course_id}")
            return students

        except MoodleAPIError as e:
            logger.error(f"Error fetching students: {e}")
            return []

    def get_assignments(self, course_id: int) -> List[Dict[str, Any]]:
        """
        Get assignments for a course

        Args:
            course_id: Moodle course ID

        Returns:
            List of assignment dictionaries
        """
        try:
            params = {
                'courseids[0]': course_id
            }

            result = self._call_api(
                'mod_assign_get_assignments',
                params=params
            )

            assignments = result.get('courses', [{}])[0].get('assignments', [])
            logger.info(f"Retrieved {len(assignments)} assignments from course {course_id}")
            return assignments

        except MoodleAPIError as e:
            logger.error(f"Error fetching assignments: {e}")
            return []

    def get_assignment_submissions(
        self,
        assignment_id: int,
        since: Optional[datetime] = None
    ) -> List[StudentResponse]:
        """
        Get submissions for an assignment

        Args:
            assignment_id: Moodle assignment ID
            since: Only fetch submissions after this datetime

        Returns:
            List of StudentResponse objects
        """
        try:
            params = {
                'assignmentids[0]': assignment_id
            }

            result = self._call_api(
                'mod_assign_get_submissions',
                params=params
            )

            submissions = result.get('assignments', [{}])[0].get('submissions', [])

            student_responses = []
            for sub in submissions:
                # Check if submission is after 'since' date
                submit_time = datetime.fromtimestamp(sub.get('timemodified', 0))
                if since and submit_time < since:
                    continue

                # Extract text from plugins (online text submission)
                response_text = ""
                response_html = ""
                for plugin in sub.get('plugins', []):
                    if plugin.get('type') == 'onlinetext':
                        for editor in plugin.get('editorfields', []):
                            if editor.get('name') == 'onlinetext':
                                response_html = editor.get('text', '')
                                # Simple HTML strip (use BeautifulSoup for production)
                                response_text = self._strip_html(response_html)

                if response_text:  # Only include if there's actual text
                    student_responses.append(StudentResponse(
                        moodle_user_id=sub.get('userid'),
                        response_type=ResponseType.ASSIGNMENT,
                        activity_id=assignment_id,
                        activity_name=f"Assignment {assignment_id}",
                        response_text=response_text,
                        response_html=response_html,
                        submitted_at=submit_time,
                        metadata={
                            'submission_id': sub.get('id'),
                            'attempt': sub.get('attemptnumber', 1),
                            'status': sub.get('status', 'submitted')
                        }
                    ))

            logger.info(f"Retrieved {len(student_responses)} submissions for assignment {assignment_id}")
            return student_responses

        except MoodleAPIError as e:
            logger.error(f"Error fetching assignment submissions: {e}")
            return []

    def get_quiz_attempts(
        self,
        quiz_id: int,
        since: Optional[datetime] = None
    ) -> List[StudentResponse]:
        """
        Get quiz attempts for a quiz

        Args:
            quiz_id: Moodle quiz ID
            since: Only fetch attempts after this datetime

        Returns:
            List of StudentResponse objects
        """
        try:
            params = {
                'quizid': quiz_id
            }

            attempts = self._call_api(
                'mod_quiz_get_user_attempts',
                params=params
            )

            student_responses = []
            for attempt in attempts.get('attempts', []):
                # Check if attempt is after 'since' date
                finish_time = datetime.fromtimestamp(attempt.get('timefinish', 0))
                if since and finish_time < since:
                    continue

                # Get detailed attempt data
                attempt_id = attempt.get('id')
                attempt_detail = self._get_quiz_attempt_detail(attempt_id)

                if attempt_detail:
                    student_responses.append(attempt_detail)

            logger.info(f"Retrieved {len(student_responses)} quiz attempts for quiz {quiz_id}")
            return student_responses

        except MoodleAPIError as e:
            logger.error(f"Error fetching quiz attempts: {e}")
            return []

    def _get_quiz_attempt_detail(self, attempt_id: int) -> Optional[StudentResponse]:
        """
        Get detailed quiz attempt data

        Args:
            attempt_id: Quiz attempt ID

        Returns:
            StudentResponse object or None
        """
        try:
            params = {
                'attemptid': attempt_id
            }

            attempt_data = self._call_api(
                'mod_quiz_get_attempt_data',
                params=params
            )

            # Combine all question responses
            combined_text = []
            for question in attempt_data.get('questions', []):
                q_text = question.get('html', '')
                combined_text.append(self._strip_html(q_text))

            response_text = "\n\n".join(combined_text)

            return StudentResponse(
                moodle_user_id=attempt_data.get('attempt', {}).get('userid'),
                response_type=ResponseType.QUIZ,
                activity_id=attempt_data.get('attempt', {}).get('quiz'),
                activity_name=f"Quiz {attempt_data.get('attempt', {}).get('quiz')}",
                response_text=response_text,
                submitted_at=datetime.fromtimestamp(
                    attempt_data.get('attempt', {}).get('timefinish', 0)
                ),
                max_points=attempt_data.get('attempt', {}).get('sumgrades'),
                metadata={
                    'attempt_id': attempt_id,
                    'state': attempt_data.get('attempt', {}).get('state'),
                    'grade': attempt_data.get('attempt', {}).get('sumgrades')
                }
            )

        except MoodleAPIError as e:
            logger.error(f"Error fetching quiz attempt detail: {e}")
            return None

    def get_forum_posts(
        self,
        forum_id: int,
        since: Optional[datetime] = None
    ) -> List[StudentResponse]:
        """
        Get forum posts for a forum

        Args:
            forum_id: Moodle forum ID
            since: Only fetch posts after this datetime

        Returns:
            List of StudentResponse objects
        """
        try:
            params = {
                'forumid': forum_id
            }

            discussions = self._call_api(
                'mod_forum_get_forum_discussions',
                params=params
            )

            student_responses = []
            for discussion in discussions.get('discussions', []):
                discussion_id = discussion.get('discussion')
                posts = self._get_forum_discussion_posts(discussion_id, since)
                student_responses.extend(posts)

            logger.info(f"Retrieved {len(student_responses)} forum posts for forum {forum_id}")
            return student_responses

        except MoodleAPIError as e:
            logger.error(f"Error fetching forum posts: {e}")
            return []

    def _get_forum_discussion_posts(
        self,
        discussion_id: int,
        since: Optional[datetime] = None
    ) -> List[StudentResponse]:
        """
        Get posts for a forum discussion

        Args:
            discussion_id: Discussion ID
            since: Only fetch posts after this datetime

        Returns:
            List of StudentResponse objects
        """
        try:
            params = {
                'discussionid': discussion_id
            }

            posts_data = self._call_api(
                'mod_forum_get_forum_discussion_posts',
                params=params
            )

            student_responses = []
            for post in posts_data.get('posts', []):
                # Check if post is after 'since' date
                created_time = datetime.fromtimestamp(post.get('created', 0))
                if since and created_time < since:
                    continue

                response_text = self._strip_html(post.get('message', ''))

                if response_text:
                    student_responses.append(StudentResponse(
                        moodle_user_id=post.get('userid'),
                        response_type=ResponseType.FORUM,
                        activity_id=post.get('discussion'),
                        activity_name=post.get('subject', f"Discussion {discussion_id}"),
                        response_text=response_text,
                        response_html=post.get('message', ''),
                        submitted_at=created_time,
                        metadata={
                            'post_id': post.get('id'),
                            'parent': post.get('parent', 0)
                        }
                    ))

            return student_responses

        except MoodleAPIError as e:
            logger.error(f"Error fetching forum discussion posts: {e}")
            return []

    def get_all_course_responses(
        self,
        course_id: int,
        since: Optional[datetime] = None
    ) -> List[StudentResponse]:
        """
        Get all student responses from a course (assignments, quizzes, forums)

        Args:
            course_id: Moodle course ID
            since: Only fetch responses after this datetime (default: last 24 hours)

        Returns:
            List of StudentResponse objects
        """
        if since is None:
            since = datetime.now() - timedelta(days=1)

        all_responses = []

        # Get assignments and submissions
        assignments = self.get_assignments(course_id)
        for assignment in assignments:
            responses = self.get_assignment_submissions(
                assignment['id'],
                since=since
            )
            # Update activity name
            for resp in responses:
                resp.activity_name = assignment.get('name', resp.activity_name)
            all_responses.extend(responses)

        # Get quizzes and attempts
        # Note: Moodle doesn't have a direct "get all quizzes" function
        # You may need to use mod_quiz_get_quizzes_by_courses or similar

        # Get forums and posts
        # Note: You'd need to get forum list first, then iterate

        logger.info(f"Retrieved total {len(all_responses)} responses from course {course_id}")
        return all_responses

    @staticmethod
    def _strip_html(html: str) -> str:
        """
        Simple HTML tag stripper

        Args:
            html: HTML string

        Returns:
            Plain text (HTML tags removed)

        Note: For production, use BeautifulSoup or lxml
        """
        import re
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', '', html)
        # Decode HTML entities
        import html as html_lib
        text = html_lib.unescape(text)
        # Clean up whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        return text


# ============================================================================
# Example Usage
# ============================================================================

if __name__ == "__main__":
    # Configuration (replace with actual values)
    config = MoodleConfig(
        moodle_url="https://lms.kaist.ac.kr",
        ws_token="YOUR_WEB_SERVICE_TOKEN_HERE"
    )

    # Initialize connector
    connector = MoodleConnector(config)

    # Test connection
    if connector.test_connection():
        print("✓ Successfully connected to Moodle")

        # Get courses
        courses = connector.get_courses()
        if courses:
            print(f"\n✓ Found {len(courses)} courses:")
            for course in courses[:5]:  # Show first 5
                print(f"  - {course.get('fullname')} (ID: {course.get('id')})")

        # Get students from first course
        if courses:
            course_id = courses[0]['id']
            students = connector.get_course_students(course_id)
            print(f"\n✓ Found {len(students)} students in course {course_id}")

        # Get responses from last 7 days
        if courses:
            since = datetime.now() - timedelta(days=7)
            responses = connector.get_all_course_responses(course_id, since=since)
            print(f"\n✓ Found {len(responses)} responses in last 7 days")

            # Show sample response
            if responses:
                sample = responses[0]
                print(f"\nSample response:")
                print(f"  Type: {sample.response_type.value}")
                print(f"  Activity: {sample.activity_name}")
                print(f"  Text preview: {sample.response_text[:100]}...")
    else:
        print("✗ Failed to connect to Moodle")
