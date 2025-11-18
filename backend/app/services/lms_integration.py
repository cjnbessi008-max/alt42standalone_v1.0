"""
LMS Integration Service
Handles synchronization with external Learning Management Systems
"""
from typing import Optional, List, Dict, Any
from uuid import UUID
import requests
from datetime import datetime

from app.config import settings


class LMSIntegrationService:
    """
    Service for integrating with external LMS systems
    Supports syncing users, courses, and grades
    """

    def __init__(self):
        self.api_url = settings.LMS_API_URL
        self.api_key = settings.LMS_API_KEY
        self.enabled = settings.LMS_SYNC_ENABLED

    def _get_headers(self) -> Dict[str, str]:
        """Get authentication headers for LMS API"""
        return {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
        }

    def sync_user_from_lms(self, lms_user_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch user data from LMS
        Returns user data or None if not found
        """
        if not self.enabled or not self.api_url:
            return None

        try:
            response = requests.get(
                f'{self.api_url}/users/{lms_user_id}',
                headers=self._get_headers(),
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"Error syncing user from LMS: {e}")
            return None

    def sync_course_from_lms(self, lms_course_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch course data from LMS
        Returns course data or None if not found
        """
        if not self.enabled or not self.api_url:
            return None

        try:
            response = requests.get(
                f'{self.api_url}/courses/{lms_course_id}',
                headers=self._get_headers(),
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"Error syncing course from LMS: {e}")
            return None

    def get_course_students(self, lms_course_id: str) -> List[Dict[str, Any]]:
        """
        Get list of students enrolled in a course from LMS
        """
        if not self.enabled or not self.api_url:
            return []

        try:
            response = requests.get(
                f'{self.api_url}/courses/{lms_course_id}/students',
                headers=self._get_headers(),
                timeout=10
            )
            response.raise_for_status()
            return response.json().get('students', [])
        except requests.RequestException as e:
            print(f"Error fetching course students from LMS: {e}")
            return []

    def sync_grade_to_lms(
        self,
        lms_user_id: str,
        lms_course_id: str,
        assignment_id: str,
        grade: float,
        max_grade: float = 100.0,
        comment: Optional[str] = None
    ) -> bool:
        """
        Send grade back to LMS
        Returns True if successful, False otherwise
        """
        if not self.enabled or not self.api_url:
            return False

        try:
            payload = {
                'user_id': lms_user_id,
                'course_id': lms_course_id,
                'assignment_id': assignment_id,
                'grade': grade,
                'max_grade': max_grade,
                'comment': comment,
                'graded_at': datetime.utcnow().isoformat()
            }

            response = requests.post(
                f'{self.api_url}/grades',
                headers=self._get_headers(),
                json=payload,
                timeout=10
            )
            response.raise_for_status()
            return True
        except requests.RequestException as e:
            print(f"Error syncing grade to LMS: {e}")
            return False

    def sync_mission_completion_to_lms(
        self,
        student_lms_id: str,
        course_lms_id: str,
        mission_title: str,
        is_correct: bool,
        score: float
    ) -> bool:
        """
        Sync daily mission completion to LMS as a gradebook entry
        """
        # Create a unique assignment ID based on mission title and date
        today = datetime.now().strftime('%Y-%m-%d')
        assignment_id = f"daily_mission_{mission_title}_{today}"

        comment = "정답입니다!" if is_correct else "오답입니다. 다시 시도해보세요."

        return self.sync_grade_to_lms(
            lms_user_id=student_lms_id,
            lms_course_id=course_lms_id,
            assignment_id=assignment_id,
            grade=score,
            max_grade=100.0,
            comment=comment
        )

    def create_lms_assignment(
        self,
        lms_course_id: str,
        title: str,
        description: str,
        due_date: Optional[datetime] = None,
        points_possible: float = 100.0
    ) -> Optional[str]:
        """
        Create an assignment in the LMS
        Returns assignment ID if successful
        """
        if not self.enabled or not self.api_url:
            return None

        try:
            payload = {
                'course_id': lms_course_id,
                'title': title,
                'description': description,
                'points_possible': points_possible,
            }

            if due_date:
                payload['due_at'] = due_date.isoformat()

            response = requests.post(
                f'{self.api_url}/assignments',
                headers=self._get_headers(),
                json=payload,
                timeout=10
            )
            response.raise_for_status()
            result = response.json()
            return result.get('id')
        except requests.RequestException as e:
            print(f"Error creating LMS assignment: {e}")
            return None

    def auto_enroll_students_from_lms(
        self,
        db_session,
        mission_id: UUID,
        lms_course_id: str
    ) -> int:
        """
        Automatically enroll all students from an LMS course into a daily mission
        Returns number of students enrolled
        """
        if not self.enabled:
            return 0

        students = self.get_course_students(lms_course_id)
        enrolled_count = 0

        for student_data in students:
            lms_user_id = student_data.get('id')
            email = student_data.get('email')
            name = student_data.get('name')

            if not lms_user_id or not email:
                continue

            # Check if user exists in our system
            query = "SELECT id FROM users WHERE lms_user_id = %s OR email = %s"
            result = db_session.execute(query, (lms_user_id, email))
            user = result.fetchone()

            if not user:
                # Create user in our system
                create_query = """
                    INSERT INTO users (email, name, role, lms_user_id)
                    VALUES (%s, %s, 'student', %s)
                    RETURNING id
                """
                result = db_session.execute(create_query, (email, name, lms_user_id))
                user = result.fetchone()
                db_session.commit()

            user_id = user['id']

            # Enroll in mission
            enroll_query = """
                INSERT INTO mission_enrollments (student_id, mission_id)
                VALUES (%s, %s)
                ON CONFLICT (student_id, mission_id) DO NOTHING
            """
            db_session.execute(enroll_query, (user_id, str(mission_id)))
            enrolled_count += 1

        db_session.commit()
        return enrolled_count

    def get_lms_connection_status(self) -> Dict[str, Any]:
        """
        Check LMS connection status
        """
        if not self.enabled:
            return {
                'connected': False,
                'message': 'LMS integration is disabled',
                'lms_url': None
            }

        if not self.api_url or not self.api_key:
            return {
                'connected': False,
                'message': 'LMS API URL or API key not configured',
                'lms_url': None
            }

        try:
            # Test connection with a simple health check
            response = requests.get(
                f'{self.api_url}/health',
                headers=self._get_headers(),
                timeout=5
            )
            response.raise_for_status()

            return {
                'connected': True,
                'message': 'LMS connection successful',
                'lms_url': self.api_url
            }
        except requests.RequestException as e:
            return {
                'connected': False,
                'message': f'LMS connection failed: {str(e)}',
                'lms_url': self.api_url
            }
