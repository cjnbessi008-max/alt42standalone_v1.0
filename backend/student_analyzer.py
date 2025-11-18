"""
Student Performance Analyzer
Analyzes student learning patterns, thinking routines, and performance metrics
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime
import logging
from collections import defaultdict
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class ThinkingRoutine:
    """Represents a student's thinking routine/pattern"""
    user_id: int
    avg_time_per_question: float  # seconds
    consistency_score: float  # 0-1, how consistent their performance is
    accuracy_rate: float  # 0-100, percentage of correct answers
    attempt_pattern: str  # 'quick_solver', 'methodical', 'struggler', 'rusher'
    time_distribution: Dict[str, float]  # quartiles of time spent
    question_type_performance: Dict[str, float]  # performance by question type
    learning_velocity: float  # rate of improvement over time
    error_patterns: List[str]  # common mistake patterns
    engagement_score: float  # based on activity frequency and depth


@dataclass
class PerformanceMetrics:
    """Student performance metrics"""
    user_id: int
    total_activities: int
    avg_score: float
    median_score: float
    std_dev_score: float
    total_time_spent: int  # seconds
    completion_rate: float
    improvement_trend: float  # slope of performance over time
    peak_performance_time: str  # time of day when performance peaks
    struggle_areas: List[str]


class StudentAnalyzer:
    """Analyzes student performance and identifies thinking patterns"""

    def __init__(self, config_path: str = "../config/database.config.json"):
        """Initialize analyzer with configuration"""
        with open(config_path, 'r') as f:
            config = json.load(f)

        self.settings = config['analysis_settings']
        self.top_tier_percentage = self.settings['top_tier_percentage']
        self.min_activities = self.settings['min_activities_for_analysis']

    def calculate_performance_metrics(self, quiz_attempts: List[Dict],
                                       assignments: List[Dict],
                                       activity_logs: List[Dict]) -> PerformanceMetrics:
        """
        Calculate comprehensive performance metrics for a student

        Args:
            quiz_attempts: List of quiz attempt records
            assignments: List of assignment submission records
            activity_logs: List of activity log records

        Returns:
            PerformanceMetrics object
        """
        if not quiz_attempts and not assignments:
            raise ValueError("No performance data available")

        user_id = quiz_attempts[0]['user_id'] if quiz_attempts else assignments[0]['user_id']

        # Combine scores from quizzes and assignments
        all_scores = []
        all_scores.extend([a['percentage'] for a in quiz_attempts if a['percentage'] is not None])
        all_scores.extend([a['percentage'] for a in assignments if a['percentage'] is not None])

        # Calculate time-based metrics
        total_time = sum([a.get('time_taken_seconds', 0) for a in quiz_attempts])

        # Calculate completion rate
        total_activities = len(quiz_attempts) + len(assignments)
        completed = len([a for a in quiz_attempts if a['percentage'] is not None])
        completed += len([a for a in assignments if a['percentage'] is not None])
        completion_rate = (completed / total_activities * 100) if total_activities > 0 else 0

        # Calculate improvement trend
        if len(all_scores) >= 2:
            time_indices = np.arange(len(all_scores))
            trend_line = np.polyfit(time_indices, all_scores, 1)
            improvement_trend = trend_line[0]  # slope
        else:
            improvement_trend = 0.0

        # Analyze peak performance time
        peak_time = self._analyze_peak_performance_time(quiz_attempts, assignments)

        # Identify struggle areas
        struggle_areas = self._identify_struggle_areas(quiz_attempts)

        return PerformanceMetrics(
            user_id=user_id,
            total_activities=total_activities,
            avg_score=np.mean(all_scores) if all_scores else 0.0,
            median_score=np.median(all_scores) if all_scores else 0.0,
            std_dev_score=np.std(all_scores) if all_scores else 0.0,
            total_time_spent=total_time,
            completion_rate=completion_rate,
            improvement_trend=improvement_trend,
            peak_performance_time=peak_time,
            struggle_areas=struggle_areas
        )

    def analyze_thinking_routine(self, user_id: int, quiz_attempts: List[Dict],
                                  question_attempts: List[Dict],
                                  activity_logs: List[Dict]) -> ThinkingRoutine:
        """
        Analyze a student's thinking routine and learning patterns

        Args:
            user_id: Student user ID
            quiz_attempts: Quiz attempt records
            question_attempts: Individual question attempt records
            activity_logs: Activity log records

        Returns:
            ThinkingRoutine object with detailed pattern analysis
        """
        # Calculate average time per question
        question_times = []
        for qa in question_attempts:
            steps = [s for s in question_attempts if s['question_attempt_id'] == qa['question_attempt_id']]
            if len(steps) >= 2:
                time_diff = (steps[-1]['timecreated'] - steps[0]['timecreated'])
                question_times.append(time_diff)

        avg_time_per_question = np.mean(question_times) if question_times else 0.0

        # Calculate consistency score (inverse of coefficient of variation)
        scores = [qa.get('score_fraction', 0) for qa in question_attempts if qa.get('score_fraction') is not None]
        if len(scores) > 1:
            cv = np.std(scores) / np.mean(scores) if np.mean(scores) > 0 else 1.0
            consistency_score = max(0, 1 - cv)
        else:
            consistency_score = 0.5

        # Calculate accuracy rate
        correct_count = sum([1 for qa in question_attempts if qa.get('state') == 'gradedright'])
        total_count = len(question_attempts)
        accuracy_rate = (correct_count / total_count * 100) if total_count > 0 else 0.0

        # Determine attempt pattern
        attempt_pattern = self._classify_attempt_pattern(
            avg_time_per_question, accuracy_rate, consistency_score
        )

        # Calculate time distribution (quartiles)
        time_distribution = {}
        if question_times:
            time_distribution = {
                'q1': float(np.percentile(question_times, 25)),
                'median': float(np.percentile(question_times, 50)),
                'q3': float(np.percentile(question_times, 75)),
                'min': float(np.min(question_times)),
                'max': float(np.max(question_times))
            }

        # Analyze performance by question type
        question_type_performance = self._analyze_by_question_type(question_attempts)

        # Calculate learning velocity (improvement rate)
        learning_velocity = self._calculate_learning_velocity(question_attempts)

        # Identify error patterns
        error_patterns = self._identify_error_patterns(question_attempts)

        # Calculate engagement score
        engagement_score = self._calculate_engagement_score(activity_logs, quiz_attempts)

        return ThinkingRoutine(
            user_id=user_id,
            avg_time_per_question=avg_time_per_question,
            consistency_score=consistency_score,
            accuracy_rate=accuracy_rate,
            attempt_pattern=attempt_pattern,
            time_distribution=time_distribution,
            question_type_performance=question_type_performance,
            learning_velocity=learning_velocity,
            error_patterns=error_patterns,
            engagement_score=engagement_score
        )

    def identify_top_tier_students(self, all_metrics: List[PerformanceMetrics],
                                     all_routines: List[ThinkingRoutine]) -> List[int]:
        """
        Identify top-tier students based on composite scoring

        Args:
            all_metrics: List of all students' performance metrics
            all_routines: List of all students' thinking routines

        Returns:
            List of user IDs of top-tier students
        """
        # Create composite score
        composite_scores = []

        for metrics, routine in zip(all_metrics, all_routines):
            # Normalize each component to 0-1 scale
            score_component = metrics.avg_score / 100.0
            consistency_component = routine.consistency_score
            accuracy_component = routine.accuracy_rate / 100.0
            engagement_component = routine.engagement_score
            learning_component = min(1.0, max(0.0, routine.learning_velocity))

            # Weighted composite score
            composite = (
                score_component * 0.30 +
                accuracy_component * 0.25 +
                consistency_component * 0.20 +
                engagement_component * 0.15 +
                learning_component * 0.10
            )

            composite_scores.append({
                'user_id': metrics.user_id,
                'composite_score': composite
            })

        # Sort by composite score
        composite_scores.sort(key=lambda x: x['composite_score'], reverse=True)

        # Select top percentage
        top_count = max(1, int(len(composite_scores) * self.top_tier_percentage / 100))
        top_tier_ids = [s['user_id'] for s in composite_scores[:top_count]]

        logger.info(f"Identified {len(top_tier_ids)} top-tier students out of {len(composite_scores)}")
        return top_tier_ids

    def calculate_average_routine(self, routines: List[ThinkingRoutine]) -> ThinkingRoutine:
        """
        Calculate average thinking routine from a group of students

        Args:
            routines: List of ThinkingRoutine objects

        Returns:
            Average ThinkingRoutine representing the group
        """
        if not routines:
            raise ValueError("No routines provided")

        # Calculate averages
        avg_time = np.mean([r.avg_time_per_question for r in routines])
        avg_consistency = np.mean([r.consistency_score for r in routines])
        avg_accuracy = np.mean([r.accuracy_rate for r in routines])
        avg_learning_velocity = np.mean([r.learning_velocity for r in routines])
        avg_engagement = np.mean([r.engagement_score for r in routines])

        # Aggregate time distributions
        all_time_dists = [r.time_distribution for r in routines if r.time_distribution]
        avg_time_dist = {}
        if all_time_dists:
            for key in ['q1', 'median', 'q3', 'min', 'max']:
                values = [td.get(key, 0) for td in all_time_dists if key in td]
                avg_time_dist[key] = np.mean(values) if values else 0.0

        # Aggregate question type performance
        all_qt_perfs = defaultdict(list)
        for routine in routines:
            for qtype, perf in routine.question_type_performance.items():
                all_qt_perfs[qtype].append(perf)

        avg_qt_perf = {qtype: np.mean(perfs) for qtype, perfs in all_qt_perfs.items()}

        # Most common error patterns
        all_errors = []
        for routine in routines:
            all_errors.extend(routine.error_patterns)
        common_errors = list(set(all_errors))[:5]  # Top 5 most common

        # Most common attempt pattern
        patterns = [r.attempt_pattern for r in routines]
        most_common_pattern = max(set(patterns), key=patterns.count)

        return ThinkingRoutine(
            user_id=0,  # Represents average, not a specific student
            avg_time_per_question=avg_time,
            consistency_score=avg_consistency,
            accuracy_rate=avg_accuracy,
            attempt_pattern=most_common_pattern,
            time_distribution=avg_time_dist,
            question_type_performance=avg_qt_perf,
            learning_velocity=avg_learning_velocity,
            error_patterns=common_errors,
            engagement_score=avg_engagement
        )

    # Helper methods

    def _classify_attempt_pattern(self, avg_time: float, accuracy: float,
                                   consistency: float) -> str:
        """Classify student's attempt pattern based on metrics"""
        if accuracy >= 80 and avg_time < 60:
            return 'quick_solver'
        elif accuracy >= 75 and consistency >= 0.7:
            return 'methodical'
        elif accuracy < 60 and avg_time > 120:
            return 'struggler'
        elif avg_time < 30:
            return 'rusher'
        else:
            return 'average'

    def _analyze_by_question_type(self, question_attempts: List[Dict]) -> Dict[str, float]:
        """Analyze performance by question type"""
        type_performance = defaultdict(list)

        for qa in question_attempts:
            qtype = qa.get('question_type', 'unknown')
            score = qa.get('score_fraction', 0)
            if score is not None:
                type_performance[qtype].append(score * 100)

        return {qtype: np.mean(scores) for qtype, scores in type_performance.items()}

    def _calculate_learning_velocity(self, question_attempts: List[Dict]) -> float:
        """Calculate rate of improvement over time"""
        if len(question_attempts) < 3:
            return 0.0

        # Sort by time
        sorted_attempts = sorted(question_attempts, key=lambda x: x.get('timecreated', 0))

        # Get scores over time
        scores = [qa.get('score_fraction', 0) * 100 for qa in sorted_attempts
                  if qa.get('score_fraction') is not None]

        if len(scores) >= 3:
            # Calculate slope using linear regression
            time_indices = np.arange(len(scores))
            slope, _ = np.polyfit(time_indices, scores, 1)
            return float(slope)

        return 0.0

    def _identify_error_patterns(self, question_attempts: List[Dict]) -> List[str]:
        """Identify common error patterns"""
        error_patterns = []

        wrong_attempts = [qa for qa in question_attempts if qa.get('state') in ['gradedwrong', 'gradedpartial']]

        # Pattern: Rushing (very short time + wrong answer)
        rushing_count = sum([1 for qa in wrong_attempts
                             if qa.get('timecreated', 0) > 0 and
                             (qa.get('timemodified', 0) - qa.get('timecreated', 0)) < 15])
        if rushing_count > len(wrong_attempts) * 0.3:
            error_patterns.append('rushing_through_questions')

        # Pattern: Specific question type struggles
        type_errors = defaultdict(int)
        for qa in wrong_attempts:
            qtype = qa.get('question_type', 'unknown')
            type_errors[qtype] += 1

        for qtype, count in type_errors.items():
            if count > 3:
                error_patterns.append(f'struggles_with_{qtype}')

        return error_patterns[:5]  # Return top 5

    def _calculate_engagement_score(self, activity_logs: List[Dict],
                                     quiz_attempts: List[Dict]) -> float:
        """Calculate engagement score based on activity patterns"""
        if not activity_logs:
            return 0.5

        # Count different types of activities
        unique_activities = len(set([log.get('eventname', '') for log in activity_logs]))

        # Calculate activity frequency (activities per day)
        if activity_logs:
            time_span_days = (max([log['timecreated'] for log in activity_logs]) -
                              min([log['timecreated'] for log in activity_logs])) / 86400
            if time_span_days > 0:
                frequency = len(activity_logs) / time_span_days
            else:
                frequency = len(activity_logs)
        else:
            frequency = 0

        # Normalize to 0-1 scale
        diversity_score = min(1.0, unique_activities / 20)  # Assume 20+ is high diversity
        frequency_score = min(1.0, frequency / 10)  # Assume 10+ per day is high engagement

        engagement = (diversity_score * 0.6 + frequency_score * 0.4)
        return engagement

    def _analyze_peak_performance_time(self, quiz_attempts: List[Dict],
                                        assignments: List[Dict]) -> str:
        """Analyze time of day when student performs best"""
        time_performance = defaultdict(list)

        for attempt in quiz_attempts:
            if attempt.get('timestart') and attempt.get('percentage'):
                hour = datetime.fromtimestamp(attempt['timestart']).hour
                time_performance[hour].append(attempt['percentage'])

        if not time_performance:
            return 'unknown'

        # Find hour with highest average performance
        avg_performance = {hour: np.mean(scores) for hour, scores in time_performance.items()}
        peak_hour = max(avg_performance, key=avg_performance.get)

        # Classify time of day
        if 6 <= peak_hour < 12:
            return 'morning'
        elif 12 <= peak_hour < 17:
            return 'afternoon'
        elif 17 <= peak_hour < 21:
            return 'evening'
        else:
            return 'night'

    def _identify_struggle_areas(self, quiz_attempts: List[Dict]) -> List[str]:
        """Identify areas where student struggles most"""
        struggle_areas = []

        # Low scoring quizzes
        low_score_quizzes = [qa for qa in quiz_attempts
                             if qa.get('percentage', 100) < 60]

        quiz_names = [qa['quiz_name'] for qa in low_score_quizzes]
        from collections import Counter
        common_struggles = Counter(quiz_names).most_common(3)

        struggle_areas = [name for name, count in common_struggles]

        return struggle_areas
