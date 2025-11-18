"""
Analysis Pipeline Orchestrator
Main entry point that coordinates Moodle data extraction,
student analysis, and deviation calculation
"""

import json
import logging
from typing import List, Dict, Optional
from datetime import datetime
import os

from moodle_connector import MoodleConnector
from student_analyzer import StudentAnalyzer, ThinkingRoutine, PerformanceMetrics
from deviation_analyzer import DeviationAnalyzer, DeviationMetrics, ComparisonReport, export_deviation_report_json

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class AnalysisPipeline:
    """Orchestrates the complete analysis pipeline"""

    def __init__(self, config_path: str = "../config/database.config.json"):
        """Initialize pipeline components"""
        self.config_path = config_path
        self.moodle = MoodleConnector(config_path)
        self.analyzer = StudentAnalyzer(config_path)
        self.deviation_analyzer = DeviationAnalyzer()

    def run_complete_analysis(self, course_id: int,
                                output_dir: str = "../output") -> Dict:
        """
        Run complete analysis pipeline for a course

        Args:
            course_id: Moodle course ID to analyze
            output_dir: Directory to save output files

        Returns:
            Dictionary with analysis results summary
        """
        logger.info(f"Starting complete analysis for course {course_id}")

        # Create output directory if needed
        os.makedirs(output_dir, exist_ok=True)

        try:
            # Step 1: Connect to Moodle
            logger.info("Step 1: Connecting to Moodle database...")
            if not self.moodle.connect():
                raise Exception("Failed to connect to Moodle database")

            # Step 2: Extract student data
            logger.info("Step 2: Extracting student data...")
            students = self.moodle.get_course_students(course_id)
            logger.info(f"Found {len(students)} students")

            if not students:
                raise Exception("No students found in course")

            # Step 3: Analyze each student
            logger.info("Step 3: Analyzing individual students...")
            all_routines = []
            all_metrics = []
            student_data = []

            for idx, student in enumerate(students, 1):
                logger.info(f"  Analyzing student {idx}/{len(students)}: {student['firstname']} {student['lastname']}")

                try:
                    routine, metrics = self._analyze_student(course_id, student['user_id'])

                    student_name = f"{student['firstname']} {student['lastname']}"
                    all_routines.append(routine)
                    all_metrics.append(metrics)
                    student_data.append((routine, metrics, student_name))

                except Exception as e:
                    logger.warning(f"  Failed to analyze student {student['user_id']}: {e}")
                    continue

            logger.info(f"Successfully analyzed {len(all_routines)} students")

            # Step 4: Identify top-tier students
            logger.info("Step 4: Identifying top-tier students...")
            top_tier_ids = self.analyzer.identify_top_tier_students(all_metrics, all_routines)
            logger.info(f"Identified {len(top_tier_ids)} top-tier students")

            # Step 5: Calculate top-tier average routine
            logger.info("Step 5: Calculating top-tier average thinking routine...")
            top_tier_routines = [r for r in all_routines if r.user_id in top_tier_ids]
            top_tier_average = self.analyzer.calculate_average_routine(top_tier_routines)
            logger.info("Top-tier average routine calculated")

            # Step 6: Calculate deviations for all students
            logger.info("Step 6: Calculating deviations from top-tier average...")
            all_deviations = self.deviation_analyzer.batch_analyze_deviations(
                student_data, top_tier_average
            )
            logger.info(f"Calculated deviations for {len(all_deviations)} students")

            # Step 7: Generate individual reports
            logger.info("Step 7: Generating detailed reports...")
            reports = []
            for routine, metrics, name in student_data:
                report = self.deviation_analyzer.generate_comparison_report(
                    routine, top_tier_average, metrics, name
                )
                reports.append(report)

            # Step 8: Save results
            logger.info("Step 8: Saving results...")
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

            # Save summary
            summary = self._create_summary(
                course_id, students, top_tier_ids,
                all_deviations, top_tier_average
            )
            summary_file = os.path.join(output_dir, f"course_{course_id}_summary_{timestamp}.json")
            with open(summary_file, 'w', encoding='utf-8') as f:
                json.dump(summary, f, indent=2, ensure_ascii=False, default=str)
            logger.info(f"Saved summary to {summary_file}")

            # Save detailed reports
            reports_file = os.path.join(output_dir, f"course_{course_id}_detailed_reports_{timestamp}.json")
            reports_data = [export_deviation_report_json(r) for r in reports]
            with open(reports_file, 'w', encoding='utf-8') as f:
                json.dump(reports_data, f, indent=2, ensure_ascii=False, default=str)
            logger.info(f"Saved detailed reports to {reports_file}")

            # Save CSV for easy viewing
            csv_file = os.path.join(output_dir, f"course_{course_id}_deviations_{timestamp}.csv")
            self._save_deviations_csv(all_deviations, csv_file)
            logger.info(f"Saved CSV to {csv_file}")

            logger.info("Analysis complete!")

            return {
                'success': True,
                'course_id': course_id,
                'total_students': len(students),
                'analyzed_students': len(all_routines),
                'top_tier_count': len(top_tier_ids),
                'summary_file': summary_file,
                'reports_file': reports_file,
                'csv_file': csv_file,
                'timestamp': timestamp
            }

        except Exception as e:
            logger.error(f"Analysis pipeline failed: {e}", exc_info=True)
            return {
                'success': False,
                'error': str(e)
            }

        finally:
            # Always disconnect
            self.moodle.disconnect()

    def analyze_single_student(self, course_id: int, user_id: int,
                                 output_dir: str = "../output") -> Optional[ComparisonReport]:
        """
        Analyze a single student against top-tier average

        Args:
            course_id: Moodle course ID
            user_id: Student user ID
            output_dir: Directory for output files

        Returns:
            ComparisonReport or None if analysis fails
        """
        logger.info(f"Analyzing student {user_id} in course {course_id}")

        try:
            if not self.moodle.connect():
                raise Exception("Failed to connect to Moodle")

            # Get all students to calculate top-tier average
            students = self.moodle.get_course_students(course_id)

            # Analyze all students
            all_routines = []
            all_metrics = []
            for student in students:
                try:
                    routine, metrics = self._analyze_student(course_id, student['user_id'])
                    all_routines.append(routine)
                    all_metrics.append(metrics)
                except Exception as e:
                    logger.warning(f"Failed to analyze student {student['user_id']}: {e}")

            # Identify top-tier
            top_tier_ids = self.analyzer.identify_top_tier_students(all_metrics, all_routines)
            top_tier_routines = [r for r in all_routines if r.user_id in top_tier_ids]
            top_tier_average = self.analyzer.calculate_average_routine(top_tier_routines)

            # Analyze target student
            target_routine, target_metrics = self._analyze_student(course_id, user_id)

            # Get student name
            student_info = next((s for s in students if s['user_id'] == user_id), None)
            student_name = f"{student_info['firstname']} {student_info['lastname']}" if student_info else "Unknown"

            # Generate report
            report = self.deviation_analyzer.generate_comparison_report(
                target_routine, top_tier_average, target_metrics, student_name
            )

            # Save report
            os.makedirs(output_dir, exist_ok=True)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            report_file = os.path.join(output_dir, f"student_{user_id}_report_{timestamp}.json")

            with open(report_file, 'w', encoding='utf-8') as f:
                json.dump(export_deviation_report_json(report), f, indent=2, ensure_ascii=False, default=str)

            logger.info(f"Saved report to {report_file}")

            return report

        except Exception as e:
            logger.error(f"Failed to analyze student: {e}", exc_info=True)
            return None

        finally:
            self.moodle.disconnect()

    def _analyze_student(self, course_id: int, user_id: int) -> tuple[ThinkingRoutine, PerformanceMetrics]:
        """
        Analyze a single student's performance and thinking routine

        Args:
            course_id: Moodle course ID
            user_id: Student user ID

        Returns:
            Tuple of (ThinkingRoutine, PerformanceMetrics)
        """
        # Extract data
        quiz_attempts = self.moodle.get_quiz_attempts(course_id, user_id)
        assignments = self.moodle.get_assignment_submissions(course_id, user_id)
        activity_logs = self.moodle.get_activity_logs(course_id, user_id, limit=500)

        # Get detailed question attempts
        question_attempts = []
        for attempt in quiz_attempts[:10]:  # Limit to recent 10 attempts for performance
            qa = self.moodle.get_question_attempts(attempt['attempt_id'])
            question_attempts.extend(qa)

        # Calculate metrics
        metrics = self.analyzer.calculate_performance_metrics(
            quiz_attempts, assignments, activity_logs
        )

        # Analyze thinking routine
        routine = self.analyzer.analyze_thinking_routine(
            user_id, quiz_attempts, question_attempts, activity_logs
        )

        return routine, metrics

    def _create_summary(self, course_id: int, students: List[Dict],
                         top_tier_ids: List[int], deviations: List[DeviationMetrics],
                         top_tier_average: ThinkingRoutine) -> Dict:
        """Create summary report"""
        return {
            'course_id': course_id,
            'analysis_date': datetime.now().isoformat(),
            'total_students': len(students),
            'analyzed_students': len(deviations),
            'top_tier_count': len(top_tier_ids),
            'top_tier_student_ids': top_tier_ids,
            'top_tier_average_profile': {
                'avg_time_per_question': f"{top_tier_average.avg_time_per_question:.0f}초",
                'accuracy_rate': f"{top_tier_average.accuracy_rate:.1f}%",
                'consistency_score': f"{top_tier_average.consistency_score:.2f}",
                'engagement_score': f"{top_tier_average.engagement_score:.2f}",
                'learning_velocity': f"{top_tier_average.learning_velocity:.2f}",
                'attempt_pattern': top_tier_average.attempt_pattern
            },
            'class_statistics': {
                'avg_deviation_score': sum(d.overall_deviation_score for d in deviations) / len(deviations),
                'best_student': {
                    'name': deviations[0].student_name,
                    'deviation_score': deviations[0].overall_deviation_score,
                    'percentile': deviations[0].percentile_rank
                } if deviations else None,
                'students_by_grade': self._count_by_grade(deviations)
            },
            'common_weaknesses': self._identify_common_weaknesses(deviations),
            'improvement_priorities': self._identify_improvement_priorities(deviations)
        }

    def _count_by_grade(self, deviations: List[DeviationMetrics]) -> Dict[str, int]:
        """Count students by grade level"""
        grade_counts = {'S': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0}

        for dev in deviations:
            if dev.overall_deviation_score < 10:
                grade_counts['S'] += 1
            elif dev.overall_deviation_score < 25:
                grade_counts['A'] += 1
            elif dev.overall_deviation_score < 40:
                grade_counts['B'] += 1
            elif dev.overall_deviation_score < 60:
                grade_counts['C'] += 1
            else:
                grade_counts['D'] += 1

        return grade_counts

    def _identify_common_weaknesses(self, deviations: List[DeviationMetrics]) -> List[str]:
        """Identify most common weaknesses across all students"""
        all_weaknesses = []
        for dev in deviations:
            all_weaknesses.extend(dev.weaknesses)

        from collections import Counter
        common = Counter(all_weaknesses).most_common(5)
        return [weakness for weakness, count in common]

    def _identify_improvement_priorities(self, deviations: List[DeviationMetrics]) -> List[str]:
        """Identify class-wide improvement priorities"""
        priorities = []

        # Calculate average deviations
        avg_accuracy_dev = sum(abs(d.accuracy_deviation) for d in deviations) / len(deviations)
        avg_consistency_dev = sum(abs(d.consistency_deviation) for d in deviations) / len(deviations)
        avg_engagement_dev = sum(abs(d.engagement_deviation) for d in deviations) / len(deviations)

        if avg_accuracy_dev > 20:
            priorities.append("정확도 향상이 가장 시급합니다")
        if avg_consistency_dev > 20:
            priorities.append("학습 일관성 개선이 필요합니다")
        if avg_engagement_dev > 20:
            priorities.append("학생 참여도 증진이 필요합니다")

        return priorities

    def _save_deviations_csv(self, deviations: List[DeviationMetrics], filepath: str):
        """Save deviations to CSV file"""
        import csv

        with open(filepath, 'w', newline='', encoding='utf-8-sig') as f:
            writer = csv.writer(f)

            # Header
            writer.writerow([
                '학생ID', '학생명', '종합편차점수', '백분위순위', '등급',
                '정확도편차', '일관성편차', '시간편차', '참여도편차',
                '학습속도편차', '패턴일치', '강점수', '약점수'
            ])

            # Data rows
            for dev in deviations:
                grade = 'S' if dev.overall_deviation_score < 10 else \
                        'A' if dev.overall_deviation_score < 25 else \
                        'B' if dev.overall_deviation_score < 40 else \
                        'C' if dev.overall_deviation_score < 60 else 'D'

                writer.writerow([
                    dev.user_id,
                    dev.student_name,
                    f"{dev.overall_deviation_score:.1f}",
                    f"{dev.percentile_rank:.1f}",
                    grade,
                    f"{dev.accuracy_deviation:+.1f}%",
                    f"{dev.consistency_deviation:+.1f}%",
                    f"{dev.time_deviation:+.1f}%",
                    f"{dev.engagement_deviation:+.1f}%",
                    f"{dev.learning_velocity_deviation:+.1f}%",
                    dev.pattern_match,
                    len(dev.strengths),
                    len(dev.weaknesses)
                ])


# CLI interface
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Student Performance Analysis Pipeline')
    parser.add_argument('--course-id', type=int, required=True, help='Moodle course ID')
    parser.add_argument('--user-id', type=int, help='Analyze specific user (optional)')
    parser.add_argument('--output-dir', default='../output', help='Output directory')
    parser.add_argument('--config', default='../config/database.config.json', help='Config file path')

    args = parser.parse_args()

    pipeline = AnalysisPipeline(config_path=args.config)

    if args.user_id:
        # Analyze single student
        report = pipeline.analyze_single_student(args.course_id, args.user_id, args.output_dir)
        if report:
            print("\n=== Analysis Complete ===")
            print(f"Student: {report.deviation_metrics.student_name}")
            print(f"Overall Deviation: {report.deviation_metrics.overall_deviation_score:.1f}")
            print(f"Percentile: {report.deviation_metrics.percentile_rank:.1f}%")
            print("\nTop Recommendations:")
            for rec in report.deviation_metrics.improvement_recommendations[:3]:
                print(f"  - {rec}")
    else:
        # Analyze entire course
        result = pipeline.run_complete_analysis(args.course_id, args.output_dir)

        if result['success']:
            print("\n=== Analysis Complete ===")
            print(f"Course ID: {result['course_id']}")
            print(f"Total Students: {result['total_students']}")
            print(f"Analyzed: {result['analyzed_students']}")
            print(f"Top-Tier Count: {result['top_tier_count']}")
            print(f"\nResults saved to:")
            print(f"  Summary: {result['summary_file']}")
            print(f"  Reports: {result['reports_file']}")
            print(f"  CSV: {result['csv_file']}")
        else:
            print(f"\n=== Analysis Failed ===")
            print(f"Error: {result['error']}")
