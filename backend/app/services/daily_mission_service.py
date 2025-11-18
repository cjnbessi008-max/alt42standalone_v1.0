"""
Daily Mission Service - Business logic for daily missions
"""
from datetime import date, datetime, timedelta
from typing import Optional, List
from uuid import UUID
import random

from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from app.models.daily_mission import (
    DailyMissionCreate,
    DailyMissionUpdate,
    MissionStatus,
    StudentAnswerSubmission,
)


class DailyMissionService:
    """Service for managing daily missions"""

    def __init__(self, db: Session):
        self.db = db

    def create_mission(self, teacher_id: UUID, mission_data: DailyMissionCreate):
        """Create a new daily mission"""
        query = """
            INSERT INTO daily_missions
            (teacher_id, title, description, subject, grade_level,
             problem_pool_size, difficulty_adaptive, status, start_date,
             end_date, lms_course_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """
        result = self.db.execute(query, (
            str(teacher_id),
            mission_data.title,
            mission_data.description,
            mission_data.subject,
            mission_data.grade_level,
            mission_data.problem_pool_size,
            mission_data.difficulty_adaptive,
            mission_data.status.value,
            mission_data.start_date,
            mission_data.end_date,
            mission_data.lms_course_id,
        ))
        return result.fetchone()

    def get_mission(self, mission_id: UUID):
        """Get mission by ID"""
        query = "SELECT * FROM daily_missions WHERE id = %s"
        result = self.db.execute(query, (str(mission_id),))
        return result.fetchone()

    def get_missions_by_teacher(self, teacher_id: UUID):
        """Get all missions created by a teacher"""
        query = "SELECT * FROM daily_missions WHERE teacher_id = %s ORDER BY created_at DESC"
        result = self.db.execute(query, (str(teacher_id),))
        return result.fetchall()

    def update_mission(self, mission_id: UUID, update_data: DailyMissionUpdate):
        """Update mission details"""
        update_fields = []
        values = []

        if update_data.title is not None:
            update_fields.append("title = %s")
            values.append(update_data.title)
        if update_data.description is not None:
            update_fields.append("description = %s")
            values.append(update_data.description)
        if update_data.status is not None:
            update_fields.append("status = %s")
            values.append(update_data.status.value)
        if update_data.end_date is not None:
            update_fields.append("end_date = %s")
            values.append(update_data.end_date)

        if not update_fields:
            return self.get_mission(mission_id)

        values.append(str(mission_id))
        query = f"UPDATE daily_missions SET {', '.join(update_fields)} WHERE id = %s RETURNING *"
        result = self.db.execute(query, tuple(values))
        return result.fetchone()

    def enroll_student(self, student_id: UUID, mission_id: UUID):
        """Enroll a student in a mission"""
        query = """
            INSERT INTO mission_enrollments (student_id, mission_id)
            VALUES (%s, %s)
            ON CONFLICT (student_id, mission_id)
            DO UPDATE SET is_active = true
            RETURNING *
        """
        result = self.db.execute(query, (str(student_id), str(mission_id)))
        return result.fetchone()

    def get_enrolled_missions(self, student_id: UUID):
        """Get all missions a student is enrolled in"""
        query = """
            SELECT dm.* FROM daily_missions dm
            JOIN mission_enrollments me ON dm.id = me.mission_id
            WHERE me.student_id = %s AND me.is_active = true
            AND dm.status = 'active'
            ORDER BY dm.created_at DESC
        """
        result = self.db.execute(query, (str(student_id),))
        return result.fetchall()

    def get_or_assign_daily_problem(self, mission_id: UUID, target_date: Optional[date] = None):
        """
        Get or assign today's problem for a mission
        If no problem is assigned for today, select one and assign it
        """
        if target_date is None:
            target_date = date.today()

        # Check if problem is already assigned for this date
        query = """
            SELECT mp.* FROM mission_problems mp
            JOIN daily_problem_assignments dpa ON mp.id = dpa.problem_id
            WHERE dpa.mission_id = %s AND dpa.assigned_date = %s
        """
        result = self.db.execute(query, (str(mission_id), target_date))
        existing_problem = result.fetchone()

        if existing_problem:
            return existing_problem

        # No problem assigned yet, select a random one
        query = """
            SELECT * FROM mission_problems
            WHERE mission_id = %s
            AND id NOT IN (
                SELECT problem_id FROM daily_problem_assignments
                WHERE mission_id = %s
                AND assigned_date > %s
            )
            ORDER BY RANDOM()
            LIMIT 1
        """
        # Don't repeat problems from last 7 days
        cutoff_date = target_date - timedelta(days=7)
        result = self.db.execute(query, (str(mission_id), str(mission_id), cutoff_date))
        new_problem = result.fetchone()

        if not new_problem:
            # If all problems have been used recently, just pick any random one
            query = "SELECT * FROM mission_problems WHERE mission_id = %s ORDER BY RANDOM() LIMIT 1"
            result = self.db.execute(query, (str(mission_id),))
            new_problem = result.fetchone()

        if new_problem:
            # Assign this problem for today
            assign_query = """
                INSERT INTO daily_problem_assignments (mission_id, problem_id, assigned_date)
                VALUES (%s, %s, %s)
                ON CONFLICT (mission_id, assigned_date) DO NOTHING
            """
            self.db.execute(assign_query, (str(mission_id), new_problem['id'], target_date))
            self.db.commit()

        return new_problem

    def get_student_progress(self, student_id: UUID, mission_id: UUID, target_date: Optional[date] = None):
        """Get student's progress for a specific mission on a specific date"""
        if target_date is None:
            target_date = date.today()

        query = """
            SELECT * FROM student_mission_progress
            WHERE student_id = %s AND mission_id = %s AND today_date = %s
        """
        result = self.db.execute(query, (str(student_id), str(mission_id), target_date))
        return result.fetchone()

    def submit_answer(self, student_id: UUID, mission_id: UUID, submission: StudentAnswerSubmission):
        """
        Submit an answer to today's problem
        Returns (progress_record, is_correct, feedback)
        """
        today = date.today()

        # Get the problem
        problem_query = "SELECT * FROM mission_problems WHERE id = %s"
        problem_result = self.db.execute(problem_query, (str(submission.problem_id),))
        problem = problem_result.fetchone()

        if not problem:
            raise ValueError("Problem not found")

        # Check answer correctness
        is_correct = self._check_answer(problem, submission.answer)

        # Check if progress record exists
        existing_progress = self.get_student_progress(student_id, mission_id, today)

        if existing_progress:
            # Update existing record
            query = """
                UPDATE student_mission_progress
                SET student_answer = %s,
                    is_completed = true,
                    is_correct = %s,
                    time_spent_seconds = %s,
                    attempts_count = attempts_count + 1,
                    completed_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING *
            """
            result = self.db.execute(query, (
                str(submission.answer),
                is_correct,
                submission.time_spent_seconds,
                existing_progress['id']
            ))
        else:
            # Create new progress record
            query = """
                INSERT INTO student_mission_progress
                (student_id, mission_id, problem_id, today_date,
                 student_answer, is_completed, is_correct,
                 time_spent_seconds, attempts_count, started_at, completed_at)
                VALUES (%s, %s, %s, %s, %s, true, %s, %s, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING *
            """
            result = self.db.execute(query, (
                str(student_id),
                str(mission_id),
                str(submission.problem_id),
                today,
                str(submission.answer),
                is_correct,
                submission.time_spent_seconds
            ))

        progress = result.fetchone()
        self.db.commit()

        # Update streak
        self._update_streak(student_id, mission_id, is_correct)

        # Generate feedback
        feedback = self._generate_feedback(problem, is_correct)

        return progress, is_correct, feedback

    def _check_answer(self, problem, student_answer: dict) -> bool:
        """Check if student answer is correct"""
        correct_answer = problem['correct_answer']
        problem_type = problem['problem_type']

        if problem_type == 'multiple_choice':
            return student_answer.get('selected_option') == correct_answer.get('correct_option')
        elif problem_type == 'short_answer':
            # Simple string comparison (case-insensitive)
            student_text = str(student_answer.get('text', '')).strip().lower()
            correct_text = str(correct_answer.get('text', '')).strip().lower()
            return student_text == correct_text
        else:
            # For other types, implement specific logic
            return False

    def _generate_feedback(self, problem, is_correct: bool) -> dict:
        """Generate feedback for student submission"""
        feedback = {
            'is_correct': is_correct,
            'message': '정답입니다! 잘하셨습니다!' if is_correct else '틀렸습니다. 다시 한 번 생각해보세요.',
            'explanation': problem.get('explanation', ''),
        }
        return feedback

    def _update_streak(self, student_id: UUID, mission_id: UUID, is_correct: bool):
        """Update student's streak"""
        today = date.today()
        yesterday = today - timedelta(days=1)

        # Get existing streak
        query = "SELECT * FROM student_mission_streaks WHERE student_id = %s AND mission_id = %s"
        result = self.db.execute(query, (str(student_id), str(mission_id)))
        streak = result.fetchone()

        if not streak:
            # Create new streak
            query = """
                INSERT INTO student_mission_streaks
                (student_id, mission_id, current_streak, longest_streak,
                 last_completed_date, total_completed, total_correct)
                VALUES (%s, %s, 1, 1, %s, 1, %s)
            """
            self.db.execute(query, (
                str(student_id),
                str(mission_id),
                today,
                1 if is_correct else 0
            ))
        else:
            # Update existing streak
            last_date = streak['last_completed_date']
            current_streak = streak['current_streak']

            if last_date == yesterday:
                # Continue streak
                current_streak += 1
            elif last_date != today:
                # Streak broken, reset
                current_streak = 1

            longest_streak = max(streak['longest_streak'], current_streak)
            total_completed = streak['total_completed'] + 1
            total_correct = streak['total_correct'] + (1 if is_correct else 0)

            query = """
                UPDATE student_mission_streaks
                SET current_streak = %s,
                    longest_streak = %s,
                    last_completed_date = %s,
                    total_completed = %s,
                    total_correct = %s
                WHERE id = %s
            """
            self.db.execute(query, (
                current_streak,
                longest_streak,
                today,
                total_completed,
                total_correct,
                streak['id']
            ))

        self.db.commit()

    def get_student_streak(self, student_id: UUID, mission_id: UUID):
        """Get student's streak information"""
        query = "SELECT * FROM student_mission_streaks WHERE student_id = %s AND mission_id = %s"
        result = self.db.execute(query, (str(student_id), str(mission_id)))
        return result.fetchone()

    def get_mission_analytics(self, mission_id: UUID):
        """Get analytics for a mission"""
        # Total enrolled students
        total_query = """
            SELECT COUNT(*) as total FROM mission_enrollments
            WHERE mission_id = %s AND is_active = true
        """
        total_result = self.db.execute(total_query, (str(mission_id),))
        total_students = total_result.fetchone()['total']

        # Active students (completed at least one problem in last 7 days)
        active_query = """
            SELECT COUNT(DISTINCT student_id) as active FROM student_mission_progress
            WHERE mission_id = %s
            AND today_date >= %s
        """
        cutoff = date.today() - timedelta(days=7)
        active_result = self.db.execute(active_query, (str(mission_id), cutoff))
        active_students = active_result.fetchone()['active']

        # Completion and accuracy stats
        stats_query = """
            SELECT
                AVG(CASE WHEN is_completed THEN 1.0 ELSE 0.0 END) as completion_rate,
                AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) as correct_rate,
                AVG(time_spent_seconds) as avg_time,
                COUNT(*) as total_completed
            FROM student_mission_progress
            WHERE mission_id = %s AND is_completed = true
        """
        stats_result = self.db.execute(stats_query, (str(mission_id),))
        stats = stats_result.fetchone()

        return {
            'mission_id': mission_id,
            'total_students': total_students,
            'active_students': active_students,
            'completion_rate': float(stats['completion_rate'] or 0),
            'average_correct_rate': float(stats['correct_rate'] or 0),
            'average_time_seconds': float(stats['avg_time'] or 0),
            'total_problems_completed': int(stats['total_completed'] or 0),
        }
