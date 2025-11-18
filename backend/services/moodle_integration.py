"""
Moodle LMS Integration Service
Moodle 3.7 (PHP 7.1.9, MySQL 5.7)와의 연동
"""

import requests
import pymysql
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import logging
from urllib.parse import urljoin

from backend.models.recurrence import RecurrenceRelation
from backend.services.recurrence_parser import MoodleFormulaConverter


logger = logging.getLogger(__name__)


@dataclass
class MoodleConfig:
    """Moodle 연동 설정"""
    # Web Services API
    moodle_url: str
    webservice_token: str

    # Direct Database (Optional)
    db_host: Optional[str] = None
    db_port: int = 3306
    db_user: Optional[str] = None
    db_password: Optional[str] = None
    db_name: str = "moodle"

    # 설정
    timeout: int = 30
    verify_ssl: bool = True


class MoodleClient:
    """Moodle Web Services API 클라이언트"""

    def __init__(self, config: MoodleConfig):
        self.config = config
        self.session = requests.Session()
        self.session.verify = config.verify_ssl

    def _call_api(
        self,
        function: str,
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Moodle Web Services API 호출

        Args:
            function: 함수 이름 (예: 'core_course_get_courses')
            params: 파라미터

        Returns:
            API 응답 (JSON)
        """
        endpoint = urljoin(self.config.moodle_url, '/webservice/rest/server.php')

        request_params = {
            'wstoken': self.config.webservice_token,
            'wsfunction': function,
            'moodlewsrestformat': 'json'
        }

        if params:
            request_params.update(params)

        try:
            response = self.session.get(
                endpoint,
                params=request_params,
                timeout=self.config.timeout
            )
            response.raise_for_status()

            data = response.json()

            # 에러 확인
            if isinstance(data, dict) and 'exception' in data:
                raise MoodleAPIError(
                    data.get('message', 'Unknown Moodle API error'),
                    data.get('errorcode', 'unknown')
                )

            return data

        except requests.RequestException as e:
            logger.error(f"Moodle API request failed: {e}")
            raise MoodleAPIError(f"Request failed: {str(e)}")

    def get_courses(self) -> List[Dict[str, Any]]:
        """코스 목록 조회"""
        try:
            return self._call_api('core_course_get_courses')
        except Exception as e:
            logger.error(f"Failed to get courses: {e}")
            return []

    def get_course_contents(self, course_id: int) -> List[Dict[str, Any]]:
        """코스 내용 조회 (섹션, 모듈 포함)"""
        try:
            return self._call_api(
                'core_course_get_contents',
                {'courseid': course_id}
            )
        except Exception as e:
            logger.error(f"Failed to get course contents for course {course_id}: {e}")
            return []

    def get_quiz_questions(self, quiz_id: int) -> List[Dict[str, Any]]:
        """퀴즈 문제 목록 조회"""
        try:
            # Moodle 3.7에서는 mod_quiz_get_quiz_questions 사용
            return self._call_api(
                'mod_quiz_get_quizzes_by_courses',
                {'courseids[]': [quiz_id]}
            )
        except Exception as e:
            logger.error(f"Failed to get quiz questions for quiz {quiz_id}: {e}")
            return []

    def get_user_grades(self, course_id: int, user_id: int) -> Dict[str, Any]:
        """학생 성적 조회"""
        try:
            return self._call_api(
                'gradereport_user_get_grade_items',
                {
                    'courseid': course_id,
                    'userid': user_id
                }
            )
        except Exception as e:
            logger.error(f"Failed to get grades for user {user_id} in course {course_id}: {e}")
            return {}


class MoodleDatabaseClient:
    """Moodle MySQL 데이터베이스 직접 연결 클라이언트"""

    def __init__(self, config: MoodleConfig):
        self.config = config
        self.connection = None

    def connect(self):
        """데이터베이스 연결"""
        try:
            self.connection = pymysql.connect(
                host=self.config.db_host,
                port=self.config.db_port,
                user=self.config.db_user,
                password=self.config.db_password,
                database=self.config.db_name,
                charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor
            )
            logger.info("Connected to Moodle database")
        except Exception as e:
            logger.error(f"Failed to connect to Moodle database: {e}")
            raise

    def disconnect(self):
        """데이터베이스 연결 종료"""
        if self.connection:
            self.connection.close()
            self.connection = None

    def __enter__(self):
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.disconnect()

    def get_calculated_questions(
        self,
        category_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Calculated 타입 문제 조회 (점화식 문제)

        Args:
            category_id: 문제 카테고리 ID (없으면 전체)

        Returns:
            문제 리스트
        """
        query = """
        SELECT
            q.id,
            q.category,
            q.name,
            q.questiontext,
            q.defaultmark,
            qc.formula,
            qc.correctanswerlength,
            qc.tolerance
        FROM mdl_question q
        INNER JOIN mdl_question_calculated qc ON q.id = qc.question
        WHERE q.qtype = 'calculated'
        """

        params = []
        if category_id is not None:
            query += " AND q.category = %s"
            params.append(category_id)

        query += " ORDER BY q.id DESC"

        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, params)
                return cursor.fetchall()
        except Exception as e:
            logger.error(f"Failed to get calculated questions: {e}")
            return []

    def get_student_attempts(
        self,
        quiz_id: int,
        student_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        학생의 퀴즈 시도 기록 조회

        Args:
            quiz_id: 퀴즈 ID
            student_id: 학생 ID (없으면 전체)

        Returns:
            시도 기록 리스트
        """
        query = """
        SELECT
            qa.id,
            qa.quiz,
            qa.userid,
            qa.attempt,
            qa.timestart,
            qa.timefinish,
            qa.state,
            qa.sumgrades,
            u.username,
            u.firstname,
            u.lastname
        FROM mdl_quiz_attempts qa
        INNER JOIN mdl_user u ON qa.userid = u.id
        WHERE qa.quiz = %s
        """

        params = [quiz_id]
        if student_id is not None:
            query += " AND qa.userid = %s"
            params.append(student_id)

        query += " ORDER BY qa.timestart DESC"

        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, params)
                return cursor.fetchall()
        except Exception as e:
            logger.error(f"Failed to get student attempts: {e}")
            return []

    def get_question_categories(self) -> List[Dict[str, Any]]:
        """문제 카테고리 목록 조회"""
        query = """
        SELECT
            id,
            name,
            parent,
            contextid,
            info
        FROM mdl_question_categories
        ORDER BY parent, name
        """

        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query)
                return cursor.fetchall()
        except Exception as e:
            logger.error(f"Failed to get question categories: {e}")
            return []


class MoodleIntegrationService:
    """Moodle 통합 서비스 - 고수준 API"""

    def __init__(self, config: MoodleConfig):
        self.config = config
        self.api_client = MoodleClient(config)
        self.db_client = MoodleDatabaseClient(config) if config.db_host else None
        self.formula_converter = MoodleFormulaConverter()

    def import_questions_from_course(
        self,
        course_id: int,
        category_id: Optional[int] = None
    ) -> List[RecurrenceRelation]:
        """
        Moodle 코스에서 점화식 문제 가져오기

        Args:
            course_id: 코스 ID
            category_id: 문제 카테고리 ID (optional)

        Returns:
            변환된 RecurrenceRelation 리스트
        """
        recurrences = []

        if self.db_client is None:
            logger.warning("Database client not configured, cannot import questions")
            return recurrences

        try:
            with self.db_client as db:
                # Calculated 타입 문제 조회
                questions = db.get_calculated_questions(category_id)

                for q in questions:
                    try:
                        # Moodle 수식 변환
                        formula = q.get('formula', '')
                        if not formula:
                            continue

                        recurrence = self.formula_converter.convert(formula)

                        # 메타데이터 설정
                        recurrence.id = str(q['id'])
                        recurrence.name = q.get('name', '')
                        recurrence.description = self._clean_html(q.get('questiontext', ''))
                        recurrence.moodle_question_id = q['id']

                        recurrences.append(recurrence)

                        logger.info(f"Imported question {q['id']}: {q.get('name', 'Untitled')}")

                    except Exception as e:
                        logger.error(f"Failed to convert question {q.get('id')}: {e}")
                        continue

        except Exception as e:
            logger.error(f"Failed to import questions from course {course_id}: {e}")

        return recurrences

    def sync_student_progress(
        self,
        quiz_id: int,
        student_id: int
    ) -> Dict[str, Any]:
        """
        학생의 진행 상황 동기화

        Args:
            quiz_id: 퀴즈 ID
            student_id: 학생 ID

        Returns:
            진행 상황 데이터
        """
        progress = {
            'student_id': student_id,
            'quiz_id': quiz_id,
            'attempts': [],
            'total_attempts': 0,
            'best_grade': 0.0,
            'avg_grade': 0.0
        }

        if self.db_client is None:
            return progress

        try:
            with self.db_client as db:
                attempts = db.get_student_attempts(quiz_id, student_id)

                grades = []
                for attempt in attempts:
                    progress['attempts'].append({
                        'attempt_number': attempt['attempt'],
                        'time_start': attempt['timestart'],
                        'time_finish': attempt['timefinish'],
                        'state': attempt['state'],
                        'grade': attempt.get('sumgrades', 0.0)
                    })

                    if attempt.get('sumgrades'):
                        grades.append(float(attempt['sumgrades']))

                progress['total_attempts'] = len(attempts)

                if grades:
                    progress['best_grade'] = max(grades)
                    progress['avg_grade'] = sum(grades) / len(grades)

        except Exception as e:
            logger.error(f"Failed to sync student progress: {e}")

        return progress

    def export_grade_to_moodle(
        self,
        course_id: int,
        student_id: int,
        grade: float,
        item_name: str = "Condition Morph Progress"
    ) -> bool:
        """
        성적을 Moodle로 내보내기

        Args:
            course_id: 코스 ID
            student_id: 학생 ID
            grade: 성적 (0-100)
            item_name: 성적 항목 이름

        Returns:
            성공 여부
        """
        try:
            # Moodle API를 통한 성적 업데이트
            # (실제 구현은 Moodle 버전에 따라 다름)
            result = self.api_client._call_api(
                'core_grades_update_grades',
                {
                    'source': 'condition_morph',
                    'courseid': course_id,
                    'component': 'mod_quiz',
                    'activityid': course_id,
                    'itemnumber': 0,
                    'grades': [
                        {
                            'studentid': student_id,
                            'grade': grade
                        }
                    ]
                }
            )

            logger.info(f"Exported grade {grade} for student {student_id} to Moodle")
            return True

        except Exception as e:
            logger.error(f"Failed to export grade to Moodle: {e}")
            return False

    def _clean_html(self, html_text: str) -> str:
        """HTML 태그 제거"""
        import re
        # 간단한 HTML 태그 제거
        text = re.sub(r'<[^>]+>', '', html_text)
        text = text.strip()
        return text

    def get_course_list(self) -> List[Dict[str, Any]]:
        """코스 목록 조회"""
        try:
            courses = self.api_client.get_courses()
            return [
                {
                    'id': c.get('id'),
                    'fullname': c.get('fullname'),
                    'shortname': c.get('shortname'),
                    'category': c.get('category')
                }
                for c in courses
            ]
        except Exception as e:
            logger.error(f"Failed to get course list: {e}")
            return []


class MoodleAPIError(Exception):
    """Moodle API 에러"""

    def __init__(self, message: str, error_code: str = "unknown"):
        super().__init__(message)
        self.error_code = error_code
