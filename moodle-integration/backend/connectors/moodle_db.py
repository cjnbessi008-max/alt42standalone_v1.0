"""
Moodle MySQL 데이터베이스 커넥터
Moodle 3.7의 MySQL 5.7 데이터베이스에 직접 연결하여 데이터 추출
"""
import logging
from datetime import datetime
from typing import List, Dict, Optional, Any
from contextlib import contextmanager
import pymysql
from pymysql.cursors import DictCursor
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from ..models.schemas import MoodleConfig

logger = logging.getLogger(__name__)


class MoodleDBConnector:
    """Moodle 데이터베이스 커넥터"""

    # Moodle 3.7 테이블 이름 (기본 prefix: mdl_)
    TABLE_COURSE = "mdl_course"
    TABLE_USER = "mdl_user"
    TABLE_QUIZ = "mdl_quiz"
    TABLE_QUESTION = "mdl_question"
    TABLE_QUESTION_ATTEMPTS = "mdl_question_attempts"
    TABLE_QUIZ_ATTEMPTS = "mdl_quiz_attempts"
    TABLE_COURSE_MODULES = "mdl_course_modules"
    TABLE_QUIZ_GRADES = "mdl_quiz_grades"
    TABLE_USER_ENROLMENTS = "mdl_user_enrolments"
    TABLE_ENROL = "mdl_enrol"

    def __init__(self, config: MoodleConfig):
        """
        Args:
            config: Moodle 연결 설정
        """
        self.config = config
        self.connection_string = (
            f"mysql+pymysql://{config.db_user}:{config.db_password}"
            f"@{config.db_host}:{config.db_port}/{config.db_name}"
            f"?charset=utf8mb4"
        )
        self.engine = None
        self.session_factory = None
        self._initialize_engine()

    def _initialize_engine(self):
        """SQLAlchemy 엔진 초기화"""
        try:
            self.engine = create_engine(
                self.connection_string,
                pool_pre_ping=True,  # 연결 유효성 체크
                pool_recycle=3600,   # 1시간마다 연결 재생성
                echo=False,
            )
            self.session_factory = sessionmaker(bind=self.engine)
            logger.info("Moodle DB 연결 초기화 성공")
        except Exception as e:
            logger.error(f"Moodle DB 연결 실패: {e}")
            raise

    @contextmanager
    def get_connection(self):
        """PyMySQL 연결 컨텍스트 매니저"""
        conn = pymysql.connect(
            host=self.config.db_host,
            port=self.config.db_port,
            user=self.config.db_user,
            password=self.config.db_password,
            database=self.config.db_name,
            charset='utf8mb4',
            cursorclass=DictCursor
        )
        try:
            yield conn
        finally:
            conn.close()

    @contextmanager
    def get_session(self) -> Session:
        """SQLAlchemy 세션 컨텍스트 매니저"""
        session = self.session_factory()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    def test_connection(self) -> bool:
        """연결 테스트"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT VERSION()")
                    version = cursor.fetchone()
                    logger.info(f"Moodle DB 연결 성공. MySQL 버전: {version}")
                    return True
        except Exception as e:
            logger.error(f"Moodle DB 연결 테스트 실패: {e}")
            return False

    # ========================================================================
    # 코스 데이터 추출
    # ========================================================================

    def get_courses(self, course_ids: Optional[List[int]] = None) -> List[Dict[str, Any]]:
        """
        코스 목록 조회

        Args:
            course_ids: 특정 코스 ID 리스트 (None이면 모든 코스)

        Returns:
            코스 정보 리스트
        """
        query = f"""
            SELECT
                id,
                fullname,
                shortname,
                category,
                FROM_UNIXTIME(startdate) as startdate,
                FROM_UNIXTIME(enddate) as enddate,
                visible,
                FROM_UNIXTIME(timecreated) as created_at,
                FROM_UNIXTIME(timemodified) as modified_at
            FROM {self.TABLE_COURSE}
            WHERE visible = 1
        """

        if course_ids:
            placeholders = ','.join(['%s'] * len(course_ids))
            query += f" AND id IN ({placeholders})"

        query += " ORDER BY fullname"

        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                if course_ids:
                    cursor.execute(query, course_ids)
                else:
                    cursor.execute(query)
                courses = cursor.fetchall()

        logger.info(f"코스 {len(courses)}개 조회 완료")
        return courses

    # ========================================================================
    # 학생 데이터 추출
    # ========================================================================

    def get_course_students(self, course_id: int) -> List[Dict[str, Any]]:
        """
        특정 코스의 학생 목록 조회

        Args:
            course_id: 코스 ID

        Returns:
            학생 정보 리스트
        """
        query = f"""
            SELECT DISTINCT
                u.id,
                u.username,
                u.firstname,
                u.lastname,
                u.email,
                FROM_UNIXTIME(u.timecreated) as created_at,
                FROM_UNIXTIME(ue.timecreated) as enrolled_at
            FROM {self.TABLE_USER} u
            JOIN {self.TABLE_USER_ENROLMENTS} ue ON ue.userid = u.id
            JOIN {self.TABLE_ENROL} e ON e.id = ue.enrolid
            WHERE e.courseid = %s
                AND u.deleted = 0
                AND u.suspended = 0
            ORDER BY u.lastname, u.firstname
        """

        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, (course_id,))
                students = cursor.fetchall()

        logger.info(f"코스 {course_id}의 학생 {len(students)}명 조회 완료")
        return students

    # ========================================================================
    # 퀴즈 및 문제 데이터 추출
    # ========================================================================

    def get_course_quizzes(self, course_id: int) -> List[Dict[str, Any]]:
        """
        코스의 퀴즈 목록 조회

        Args:
            course_id: 코스 ID

        Returns:
            퀴즈 정보 리스트
        """
        query = f"""
            SELECT
                q.id,
                q.course,
                q.name,
                q.intro,
                q.timeopen,
                q.timeclose,
                q.timelimit,
                q.grade,
                q.sumgrades,
                FROM_UNIXTIME(q.timemodified) as modified_at
            FROM {self.TABLE_QUIZ} q
            WHERE q.course = %s
            ORDER BY q.timeopen DESC
        """

        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, (course_id,))
                quizzes = cursor.fetchall()

        logger.info(f"코스 {course_id}의 퀴즈 {len(quizzes)}개 조회 완료")
        return quizzes

    def get_quiz_questions(self, quiz_id: int) -> List[Dict[str, Any]]:
        """
        퀴즈의 문제 목록 조회

        Args:
            quiz_id: 퀴즈 ID

        Returns:
            문제 정보 리스트
        """
        query = f"""
            SELECT
                q.id,
                q.category,
                q.parent,
                q.name,
                q.questiontext,
                q.questiontextformat,
                q.generalfeedback,
                q.defaultmark,
                q.penalty,
                q.qtype,
                q.length,
                FROM_UNIXTIME(q.timecreated) as created_at,
                FROM_UNIXTIME(q.timemodified) as modified_at
            FROM {self.TABLE_QUESTION} q
            JOIN mdl_quiz_slots qs ON qs.questionid = q.id
            WHERE qs.quizid = %s
            ORDER BY qs.slot
        """

        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, (quiz_id,))
                questions = cursor.fetchall()

        logger.info(f"퀴즈 {quiz_id}의 문제 {len(questions)}개 조회 완료")
        return questions

    def get_all_course_questions(self, course_id: int) -> List[Dict[str, Any]]:
        """
        코스의 모든 문제 조회 (모든 퀴즈 포함)

        Args:
            course_id: 코스 ID

        Returns:
            문제 정보 리스트
        """
        query = f"""
            SELECT DISTINCT
                q.id,
                q.category,
                q.name,
                q.questiontext,
                q.qtype,
                q.defaultmark,
                quiz.id as quiz_id,
                quiz.name as quiz_name,
                FROM_UNIXTIME(q.timecreated) as created_at
            FROM {self.TABLE_QUESTION} q
            JOIN mdl_quiz_slots qs ON qs.questionid = q.id
            JOIN {self.TABLE_QUIZ} quiz ON quiz.id = qs.quizid
            WHERE quiz.course = %s
            ORDER BY quiz.id, qs.slot
        """

        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, (course_id,))
                questions = cursor.fetchall()

        logger.info(f"코스 {course_id}의 전체 문제 {len(questions)}개 조회 완료")
        return questions

    # ========================================================================
    # 학생 시도 데이터 추출
    # ========================================================================

    def get_student_attempts(
        self,
        student_id: int,
        course_id: Optional[int] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """
        학생의 문제 풀이 시도 조회

        Args:
            student_id: 학생 ID
            course_id: 코스 ID (선택)
            date_from: 시작 날짜
            date_to: 종료 날짜

        Returns:
            시도 정보 리스트
        """
        query = f"""
            SELECT
                qa.id as attempt_id,
                qa.questionid,
                qa.questionusageid,
                qa.slot,
                qa.behaviour,
                qa.questionsummary,
                qa.responsesummary,
                qa.rightanswer,
                qa.maxmark,
                qa.minfraction,
                qa.maxfraction,
                qa.flagged,
                FROM_UNIXTIME(qa.timemodified) as submitted_at,

                qz.id as quiz_id,
                qz.name as quiz_name,
                qz.course as course_id,

                qza.userid,
                qza.attempt as attempt_number,
                FROM_UNIXTIME(qza.timestart) as started_at,
                FROM_UNIXTIME(qza.timefinish) as finished_at,
                qza.sumgrades as total_score,

                q.questiontext,
                q.qtype,
                q.defaultmark

            FROM {self.TABLE_QUESTION_ATTEMPTS} qa
            JOIN {self.TABLE_QUIZ_ATTEMPTS} qza ON qa.questionusageid = qza.uniqueid
            JOIN {self.TABLE_QUIZ} qz ON qza.quiz = qz.id
            JOIN {self.TABLE_QUESTION} q ON qa.questionid = q.id
            WHERE qza.userid = %s
                AND qza.state = 'finished'
        """

        params = [student_id]

        if course_id:
            query += " AND qz.course = %s"
            params.append(course_id)

        if date_from:
            query += " AND FROM_UNIXTIME(qza.timefinish) >= %s"
            params.append(date_from)

        if date_to:
            query += " AND FROM_UNIXTIME(qza.timefinish) <= %s"
            params.append(date_to)

        query += " ORDER BY qza.timefinish DESC"

        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, params)
                attempts = cursor.fetchall()

        logger.info(f"학생 {student_id}의 시도 {len(attempts)}개 조회 완료")
        return attempts

    def get_question_attempts(
        self,
        question_id: int,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        특정 문제에 대한 모든 학생의 시도 조회

        Args:
            question_id: 문제 ID
            limit: 최대 조회 개수

        Returns:
            시도 정보 리스트
        """
        query = f"""
            SELECT
                qa.id as attempt_id,
                qza.userid as student_id,
                u.username,
                u.firstname,
                u.lastname,
                qa.questionsummary,
                qa.responsesummary,
                qa.rightanswer,
                qa.maxmark,
                qza.attempt as attempt_number,
                FROM_UNIXTIME(qza.timestart) as started_at,
                FROM_UNIXTIME(qza.timefinish) as finished_at,
                (UNIX_TIMESTAMP(qza.timefinish) - UNIX_TIMESTAMP(qza.timestart)) as time_spent_seconds
            FROM {self.TABLE_QUESTION_ATTEMPTS} qa
            JOIN {self.TABLE_QUIZ_ATTEMPTS} qza ON qa.questionusageid = qza.uniqueid
            JOIN {self.TABLE_USER} u ON qza.userid = u.id
            WHERE qa.questionid = %s
                AND qza.state = 'finished'
            ORDER BY qza.timefinish DESC
        """

        params = [question_id]

        if limit:
            query += " LIMIT %s"
            params.append(limit)

        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, params)
                attempts = cursor.fetchall()

        logger.info(f"문제 {question_id}의 시도 {len(attempts)}개 조회 완료")
        return attempts

    # ========================================================================
    # 성적 데이터 추출
    # ========================================================================

    def get_student_grades(self, student_id: int, course_id: int) -> List[Dict[str, Any]]:
        """
        학생의 퀴즈 성적 조회

        Args:
            student_id: 학생 ID
            course_id: 코스 ID

        Returns:
            성적 정보 리스트
        """
        query = f"""
            SELECT
                qg.quiz as quiz_id,
                qz.name as quiz_name,
                qg.userid as student_id,
                qg.grade,
                qg.timemodified,
                qz.grade as max_grade,
                (qg.grade / qz.grade * 100) as percentage
            FROM {self.TABLE_QUIZ_GRADES} qg
            JOIN {self.TABLE_QUIZ} qz ON qg.quiz = qz.id
            WHERE qg.userid = %s
                AND qz.course = %s
            ORDER BY qg.timemodified DESC
        """

        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, (student_id, course_id))
                grades = cursor.fetchall()

        logger.info(f"학생 {student_id}의 성적 {len(grades)}개 조회 완료")
        return grades

    # ========================================================================
    # 통계 데이터
    # ========================================================================

    def get_course_statistics(self, course_id: int) -> Dict[str, Any]:
        """
        코스 전체 통계 조회

        Args:
            course_id: 코스 ID

        Returns:
            통계 정보
        """
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                # 학생 수
                cursor.execute(f"""
                    SELECT COUNT(DISTINCT ue.userid) as student_count
                    FROM {self.TABLE_USER_ENROLMENTS} ue
                    JOIN {self.TABLE_ENROL} e ON e.id = ue.enrolid
                    JOIN {self.TABLE_USER} u ON u.id = ue.userid
                    WHERE e.courseid = %s
                        AND u.deleted = 0
                        AND u.suspended = 0
                """, (course_id,))
                student_count = cursor.fetchone()['student_count']

                # 퀴즈 수
                cursor.execute(f"""
                    SELECT COUNT(*) as quiz_count
                    FROM {self.TABLE_QUIZ}
                    WHERE course = %s
                """, (course_id,))
                quiz_count = cursor.fetchone()['quiz_count']

                # 문제 수
                cursor.execute(f"""
                    SELECT COUNT(DISTINCT q.id) as question_count
                    FROM {self.TABLE_QUESTION} q
                    JOIN mdl_quiz_slots qs ON qs.questionid = q.id
                    JOIN {self.TABLE_QUIZ} qz ON qz.id = qs.quizid
                    WHERE qz.course = %s
                """, (course_id,))
                question_count = cursor.fetchone()['question_count']

                # 전체 시도 수
                cursor.execute(f"""
                    SELECT COUNT(*) as attempt_count
                    FROM {self.TABLE_QUIZ_ATTEMPTS} qza
                    JOIN {self.TABLE_QUIZ} qz ON qz.id = qza.quiz
                    WHERE qz.course = %s
                        AND qza.state = 'finished'
                """, (course_id,))
                attempt_count = cursor.fetchone()['attempt_count']

        stats = {
            'course_id': course_id,
            'student_count': student_count,
            'quiz_count': quiz_count,
            'question_count': question_count,
            'attempt_count': attempt_count,
            'retrieved_at': datetime.utcnow()
        }

        logger.info(f"코스 {course_id} 통계: {stats}")
        return stats
