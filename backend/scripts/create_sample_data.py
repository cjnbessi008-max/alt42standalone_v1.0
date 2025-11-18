"""
Create sample data for testing the metacognition tracker
"""
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from app.database import SessionLocal
from app.models import Student, LearningActivity, ProblemAttempt
from datetime import datetime, timedelta
import uuid
import random


def create_sample_data():
    """Create sample students and learning activities"""
    db = SessionLocal()

    try:
        # Create students
        students = [
            Student(
                id=str(uuid.uuid4()),
                name="김민수",
                email="minsu@example.com",
                grade_level="6학년",
                is_teacher=False
            ),
            Student(
                id=str(uuid.uuid4()),
                name="이서연",
                email="seoyeon@example.com",
                grade_level="5학년",
                is_teacher=False
            ),
            Student(
                id=str(uuid.uuid4()),
                name="박지훈",
                email="jihoon@example.com",
                grade_level="6학년",
                is_teacher=False
            ),
        ]

        for student in students:
            db.add(student)

        db.commit()

        print(f"✓ Created {len(students)} students")

        # Create learning activities for each student
        topics = [
            "분수의 덧셈과 뺄셈",
            "소수의 곱셈",
            "도형의 넓이",
            "비율과 백분율",
            "방정식 풀이"
        ]

        total_activities = 0
        total_attempts = 0

        for student in students:
            # Create 5-7 activities per student over the last week
            num_activities = random.randint(5, 7)

            for i in range(num_activities):
                days_ago = random.randint(0, 6)
                session_start = datetime.utcnow() - timedelta(days=days_ago, hours=random.randint(1, 4))
                duration = random.randint(30, 90)
                session_end = session_start + timedelta(minutes=duration)

                num_problems = random.randint(8, 15)
                correct = random.randint(int(num_problems * 0.6), num_problems)
                incorrect = num_problems - correct
                hints = random.randint(0, int(num_problems * 0.3))

                activity = LearningActivity(
                    id=str(uuid.uuid4()),
                    student_id=student.id,
                    session_start=session_start,
                    session_end=session_end,
                    duration_minutes=duration,
                    subject="mathematics",
                    topic=random.choice(topics),
                    total_problems=num_problems,
                    correct_answers=correct,
                    incorrect_answers=incorrect,
                    hints_used=hints,
                    self_confidence_before=random.randint(2, 4),
                    self_confidence_after=random.randint(3, 5)
                )

                db.add(activity)
                db.flush()

                total_activities += 1

                # Create problem attempts
                for j in range(num_problems):
                    is_correct = j < correct
                    hints_for_problem = 1 if (not is_correct and random.random() > 0.5) else 0

                    attempt = ProblemAttempt(
                        id=str(uuid.uuid4()),
                        activity_id=activity.id,
                        problem_id=f"{activity.topic}_prob_{j+1}",
                        problem_type="calculation",
                        difficulty_level=random.randint(1, 5),
                        attempt_number=random.randint(1, 2),
                        time_spent_seconds=random.randint(30, 300),
                        is_correct=is_correct,
                        hints_requested=hints_for_problem,
                        gave_up=False,
                        self_assessment_before=random.randint(2, 4),
                        self_assessment_after=random.randint(2, 5)
                    )

                    db.add(attempt)
                    total_attempts += 1

        db.commit()

        print(f"✓ Created {total_activities} learning activities")
        print(f"✓ Created {total_attempts} problem attempts")
        print("\n학생 목록:")

        for student in students:
            print(f"  - {student.name} (ID: {student.id})")

        print("\n샘플 데이터 생성 완료!")
        print("\n다음 명령으로 일일 성장 포인트를 생성할 수 있습니다:")
        print(f"curl http://localhost:8000/api/insights/daily/{students[0].id}")

    except Exception as e:
        print(f"Error creating sample data: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_sample_data()
