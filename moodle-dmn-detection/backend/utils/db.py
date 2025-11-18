"""
Database Manager for DMN Detection System
Handles all MySQL database operations
"""

import mysql.connector
from mysql.connector import pooling
import json
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any

logger = logging.getLogger('dmn_api.db')


class DatabaseManager:
    """Manages database connections and operations"""

    def __init__(self, config):
        """Initialize database connection pool"""
        self.config = config

        # Create connection pool
        self.pool = pooling.MySQLConnectionPool(
            pool_name="dmn_pool",
            pool_size=int(config.get('db_pool_size', 5)),
            host=config.get('db_host', 'localhost'),
            port=int(config.get('db_port', 3306)),
            database=config.get('db_name', 'dmn_detection'),
            user=config.get('db_user', 'root'),
            password=config.get('db_password', ''),
            autocommit=True
        )

        logger.info("Database connection pool created")

    def get_connection(self):
        """Get connection from pool"""
        return self.pool.get_connection()

    def execute_query(self, query, params=None, fetch=True):
        """Execute SQL query"""
        conn = None
        cursor = None
        try:
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)

            cursor.execute(query, params or ())

            if fetch:
                return cursor.fetchall()
            else:
                conn.commit()
                return cursor.lastrowid

        except mysql.connector.Error as err:
            logger.error(f"Database error: {err}")
            raise

        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    # ========================================================================
    # Session Management
    # ========================================================================

    def create_session(self, student_id, course_id, activity_id=None):
        """Create new learning session"""
        query = """
            INSERT INTO dmn_learning_sessions
            (student_id, course_id, moodle_activity_id, session_start)
            VALUES (%s, %s, %s, NOW())
        """

        session_id = self.execute_query(
            query,
            (student_id, course_id, activity_id),
            fetch=False
        )

        logger.info(f"Created session {session_id} for student {student_id}")
        return session_id

    def get_session(self, session_id):
        """Get session details"""
        query = """
            SELECT * FROM dmn_learning_sessions
            WHERE id = %s
        """

        results = self.execute_query(query, (session_id,))
        return results[0] if results else None

    def update_session_stats(self, session_id, stats):
        """Update session statistics"""
        query = """
            UPDATE dmn_learning_sessions
            SET total_duration_seconds = %s
            WHERE id = %s
        """

        self.execute_query(
            query,
            (stats.get('sessionDuration', 0) / 1000, session_id),
            fetch=False
        )

    def update_session_engagement(self, session_id, engagement_score):
        """Update session engagement score"""
        query = """
            UPDATE dmn_learning_sessions
            SET engagement_score = %s
            WHERE id = %s
        """

        self.execute_query(query, (engagement_score, session_id), fetch=False)

    def end_session(self, session_id):
        """End learning session"""
        query = """
            UPDATE dmn_learning_sessions
            SET session_end = NOW()
            WHERE id = %s
        """

        self.execute_query(query, (session_id,), fetch=False)
        logger.info(f"Ended session {session_id}")

    # ========================================================================
    # Behavior Events
    # ========================================================================

    def store_behavior_event(self, session_id, event_type, event_data, event_timestamp):
        """Store behavior event"""
        query = """
            INSERT INTO dmn_behavior_events
            (session_id, event_type, event_timestamp, event_data)
            VALUES (%s, %s, %s, %s)
        """

        # Convert event_data to JSON
        event_data_json = json.dumps(event_data) if isinstance(event_data, dict) else event_data

        self.execute_query(
            query,
            (session_id, event_type, event_timestamp, event_data_json),
            fetch=False
        )

    def get_session_events(self, session_id, event_type=None, limit=100):
        """Get events for a session"""
        if event_type:
            query = """
                SELECT * FROM dmn_behavior_events
                WHERE session_id = %s AND event_type = %s
                ORDER BY event_timestamp DESC
                LIMIT %s
            """
            params = (session_id, event_type, limit)
        else:
            query = """
                SELECT * FROM dmn_behavior_events
                WHERE session_id = %s
                ORDER BY event_timestamp DESC
                LIMIT %s
            """
            params = (session_id, limit)

        return self.execute_query(query, params)

    def count_events_since(self, session_id, event_type, since):
        """Count events since a specific time"""
        query = """
            SELECT COUNT(*) as count
            FROM dmn_behavior_events
            WHERE session_id = %s
            AND event_type = %s
            AND event_timestamp >= %s
        """

        results = self.execute_query(query, (session_id, event_type, since))
        return results[0]['count'] if results else 0

    # ========================================================================
    # Dropout Events
    # ========================================================================

    def store_dropout_event(self, dropout_data):
        """Store dropout event"""
        query = """
            INSERT INTO dmn_dropout_events
            (session_id, student_id, course_id, dropout_type, severity_level, detected_at, detection_data)
            SELECT %s, student_id, course_id, %s, %s, %s, %s
            FROM dmn_learning_sessions
            WHERE id = %s
        """

        detection_data_json = json.dumps(dropout_data.get('detection_data', {}))

        event_id = self.execute_query(
            query,
            (
                dropout_data['session_id'],
                dropout_data['dropout_type'],
                dropout_data['severity_level'],
                dropout_data['detected_at'],
                detection_data_json,
                dropout_data['session_id']
            ),
            fetch=False
        )

        # Update session dropout count
        self.execute_query(
            "UPDATE dmn_learning_sessions SET dropout_event_count = dropout_event_count + 1 WHERE id = %s",
            (dropout_data['session_id'],),
            fetch=False
        )

        logger.warning(f"Stored dropout event: {dropout_data['dropout_type']} for session {dropout_data['session_id']}")
        return event_id

    def get_dropout_events(self, student_id=None, course_id=None, start_date=None, end_date=None, severity=None, hours=None):
        """Get dropout events with filters"""
        conditions = []
        params = []

        if student_id:
            conditions.append("student_id = %s")
            params.append(student_id)

        if course_id:
            conditions.append("course_id = %s")
            params.append(course_id)

        if start_date:
            conditions.append("detected_at >= %s")
            params.append(start_date)

        if end_date:
            conditions.append("detected_at <= %s")
            params.append(end_date)

        if severity:
            conditions.append("severity_level = %s")
            params.append(severity)

        if hours:
            conditions.append("detected_at >= DATE_SUB(NOW(), INTERVAL %s HOUR)")
            params.append(hours)

        where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""

        query = f"""
            SELECT * FROM dmn_dropout_events
            {where_clause}
            ORDER BY detected_at DESC
            LIMIT 1000
        """

        return self.execute_query(query, tuple(params))

    def get_session_dropout_events(self, session_id):
        """Get dropout events for a session"""
        query = """
            SELECT * FROM dmn_dropout_events
            WHERE session_id = %s
            ORDER BY detected_at DESC
        """

        return self.execute_query(query, (session_id,))

    # ========================================================================
    # Problem Tracking
    # ========================================================================

    def get_average_problem_duration(self, session_id):
        """Get average problem duration for session"""
        query = """
            SELECT AVG(CAST(JSON_EXTRACT(event_data, '$.duration') AS UNSIGNED)) as avg_duration
            FROM dmn_behavior_events
            WHERE session_id = %s
            AND event_type = 'problem_submitted'
        """

        results = self.execute_query(query, (session_id,))
        return results[0]['avg_duration'] / 1000 if results and results[0]['avg_duration'] else None

    def get_recent_problems(self, session_id, limit=5, offset=0):
        """Get recent problems for session"""
        query = """
            SELECT event_data
            FROM dmn_behavior_events
            WHERE session_id = %s
            AND event_type = 'problem_submitted'
            ORDER BY event_timestamp DESC
            LIMIT %s OFFSET %s
        """

        results = self.execute_query(query, (session_id, limit, offset))

        # Parse JSON event_data
        problems = []
        for row in results:
            event_data = json.loads(row['event_data']) if isinstance(row['event_data'], str) else row['event_data']
            problems.append(event_data)

        return problems

    # ========================================================================
    # Student & Course Sync
    # ========================================================================

    def sync_students(self, students):
        """Sync students from Moodle"""
        query = """
            INSERT INTO dmn_students
            (moodle_user_id, username, email, first_name, last_name, last_synced_at)
            VALUES (%s, %s, %s, %s, %s, NOW())
            ON DUPLICATE KEY UPDATE
            username = VALUES(username),
            email = VALUES(email),
            first_name = VALUES(first_name),
            last_name = VALUES(last_name),
            last_synced_at = NOW()
        """

        count = 0
        for student in students:
            self.execute_query(
                query,
                (
                    student['id'],
                    student.get('username'),
                    student.get('email'),
                    student.get('firstname'),
                    student.get('lastname')
                ),
                fetch=False
            )
            count += 1

        logger.info(f"Synced {count} students")
        return count

    def sync_courses(self, courses):
        """Sync courses from Moodle"""
        query = """
            INSERT INTO dmn_courses
            (moodle_course_id, course_name, course_code, last_synced_at)
            VALUES (%s, %s, %s, NOW())
            ON DUPLICATE KEY UPDATE
            course_name = VALUES(course_name),
            course_code = VALUES(course_code),
            last_synced_at = NOW()
        """

        count = 0
        for course in courses:
            self.execute_query(
                query,
                (
                    course['id'],
                    course.get('fullname'),
                    course.get('shortname')
                ),
                fetch=False
            )
            count += 1

        logger.info(f"Synced {count} courses")
        return count

    # ========================================================================
    # Alert Configuration
    # ========================================================================

    def get_alert_config(self, teacher_id, course_id=None):
        """Get alert configuration"""
        query = """
            SELECT * FROM dmn_alert_config
            WHERE teacher_moodle_id = %s
            AND (course_id = %s OR course_id IS NULL)
            AND is_enabled = TRUE
        """

        return self.execute_query(query, (teacher_id, course_id))

    def save_alert_config(self, config_data):
        """Save alert configuration"""
        query = """
            INSERT INTO dmn_alert_config
            (teacher_moodle_id, course_id, alert_type, severity_threshold, notification_method, is_enabled)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
            alert_type = VALUES(alert_type),
            severity_threshold = VALUES(severity_threshold),
            notification_method = VALUES(notification_method),
            is_enabled = VALUES(is_enabled)
        """

        self.execute_query(
            query,
            (
                config_data['teacher_id'],
                config_data.get('course_id'),
                config_data['alert_type'],
                config_data['severity_threshold'],
                config_data['notification_method'],
                config_data.get('is_enabled', True)
            ),
            fetch=False
        )

    # ========================================================================
    # System Configuration
    # ========================================================================

    def get_system_config(self, config_key):
        """Get system configuration value"""
        query = """
            SELECT config_value, config_type
            FROM dmn_system_config
            WHERE config_key = %s
        """

        results = self.execute_query(query, (config_key,))
        if results:
            value = results[0]['config_value']
            value_type = results[0]['config_type']

            # Convert to appropriate type
            if value_type == 'int':
                return int(value)
            elif value_type == 'float':
                return float(value)
            elif value_type == 'boolean':
                return value.lower() == 'true'
            elif value_type == 'json':
                return json.loads(value)
            else:
                return value

        return None
