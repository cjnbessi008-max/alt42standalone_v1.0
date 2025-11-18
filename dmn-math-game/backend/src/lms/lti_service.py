"""
LTI 1.3 Service for LMS Integration
"""

import os
import json
from typing import Dict, Any, Optional
from pylti1p3.tool_config import ToolConfJsonFile
from pylti1p3.registration import Registration
from pylti1p3.message_launch import MessageLaunch
from pylti1p3.grade_passback import GradePassback
from flask import request, session


class LTIService:
    """Service for handling LTI 1.3 integration with LMS platforms"""

    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize LTI service

        Args:
            config_path: Path to LTI configuration JSON file
        """
        self.config_path = config_path or os.getenv('LTI_CONFIG_PATH', 'lti_config.json')
        self.tool_config = None
        self._load_config()

    def _load_config(self):
        """Load LTI configuration"""
        try:
            if os.path.exists(self.config_path):
                self.tool_config = ToolConfJsonFile(self.config_path)
            else:
                # Create default config if not exists
                self._create_default_config()
                self.tool_config = ToolConfJsonFile(self.config_path)
        except Exception as e:
            print(f"Warning: Could not load LTI config: {e}")

    def _create_default_config(self):
        """Create default LTI configuration file"""
        default_config = {
            "https://canvas.instructure.com": [{
                "default": True,
                "client_id": os.getenv('LTI_CLIENT_ID', 'your-client-id'),
                "auth_login_url": os.getenv('LTI_AUTH_URL', 'https://canvas.instructure.com/api/lti/authorize_redirect'),
                "auth_token_url": os.getenv('LTI_TOKEN_URL', 'https://canvas.instructure.com/login/oauth2/token'),
                "auth_audience": None,
                "key_set_url": os.getenv('LTI_KEYSET_URL', 'https://canvas.instructure.com/api/lti/security/jwks'),
                "key_set": None,
                "private_key_file": os.getenv('LTI_PRIVATE_KEY_FILE', 'private.key'),
                "public_key_file": os.getenv('LTI_PUBLIC_KEY_FILE', 'public.key'),
                "deployment_ids": [os.getenv('LTI_DEPLOYMENT_ID', 'your-deployment-id')]
            }]
        }

        os.makedirs(os.path.dirname(self.config_path) or '.', exist_ok=True)
        with open(self.config_path, 'w') as f:
            json.dump(default_config, f, indent=2)

    def get_launch_data_storage(self):
        """Get launch data storage (session-based)"""
        from pylti1p3.session import FlaskSessionService
        return FlaskSessionService()

    def get_message_launch(self, request_obj) -> Optional[MessageLaunch]:
        """
        Get and validate LTI message launch

        Args:
            request_obj: Flask request object

        Returns:
            MessageLaunch object if valid, None otherwise
        """
        try:
            message_launch = MessageLaunch(
                request_obj,
                self.tool_config,
                launch_data_storage=self.get_launch_data_storage()
            )
            return message_launch
        except Exception as e:
            print(f"LTI launch error: {e}")
            return None

    def extract_user_info(self, message_launch: MessageLaunch) -> Dict[str, Any]:
        """
        Extract user information from LTI launch

        Args:
            message_launch: LTI message launch object

        Returns:
            Dictionary with user information
        """
        launch_data = message_launch.get_launch_data()

        return {
            'lms_user_id': launch_data.get('sub'),
            'name': launch_data.get('name', ''),
            'email': launch_data.get('email', ''),
            'roles': launch_data.get('https://purl.imsglobal.org/spec/lti/claim/roles', []),
            'context_id': launch_data.get('https://purl.imsglobal.org/spec/lti/claim/context', {}).get('id'),
            'context_title': launch_data.get('https://purl.imsglobal.org/spec/lti/claim/context', {}).get('title'),
            'resource_link_id': launch_data.get('https://purl.imsglobal.org/spec/lti/claim/resource_link', {}).get('id')
        }

    def send_grade(
        self,
        message_launch: MessageLaunch,
        score: float,
        max_score: float = 100.0,
        comment: Optional[str] = None
    ) -> bool:
        """
        Send grade back to LMS

        Args:
            message_launch: LTI message launch object
            score: Student's score
            max_score: Maximum possible score
            comment: Optional comment

        Returns:
            True if successful, False otherwise
        """
        try:
            grade_passback = GradePassback(message_launch)
            grade_passback.set_score_given(score)
            grade_passback.set_score_maximum(max_score)
            grade_passback.set_activity_progress('Completed')
            grade_passback.set_grading_progress('FullyGraded')

            if comment:
                grade_passback.set_comment(comment)

            result = grade_passback.publish_grade()
            return result.get('success', False)

        except Exception as e:
            print(f"Grade passback error: {e}")
            return False

    def is_instructor(self, message_launch: MessageLaunch) -> bool:
        """
        Check if user has instructor role

        Args:
            message_launch: LTI message launch object

        Returns:
            True if user is instructor
        """
        roles = message_launch.get_launch_data().get(
            'https://purl.imsglobal.org/spec/lti/claim/roles',
            []
        )

        instructor_roles = [
            'http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor',
            'http://purl.imsglobal.org/vocab/lis/v2/membership/Instructor#TeachingAssistant',
            'http://purl.imsglobal.org/vocab/lis/v2/institution/person#Administrator'
        ]

        return any(role in instructor_roles for role in roles)

    def generate_jwks(self) -> Dict[str, Any]:
        """
        Generate JSON Web Key Set for LTI configuration

        Returns:
            JWKS dictionary
        """
        # This would typically read from the public key file
        # For now, return a placeholder structure
        return {
            "keys": []
        }
