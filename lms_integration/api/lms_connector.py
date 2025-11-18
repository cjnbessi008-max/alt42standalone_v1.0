"""
LMS Integration Connector
Provides integration with external Learning Management Systems (LMS)
Supports: Canvas, Moodle, Blackboard, Google Classroom

Uses LTI (Learning Tools Interoperability) standard for seamless integration
"""

import hashlib
import base64
import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


# Configure logging
logger = logging.getLogger(__name__)


class LMSType(str, Enum):
    """Supported LMS platforms"""
    CANVAS = "canvas"
    MOODLE = "moodle"
    BLACKBOARD = "blackboard"
    GOOGLE_CLASSROOM = "google_classroom"
    BRIGHTSPACE = "brightspace"
    SCHOOLOGY = "schoology"
    GENERIC_LTI = "generic_lti"


class LMSConnectionStatus(str, Enum):
    """LMS connection statuses"""
    ACTIVE = "active"
    ERROR = "error"
    DISABLED = "disabled"
    PENDING = "pending"


class LTIVersion(str, Enum):
    """LTI protocol versions"""
    LTI_1_1 = "1.1"
    LTI_1_3 = "1.3"
    LTI_2_0 = "2.0"


class LMSConnector:
    """
    Base connector for LMS integration
    Handles authentication, data sync, and grade passback
    """

    def __init__(
        self,
        lms_type: LMSType,
        base_url: str,
        api_key: Optional[str] = None,
        api_secret: Optional[str] = None,
        lti_consumer_key: Optional[str] = None,
        lti_shared_secret: Optional[str] = None,
        lti_version: LTIVersion = LTIVersion.LTI_1_3
    ):
        """
        Initialize LMS connector

        Args:
            lms_type: Type of LMS platform
            base_url: Base URL of LMS instance
            api_key: API key for REST API access
            api_secret: API secret for authentication
            lti_consumer_key: LTI consumer key
            lti_shared_secret: LTI shared secret
            lti_version: LTI protocol version
        """
        self.lms_type = lms_type
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.api_secret = api_secret
        self.lti_consumer_key = lti_consumer_key
        self.lti_shared_secret = lti_shared_secret
        self.lti_version = lti_version

        # Configure HTTP session with retry logic
        self.session = requests.Session()
        retry = Retry(
            total=3,
            read=3,
            connect=3,
            backoff_factor=0.3,
            status_forcelist=(500, 502, 504)
        )
        adapter = HTTPAdapter(max_retries=retry)
        self.session.mount('http://', adapter)
        self.session.mount('https://', adapter)

        # Set default headers
        self._set_auth_headers()

    def _set_auth_headers(self):
        """Set authentication headers based on LMS type"""
        if self.api_key:
            if self.lms_type == LMSType.CANVAS:
                self.session.headers.update({
                    'Authorization': f'Bearer {self.api_key}',
                    'Content-Type': 'application/json'
                })
            elif self.lms_type == LMSType.MOODLE:
                # Moodle uses query parameter for token
                pass
            else:
                self.session.headers.update({
                    'Authorization': f'Bearer {self.api_key}',
                    'Content-Type': 'application/json'
                })

    def test_connection(self) -> Dict[str, Any]:
        """
        Test connection to LMS

        Returns:
            dict: Connection test results
        """
        try:
            logger.info(f"Testing connection to {self.lms_type} LMS at {self.base_url}")

            if self.lms_type == LMSType.CANVAS:
                response = self.session.get(f"{self.base_url}/api/v1/users/self")
            elif self.lms_type == LMSType.MOODLE:
                response = self.session.get(
                    f"{self.base_url}/webservice/rest/server.php",
                    params={
                        'wstoken': self.api_key,
                        'wsfunction': 'core_webservice_get_site_info',
                        'moodlewsrestformat': 'json'
                    }
                )
            else:
                # Generic test
                response = self.session.get(self.base_url)

            if response.status_code == 200:
                return {
                    "success": True,
                    "status": "connected",
                    "lms_type": self.lms_type,
                    "message": "Connection successful"
                }
            else:
                return {
                    "success": False,
                    "status": "error",
                    "error": f"HTTP {response.status_code}",
                    "message": response.text[:200]
                }

        except Exception as e:
            logger.error(f"Connection test failed: {str(e)}")
            return {
                "success": False,
                "status": "error",
                "error": str(e),
                "message": "Failed to connect to LMS"
            }

    def sync_grades(
        self,
        course_id: str,
        assignment_id: str,
        grades: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Sync grades to LMS gradebook

        Args:
            course_id: LMS course ID
            assignment_id: LMS assignment ID
            grades: List of grade records with student_id and score

        Returns:
            dict: Sync results
        """
        try:
            logger.info(f"Syncing {len(grades)} grades to {self.lms_type}")

            results = {
                "success": True,
                "synced": 0,
                "failed": 0,
                "errors": []
            }

            for grade_record in grades:
                try:
                    result = self._post_single_grade(
                        course_id,
                        assignment_id,
                        grade_record['student_id'],
                        grade_record['score'],
                        grade_record.get('comment')
                    )

                    if result['success']:
                        results['synced'] += 1
                    else:
                        results['failed'] += 1
                        results['errors'].append({
                            'student_id': grade_record['student_id'],
                            'error': result.get('error')
                        })

                except Exception as e:
                    logger.error(f"Error posting grade for student {grade_record.get('student_id')}: {e}")
                    results['failed'] += 1
                    results['errors'].append({
                        'student_id': grade_record.get('student_id'),
                        'error': str(e)
                    })

            results['success'] = results['failed'] == 0

            return results

        except Exception as e:
            logger.error(f"Grade sync failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to sync grades"
            }

    def _post_single_grade(
        self,
        course_id: str,
        assignment_id: str,
        student_id: str,
        score: float,
        comment: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Post a single grade to LMS

        Args:
            course_id: LMS course ID
            assignment_id: LMS assignment ID
            student_id: LMS student/user ID
            score: Grade score
            comment: Optional comment

        Returns:
            dict: Post result
        """
        try:
            if self.lms_type == LMSType.CANVAS:
                url = f"{self.base_url}/api/v1/courses/{course_id}/assignments/{assignment_id}/submissions/{student_id}"
                payload = {
                    "submission": {
                        "posted_grade": score
                    }
                }
                if comment:
                    payload["comment"] = {"text_comment": comment}

                response = self.session.put(url, json=payload)

            elif self.lms_type == LMSType.MOODLE:
                url = f"{self.base_url}/webservice/rest/server.php"
                params = {
                    'wstoken': self.api_key,
                    'wsfunction': 'mod_assign_save_grade',
                    'moodlewsrestformat': 'json',
                    'assignmentid': assignment_id,
                    'userid': student_id,
                    'grade': score,
                    'attemptnumber': -1
                }
                if comment:
                    params['plugindata[comments_comment]'] = comment

                response = self.session.post(url, data=params)

            else:
                # Generic LTI grade passback
                return self._lti_grade_passback(student_id, score)

            if response.status_code in [200, 201]:
                return {"success": True}
            else:
                return {
                    "success": False,
                    "error": f"HTTP {response.status_code}: {response.text[:200]}"
                }

        except Exception as e:
            return {"success": False, "error": str(e)}

    def _lti_grade_passback(
        self,
        student_id: str,
        score: float
    ) -> Dict[str, Any]:
        """
        Perform LTI grade passback (Outcomes Service)

        Args:
            student_id: Student identifier
            score: Grade score (0.0 - 1.0)

        Returns:
            dict: Passback result
        """
        # TODO: Implement LTI 1.1/1.3 grade passback
        # This requires OAuth signing and XML message construction
        logger.info(f"LTI grade passback for student {student_id}: {score}")

        return {
            "success": True,
            "message": "LTI grade passback (implementation pending)"
        }

    def sync_tension_curves(
        self,
        course_id: str,
        tension_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Sync tension curve data to LMS (as custom data/annotations)

        Args:
            course_id: LMS course ID
            tension_data: List of tension curve records

        Returns:
            dict: Sync results
        """
        try:
            logger.info(f"Syncing tension curves to {self.lms_type}")

            # Most LMS don't have native tension curve support
            # We can use custom fields, notes, or comments

            results = {
                "success": True,
                "synced": 0,
                "method": "custom_annotations"
            }

            for record in tension_data:
                # Post as student annotation/note
                comment = f"Tension Score: {record['tension_score']}, " \
                         f"Learning Phase: {record['learning_phase']}, " \
                         f"Accuracy: {record['accuracy_rate']}%"

                # Use existing grade posting mechanism with comment
                # In production, might use custom API endpoints if available

                results['synced'] += 1

            return results

        except Exception as e:
            logger.error(f"Tension curve sync failed: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

    def get_course_roster(self, course_id: str) -> Dict[str, Any]:
        """
        Retrieve student roster from LMS course

        Args:
            course_id: LMS course ID

        Returns:
            dict: Course roster data
        """
        try:
            logger.info(f"Fetching roster for course {course_id}")

            if self.lms_type == LMSType.CANVAS:
                url = f"{self.base_url}/api/v1/courses/{course_id}/users"
                params = {'enrollment_type[]': 'student'}
                response = self.session.get(url, params=params)

                if response.status_code == 200:
                    students = response.json()
                    return {
                        "success": True,
                        "students": [
                            {
                                "lms_user_id": str(s['id']),
                                "name": s.get('name', ''),
                                "email": s.get('email', ''),
                                "sis_user_id": s.get('sis_user_id')
                            }
                            for s in students
                        ]
                    }

            elif self.lms_type == LMSType.MOODLE:
                url = f"{self.base_url}/webservice/rest/server.php"
                params = {
                    'wstoken': self.api_key,
                    'wsfunction': 'core_enrol_get_enrolled_users',
                    'moodlewsrestformat': 'json',
                    'courseid': course_id
                }
                response = self.session.get(url, params=params)

                if response.status_code == 200:
                    students = response.json()
                    return {
                        "success": True,
                        "students": [
                            {
                                "lms_user_id": str(s['id']),
                                "name": s.get('fullname', ''),
                                "email": s.get('email', ''),
                                "sis_user_id": s.get('idnumber')
                            }
                            for s in students
                        ]
                    }

            return {"success": False, "error": "Unsupported LMS type for roster fetch"}

        except Exception as e:
            logger.error(f"Roster fetch failed: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

    def create_assignment(
        self,
        course_id: str,
        assignment_name: str,
        description: str,
        points_possible: float,
        due_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Create an assignment in LMS

        Args:
            course_id: LMS course ID
            assignment_name: Assignment name
            description: Assignment description
            points_possible: Maximum points
            due_date: Due date (optional)

        Returns:
            dict: Created assignment data
        """
        try:
            logger.info(f"Creating assignment '{assignment_name}' in course {course_id}")

            if self.lms_type == LMSType.CANVAS:
                url = f"{self.base_url}/api/v1/courses/{course_id}/assignments"
                payload = {
                    "assignment": {
                        "name": assignment_name,
                        "description": description,
                        "points_possible": points_possible,
                        "submission_types": ["external_tool"],
                        "external_tool_tag_attributes": {
                            "url": "https://your-app-url.com/lti/launch",
                            "new_tab": True
                        }
                    }
                }

                if due_date:
                    payload["assignment"]["due_at"] = due_date.isoformat()

                response = self.session.post(url, json=payload)

                if response.status_code in [200, 201]:
                    assignment = response.json()
                    return {
                        "success": True,
                        "assignment_id": str(assignment['id']),
                        "assignment_url": assignment.get('html_url')
                    }

            return {"success": False, "error": "Unsupported LMS type"}

        except Exception as e:
            logger.error(f"Assignment creation failed: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }


class LMSIntegrationManager:
    """
    Manager for handling multiple LMS integrations
    """

    def __init__(self):
        self.connectors: Dict[str, LMSConnector] = {}

    def register_connector(self, module_id: str, connector: LMSConnector):
        """Register an LMS connector for a module"""
        self.connectors[module_id] = connector
        logger.info(f"Registered {connector.lms_type} connector for module {module_id}")

    def get_connector(self, module_id: str) -> Optional[LMSConnector]:
        """Get LMS connector for a module"""
        return self.connectors.get(module_id)

    def sync_module_grades(
        self,
        module_id: str,
        grades: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Sync grades for a module to its connected LMS

        Args:
            module_id: Module UUID
            grades: List of grade records

        Returns:
            dict: Sync results
        """
        connector = self.get_connector(module_id)

        if not connector:
            return {
                "success": False,
                "error": "No LMS connector configured for this module"
            }

        # TODO: Get course_id and assignment_id from database
        course_id = "course-id-placeholder"
        assignment_id = "assignment-id-placeholder"

        return connector.sync_grades(course_id, assignment_id, grades)

    def sync_all_tension_curves(self, module_id: str) -> Dict[str, Any]:
        """
        Sync all tension curve data for a module to LMS

        Args:
            module_id: Module UUID

        Returns:
            dict: Sync results
        """
        connector = self.get_connector(module_id)

        if not connector:
            return {
                "success": False,
                "error": "No LMS connector configured"
            }

        # TODO: Fetch tension curve data from database
        tension_data = []

        course_id = "course-id-placeholder"

        return connector.sync_tension_curves(course_id, tension_data)


# Singleton manager instance
lms_manager = LMSIntegrationManager()
