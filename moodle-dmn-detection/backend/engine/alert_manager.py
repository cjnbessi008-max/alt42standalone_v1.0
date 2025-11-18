"""
Alert Manager
Manages dropout event alerts and notifications to teachers
"""

import logging
from datetime import datetime
from typing import Dict, List

logger = logging.getLogger('dmn_api.alert_manager')


class AlertManager:
    """Manages alerts and notifications"""

    def __init__(self, config, db):
        self.config = config
        self.db = db

    def handle_dropout_event(self, dropout_event: Dict):
        """
        Handle a dropout event and generate alerts

        Args:
            dropout_event: Dropout event data
        """
        try:
            # Get session info
            session = self.db.get_session(dropout_event['session_id'])
            if not session:
                logger.warning(f"Session not found: {dropout_event['session_id']}")
                return

            course_id = session.get('course_id')
            student_id = session.get('student_id')

            # Get teachers for this course
            teachers = self._get_course_teachers(course_id)

            for teacher in teachers:
                # Check teacher's alert configuration
                if self._should_send_alert(
                    teacher['moodle_user_id'],
                    course_id,
                    dropout_event['dropout_type'],
                    dropout_event['severity_level']
                ):
                    self._send_alert(teacher, dropout_event, session)

        except Exception as e:
            logger.error(f"Error handling dropout event: {e}")

    def _get_course_teachers(self, course_id: int) -> List[Dict]:
        """Get teachers for a course"""
        query = """
            SELECT teacher_moodle_id as moodle_user_id
            FROM dmn_courses
            WHERE id = %s
            AND teacher_moodle_id IS NOT NULL
        """

        return self.db.execute_query(query, (course_id,))

    def _should_send_alert(
        self,
        teacher_id: int,
        course_id: int,
        dropout_type: str,
        severity: str
    ) -> bool:
        """Check if alert should be sent based on teacher config"""
        # Get teacher's alert config
        configs = self.db.get_alert_config(teacher_id, course_id)

        if not configs:
            # Default: send medium and high severity alerts
            return severity in ['medium', 'high']

        # Check against config
        for config in configs:
            alert_type = config.get('alert_type')
            severity_threshold = config.get('severity_threshold', 'medium')

            # Check if this alert type matches
            if alert_type == 'all' or self._matches_alert_type(dropout_type, alert_type):
                # Check severity
                severity_order = ['low', 'medium', 'high']
                if severity_order.index(severity) >= severity_order.index(severity_threshold):
                    return True

        return False

    def _matches_alert_type(self, dropout_type: str, alert_type: str) -> bool:
        """Check if dropout type matches alert type"""
        type_mapping = {
            'inactivity': ['inactivity_5min', 'inactivity_10min'],
            'page_switch': ['page_hidden_prolonged', 'page_switch_frequent'],
            'accuracy_drop': ['accuracy_drop'],
            'random_behavior': ['random_clicking', 'repetitive_clicking', 'response_too_fast']
        }

        return dropout_type in type_mapping.get(alert_type, [])

    def _send_alert(self, teacher: Dict, dropout_event: Dict, session: Dict):
        """Send alert notification to teacher"""
        try:
            # Get student info
            student_query = """
                SELECT username, first_name, last_name
                FROM dmn_students
                WHERE id = %s
            """

            student_results = self.db.execute_query(student_query, (session['student_id'],))
            student = student_results[0] if student_results else {}

            # Create notification record
            notification_query = """
                INSERT INTO dmn_alert_notifications
                (dropout_event_id, teacher_moodle_id, notification_method, sent_at)
                VALUES (%s, %s, %s, NOW())
            """

            # Get event ID from database
            event_id = dropout_event.get('id')
            if not event_id:
                # Event not yet stored, skip notification
                logger.warning("Dropout event not stored yet, skipping notification")
                return

            self.db.execute_query(
                notification_query,
                (event_id, teacher['moodle_user_id'], 'websocket'),
                fetch=False
            )

            # Mark dropout event as notified
            update_query = """
                UPDATE dmn_dropout_events
                SET is_notified = TRUE, notified_at = NOW()
                WHERE id = %s
            """

            self.db.execute_query(update_query, (event_id,), fetch=False)

            logger.info(
                f"Alert sent to teacher {teacher['moodle_user_id']} "
                f"for {dropout_event['dropout_type']}"
            )

            # In production, this would:
            # - Send WebSocket message
            # - Send email if configured
            # - Send push notification if configured

        except Exception as e:
            logger.error(f"Error sending alert: {e}")

    def get_unread_alerts(self, teacher_id: int, course_id: int = None) -> List[Dict]:
        """Get unread alerts for a teacher"""
        query = """
            SELECT an.*, de.dropout_type, de.severity_level, de.detected_at,
                   s.username, s.first_name, s.last_name,
                   c.course_name
            FROM dmn_alert_notifications an
            INNER JOIN dmn_dropout_events de ON an.dropout_event_id = de.id
            INNER JOIN dmn_students s ON de.student_id = s.id
            INNER JOIN dmn_courses c ON de.course_id = c.id
            WHERE an.teacher_moodle_id = %s
            AND an.is_read = FALSE
        """

        params = [teacher_id]

        if course_id:
            query += " AND de.course_id = %s"
            params.append(course_id)

        query += " ORDER BY an.sent_at DESC LIMIT 50"

        return self.db.execute_query(query, tuple(params))

    def mark_alert_read(self, notification_id: int):
        """Mark alert as read"""
        query = """
            UPDATE dmn_alert_notifications
            SET is_read = TRUE, read_at = NOW()
            WHERE id = %s
        """

        self.db.execute_query(query, (notification_id,), fetch=False)
