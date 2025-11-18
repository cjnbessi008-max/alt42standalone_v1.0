"""
Moodle LMS Database Connector
Connects to Moodle 3.7 MySQL 5.7 database and extracts student performance data
"""

import mysql.connector
from mysql.connector import Error
import json
import logging
from typing import List, Dict, Optional
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MoodleConnector:
    """Handles connection and data extraction from Moodle LMS database"""

    def __init__(self, config_path: str = "../config/database.config.json"):
        """Initialize Moodle connector with database configuration"""
        with open(config_path, 'r') as f:
            config = json.load(f)

        self.db_config = config['moodle']
        self.connection = None
        self.cursor = None

    def connect(self) -> bool:
        """Establish connection to Moodle database"""
        try:
            self.connection = mysql.connector.connect(
                host=self.db_config['host'],
                port=self.db_config['port'],
                database=self.db_config['database'],
                user=self.db_config['user'],
                password=self.db_config['password'],
                charset=self.db_config['charset']
            )

            if self.connection.is_connected():
                self.cursor = self.connection.cursor(dictionary=True)
                db_info = self.connection.get_server_info()
                logger.info(f"Connected to Moodle MySQL Server version {db_info}")
                return True

        except Error as e:
            logger.error(f"Error connecting to Moodle database: {e}")
            return False

    def disconnect(self):
        """Close database connection"""
        if self.connection and self.connection.is_connected():
            if self.cursor:
                self.cursor.close()
            self.connection.close()
            logger.info("Moodle database connection closed")

    def get_course_students(self, course_id: int) -> List[Dict]:
        """
        Get all students enrolled in a specific course

        Args:
            course_id: Moodle course ID

        Returns:
            List of student dictionaries with user information
        """
        query = """
            SELECT
                u.id as user_id,
                u.username,
                u.firstname,
                u.lastname,
                u.email,
                ue.timecreated as enrollment_date
            FROM mdl_user u
            JOIN mdl_user_enrolments ue ON u.id = ue.userid
            JOIN mdl_enrol e ON ue.enrolid = e.id
            WHERE e.courseid = %s
            AND u.deleted = 0
            ORDER BY u.lastname, u.firstname
        """

        try:
            self.cursor.execute(query, (course_id,))
            students = self.cursor.fetchall()
            logger.info(f"Retrieved {len(students)} students from course {course_id}")
            return students
        except Error as e:
            logger.error(f"Error fetching students: {e}")
            return []

    def get_quiz_attempts(self, course_id: int, user_id: Optional[int] = None) -> List[Dict]:
        """
        Get quiz attempt data for students in a course

        Args:
            course_id: Moodle course ID
            user_id: Optional specific user ID

        Returns:
            List of quiz attempt records with detailed information
        """
        query = """
            SELECT
                qa.id as attempt_id,
                qa.userid as user_id,
                q.id as quiz_id,
                q.name as quiz_name,
                qa.attempt as attempt_number,
                qa.timestart,
                qa.timefinish,
                qa.sumgrades as score,
                q.sumgrades as max_score,
                (qa.sumgrades / q.sumgrades * 100) as percentage,
                (qa.timefinish - qa.timestart) as time_taken_seconds
            FROM mdl_quiz_attempts qa
            JOIN mdl_quiz q ON qa.quiz = q.id
            WHERE q.course = %s
            AND qa.state = 'finished'
        """

        params = [course_id]
        if user_id:
            query += " AND qa.userid = %s"
            params.append(user_id)

        query += " ORDER BY qa.userid, qa.timestart"

        try:
            self.cursor.execute(query, params)
            attempts = self.cursor.fetchall()
            logger.info(f"Retrieved {len(attempts)} quiz attempts")
            return attempts
        except Error as e:
            logger.error(f"Error fetching quiz attempts: {e}")
            return []

    def get_assignment_submissions(self, course_id: int, user_id: Optional[int] = None) -> List[Dict]:
        """
        Get assignment submission data for students

        Args:
            course_id: Moodle course ID
            user_id: Optional specific user ID

        Returns:
            List of assignment submission records
        """
        query = """
            SELECT
                asub.id as submission_id,
                asub.userid as user_id,
                a.id as assignment_id,
                a.name as assignment_name,
                asub.timecreated as submission_time,
                asub.timemodified as last_modified,
                ag.grade,
                a.grade as max_grade,
                (ag.grade / a.grade * 100) as percentage,
                asub.attemptnumber
            FROM mdl_assign_submission asub
            JOIN mdl_assign a ON asub.assignment = a.id
            LEFT JOIN mdl_assign_grades ag ON asub.assignment = ag.assignment
                AND asub.userid = ag.userid
            WHERE a.course = %s
            AND asub.status = 'submitted'
        """

        params = [course_id]
        if user_id:
            query += " AND asub.userid = %s"
            params.append(user_id)

        query += " ORDER BY asub.userid, asub.timecreated"

        try:
            self.cursor.execute(query, params)
            submissions = self.cursor.fetchall()
            logger.info(f"Retrieved {len(submissions)} assignment submissions")
            return submissions
        except Error as e:
            logger.error(f"Error fetching assignments: {e}")
            return []

    def get_activity_logs(self, course_id: int, user_id: Optional[int] = None,
                          limit: int = 1000) -> List[Dict]:
        """
        Get user activity logs (clicks, views, interactions)

        Args:
            course_id: Moodle course ID
            user_id: Optional specific user ID
            limit: Maximum number of records to retrieve

        Returns:
            List of activity log records
        """
        query = """
            SELECT
                l.id as log_id,
                l.userid as user_id,
                l.timecreated,
                l.eventname,
                l.component,
                l.action,
                l.target,
                l.objecttable,
                l.objectid,
                l.contextlevel,
                l.contextinstanceid
            FROM mdl_logstore_standard_log l
            WHERE l.courseid = %s
        """

        params = [course_id]
        if user_id:
            query += " AND l.userid = %s"
            params.append(user_id)

        query += f" ORDER BY l.timecreated DESC LIMIT {limit}"

        try:
            self.cursor.execute(query, params)
            logs = self.cursor.fetchall()
            logger.info(f"Retrieved {len(logs)} activity log records")
            return logs
        except Error as e:
            logger.error(f"Error fetching activity logs: {e}")
            return []

    def get_question_attempts(self, quiz_attempt_id: int) -> List[Dict]:
        """
        Get individual question attempts within a quiz attempt

        Args:
            quiz_attempt_id: Quiz attempt ID

        Returns:
            List of question attempt records with detailed timing and responses
        """
        query = """
            SELECT
                qas.id as step_id,
                qa.id as question_attempt_id,
                qa.questionid,
                qas.sequencenumber,
                qas.state,
                qas.fraction as score_fraction,
                qas.timecreated,
                qas.userid as grader_id,
                qa.timemodified,
                qa.responsesummary,
                qa.rightanswer,
                q.qtype as question_type,
                q.name as question_name
            FROM mdl_question_attempt_steps qas
            JOIN mdl_question_attempts qa ON qas.questionattemptid = qa.id
            JOIN mdl_question q ON qa.questionid = q.id
            WHERE qa.questionusageid IN (
                SELECT uniqueid FROM mdl_quiz_attempts WHERE id = %s
            )
            ORDER BY qa.slot, qas.sequencenumber
        """

        try:
            self.cursor.execute(query, (quiz_attempt_id,))
            question_attempts = self.cursor.fetchall()
            logger.info(f"Retrieved {len(question_attempts)} question attempts")
            return question_attempts
        except Error as e:
            logger.error(f"Error fetching question attempts: {e}")
            return []

    def get_student_grades_summary(self, course_id: int) -> List[Dict]:
        """
        Get comprehensive grade summary for all students in a course

        Args:
            course_id: Moodle course ID

        Returns:
            List of student grade summaries
        """
        query = """
            SELECT
                u.id as user_id,
                u.firstname,
                u.lastname,
                gg.finalgrade as course_grade,
                gi.grademax as max_grade,
                (gg.finalgrade / gi.grademax * 100) as percentage,
                gg.timemodified as last_updated
            FROM mdl_user u
            JOIN mdl_user_enrolments ue ON u.id = ue.userid
            JOIN mdl_enrol e ON ue.enrolid = e.id
            LEFT JOIN mdl_grade_grades gg ON u.id = gg.userid
            LEFT JOIN mdl_grade_items gi ON gg.itemid = gi.id
            WHERE e.courseid = %s
            AND gi.itemtype = 'course'
            AND u.deleted = 0
            ORDER BY percentage DESC, u.lastname
        """

        try:
            self.cursor.execute(query, (course_id,))
            grades = self.cursor.fetchall()
            logger.info(f"Retrieved grade summary for {len(grades)} students")
            return grades
        except Error as e:
            logger.error(f"Error fetching grade summary: {e}")
            return []


# Example usage
if __name__ == "__main__":
    connector = MoodleConnector()

    if connector.connect():
        # Example: Get students from course ID 1
        students = connector.get_course_students(course_id=1)
        print(f"Found {len(students)} students")

        # Example: Get quiz attempts
        attempts = connector.get_quiz_attempts(course_id=1)
        print(f"Found {len(attempts)} quiz attempts")

        connector.disconnect()
