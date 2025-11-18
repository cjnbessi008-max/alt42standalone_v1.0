"""Analysis service for student performance and top-tier routine modeling"""
from typing import Dict, List, Optional, Tuple
import numpy as np
from datetime import datetime, timedelta
from services.moodle_service import MoodleDataService
from services.ai_service import AIService
from config import settings
import logging

logger = logging.getLogger(__name__)


class AnalysisService:
    """Service for analyzing student performance and identifying top-tier routines"""

    def __init__(self, moodle_service: MoodleDataService, ai_service: AIService):
        self.moodle = moodle_service
        self.ai = ai_service

    def analyze_student_comprehensive(
        self,
        user_id: int,
        course_id: int,
        lookback_days: int = 90
    ) -> Dict:
        """Comprehensive analysis of a single student"""
        time_end = int(datetime.now().timestamp())
        time_start = int((datetime.now() - timedelta(days=lookback_days)).timestamp())

        # Get basic info
        student_info = self.moodle.get_student_basic_info(user_id)
        course_info = self.moodle.get_course_info(course_id)

        # Get activity logs
        logs = self.moodle.get_user_logs(user_id, course_id, time_start, time_end)

        # Extract sessions
        sessions = self.moodle.extract_learning_sessions(logs)

        # Calculate time metrics
        total_sessions = len(sessions)
        total_time = sum(s['duration'] for s in sessions) if sessions else 0
        avg_session_duration = (total_time / total_sessions / 60) if total_sessions > 0 else 0
        total_time_hours = total_time / 3600

        # Get quiz performance
        quiz_data = self.moodle.get_quiz_performance(user_id, course_id, time_start, time_end)

        # Get forum participation
        forum_data = self.moodle.get_forum_participation(user_id, course_id, time_start, time_end)

        # Get resource views
        resource_views = self.moodle.get_resource_views(user_id, course_id, time_start, time_end)

        # Get completion rate
        completion_rate = self.moodle.get_completion_rate(user_id, course_id)

        # Analyze time patterns
        time_patterns = self.moodle.analyze_time_of_day_patterns(logs)

        # Get peak performance time
        peak_time = self.moodle.get_peak_performance_time(user_id, course_id)

        # Calculate learning velocity
        velocity = self.calculate_learning_velocity(user_id, course_id)

        # Calculate sessions per week
        weeks = lookback_days / 7
        sessions_per_week = total_sessions / weeks if weeks > 0 else 0

        return {
            'userid': user_id,
            'student_info': student_info,
            'course_info': course_info,
            'total_sessions': total_sessions,
            'avg_session_duration': round(avg_session_duration, 2),
            'total_time_spent': round(total_time_hours, 2),
            'sessions_per_week': round(sessions_per_week, 2),
            'completion_rate': completion_rate,
            'avg_grade': quiz_data['avg_grade'],
            'quiz_attempts': quiz_data['attempts'],
            'max_quiz_grade': quiz_data['max_grade'],
            'forum_posts': forum_data['post_count'],
            'resource_views': resource_views,
            'activity_pattern': time_patterns,
            'peak_performance_time': peak_time,
            'learning_velocity': velocity,
            'lookback_days': lookback_days,
        }

    def analyze_top_performers(
        self,
        course_id: int,
        top_percentile: float = 10.0
    ) -> Dict:
        """Analyze patterns of top-performing students"""
        # Get all student grades
        all_grades = self.moodle.get_all_student_grades(course_id)

        if not all_grades:
            return self._get_empty_top_patterns(course_id)

        # Sort by grade
        sorted_students = sorted(all_grades.items(), key=lambda x: x[1], reverse=True)

        # Get top performers
        top_count = max(1, int(len(sorted_students) * (top_percentile / 100)))
        top_performers = sorted_students[:top_count]

        # Analyze each top performer
        top_performers_data = []
        for user_id, grade in top_performers:
            try:
                data = self.analyze_student_comprehensive(user_id, course_id)
                data['overall_grade'] = grade
                top_performers_data.append(data)
            except Exception as e:
                logger.warning(f"Could not analyze top performer {user_id}: {str(e)}")
                continue

        if not top_performers_data:
            return self._get_empty_top_patterns(course_id)

        # Calculate aggregate patterns
        avg_session_duration = np.mean([d['avg_session_duration'] for d in top_performers_data])
        avg_sessions_per_week = np.mean([d['sessions_per_week'] for d in top_performers_data])
        avg_grade = np.mean([d['overall_grade'] for d in top_performers_data])

        # Find most common study time
        time_preferences = {}
        for data in top_performers_data:
            peak = data['peak_performance_time']
            time_preferences[peak] = time_preferences.get(peak, 0) + 1

        most_common_time = max(time_preferences.items(), key=lambda x: x[1])[0] if time_preferences else 'afternoon'

        # Use AI to identify patterns
        ai_patterns = self.ai.analyze_learning_patterns(top_performers_data)

        # Combine statistical and AI-identified patterns
        patterns = self._merge_patterns(top_performers_data, ai_patterns)

        return {
            'courseid': course_id,
            'total_students': len(all_grades),
            'top_performers_count': len(top_performers_data),
            'avg_top_performer_grade': round(avg_grade, 2),
            'common_patterns': patterns,
            'optimal_study_duration': round(avg_session_duration, 2),
            'optimal_session_frequency': round(avg_sessions_per_week, 2),
            'recommended_time_of_day': most_common_time,
            'top_performers_data': top_performers_data,  # For detailed analysis
        }

    def generate_personalized_recommendations(
        self,
        user_id: int,
        course_id: int
    ) -> Dict:
        """Generate personalized thinking routine and recommendations"""
        # Get student's current performance
        student_data = self.analyze_student_comprehensive(user_id, course_id)

        # Get overall grade
        overall_grade = self.moodle.get_overall_grade(user_id, course_id)
        student_data['overall_grade'] = overall_grade or 0

        # Get top performer patterns
        top_patterns = self.analyze_top_performers(course_id, settings.TOP_PERFORMER_PERCENTILE)

        # Calculate performance percentile
        percentile = self.calculate_percentile(user_id, course_id)

        # Generate gap analysis
        gap_analysis = self.generate_gap_analysis(student_data, top_patterns)

        # Use AI to generate personalized thinking routine
        thinking_routine = self.ai.generate_thinking_routine(
            student_data,
            top_patterns,
            gap_analysis
        )

        # Use AI to generate recommendations
        recommendations = self.ai.generate_recommendations(
            student_data,
            top_patterns,
            gap_analysis
        )

        return {
            'userid': user_id,
            'courseid': course_id,
            'current_performance_percentile': percentile,
            'student_performance': student_data,
            'top_performer_benchmarks': {
                'avg_grade': top_patterns['avg_top_performer_grade'],
                'study_duration': top_patterns['optimal_study_duration'],
                'sessions_per_week': top_patterns['optimal_session_frequency'],
                'study_time': top_patterns['recommended_time_of_day'],
            },
            'recommendations': recommendations,
            'thinking_routine': thinking_routine,
            'gap_analysis': gap_analysis,
        }

    def calculate_learning_velocity(self, user_id: int, course_id: int) -> float:
        """Calculate learning velocity (improvement rate over time)"""
        attempts = self.moodle.get_quiz_attempts_detail(user_id, course_id)

        if len(attempts) < 2:
            return 0.0

        # Calculate linear regression slope
        grades = [a['grade'] for a in attempts]
        n = len(grades)

        x = np.arange(1, n + 1)
        y = np.array(grades)

        # Calculate slope using least squares
        x_mean = np.mean(x)
        y_mean = np.mean(y)

        numerator = np.sum((x - x_mean) * (y - y_mean))
        denominator = np.sum((x - x_mean) ** 2)

        if denominator == 0:
            return 0.0

        slope = numerator / denominator
        return round(slope, 2)

    def calculate_percentile(self, user_id: int, course_id: int) -> float:
        """Calculate student's performance percentile in the course"""
        all_grades = self.moodle.get_all_student_grades(course_id)

        if not all_grades or user_id not in all_grades:
            return 0.0

        student_grade = all_grades[user_id]
        lower_count = sum(1 for grade in all_grades.values() if grade < student_grade)
        total_count = len(all_grades)

        if total_count == 0:
            return 0.0

        return round((lower_count / total_count) * 100, 2)

    def generate_gap_analysis(self, student_data: Dict, top_patterns: Dict) -> List[Dict]:
        """Generate gap analysis between student and top performers"""
        gaps = []

        # Study duration gap
        duration_gap = top_patterns['optimal_study_duration'] - student_data['avg_session_duration']
        if abs(duration_gap) > 5:
            gaps.append({
                'area': 'Study Duration',
                'current_level': student_data['avg_session_duration'],
                'top_performer_level': top_patterns['optimal_study_duration'],
                'gap': round(duration_gap, 2),
                'gap_percentage': round((duration_gap / top_patterns['optimal_study_duration']) * 100, 1),
                'improvement_strategy': self._get_duration_strategy(duration_gap),
            })

        # Session frequency gap
        freq_gap = top_patterns['optimal_session_frequency'] - student_data['sessions_per_week']
        if abs(freq_gap) > 0.5:
            gaps.append({
                'area': 'Practice Frequency',
                'current_level': student_data['sessions_per_week'],
                'top_performer_level': top_patterns['optimal_session_frequency'],
                'gap': round(freq_gap, 2),
                'gap_percentage': round((freq_gap / top_patterns['optimal_session_frequency']) * 100, 1),
                'improvement_strategy': self._get_frequency_strategy(freq_gap),
            })

        # Completion rate gap
        if student_data['completion_rate'] < 90:
            gaps.append({
                'area': 'Activity Completion',
                'current_level': student_data['completion_rate'],
                'top_performer_level': 95.0,
                'gap': round(95.0 - student_data['completion_rate'], 2),
                'gap_percentage': round((95.0 - student_data['completion_rate']) / 95.0 * 100, 1),
                'improvement_strategy': 'Set daily completion goals and track progress consistently. Aim to complete 2-3 activities per study session.',
            })

        # Grade gap
        grade_gap = top_patterns['avg_top_performer_grade'] - student_data['avg_grade']
        if grade_gap > 5:
            gaps.append({
                'area': 'Overall Performance',
                'current_level': student_data['avg_grade'],
                'top_performer_level': top_patterns['avg_top_performer_grade'],
                'gap': round(grade_gap, 2),
                'gap_percentage': round((grade_gap / top_patterns['avg_top_performer_grade']) * 100, 1),
                'improvement_strategy': 'Focus on understanding core concepts, seek help when stuck, and practice actively with challenging problems.',
            })

        # Engagement gap (forum participation)
        avg_top_forum_posts = np.mean([d.get('forum_posts', 0) for d in top_patterns.get('top_performers_data', [])])
        if avg_top_forum_posts > 0:
            forum_gap = avg_top_forum_posts - student_data['forum_posts']
            if forum_gap > 3:
                gaps.append({
                    'area': 'Peer Engagement',
                    'current_level': student_data['forum_posts'],
                    'top_performer_level': round(avg_top_forum_posts, 1),
                    'gap': round(forum_gap, 2),
                    'gap_percentage': round((forum_gap / avg_top_forum_posts) * 100, 1) if avg_top_forum_posts > 0 else 0,
                    'improvement_strategy': 'Participate in discussions by asking questions and helping peers. Aim for 2-3 meaningful posts per week.',
                })

        # Sort by gap size (descending)
        gaps.sort(key=lambda x: abs(x['gap']), reverse=True)

        return gaps

    def _get_duration_strategy(self, gap: float) -> str:
        """Get improvement strategy for study duration gap"""
        if gap > 0:
            return f"Gradually increase study session duration by 5-10 minutes each week until reaching optimal duration. Use Pomodoro technique (25-min focused work + 5-min break) to build stamina."
        else:
            return "Your session duration is good. Focus on quality over quantity - ensure sessions are focused and productive."

    def _get_frequency_strategy(self, gap: float) -> str:
        """Get improvement strategy for session frequency gap"""
        if gap > 0:
            sessions_needed = int(np.ceil(gap))
            return f"Add {sessions_needed} more study session(s) per week. Start with shorter sessions (20-30 min) if needed, and build consistency before extending duration."
        else:
            return "Your study frequency is excellent. Maintain this consistency while optimizing session quality."

    def _merge_patterns(self, top_performers_data: List[Dict], ai_patterns: List[Dict]) -> List[Dict]:
        """Merge statistical patterns with AI-identified patterns"""
        patterns = []

        # Add statistical patterns
        if top_performers_data:
            avg_completion = np.mean([d['completion_rate'] for d in top_performers_data])
            if avg_completion > 85:
                patterns.append({
                    'pattern_type': 'completion_consistency',
                    'description': f'Consistent activity completion (average {avg_completion:.1f}%)',
                    'frequency': 90.0,
                    'impact_score': 8.5,
                })

            avg_velocity = np.mean([d['learning_velocity'] for d in top_performers_data])
            if avg_velocity > 0.5:
                patterns.append({
                    'pattern_type': 'continuous_improvement',
                    'description': f'Steady improvement trajectory (velocity: {avg_velocity:.2f})',
                    'frequency': 85.0,
                    'impact_score': 9.0,
                })

        # Add AI-identified patterns
        for pattern in ai_patterns:
            if pattern.get('frequency', 0) > 70:  # Only high-frequency patterns
                patterns.append(pattern)

        # Sort by impact score
        patterns.sort(key=lambda x: x.get('impact_score', 0), reverse=True)

        return patterns[:10]  # Top 10 patterns

    def _get_empty_top_patterns(self, course_id: int) -> Dict:
        """Return empty top patterns structure"""
        return {
            'courseid': course_id,
            'total_students': 0,
            'top_performers_count': 0,
            'avg_top_performer_grade': 0,
            'common_patterns': [],
            'optimal_study_duration': 45,  # Default reasonable values
            'optimal_session_frequency': 3,
            'recommended_time_of_day': 'afternoon',
            'top_performers_data': [],
        }
