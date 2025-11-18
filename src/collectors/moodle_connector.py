"""
Moodle Database Connector

This module provides read-only access to Moodle 3.7's MySQL database
to extract student activity data for impairment detection analysis.

IMPORTANT: This connector requires READ-ONLY database access.
Never write to the Moodle database to avoid data corruption.
"""

from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
from dataclasses import dataclass
import pymysql
from pymysql.cursors import DictCursor
import logging

logger = logging.getLogger(__name__)


@dataclass
class MoodleQuizAttempt:
    """Represents a Moodle quiz attempt."""
    attempt_id: int
    user_id: int
    quiz_id: int
    attempt_number: int
    time_start: datetime
    time_finish: Optional[datetime]
    sum_grades: Optional[float]
    questions: List['MoodleQuestionAttempt']


@dataclass
class MoodleQuestionAttempt:
    """Represents a single question attempt within a quiz."""
    question_id: int
    question_usage_id: int
    slot: int
    question_text: Optional[str]
    response_summary: Optional[str]
    right_answer: Optional[str]
    max_mark: float
    min_fraction: float
    time_created: datetime
    time_modified: datetime
    response_time_sec: int
    is_correct: bool


@dataclass
class MoodleActivityLog:
    """Represents a Moodle activity log entry."""
    log_id: int
    user_id: int
    course_id: int
    event_name: str
    component: str
    action: str
    target: str
    object_id: Optional[int]
    time_created: datetime


class MoodleConnector:
    """
    Connector to Moodle 3.7 MySQL database (read-only).

    Provides methods to extract student activity data for behavioral analysis.
    """

    def __init__(
        self,
        host: str,
        port: int,
        database: str,
        user: str,
        password: str,
        use_ssl: bool = True,
        connection_timeout: int = 10
    ):
        """
        Initialize Moodle database connector.

        Args:
            host: MySQL host address
            port: MySQL port (default 3306)
            database: Database name (typically 'moodle')
            user: Read-only database user
            password: Database password
            use_ssl: Use SSL connection
            connection_timeout: Connection timeout in seconds
        """
        self.config = {
            'host': host,
            'port': port,
            'database': database,
            'user': user,
            'password': password,
            'charset': 'utf8mb4',
            'cursorclass': DictCursor,
            'connect_timeout': connection_timeout,
            'read_timeout': 30,
            'autocommit': True  # Read-only, so no transactions needed
        }

        if use_ssl:
            self.config['ssl'] = {'ssl': True}

        self.connection = None
        logger.info(f"MoodleConnector initialized for {host}:{port}/{database}")

    def connect(self) -> None:
        """Establish connection to Moodle database."""
        try:
            self.connection = pymysql.connect(**self.config)
            logger.info("Successfully connected to Moodle database")
        except pymysql.Error as e:
            logger.error(f"Failed to connect to Moodle database: {e}")
            raise

    def disconnect(self) -> None:
        """Close database connection."""
        if self.connection:
            self.connection.close()
            self.connection = None
            logger.info("Disconnected from Moodle database")

    def __enter__(self):
        """Context manager entry."""
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.disconnect()

    def _execute_query(self, query: str, params: Optional[Dict[str, Any]] = None) -> List[Dict]:
        """
        Execute a SELECT query and return results.

        Args:
            query: SQL query string
            params: Query parameters (dict for named placeholders)

        Returns:
            List of result dictionaries
        """
        if not self.connection:
            raise RuntimeError("Not connected to database. Call connect() first.")

        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, params or {})
                results = cursor.fetchall()
                logger.debug(f"Query returned {len(results)} rows")
                return results
        except pymysql.Error as e:
            logger.error(f"Query execution failed: {e}")
            logger.error(f"Query: {query}")
            raise

    def get_quiz_attempts(
        self,
        user_id: int,
        since: datetime,
        course_id: Optional[int] = None,
        limit: int = 100
    ) -> List[MoodleQuizAttempt]:
        """
        Get quiz attempts for a user since a specific time.

        Args:
            user_id: Moodle user ID
            since: Only include attempts after this timestamp
            course_id: Optional course filter
            limit: Maximum number of attempts to return

        Returns:
            List of MoodleQuizAttempt objects
        """
        query = """
            SELECT
                qa.id AS attempt_id,
                qa.userid AS user_id,
                qa.quiz AS quiz_id,
                qa.attempt AS attempt_number,
                FROM_UNIXTIME(qa.timestart) AS time_start,
                FROM_UNIXTIME(qa.timefinish) AS time_finish,
                qa.sumgrades AS sum_grades,
                q.course AS course_id,
                q.name AS quiz_name
            FROM mdl_quiz_attempts qa
            JOIN mdl_quiz q ON q.id = qa.quiz
            WHERE qa.userid = %(user_id)s
              AND FROM_UNIXTIME(qa.timestart) >= %(since)s
        """

        params = {'user_id': user_id, 'since': since}

        if course_id:
            query += " AND q.course = %(course_id)s"
            params['course_id'] = course_id

        query += " ORDER BY qa.timestart DESC LIMIT %(limit)s"
        params['limit'] = limit

        results = self._execute_query(query, params)

        attempts = []
        for row in results:
            # Get question attempts for this quiz attempt
            questions = self._get_question_attempts(row['attempt_id'])

            attempt = MoodleQuizAttempt(
                attempt_id=row['attempt_id'],
                user_id=row['user_id'],
                quiz_id=row['quiz_id'],
                attempt_number=row['attempt_number'],
                time_start=row['time_start'],
                time_finish=row['time_finish'],
                sum_grades=row['sum_grades'],
                questions=questions
            )
            attempts.append(attempt)

        logger.info(f"Retrieved {len(attempts)} quiz attempts for user {user_id}")
        return attempts

    def _get_question_attempts(self, quiz_attempt_id: int) -> List[MoodleQuestionAttempt]:
        """
        Get individual question attempts for a quiz attempt.

        Args:
            quiz_attempt_id: Quiz attempt ID

        Returns:
            List of MoodleQuestionAttempt objects
        """
        query = """
            SELECT
                qa.questionid AS question_id,
                qa.questionusageid AS question_usage_id,
                qa.slot,
                qa.responsesummary AS response_summary,
                qa.rightanswer AS right_answer,
                qa.maxmark AS max_mark,
                qa.minfraction AS min_fraction,
                FROM_UNIXTIME(qa.timecreated) AS time_created,
                FROM_UNIXTIME(qa.timemodified) AS time_modified,
                UNIX_TIMESTAMP(FROM_UNIXTIME(qa.timemodified)) - UNIX_TIMESTAMP(FROM_UNIXTIME(qa.timecreated)) AS response_time_sec,
                qas.state AS state
            FROM mdl_question_attempts qa
            LEFT JOIN mdl_question_attempt_steps qas ON qas.questionattemptid = qa.id
            WHERE qa.questionusageid = (
                SELECT uniqueid FROM mdl_quiz_attempts WHERE id = %(attempt_id)s
            )
            ORDER BY qa.slot ASC
        """

        results = self._execute_query(query, {'attempt_id': quiz_attempt_id})

        questions = []
        for row in results:
            # Determine if answer was correct based on state
            is_correct = row['state'] in ('gradedright', 'mangrright')

            question = MoodleQuestionAttempt(
                question_id=row['question_id'],
                question_usage_id=row['question_usage_id'],
                slot=row['slot'],
                question_text=None,  # Can be fetched separately if needed
                response_summary=row['response_summary'],
                right_answer=row['right_answer'],
                max_mark=row['max_mark'],
                min_fraction=row['min_fraction'],
                time_created=row['time_created'],
                time_modified=row['time_modified'],
                response_time_sec=row['response_time_sec'],
                is_correct=is_correct
            )
            questions.append(question)

        return questions

    def get_activity_logs(
        self,
        user_id: int,
        since: datetime,
        course_id: Optional[int] = None,
        limit: int = 1000
    ) -> List[MoodleActivityLog]:
        """
        Get activity logs for a user.

        Args:
            user_id: Moodle user ID
            since: Only include logs after this timestamp
            course_id: Optional course filter
            limit: Maximum number of logs to return

        Returns:
            List of MoodleActivityLog objects
        """
        query = """
            SELECT
                id AS log_id,
                userid AS user_id,
                courseid AS course_id,
                eventname AS event_name,
                component,
                action,
                target,
                objectid AS object_id,
                FROM_UNIXTIME(timecreated) AS time_created
            FROM mdl_logstore_standard_log
            WHERE userid = %(user_id)s
              AND FROM_UNIXTIME(timecreated) >= %(since)s
        """

        params = {'user_id': user_id, 'since': since}

        if course_id:
            query += " AND courseid = %(course_id)s"
            params['course_id'] = course_id

        query += " ORDER BY timecreated ASC LIMIT %(limit)s"
        params['limit'] = limit

        results = self._execute_query(query, params)

        logs = []
        for row in results:
            log = MoodleActivityLog(
                log_id=row['log_id'],
                user_id=row['user_id'],
                course_id=row['course_id'],
                event_name=row['event_name'],
                component=row['component'],
                action=row['action'],
                target=row['target'],
                object_id=row['object_id'],
                time_created=row['time_created']
            )
            logs.append(log)

        logger.info(f"Retrieved {len(logs)} activity logs for user {user_id}")
        return logs

    def get_student_grades(
        self,
        user_id: int,
        since: datetime,
        course_id: Optional[int] = None
    ) -> List[Dict]:
        """
        Get grade history for a student.

        Args:
            user_id: Moodle user ID
            since: Only include grades after this timestamp
            course_id: Optional course filter

        Returns:
            List of grade dictionaries
        """
        query = """
            SELECT
                gg.id,
                gg.userid AS user_id,
                gg.itemid AS item_id,
                gi.itemname AS item_name,
                gi.itemtype AS item_type,
                gi.courseid AS course_id,
                gg.finalgrade AS final_grade,
                gg.rawgrademax AS raw_grade_max,
                FROM_UNIXTIME(gg.timemodified) AS time_modified
            FROM mdl_grade_grades gg
            JOIN mdl_grade_items gi ON gi.id = gg.itemid
            WHERE gg.userid = %(user_id)s
              AND FROM_UNIXTIME(gg.timemodified) >= %(since)s
        """

        params = {'user_id': user_id, 'since': since}

        if course_id:
            query += " AND gi.courseid = %(course_id)s"
            params['course_id'] = course_id

        query += " ORDER BY gg.timemodified ASC"

        results = self._execute_query(query, params)
        logger.info(f"Retrieved {len(results)} grades for user {user_id}")
        return results

    def get_user_info(self, user_id: int) -> Optional[Dict]:
        """
        Get basic user information.

        Args:
            user_id: Moodle user ID

        Returns:
            User info dictionary or None if not found
        """
        query = """
            SELECT
                id,
                username,
                firstname,
                lastname,
                email,
                FROM_UNIXTIME(firstaccess) AS first_access,
                FROM_UNIXTIME(lastaccess) AS last_access
            FROM mdl_user
            WHERE id = %(user_id)s
        """

        results = self._execute_query(query, {'user_id': user_id})
        return results[0] if results else None

    def get_course_teachers(self, course_id: int) -> List[Dict]:
        """
        Get list of teachers for a course.

        Args:
            course_id: Moodle course ID

        Returns:
            List of teacher user dictionaries
        """
        query = """
            SELECT DISTINCT
                u.id AS user_id,
                u.username,
                u.firstname,
                u.lastname,
                u.email,
                r.shortname AS role
            FROM mdl_user u
            JOIN mdl_role_assignments ra ON ra.userid = u.id
            JOIN mdl_context ctx ON ctx.id = ra.contextid
            JOIN mdl_course c ON c.id = ctx.instanceid
            JOIN mdl_role r ON r.id = ra.roleid
            WHERE c.id = %(course_id)s
              AND ctx.contextlevel = 50  -- CONTEXT_COURSE
              AND r.shortname IN ('editingteacher', 'teacher')
        """

        results = self._execute_query(query, {'course_id': course_id})
        logger.info(f"Found {len(results)} teachers for course {course_id}")
        return results

    def test_connection(self) -> bool:
        """
        Test database connection.

        Returns:
            True if connection successful, False otherwise
        """
        try:
            self.connect()
            result = self._execute_query("SELECT VERSION() as version")
            version = result[0]['version'] if result else 'Unknown'
            logger.info(f"Connection test successful. MySQL version: {version}")
            self.disconnect()
            return True
        except Exception as e:
            logger.error(f"Connection test failed: {e}")
            return False


# Example usage
if __name__ == "__main__":
    import os
    from dotenv import load_dotenv

    load_dotenv()

    # Initialize connector
    connector = MoodleConnector(
        host=os.getenv('MOODLE_DB_HOST', 'localhost'),
        port=int(os.getenv('MOODLE_DB_PORT', 3306)),
        database=os.getenv('MOODLE_DB_NAME', 'moodle'),
        user=os.getenv('MOODLE_DB_USER', 'readonly'),
        password=os.getenv('MOODLE_DB_PASSWORD', ''),
        use_ssl=True
    )

    # Test connection
    if connector.test_connection():
        print("✓ Moodle database connection successful")

        # Example: Get recent quiz attempts
        with connector:
            user_id = 12345
            since = datetime.now() - timedelta(days=7)

            attempts = connector.get_quiz_attempts(user_id, since)
            print(f"Found {len(attempts)} quiz attempts for user {user_id}")

            for attempt in attempts[:3]:
                print(f"  - Quiz {attempt.quiz_id}: {len(attempt.questions)} questions")
    else:
        print("✗ Connection failed")
