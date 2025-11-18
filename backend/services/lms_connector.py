"""
LMS Integration Service

Handles communication with various Learning Management Systems (LMS)
to send emotion detection data and alerts.

Supported LMS platforms:
- Canvas LMS
- Moodle
- Blackboard
- Custom webhook-based systems
"""
from typing import Dict, Optional, Any
from datetime import datetime
import httpx
from loguru import logger


class LMSConnector:
    """
    Manages connections and data exchange with LMS platforms
    """

    def __init__(
        self,
        lms_type: str,
        lms_url: str,
        api_key: Optional[str] = None,
        webhook_url: Optional[str] = None,
        course_id: Optional[str] = None,
        timeout: int = 30
    ):
        """
        Initialize LMS connector

        Args:
            lms_type: Type of LMS (canvas, moodle, blackboard, custom)
            lms_url: Base URL of the LMS
            api_key: API key for authentication
            webhook_url: URL to send webhook notifications
            course_id: Course/class identifier
            timeout: HTTP request timeout in seconds
        """
        self.lms_type = lms_type.lower()
        self.lms_url = lms_url.rstrip('/')
        self.api_key = api_key
        self.webhook_url = webhook_url
        self.course_id = course_id
        self.timeout = timeout

        logger.info(f"LMSConnector initialized for {lms_type} at {lms_url}")

    async def send_emotion_alert(
        self,
        student_id: str,
        session_id: str,
        module_id: str,
        emotion_data: Dict[str, Any],
        severity: str = "medium"
    ) -> bool:
        """
        Send an emotion detection alert to the LMS

        Args:
            student_id: Student identifier
            session_id: Learning session identifier
            module_id: Module/activity identifier
            emotion_data: Emotion detection data
            severity: Alert severity (low, medium, high)

        Returns:
            True if successful, False otherwise
        """
        payload = {
            "event_type": "emotion_alert",
            "student_id": student_id,
            "session_id": session_id,
            "module_id": module_id,
            "timestamp": datetime.utcnow().isoformat(),
            "emotion_data": emotion_data,
            "severity": severity,
            "course_id": self.course_id,
        }

        try:
            if self.lms_type == "canvas":
                return await self._send_to_canvas(payload)
            elif self.lms_type == "moodle":
                return await self._send_to_moodle(payload)
            elif self.lms_type == "blackboard":
                return await self._send_to_blackboard(payload)
            elif self.lms_type == "custom" and self.webhook_url:
                return await self._send_to_webhook(payload)
            else:
                logger.warning(f"Unsupported LMS type: {self.lms_type}")
                return False

        except Exception as e:
            logger.error(f"Failed to send emotion alert to LMS: {e}")
            return False

    async def send_intervention_recommendation(
        self,
        student_id: str,
        recommendation: str,
        emotion_context: Dict[str, Any]
    ) -> bool:
        """
        Send an intervention recommendation to teachers via LMS

        Args:
            student_id: Student identifier
            recommendation: Recommended intervention action
            emotion_context: Context about detected emotions

        Returns:
            True if successful, False otherwise
        """
        payload = {
            "event_type": "intervention_recommendation",
            "student_id": student_id,
            "recommendation": recommendation,
            "emotion_context": emotion_context,
            "timestamp": datetime.utcnow().isoformat(),
            "course_id": self.course_id,
        }

        try:
            if self.webhook_url:
                return await self._send_to_webhook(payload)
            else:
                logger.warning("No webhook URL configured for intervention recommendations")
                return False

        except Exception as e:
            logger.error(f"Failed to send intervention recommendation: {e}")
            return False

    async def get_student_context(self, student_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve student context from LMS (grades, attendance, etc.)

        Args:
            student_id: Student identifier

        Returns:
            Student context data or None if unavailable
        """
        try:
            if self.lms_type == "canvas":
                return await self._get_canvas_student_context(student_id)
            elif self.lms_type == "moodle":
                return await self._get_moodle_student_context(student_id)
            else:
                logger.info(f"Student context retrieval not implemented for {self.lms_type}")
                return None

        except Exception as e:
            logger.error(f"Failed to retrieve student context: {e}")
            return None

    async def _send_to_canvas(self, payload: Dict[str, Any]) -> bool:
        """Send data to Canvas LMS"""
        if not self.api_key:
            logger.error("Canvas API key not configured")
            return False

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        # Canvas API endpoint for custom events
        url = f"{self.lms_url}/api/v1/courses/{self.course_id}/custom_events"

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(url, json=payload, headers=headers)

            if response.status_code in [200, 201]:
                logger.info(f"Successfully sent data to Canvas: {payload.get('event_type')}")
                return True
            else:
                logger.error(f"Canvas API error: {response.status_code} - {response.text}")
                return False

    async def _send_to_moodle(self, payload: Dict[str, Any]) -> bool:
        """Send data to Moodle LMS"""
        if not self.api_key:
            logger.error("Moodle API token not configured")
            return False

        # Moodle Web Services API
        url = f"{self.lms_url}/webservice/rest/server.php"

        params = {
            "wstoken": self.api_key,
            "wsfunction": "core_calendar_create_calendar_events",
            "moodlewsrestformat": "json",
        }

        # Convert to Moodle event format
        moodle_event = {
            "events[0][name]": f"Emotion Alert: {payload.get('severity')}",
            "events[0][description]": str(payload),
            "events[0][courseid]": self.course_id,
            "events[0][eventtype]": "user",
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(url, params=params, data=moodle_event)

            if response.status_code == 200:
                logger.info(f"Successfully sent data to Moodle")
                return True
            else:
                logger.error(f"Moodle API error: {response.status_code}")
                return False

    async def _send_to_blackboard(self, payload: Dict[str, Any]) -> bool:
        """Send data to Blackboard LMS"""
        if not self.api_key:
            logger.error("Blackboard API key not configured")
            return False

        # Blackboard REST API
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        url = f"{self.lms_url}/learn/api/public/v1/courses/{self.course_id}/contents"

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(url, json=payload, headers=headers)

            if response.status_code in [200, 201]:
                logger.info(f"Successfully sent data to Blackboard")
                return True
            else:
                logger.error(f"Blackboard API error: {response.status_code}")
                return False

    async def _send_to_webhook(self, payload: Dict[str, Any]) -> bool:
        """Send data to a custom webhook"""
        if not self.webhook_url:
            logger.error("Webhook URL not configured")
            return False

        headers = {
            "Content-Type": "application/json",
            "User-Agent": "EmotionDetection-LMS-Connector/1.0",
        }

        # Add API key to headers if configured
        if self.api_key:
            headers["X-API-Key"] = self.api_key

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                self.webhook_url,
                json=payload,
                headers=headers
            )

            if response.status_code in [200, 201, 202]:
                logger.info(f"Successfully sent data to webhook: {self.webhook_url}")
                return True
            else:
                logger.error(
                    f"Webhook error: {response.status_code} - {response.text}"
                )
                return False

    async def _get_canvas_student_context(self, student_id: str) -> Optional[Dict]:
        """Retrieve student context from Canvas"""
        if not self.api_key:
            return None

        headers = {
            "Authorization": f"Bearer {self.api_key}",
        }

        url = f"{self.lms_url}/api/v1/courses/{self.course_id}/students/{student_id}"

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(url, headers=headers)

            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Failed to get Canvas student context: {response.status_code}")
                return None

    async def _get_moodle_student_context(self, student_id: str) -> Optional[Dict]:
        """Retrieve student context from Moodle"""
        if not self.api_key:
            return None

        url = f"{self.lms_url}/webservice/rest/server.php"

        params = {
            "wstoken": self.api_key,
            "wsfunction": "core_user_get_users_by_field",
            "moodlewsrestformat": "json",
            "field": "id",
            "values[0]": student_id,
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(url, params=params)

            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Failed to get Moodle student context: {response.status_code}")
                return None

    async def test_connection(self) -> bool:
        """
        Test the connection to the LMS

        Returns:
            True if connection is successful, False otherwise
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(self.lms_url)

                if response.status_code < 500:
                    logger.info(f"LMS connection test successful: {self.lms_url}")
                    return True
                else:
                    logger.error(f"LMS connection test failed: {response.status_code}")
                    return False

        except Exception as e:
            logger.error(f"LMS connection test error: {e}")
            return False


class LMSConnectorFactory:
    """
    Factory for creating LMS connector instances
    """

    @staticmethod
    def create_connector(config: Dict[str, Any]) -> LMSConnector:
        """
        Create an LMS connector from configuration

        Args:
            config: Configuration dictionary with LMS details

        Returns:
            Configured LMSConnector instance
        """
        return LMSConnector(
            lms_type=config.get("lms_type", "custom"),
            lms_url=config["lms_url"],
            api_key=config.get("api_key"),
            webhook_url=config.get("webhook_url"),
            course_id=config.get("course_id"),
            timeout=config.get("timeout", 30),
        )
