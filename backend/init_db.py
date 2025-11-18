"""
데이터베이스 초기화 및 샘플 데이터 생성 스크립트
"""

from app.database import engine, SessionLocal
from app.models import Base, Problem

def init_database():
    """데이터베이스 테이블 생성 및 샘플 문제 추가"""

    # 테이블 생성
    Base.metadata.create_all(bind=engine)
    print("✅ 데이터베이스 테이블 생성 완료")

    # 세션 생성
    db = SessionLocal()

    try:
        # 기존 문제 확인
        existing_problems = db.query(Problem).count()
        if existing_problems > 0:
            print(f"ℹ️  이미 {existing_problems}개의 문제가 있습니다.")
            return

        # 샘플 문제 추가
        sample_problems = [
            Problem(
                problem_type="fraction_addition",
                question_text="1/2 + 1/3 = ?",
                correct_numerator=5,
                correct_denominator=6,
                difficulty="medium"
            ),
            Problem(
                problem_type="fraction_addition",
                question_text="1/4 + 1/4 = ?",
                correct_numerator=1,
                correct_denominator=2,
                difficulty="easy"
            ),
            Problem(
                problem_type="fraction_addition",
                question_text="2/3 + 1/6 = ?",
                correct_numerator=5,
                correct_denominator=6,
                difficulty="medium"
            ),
            Problem(
                problem_type="fraction_addition",
                question_text="3/4 + 1/8 = ?",
                correct_numerator=7,
                correct_denominator=8,
                difficulty="hard"
            ),
            Problem(
                problem_type="fraction_addition",
                question_text="1/5 + 2/5 = ?",
                correct_numerator=3,
                correct_denominator=5,
                difficulty="easy"
            ),
        ]

        for problem in sample_problems:
            db.add(problem)

        db.commit()
        print(f"✅ {len(sample_problems)}개의 샘플 문제 추가 완료")

    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("🔧 데이터베이스 초기화 중...")
    init_database()
    print("✅ 완료!")
