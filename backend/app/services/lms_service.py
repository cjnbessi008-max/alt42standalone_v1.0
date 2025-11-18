from typing import Dict, Any, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from pylti1p3.contrib.flask import FlaskOIDCLogin, FlaskMessageLaunch
from pylti1p3.tool_config import ToolConfJsonFile
from pylti1p3.registration import Registration
from ..models.lms_integration import LMSIntegration
from ..models.student import Student
import logging

logger = logging.getLogger(__name__)


class LMSService:
    """Service for LMS integration using LTI 1.3"""

    def __init__(self, db: Session):
        self.db = db

    def get_lms_config(self, lms_id: UUID) -> Optional[LMSIntegration]:
        """Get LMS integration configuration"""
        return (
            self.db.query(LMSIntegration)
            .filter(LMSIntegration.id == lms_id, LMSIntegration.is_active == True)
            .first()
        )

    def create_lti_registration(self, lms_config: LMSIntegration) -> Registration:
        """Create LTI 1.3 registration from LMS config"""
        return Registration(
            issuer=lms_config.issuer,
            client_id=lms_config.client_id,
            auth_login_url=lms_config.auth_login_url,
            auth_token_url=lms_config.auth_token_url,
            key_set_url=lms_config.key_set_url,
            deployment_ids=[lms_config.deployment_id] if lms_config.deployment_id else [],
        )

    def process_lti_launch(
        self, launch_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Process LTI launch request and extract user/course info"""
        try:
            # Extract user information
            user_info = {
                "lms_user_id": launch_data.get("sub"),
                "name": launch_data.get("name", ""),
                "email": launch_data.get("email", ""),
                "roles": launch_data.get("https://purl.imsglobal.org/spec/lti/claim/roles", []),
            }

            # Extract course/context information
            context = launch_data.get("https://purl.imsglobal.org/spec/lti/claim/context", {})
            course_info = {
                "course_id": context.get("id"),
                "course_title": context.get("title"),
                "course_label": context.get("label"),
            }

            # Extract resource link information
            resource_link = launch_data.get(
                "https://purl.imsglobal.org/spec/lti/claim/resource_link", {}
            )
            resource_info = {
                "resource_link_id": resource_link.get("id"),
                "resource_link_title": resource_link.get("title"),
                "resource_link_description": resource_link.get("description"),
            }

            return {
                "user": user_info,
                "course": course_info,
                "resource": resource_info,
                "custom_params": launch_data.get(
                    "https://purl.imsglobal.org/spec/lti/claim/custom", {}
                ),
            }

        except Exception as e:
            logger.error(f"Error processing LTI launch: {str(e)}")
            raise

    def sync_student_from_lms(
        self, lms_user_id: str, user_data: Dict[str, Any]
    ) -> Student:
        """Sync student data from LMS"""
        # Check if student already exists
        student = (
            self.db.query(Student)
            .filter(Student.lms_user_id == lms_user_id)
            .first()
        )

        if student:
            # Update existing student
            student.name = user_data.get("name", student.name)
            student.email = user_data.get("email", student.email)
        else:
            # Create new student
            student = Student(
                lms_user_id=lms_user_id,
                name=user_data.get("name", ""),
                email=user_data.get("email", ""),
                enrolled_modules=[],
            )
            self.db.add(student)

        self.db.commit()
        self.db.refresh(student)

        return student

    def send_grade_to_lms(
        self,
        lms_config: LMSIntegration,
        student_lms_id: str,
        resource_link_id: str,
        score: float,
        max_score: float = 100.0,
    ) -> bool:
        """Send grade back to LMS using LTI Assignment and Grade Services"""
        try:
            # This would use LTI AGS (Assignment and Grade Services) to send grades
            # Implementation depends on specific LTI library and LMS
            logger.info(
                f"Sending grade to LMS: student={student_lms_id}, "
                f"score={score}/{max_score}, resource={resource_link_id}"
            )

            # TODO: Implement actual grade passback using pylti1p3
            # This requires proper LTI 1.3 setup with AGS service

            return True

        except Exception as e:
            logger.error(f"Error sending grade to LMS: {str(e)}")
            return False

    def get_course_roster(
        self, lms_config: LMSIntegration, course_id: str
    ) -> list[Dict[str, Any]]:
        """Get course roster from LMS using Names and Role Provisioning Services"""
        try:
            # This would use LTI NRPS to get course roster
            logger.info(f"Fetching roster for course: {course_id}")

            # TODO: Implement roster fetch using pylti1p3 NRPS
            # This requires proper LTI 1.3 setup with NRPS service

            return []

        except Exception as e:
            logger.error(f"Error fetching course roster: {str(e)}")
            return []
