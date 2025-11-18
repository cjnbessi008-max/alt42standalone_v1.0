"""Service for extracting data from Moodle database"""
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from models.moodle_models import (
    User, Course, LogStandardLog, Quiz, QuizAttempt, QuizGrade,
    GradeGrade, GradeItem, Forum, ForumDiscussion, ForumPost,
    CourseModule, CourseModuleCompletion
)
from config import settings
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)


class MoodleDataService:
    """Service for extracting and processing Moodle data"""

    def __init__(self, db: Session):
        self.db = db
        self.session_gap_seconds = settings.SESSION_GAP_MINUTES * 60

    def get_student_basic_info(self, user_id: int) -> Optional[Dict]:
        """Get basic student information"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return None

        return {
            'id': user.id,
            'username': user.username,
            'firstname': user.firstname,
            'lastname': user.lastname,
            'email': user.email,
        }

    def get_course_info(self, course_id: int) -> Optional[Dict]:
        """Get course information"""
        course = self.db.query(Course).filter(Course.id == course_id).first()
        if not course:
            return None

        return {
            'id': course.id,
            'fullname': course.fullname,
            'shortname': course.shortname,
        }

    def get_enrolled_students(self, course_id: int) -> List[int]:
        """Get list of enrolled student IDs"""
        # This is a simplified query - in production, use proper enrollment tables
        logs = self.db.query(LogStandardLog.userid).filter(
            LogStandardLog.courseid == course_id
        ).distinct().all()

        return [log.userid for log in logs]

    def get_user_logs(
        self,
        user_id: int,
        course_id: Optional[int] = None,
        time_start: Optional[int] = None,
        time_end: Optional[int] = None
    ) -> List[Dict]:
        """Get user activity logs"""
        query = self.db.query(LogStandardLog).filter(
            LogStandardLog.userid == user_id
        )

        if course_id:
            query = query.filter(LogStandardLog.courseid == course_id)

        if time_start:
            query = query.filter(LogStandardLog.timecreated >= time_start)

        if time_end:
            query = query.filter(LogStandardLog.timecreated <= time_end)

        query = query.order_by(LogStandardLog.timecreated.asc())
        logs = query.all()

        return [
            {
                'id': log.id,
                'eventname': log.eventname,
                'component': log.component,
                'action': log.action,
                'target': log.target,
                'courseid': log.courseid,
                'timecreated': log.timecreated,
            }
            for log in logs
        ]

    def extract_learning_sessions(self, logs: List[Dict]) -> List[Dict]:
        """Extract learning sessions from logs"""
        if not logs:
            return []

        sessions = []
        current_session = None

        for log in logs:
            time_created = log['timecreated']

            if current_session is None:
                current_session = {
                    'start': time_created,
                    'end': time_created,
                    'duration': 0,
                    'activities': 1,
                }
            else:
                gap = time_created - current_session['end']

                if gap > self.session_gap_seconds:
                    # End current session
                    current_session['duration'] = current_session['end'] - current_session['start']
                    sessions.append(current_session)

                    # Start new session
                    current_session = {
                        'start': time_created,
                        'end': time_created,
                        'duration': 0,
                        'activities': 1,
                    }
                else:
                    current_session['end'] = time_created
                    current_session['activities'] += 1

        # Add last session
        if current_session:
            current_session['duration'] = current_session['end'] - current_session['start']
            sessions.append(current_session)

        return sessions

    def get_quiz_performance(
        self,
        user_id: int,
        course_id: Optional[int] = None,
        time_start: Optional[int] = None,
        time_end: Optional[int] = None
    ) -> Dict:
        """Get quiz performance data"""
        query = self.db.query(
            func.avg((QuizAttempt.sumgrades / Quiz.sumgrades) * 100).label('avg_grade'),
            func.count(QuizAttempt.id).label('attempts'),
            func.max((QuizAttempt.sumgrades / Quiz.sumgrades) * 100).label('max_grade'),
            func.min((QuizAttempt.sumgrades / Quiz.sumgrades) * 100).label('min_grade'),
        ).join(Quiz, QuizAttempt.quiz == Quiz.id).filter(
            QuizAttempt.userid == user_id,
            QuizAttempt.state == 'finished'
        )

        if course_id:
            query = query.filter(Quiz.course == course_id)

        if time_start:
            query = query.filter(QuizAttempt.timefinish >= time_start)

        if time_end:
            query = query.filter(QuizAttempt.timefinish <= time_end)

        result = query.first()

        return {
            'avg_grade': float(result.avg_grade) if result.avg_grade else 0.0,
            'attempts': int(result.attempts) if result.attempts else 0,
            'max_grade': float(result.max_grade) if result.max_grade else 0.0,
            'min_grade': float(result.min_grade) if result.min_grade else 0.0,
        }

    def get_quiz_attempts_detail(
        self,
        user_id: int,
        course_id: Optional[int] = None
    ) -> List[Dict]:
        """Get detailed quiz attempts for learning velocity calculation"""
        query = self.db.query(
            QuizAttempt.timefinish,
            ((QuizAttempt.sumgrades / Quiz.sumgrades) * 100).label('grade')
        ).join(Quiz, QuizAttempt.quiz == Quiz.id).filter(
            QuizAttempt.userid == user_id,
            QuizAttempt.state == 'finished',
            QuizAttempt.sumgrades.isnot(None)
        )

        if course_id:
            query = query.filter(Quiz.course == course_id)

        query = query.order_by(QuizAttempt.timefinish.asc())
        results = query.all()

        return [
            {'timestamp': r.timefinish, 'grade': float(r.grade)}
            for r in results
        ]

    def get_forum_participation(
        self,
        user_id: int,
        course_id: Optional[int] = None,
        time_start: Optional[int] = None,
        time_end: Optional[int] = None
    ) -> Dict:
        """Get forum participation metrics"""
        query = self.db.query(
            func.count(ForumPost.id).label('post_count')
        ).join(
            ForumDiscussion, ForumPost.discussion == ForumDiscussion.id
        ).join(
            Forum, ForumDiscussion.forum == Forum.id
        ).filter(
            ForumPost.userid == user_id
        )

        if course_id:
            query = query.filter(Forum.course == course_id)

        if time_start:
            query = query.filter(ForumPost.created >= time_start)

        if time_end:
            query = query.filter(ForumPost.created <= time_end)

        result = query.first()

        return {
            'post_count': int(result.post_count) if result.post_count else 0,
        }

    def get_resource_views(
        self,
        user_id: int,
        course_id: Optional[int] = None,
        time_start: Optional[int] = None,
        time_end: Optional[int] = None
    ) -> int:
        """Get count of resource views"""
        query = self.db.query(func.count(LogStandardLog.id)).filter(
            LogStandardLog.userid == user_id,
            LogStandardLog.action == 'viewed',
            LogStandardLog.target == 'course_module'
        )

        if course_id:
            query = query.filter(LogStandardLog.courseid == course_id)

        if time_start:
            query = query.filter(LogStandardLog.timecreated >= time_start)

        if time_end:
            query = query.filter(LogStandardLog.timecreated <= time_end)

        return query.scalar() or 0

    def get_completion_rate(self, user_id: int, course_id: int) -> float:
        """Get activity completion rate"""
        # Get total activities with completion enabled
        total_query = self.db.query(func.count(CourseModule.id)).filter(
            CourseModule.course == course_id,
            CourseModule.completion > 0
        )
        total = total_query.scalar() or 0

        if total == 0:
            return 0.0

        # Get completed activities
        completed_query = self.db.query(
            func.count(CourseModuleCompletion.id)
        ).join(
            CourseModule,
            CourseModuleCompletion.coursemoduleid == CourseModule.id
        ).filter(
            CourseModule.course == course_id,
            CourseModuleCompletion.userid == user_id,
            CourseModuleCompletion.completionstate > 0
        )
        completed = completed_query.scalar() or 0

        return round((completed / total) * 100, 2)

    def get_overall_grade(self, user_id: int, course_id: int) -> Optional[float]:
        """Get overall course grade"""
        query = self.db.query(
            func.avg((GradeGrade.finalgrade / GradeItem.grademax) * 100).label('grade')
        ).join(
            GradeItem, GradeGrade.itemid == GradeItem.id
        ).filter(
            GradeGrade.userid == user_id,
            GradeItem.courseid == course_id,
            GradeItem.itemtype == 'mod',
            GradeGrade.finalgrade.isnot(None)
        )

        result = query.first()
        return float(result.grade) if result and result.grade else None

    def get_all_student_grades(self, course_id: int) -> Dict[int, float]:
        """Get grades for all students in a course"""
        query = self.db.query(
            GradeGrade.userid,
            func.avg((GradeGrade.finalgrade / GradeItem.grademax) * 100).label('grade')
        ).join(
            GradeItem, GradeGrade.itemid == GradeItem.id
        ).filter(
            GradeItem.courseid == course_id,
            GradeItem.itemtype == 'mod',
            GradeGrade.finalgrade.isnot(None)
        ).group_by(GradeGrade.userid)

        results = query.all()
        return {int(r.userid): float(r.grade) for r in results}

    def analyze_time_of_day_patterns(self, logs: List[Dict]) -> Dict[str, float]:
        """Analyze activity patterns by time of day"""
        patterns = {'morning': 0, 'afternoon': 0, 'evening': 0, 'night': 0}
        total = len(logs)

        if total == 0:
            return patterns

        for log in logs:
            dt = datetime.fromtimestamp(log['timecreated'])
            hour = dt.hour

            if 6 <= hour < 12:
                patterns['morning'] += 1
            elif 12 <= hour < 18:
                patterns['afternoon'] += 1
            elif 18 <= hour < 22:
                patterns['evening'] += 1
            else:
                patterns['night'] += 1

        # Convert to percentages
        return {k: round((v / total) * 100, 2) for k, v in patterns.items()}

    def get_peak_performance_time(self, user_id: int, course_id: Optional[int] = None) -> str:
        """Determine peak performance time of day based on quiz scores"""
        query = self.db.query(
            func.hour(func.from_unixtime(QuizAttempt.timefinish)).label('hour'),
            func.avg((QuizAttempt.sumgrades / Quiz.sumgrades) * 100).label('avg_grade')
        ).join(Quiz, QuizAttempt.quiz == Quiz.id).filter(
            QuizAttempt.userid == user_id,
            QuizAttempt.state == 'finished'
        ).group_by('hour')

        if course_id:
            query = query.filter(Quiz.course == course_id)

        results = query.all()

        if not results:
            return 'afternoon'

        # Find hour with best average grade
        best_hour = max(results, key=lambda r: r.avg_grade).hour

        if 6 <= best_hour < 12:
            return 'morning'
        elif 12 <= best_hour < 18:
            return 'afternoon'
        elif 18 <= best_hour < 22:
            return 'evening'
        else:
            return 'night'
