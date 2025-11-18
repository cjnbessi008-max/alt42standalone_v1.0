"""
LMS Integration Service
Handles integration with various Learning Management Systems (Canvas, Moodle, Blackboard)
to receive student activity data and map it to the DMN detection pipeline
"""

from datetime import datetime
from typing import Dict, Optional, List, Any
from uuid import UUID
from abc import ABC, abstractmethod
from dataclasses import dataclass
import hmac
import hashlib
import logging

logger = logging.getLogger(__name__)


# =============================================================================
# Data Classes
# =============================================================================

@dataclass
class LMSEvent:
    """Standardized LMS event"""
    source: str  # canvas, moodle, blackboard, custom
    event_type: str
    user_id: str  # LMS-specific user ID
    timestamp: datetime
    course_id: Optional[str] = None
    assignment_id: Optional[str] = None
    module_id: Optional[str] = None
    score: Optional[float] = None
    max_score: Optional[float] = None
    duration_seconds: Optional[int] = None
    payload: Optional[Dict[str, Any]] = None


@dataclass
class StudentMapping:
    """Mapping between LMS user and internal student ID"""
    lms_source: str
    lms_user_id: str
    student_id: UUID
    email: Optional[str] = None
    created_at: datetime = None


# =============================================================================
# Base LMS Adapter
# =============================================================================

class LMSAdapter(ABC):
    """Base class for LMS integrations"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.name = self.__class__.__name__

    @abstractmethod
    def parse_webhook(self, payload: Dict[str, Any]) -> Optional[LMSEvent]:
        """Parse webhook payload into standardized LMSEvent"""
        pass

    @abstractmethod
    def verify_signature(self, payload: bytes, signature: str) -> bool:
        """Verify webhook signature for security"""
        pass

    @abstractmethod
    def map_to_activity_event(self, lms_event: LMSEvent) -> Optional[Dict[str, Any]]:
        """Map LMS event to DMN activity event format"""
        pass


# =============================================================================
# Canvas LMS Adapter
# =============================================================================

class CanvasLMSAdapter(LMSAdapter):
    """
    Adapter for Canvas LMS
    Documentation: https://canvas.instructure.com/doc/api/file.live_events.html
    """

    SUPPORTED_EVENTS = [
        "assignment_created",
        "assignment_updated",
        "assignment_submitted",
        "quiz_submitted",
        "discussion_topic_created",
        "discussion_entry_created",
        "page_view",
        "module_item_viewed",
        "grade_change"
    ]

    def parse_webhook(self, payload: Dict[str, Any]) -> Optional[LMSEvent]:
        """Parse Canvas webhook payload"""
        try:
            # Canvas live events structure
            metadata = payload.get("metadata", {})
            event_name = metadata.get("event_name", "")
            event_time = metadata.get("event_time", "")

            body = payload.get("body", {})

            # Extract user information
            user_id = None
            if "user_id" in body:
                user_id = str(body["user_id"])
            elif "userId" in body:
                user_id = str(body["userId"])

            if not user_id:
                logger.warning("Canvas webhook missing user_id")
                return None

            lms_event = LMSEvent(
                source="canvas",
                event_type=event_name,
                user_id=user_id,
                timestamp=datetime.fromisoformat(event_time.replace('Z', '+00:00')),
                course_id=body.get("course_id"),
                assignment_id=body.get("assignment_id"),
                payload=payload
            )

            # Extract additional fields based on event type
            if event_name == "assignment_submitted":
                lms_event.score = body.get("score")
                lms_event.duration_seconds = body.get("attempt_duration_seconds")

            elif event_name == "quiz_submitted":
                lms_event.score = body.get("score")
                lms_event.max_score = body.get("points_possible")
                lms_event.duration_seconds = body.get("time_spent")

            logger.info(f"Parsed Canvas event: {event_name} for user {user_id}")
            return lms_event

        except Exception as e:
            logger.error(f"Error parsing Canvas webhook: {str(e)}")
            return None

    def verify_signature(self, payload: bytes, signature: str) -> bool:
        """
        Verify Canvas webhook signature
        Canvas uses HMAC-SHA256
        """
        try:
            secret = self.config.get("webhook_secret", "").encode()
            expected_signature = hmac.new(secret, payload, hashlib.sha256).hexdigest()
            return hmac.compare_digest(signature, expected_signature)
        except Exception as e:
            logger.error(f"Error verifying Canvas signature: {str(e)}")
            return False

    def map_to_activity_event(self, lms_event: LMSEvent) -> Optional[Dict[str, Any]]:
        """Map Canvas event to DMN activity event"""

        event_mapping = {
            "assignment_submitted": {
                "event_type": "submit",
                "extract_correctness": True,
                "extract_duration": True
            },
            "quiz_submitted": {
                "event_type": "submit",
                "extract_correctness": True,
                "extract_duration": True
            },
            "page_view": {
                "event_type": "navigation",
                "extract_correctness": False,
                "extract_duration": True
            },
            "module_item_viewed": {
                "event_type": "click",
                "extract_correctness": False,
                "extract_duration": False
            },
            "discussion_entry_created": {
                "event_type": "submit",
                "extract_correctness": False,
                "extract_duration": False
            }
        }

        mapping = event_mapping.get(lms_event.event_type)
        if not mapping:
            logger.debug(f"No mapping for Canvas event: {lms_event.event_type}")
            return None

        activity_event = {
            "event_type": mapping["event_type"],
            "timestamp": lms_event.timestamp.isoformat()
        }

        # Extract correctness if available
        if mapping["extract_correctness"] and lms_event.score is not None and lms_event.max_score:
            accuracy = lms_event.score / lms_event.max_score
            activity_event["is_correct"] = accuracy >= 0.7  # 70% threshold
            activity_event["metadata"] = {"score": lms_event.score, "max_score": lms_event.max_score}

        # Extract duration if available
        if mapping["extract_duration"] and lms_event.duration_seconds:
            activity_event["response_time_ms"] = lms_event.duration_seconds * 1000

        return activity_event


# =============================================================================
# Moodle Adapter
# =============================================================================

class MoodleAdapter(LMSAdapter):
    """
    Adapter for Moodle
    Documentation: https://docs.moodle.org/dev/Webservices
    """

    SUPPORTED_EVENTS = [
        "\\mod_assign\\event\\assessable_submitted",
        "\\mod_quiz\\event\\attempt_submitted",
        "\\mod_forum\\event\\discussion_created",
        "\\mod_forum\\event\\post_created",
        "\\core\\event\\course_module_viewed",
        "\\mod_quiz\\event\\attempt_started"
    ]

    def parse_webhook(self, payload: Dict[str, Any]) -> Optional[LMSEvent]:
        """Parse Moodle webhook payload"""
        try:
            event_name = payload.get("eventname", "")
            user_id = str(payload.get("userid", ""))
            time_created = payload.get("timecreated", "")

            if not user_id:
                logger.warning("Moodle webhook missing userid")
                return None

            lms_event = LMSEvent(
                source="moodle",
                event_type=event_name,
                user_id=user_id,
                timestamp=datetime.fromtimestamp(int(time_created)),
                course_id=payload.get("courseid"),
                payload=payload
            )

            # Extract additional context
            other = payload.get("other", {})
            if "attemptid" in other:
                lms_event.assignment_id = str(other["attemptid"])

            logger.info(f"Parsed Moodle event: {event_name} for user {user_id}")
            return lms_event

        except Exception as e:
            logger.error(f"Error parsing Moodle webhook: {str(e)}")
            return None

    def verify_signature(self, payload: bytes, signature: str) -> bool:
        """Verify Moodle webhook signature"""
        try:
            secret = self.config.get("webhook_secret", "").encode()
            expected_signature = hmac.new(secret, payload, hashlib.sha256).hexdigest()
            return hmac.compare_digest(signature, expected_signature)
        except Exception as e:
            logger.error(f"Error verifying Moodle signature: {str(e)}")
            return False

    def map_to_activity_event(self, lms_event: LMSEvent) -> Optional[Dict[str, Any]]:
        """Map Moodle event to DMN activity event"""

        event_mapping = {
            "\\mod_assign\\event\\assessable_submitted": "submit",
            "\\mod_quiz\\event\\attempt_submitted": "submit",
            "\\mod_forum\\event\\post_created": "submit",
            "\\core\\event\\course_module_viewed": "navigation",
            "\\mod_quiz\\event\\attempt_started": "click"
        }

        event_type = event_mapping.get(lms_event.event_type)
        if not event_type:
            logger.debug(f"No mapping for Moodle event: {lms_event.event_type}")
            return None

        return {
            "event_type": event_type,
            "timestamp": lms_event.timestamp.isoformat()
        }


# =============================================================================
# Blackboard Adapter
# =============================================================================

class BlackboardAdapter(LMSAdapter):
    """
    Adapter for Blackboard Learn
    Documentation: https://docs.blackboard.com/
    """

    def parse_webhook(self, payload: Dict[str, Any]) -> Optional[LMSEvent]:
        """Parse Blackboard webhook payload"""
        try:
            event_type = payload.get("eventType", "")
            event_data = payload.get("event", {})

            user_id = event_data.get("userId", "")
            if not user_id:
                logger.warning("Blackboard webhook missing userId")
                return None

            timestamp_str = payload.get("timestamp", "")
            timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))

            lms_event = LMSEvent(
                source="blackboard",
                event_type=event_type,
                user_id=user_id,
                timestamp=timestamp,
                course_id=event_data.get("courseId"),
                payload=payload
            )

            logger.info(f"Parsed Blackboard event: {event_type} for user {user_id}")
            return lms_event

        except Exception as e:
            logger.error(f"Error parsing Blackboard webhook: {str(e)}")
            return None

    def verify_signature(self, payload: bytes, signature: str) -> bool:
        """Verify Blackboard webhook signature"""
        try:
            secret = self.config.get("webhook_secret", "").encode()
            expected_signature = hmac.new(secret, payload, hashlib.sha256).hexdigest()
            return hmac.compare_digest(signature, expected_signature)
        except Exception as e:
            logger.error(f"Error verifying Blackboard signature: {str(e)}")
            return False

    def map_to_activity_event(self, lms_event: LMSEvent) -> Optional[Dict[str, Any]]:
        """Map Blackboard event to DMN activity event"""

        event_mapping = {
            "attempt.submitted": "submit",
            "content.viewed": "navigation",
            "discussion.entry.created": "submit",
            "grade.changed": "submit"
        }

        event_type = event_mapping.get(lms_event.event_type)
        if not event_type:
            logger.debug(f"No mapping for Blackboard event: {lms_event.event_type}")
            return None

        return {
            "event_type": event_type,
            "timestamp": lms_event.timestamp.isoformat()
        }


# =============================================================================
# Custom LMS Adapter
# =============================================================================

class CustomLMSAdapter(LMSAdapter):
    """
    Adapter for custom LMS integrations
    Supports generic webhook format
    """

    def parse_webhook(self, payload: Dict[str, Any]) -> Optional[LMSEvent]:
        """Parse custom LMS webhook payload"""
        try:
            lms_event = LMSEvent(
                source="custom",
                event_type=payload.get("event_type", ""),
                user_id=payload.get("user_id", ""),
                timestamp=datetime.fromisoformat(payload.get("timestamp", datetime.utcnow().isoformat())),
                course_id=payload.get("course_id"),
                assignment_id=payload.get("assignment_id"),
                payload=payload
            )

            logger.info(f"Parsed custom LMS event: {lms_event.event_type} for user {lms_event.user_id}")
            return lms_event

        except Exception as e:
            logger.error(f"Error parsing custom LMS webhook: {str(e)}")
            return None

    def verify_signature(self, payload: bytes, signature: str) -> bool:
        """Verify custom LMS webhook signature"""
        if not self.config.get("require_signature", True):
            return True

        try:
            secret = self.config.get("webhook_secret", "").encode()
            expected_signature = hmac.new(secret, payload, hashlib.sha256).hexdigest()
            return hmac.compare_digest(signature, expected_signature)
        except Exception as e:
            logger.error(f"Error verifying custom LMS signature: {str(e)}")
            return False

    def map_to_activity_event(self, lms_event: LMSEvent) -> Optional[Dict[str, Any]]:
        """Map custom LMS event to DMN activity event"""
        # Direct mapping for custom format
        return {
            "event_type": lms_event.event_type,
            "timestamp": lms_event.timestamp.isoformat()
        }


# =============================================================================
# LMS Integration Service
# =============================================================================

class LMSIntegrationService:
    """Main service for LMS integration"""

    def __init__(self, configs: Dict[str, Dict[str, Any]]):
        """
        Initialize LMS Integration Service

        Args:
            configs: Dictionary of LMS configurations
                {
                    "canvas": {"webhook_secret": "..."},
                    "moodle": {"webhook_secret": "..."},
                    ...
                }
        """
        self.adapters: Dict[str, LMSAdapter] = {}

        # Initialize adapters
        if "canvas" in configs:
            self.adapters["canvas"] = CanvasLMSAdapter(configs["canvas"])

        if "moodle" in configs:
            self.adapters["moodle"] = MoodleAdapter(configs["moodle"])

        if "blackboard" in configs:
            self.adapters["blackboard"] = BlackboardAdapter(configs["blackboard"])

        if "custom" in configs:
            self.adapters["custom"] = CustomLMSAdapter(configs["custom"])

        logger.info(f"LMS Integration Service initialized with adapters: {list(self.adapters.keys())}")

    def process_webhook(
        self,
        lms_source: str,
        payload: Dict[str, Any],
        signature: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Process incoming webhook from LMS

        Args:
            lms_source: Source LMS (canvas, moodle, blackboard, custom)
            payload: Webhook payload
            signature: Webhook signature for verification

        Returns:
            Processed activity event or None
        """
        adapter = self.adapters.get(lms_source)
        if not adapter:
            logger.error(f"No adapter found for LMS: {lms_source}")
            return None

        # Verify signature if provided
        if signature:
            import json
            payload_bytes = json.dumps(payload).encode()
            if not adapter.verify_signature(payload_bytes, signature):
                logger.warning(f"Invalid signature for {lms_source} webhook")
                return None

        # Parse webhook
        lms_event = adapter.parse_webhook(payload)
        if not lms_event:
            logger.warning(f"Failed to parse {lms_source} webhook")
            return None

        # Map to activity event
        activity_event = adapter.map_to_activity_event(lms_event)
        if not activity_event:
            logger.debug(f"No mapping for {lms_source} event: {lms_event.event_type}")
            return None

        # Add LMS context
        activity_event["lms_source"] = lms_source
        activity_event["lms_user_id"] = lms_event.user_id
        activity_event["lms_course_id"] = lms_event.course_id

        logger.info(f"Successfully processed {lms_source} webhook into activity event")
        return activity_event

    async def map_lms_user_to_student(
        self,
        lms_source: str,
        lms_user_id: str,
        db  # Database session
    ) -> Optional[UUID]:
        """
        Map LMS user ID to internal student ID

        Args:
            lms_source: Source LMS
            lms_user_id: LMS user ID
            db: Database session

        Returns:
            Student UUID or None
        """
        # TODO: Query database for user mapping
        # Example:
        # mapping = db.query(StudentMapping).filter_by(
        #     lms_source=lms_source,
        #     lms_user_id=lms_user_id
        # ).first()
        #
        # if mapping:
        #     return mapping.student_id

        logger.warning(f"No student mapping found for {lms_source} user {lms_user_id}")
        return None

    def get_supported_events(self, lms_source: str) -> List[str]:
        """Get list of supported events for an LMS"""
        adapter = self.adapters.get(lms_source)
        if not adapter:
            return []

        if hasattr(adapter, "SUPPORTED_EVENTS"):
            return adapter.SUPPORTED_EVENTS

        return []


# =============================================================================
# Utility Functions
# =============================================================================

def create_user_mapping(
    lms_source: str,
    lms_user_id: str,
    student_id: UUID,
    email: Optional[str] = None,
    db=None  # Database session
) -> StudentMapping:
    """
    Create mapping between LMS user and internal student ID

    Args:
        lms_source: Source LMS
        lms_user_id: LMS user ID
        student_id: Internal student UUID
        email: Optional email for verification
        db: Database session

    Returns:
        StudentMapping object
    """
    mapping = StudentMapping(
        lms_source=lms_source,
        lms_user_id=lms_user_id,
        student_id=student_id,
        email=email,
        created_at=datetime.utcnow()
    )

    # TODO: Save to database
    # db.add(mapping)
    # db.commit()

    logger.info(f"Created user mapping: {lms_source}:{lms_user_id} -> {student_id}")
    return mapping


if __name__ == "__main__":
    # Example usage
    logging.basicConfig(level=logging.INFO)

    configs = {
        "canvas": {
            "webhook_secret": "your_canvas_secret"
        },
        "moodle": {
            "webhook_secret": "your_moodle_secret"
        }
    }

    service = LMSIntegrationService(configs)

    # Example Canvas webhook
    canvas_payload = {
        "metadata": {
            "event_name": "assignment_submitted",
            "event_time": "2025-11-18T10:30:00Z"
        },
        "body": {
            "user_id": "12345",
            "course_id": "67890",
            "assignment_id": "111",
            "score": 85,
            "attempt_duration_seconds": 300
        }
    }

    activity_event = service.process_webhook("canvas", canvas_payload)
    if activity_event:
        print(f"\nProcessed activity event:")
        print(f"  Type: {activity_event['event_type']}")
        print(f"  LMS: {activity_event['lms_source']}")
        print(f"  User: {activity_event['lms_user_id']}")
