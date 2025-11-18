"""
Seed script to populate the database with sample data
Run this script after starting the application to create demo users and problems
"""
import sys
import os

# Add the parent directory to the path to import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal
from app.models.user import User, UserRole
from app.models.problem import Problem, ProblemType, DifficultyLevel
from app.core.security import get_password_hash


def seed_database():
    """Seed the database with sample data"""
    db = SessionLocal()

    try:
        # Check if data already exists
        existing_users = db.query(User).count()
        if existing_users > 0:
            print("Database already has data. Skipping seed.")
            return

        print("Seeding database with sample data...")

        # Create demo users
        student = User(
            email="student@example.com",
            username="student",
            hashed_password=get_password_hash("password123"),
            full_name="김학생",
            role=UserRole.STUDENT,
            grade_level="3학년",
        )

        teacher = User(
            email="teacher@example.com",
            username="teacher",
            hashed_password=get_password_hash("password123"),
            full_name="이선생",
            role=UserRole.TEACHER,
        )

        db.add_all([student, teacher])
        db.commit()
        db.refresh(teacher)

        print(f"✓ Created users: {student.username}, {teacher.username}")

        # Create sample problems
        problems = [
            Problem(
                title="분수의 기본 개념",
                problem_type=ProblemType.MULTIPLE_CHOICE,
                difficulty_level=DifficultyLevel.EASY,
                subject="수학",
                grade_level="3학년",
                reading_content="""분수는 전체를 여러 개의 같은 크기로 나눈 것 중 일부를 나타내는 수입니다.

예를 들어, 피자 한 판을 4조각으로 똑같이 나눴을 때, 그 중 1조각은 전체의 1/4이 됩니다.

분수는 두 부분으로 이루어져 있습니다:
- 분자(위의 숫자): 선택한 조각의 개수
- 분모(아래의 숫자): 전체를 나눈 개수

1/4에서 1은 분자, 4는 분모입니다.""",
                question_text="피자를 8조각으로 나누었을 때, 3조각을 먹었다면 이것을 분수로 어떻게 나타낼까요?",
                correct_answer="A",
                answer_options={
                    "A": "3/8",
                    "B": "8/3",
                    "C": "3/5",
                    "D": "5/8",
                },
                explanation="전체 8조각 중 3조각을 먹었으므로 3/8입니다. 분자는 먹은 조각(3), 분모는 전체 조각(8)입니다.",
                tags=["분수", "기본개념", "시각화"],
                created_by=teacher.id,
            ),
            Problem(
                title="분수의 덧셈",
                problem_type=ProblemType.SHORT_ANSWER,
                difficulty_level=DifficultyLevel.MEDIUM,
                subject="수학",
                grade_level="3학년",
                reading_content="""분모가 같은 분수끼리 더하는 방법을 배워봅시다.

분모가 같을 때는 분자끼리만 더하면 됩니다.
분모는 그대로 유지합니다.

예시:
1/5 + 2/5 = (1+2)/5 = 3/5

케이크를 5조각으로 나눈 것 중 1조각을 먹고, 나중에 2조각을 더 먹으면 총 3조각을 먹은 것이 됩니다.
전체는 여전히 5조각이므로 3/5가 됩니다.""",
                question_text="2/7 + 3/7 = ?",
                correct_answer="5/7",
                explanation="분모가 같은 분수의 덧셈은 분자끼리만 더합니다. 2 + 3 = 5이므로 답은 5/7입니다.",
                tags=["분수", "덧셈", "연산"],
                created_by=teacher.id,
            ),
            Problem(
                title="시간 계산하기",
                problem_type=ProblemType.SHORT_ANSWER,
                difficulty_level=DifficultyLevel.EASY,
                subject="수학",
                grade_level="2학년",
                reading_content="""시계를 읽는 방법을 배워봅시다.

시계에는 짧은 바늘(시침)과 긴 바늘(분침)이 있습니다.
- 짧은 바늘(시침): 시간을 나타냅니다
- 긴 바늘(분침): 분을 나타냅니다

긴 바늘이 12를 가리키면 정각입니다.
긴 바늘이 6을 가리키면 30분입니다.

예시: 짧은 바늘이 3과 4 사이에, 긴 바늘이 12에 있으면 3시 정각입니다.""",
                question_text="짧은 바늘이 7과 8 사이에, 긴 바늘이 6을 가리키고 있습니다. 몇 시 몇 분일까요? (예: 3시 30분)",
                correct_answer="7시 30분",
                explanation="짧은 바늘이 7과 8 사이에 있으므로 7시이고, 긴 바늘이 6을 가리키므로 30분입니다.",
                tags=["시간", "시계읽기"],
                created_by=teacher.id,
            ),
            Problem(
                title="구구단 3단",
                problem_type=ProblemType.MULTIPLE_CHOICE,
                difficulty_level=DifficultyLevel.EASY,
                subject="수학",
                grade_level="2학년",
                reading_content="""구구단은 곱셈을 빠르게 계산하는 방법입니다.

3단은 3씩 증가하는 패턴을 가지고 있습니다:
3 × 1 = 3
3 × 2 = 6
3 × 3 = 9
3 × 4 = 12
3 × 5 = 15

3개씩 묶음이 있을 때, 전체 개수를 빠르게 계산할 수 있습니다.
예를 들어, 사탕 3개가 든 봉지가 4개 있다면 3 × 4 = 12개입니다.""",
                question_text="3 × 7 = ?",
                correct_answer="A",
                answer_options={
                    "A": "21",
                    "B": "18",
                    "C": "24",
                    "D": "27",
                },
                explanation="3을 7번 더하면 21입니다. 3+3+3+3+3+3+3 = 21",
                tags=["구구단", "곱셈", "3단"],
                created_by=teacher.id,
            ),
        ]

        db.add_all(problems)
        db.commit()

        print(f"✓ Created {len(problems)} sample problems")
        print("\n" + "="*50)
        print("Database seeded successfully!")
        print("="*50)
        print("\nDemo credentials:")
        print("  Student - username: student, password: password123")
        print("  Teacher - username: teacher, password: password123")
        print("\n" + "="*50)

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
