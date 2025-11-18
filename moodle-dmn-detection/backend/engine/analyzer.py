"""
Behavior Analyzer
Analyzes student behavior patterns and calculates engagement scores
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any

logger = logging.getLogger('dmn_api.analyzer')


class BehaviorAnalyzer:
    """Analyzes student behavior and engagement"""

    def __init__(self, config, db):
        self.config = config
        self.db = db

    def calculate_engagement_score(self, session_id: int) -> float:
        """
        Calculate engagement score for a session

        Returns:
            float: Engagement score from 0 to 1
        """
        session = self.db.get_session(session_id)
        if not session:
            return 0.0

        # Get session data
        total_duration = session.get('total_duration_seconds', 0)
        active_duration = session.get('active_duration_seconds', 0)
        dropout_count = session.get('dropout_event_count', 0)

        if total_duration == 0:
            return 0.0

        # Calculate time-based score
        time_score = active_duration / total_duration if total_duration > 0 else 0

        # Calculate dropout penalty
        dropout_penalty = min(dropout_count * 0.1, 0.5)

        # Calculate accuracy score (if problems exist)
        accuracy_score = self._calculate_accuracy_score(session_id)

        # Weighted combination
        weights = self.db.get_system_config('engagement_score_weights')
        if not weights:
            weights = {
                'active_time': 0.4,
                'accuracy': 0.3,
                'response_pattern': 0.2,
                'dropout_events': 0.1
            }

        engagement_score = (
            time_score * weights.get('active_time', 0.4) +
            accuracy_score * weights.get('accuracy', 0.3) -
            dropout_penalty * weights.get('dropout_events', 0.1)
        )

        # Clamp to [0, 1]
        engagement_score = max(0.0, min(1.0, engagement_score))

        return round(engagement_score, 3)

    def _calculate_accuracy_score(self, session_id: int) -> float:
        """Calculate accuracy score from problem attempts"""
        problems = self.db.get_recent_problems(session_id, limit=100)

        if not problems:
            return 0.5  # Neutral score if no problems

        correct_count = sum(1 for p in problems if p.get('isCorrect', False))
        accuracy = correct_count / len(problems)

        return accuracy

    def get_student_engagement(self, student_id: int, course_id: int = None) -> Dict:
        """Get student engagement data"""
        # Get current active session
        query = """
            SELECT * FROM dmn_learning_sessions
            WHERE student_id = %s
            AND session_end IS NULL
        """

        if course_id:
            query += " AND course_id = %s"
            active_sessions = self.db.execute_query(query, (student_id, course_id))
        else:
            active_sessions = self.db.execute_query(query, (student_id,))

        current_session = active_sessions[0] if active_sessions else None

        # Get today's dropout events
        today = datetime.now().date()
        dropout_events_today = self.db.get_dropout_events(
            student_id=student_id,
            course_id=course_id,
            start_date=today
        )

        # Get recent engagement stats
        stats_query = """
            SELECT AVG(average_engagement_score) as avg_score,
                   SUM(dropout_event_count) as total_dropouts
            FROM dmn_engagement_stats
            WHERE student_id = %s
            AND stat_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        """

        if course_id:
            stats_query += " AND course_id = %s"
            stats = self.db.execute_query(stats_query, (student_id, course_id))
        else:
            stats = self.db.execute_query(stats_query, (student_id,))

        avg_stats = stats[0] if stats else {}

        return {
            'student_id': student_id,
            'engagement_score': current_session.get('engagement_score', 0) if current_session else 0,
            'dropout_events_today': len(dropout_events_today),
            'average_focus_time': '0 minutes',  # TODO: Calculate
            'last_dropout': dropout_events_today[0].get('detected_at') if dropout_events_today else None,
            'weekly_average_engagement': float(avg_stats.get('avg_score', 0) or 0),
            'weekly_dropout_count': int(avg_stats.get('total_dropouts', 0) or 0)
        }

    def get_at_risk_students(self, teacher_id: int, course_id: int = None) -> List[Dict]:
        """Get students at risk of dropping out"""
        # Students with engagement score < 0.5 in current session
        query = """
            SELECT s.id, s.username, s.first_name, s.last_name,
                   ls.engagement_score, ls.session_start,
                   COUNT(de.id) as recent_dropouts
            FROM dmn_students s
            INNER JOIN dmn_learning_sessions ls ON s.id = ls.student_id
            INNER JOIN dmn_courses c ON ls.course_id = c.id
            LEFT JOIN dmn_dropout_events de ON ls.id = de.session_id
                AND de.detected_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
            WHERE ls.session_end IS NULL
            AND ls.engagement_score < 0.5
        """

        params = []

        if course_id:
            query += " AND c.id = %s"
            params.append(course_id)

        query += """
            GROUP BY s.id, s.username, s.first_name, s.last_name,
                     ls.engagement_score, ls.session_start
            ORDER BY ls.engagement_score ASC
            LIMIT 20
        """

        return self.db.execute_query(query, tuple(params))

    def get_course_statistics(self, course_id: int) -> Dict:
        """Get course-level statistics"""
        # Active students count
        active_query = """
            SELECT COUNT(DISTINCT student_id) as active_students
            FROM dmn_learning_sessions
            WHERE course_id = %s
            AND session_end IS NULL
        """

        active_result = self.db.execute_query(active_query, (course_id,))
        active_students = active_result[0].get('active_students', 0) if active_result else 0

        # Today's statistics
        stats_query = """
            SELECT AVG(average_engagement_score) as avg_engagement,
                   SUM(dropout_event_count) as total_dropouts
            FROM dmn_engagement_stats
            WHERE course_id = %s
            AND stat_date = CURDATE()
        """

        stats_result = self.db.execute_query(stats_query, (course_id,))
        stats = stats_result[0] if stats_result else {}

        return {
            'course_id': course_id,
            'active_students': active_students,
            'average_engagement': float(stats.get('avg_engagement', 0) or 0),
            'total_dropouts_today': int(stats.get('total_dropouts', 0) or 0)
        }
