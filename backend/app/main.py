from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import os
from dotenv import load_dotenv

from . import models, schemas
from .database import engine, get_db
from .services.ai_service import ai_service

load_dotenv()

# 데이터베이스 테이블 생성
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="LMS Wrong Answer Prediction System",
    description="AI-powered wrong answer prediction for educational platforms",
    version="1.0.0"
)

# CORS 설정
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "LMS Wrong Answer Prediction API", "status": "running"}


@app.get("/api/problems", response_model=List[schemas.Problem])
def get_problems(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """문제 목록 조회"""
    problems = db.query(models.Problem).offset(skip).limit(limit).all()
    return problems


@app.get("/api/problems/{problem_id}", response_model=schemas.Problem)
def get_problem(problem_id: int, db: Session = Depends(get_db)):
    """특정 문제 조회"""
    problem = db.query(models.Problem).filter(models.Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    return problem


@app.post("/api/problems", response_model=schemas.Problem)
def create_problem(problem: schemas.ProblemCreate, db: Session = Depends(get_db)):
    """새 문제 생성"""
    db_problem = models.Problem(**problem.dict())
    db.add(db_problem)
    db.commit()
    db.refresh(db_problem)
    return db_problem


@app.post("/api/predict", response_model=schemas.PredictionResponse)
def predict_answer(request: schemas.PredictionRequest, db: Session = Depends(get_db)):
    """
    학생이 답을 제출하기 전에 AI로 오답 여부를 예측합니다.
    오답일 가능성이 높으면 팝업을 표시하기 위한 정보를 반환합니다.
    """
    try:
        prediction = ai_service.predict_wrong_answer(
            student_answer_num=request.answer_numerator,
            student_answer_den=request.answer_denominator,
            correct_answer_num=request.correct_numerator,
            correct_answer_den=request.correct_denominator,
            student_id=request.student_id,
            problem_type="fraction_addition"
        )

        # 예측 결과 데이터베이스에 저장 (나중에 분석용)
        db_prediction = models.AnswerPrediction(
            student_id=request.student_id,
            problem_id=request.problem_id,
            submitted_answer=f"{request.answer_numerator}/{request.answer_denominator}",
            predicted_error_type=prediction.get("error_type"),
            prediction_confidence=prediction.get("confidence"),
            suggestion_text=prediction.get("suggestion"),
            shown_to_student=prediction.get("is_likely_wrong", False)
        )
        db.add(db_prediction)
        db.commit()

        return schemas.PredictionResponse(**prediction)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post("/api/submit", response_model=schemas.AttemptResponse)
def submit_answer(answer: schemas.AnswerSubmit, db: Session = Depends(get_db)):
    """
    학생의 최종 답안을 제출하고 결과를 반환합니다.
    """
    # 문제 조회
    problem = db.query(models.Problem).filter(models.Problem.id == answer.problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    # 정답 확인
    from math import gcd

    def simplify(num, den):
        if den == 0:
            return (num, den)
        g = gcd(abs(num), abs(den))
        return (num // g, den // g)

    student_simplified = simplify(answer.answer_numerator, answer.answer_denominator)
    correct_simplified = simplify(problem.correct_numerator, problem.correct_denominator)

    is_correct = student_simplified == correct_simplified

    # 답안 기록
    db_attempt = models.StudentAttempt(
        student_id=answer.student_id,
        problem_id=answer.problem_id,
        answer_numerator=answer.answer_numerator,
        answer_denominator=answer.answer_denominator,
        is_correct=is_correct
    )
    db.add(db_attempt)
    db.commit()
    db.refresh(db_attempt)

    # 응답 생성
    correct_answer_str = f"{problem.correct_numerator}/{problem.correct_denominator}"
    message = "정답입니다! 잘했어요!" if is_correct else f"아쉽지만 틀렸어요. 정답은 {correct_answer_str}입니다."

    return schemas.AttemptResponse(
        id=db_attempt.id,
        is_correct=is_correct,
        prediction_was_shown=False,  # 실제로는 세션에서 추적해야 함
        correct_answer=correct_answer_str,
        message=message
    )


@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    """시스템 통계"""
    total_problems = db.query(models.Problem).count()
    total_attempts = db.query(models.StudentAttempt).count()
    correct_attempts = db.query(models.StudentAttempt).filter(
        models.StudentAttempt.is_correct == True
    ).count()
    total_predictions = db.query(models.AnswerPrediction).count()

    accuracy = (correct_attempts / total_attempts * 100) if total_attempts > 0 else 0

    return {
        "total_problems": total_problems,
        "total_attempts": total_attempts,
        "correct_attempts": correct_attempts,
        "accuracy_rate": round(accuracy, 2),
        "total_predictions": total_predictions
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
