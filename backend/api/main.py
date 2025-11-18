"""
Condition Morph API Server
FastAPI 기반 백엔드 서버
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import asyncio
import json
import logging

# 로컬 모듈
from backend.models.recurrence import RecurrenceRelation
from backend.services.recurrence_parser import RecurrenceParser
from backend.services.condition_morpher import (
    ConditionMorpher,
    StudentState,
    StudentAttempt,
    MorphTrigger
)
from backend.services.moodle_integration import MoodleIntegrationService, MoodleConfig

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI 앱 생성
app = FastAPI(
    title="Condition Morph API",
    description="실시간 점화식 조건 변경 시스템",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== Pydantic Models (Request/Response) =====

class ProblemCreate(BaseModel):
    name: str = Field(..., description="문제 이름")
    description: str = Field(default="", description="문제 설명")
    expression: str = Field(..., description="점화식 표현 (예: a_n = 2*a_{n-1} + 1)")
    initial_conditions: Dict[str, float] = Field(..., description="초기값 (예: {'0': 1})")
    difficulty_level: int = Field(default=1, ge=1, le=5, description="난이도 (1-5)")


class ProblemResponse(BaseModel):
    id: str
    name: str
    description: str
    expression: str
    order: int
    initial_conditions: Dict[int, float]
    difficulty_level: int
    concept_tags: List[str]


class AnswerSubmission(BaseModel):
    student_id: str = Field(..., description="학생 ID")
    problem_id: str = Field(..., description="문제 ID")
    session_id: Optional[str] = Field(None, description="세션 ID")
    n_value: int = Field(..., ge=0, description="계산할 항 번호")
    answer: float = Field(..., description="학생의 답안")
    time_spent_seconds: int = Field(..., ge=0, description="소요 시간 (초)")


class MorphResponse(BaseModel):
    is_correct: bool
    morphed: bool
    new_problem: Optional[Dict[str, Any]] = None
    feedback: str
    student_state: Dict[str, Any]
    expected_value: float


class StudentStateResponse(BaseModel):
    student_id: str
    consecutive_correct: int
    consecutive_wrong: int
    total_correct: int
    total_attempts: int
    mastery_score: float
    difficulty_level: int


class MoodleImportRequest(BaseModel):
    course_id: int
    category_id: Optional[int] = None


# ===== In-Memory Storage (프로토타입용) =====
# 프로덕션에서는 PostgreSQL + Redis 사용

problems_db: Dict[str, RecurrenceRelation] = {}
student_states_db: Dict[str, StudentState] = {}


# ===== WebSocket Connection Manager =====

class ConnectionManager:
    """WebSocket 연결 관리"""

    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, student_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[student_id] = websocket
        logger.info(f"Student {student_id} connected via WebSocket")

    def disconnect(self, student_id: str):
        if student_id in self.active_connections:
            del self.active_connections[student_id]
            logger.info(f"Student {student_id} disconnected")

    async def send_message(self, student_id: str, message: dict):
        """특정 학생에게 메시지 전송"""
        if student_id in self.active_connections:
            websocket = self.active_connections[student_id]
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Failed to send message to {student_id}: {e}")

    async def broadcast(self, message: dict):
        """모든 연결된 클라이언트에 브로드캐스트"""
        for student_id, websocket in self.active_connections.items():
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Failed to broadcast to {student_id}: {e}")


manager = ConnectionManager()


# ===== 의존성 =====

def get_morpher() -> ConditionMorpher:
    """Condition Morpher 인스턴스 제공"""
    morpher = ConditionMorpher({
        'min_correct_threshold': 3,
        'min_wrong_threshold': 3,
        'time_threshold_seconds': 120
    })

    # 이벤트 핸들러 등록
    def on_morph(event: dict):
        # 로그 출력
        logger.info(f"Morph Event: {event['trigger']} for student {event['student_id']}")

        # WebSocket으로 푸시 (비동기 처리 필요)
        asyncio.create_task(manager.send_message(
            event['student_id'],
            {
                'type': 'morph_event',
                'data': event
            }
        ))

    morpher.on_morph_event(on_morph)

    return morpher


# ===== API 엔드포인트 =====

@app.get("/")
async def root():
    """API 루트"""
    return {
        "name": "Condition Morph API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """헬스 체크"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


# ----- 문제 관리 -----

@app.get("/api/problems", response_model=List[ProblemResponse])
async def list_problems(
    difficulty: Optional[int] = Query(None, ge=1, le=5),
    concept: Optional[str] = Query(None)
):
    """문제 목록 조회"""
    problems = list(problems_db.values())

    # 필터링
    if difficulty is not None:
        problems = [p for p in problems if p.difficulty_level == difficulty]

    if concept:
        problems = [p for p in problems if concept in p.concept_tags]

    return [
        ProblemResponse(
            id=p.id or str(hash(p.expression)),
            name=p.name,
            description=p.description,
            expression=p.expression,
            order=p.order,
            initial_conditions=p.initial_conditions,
            difficulty_level=p.difficulty_level,
            concept_tags=p.concept_tags
        )
        for p in problems
    ]


@app.get("/api/problems/{problem_id}", response_model=ProblemResponse)
async def get_problem(problem_id: str):
    """문제 상세 조회"""
    if problem_id not in problems_db:
        raise HTTPException(status_code=404, detail="Problem not found")

    problem = problems_db[problem_id]

    return ProblemResponse(
        id=problem_id,
        name=problem.name,
        description=problem.description,
        expression=problem.expression,
        order=problem.order,
        initial_conditions=problem.initial_conditions,
        difficulty_level=problem.difficulty_level,
        concept_tags=problem.concept_tags
    )


@app.post("/api/problems", response_model=Dict[str, str])
async def create_problem(problem: ProblemCreate):
    """새 문제 생성"""
    parser = RecurrenceParser()

    try:
        # 초기값 변환 (str key → int key)
        initial_conditions = {int(k): float(v) for k, v in problem.initial_conditions.items()}

        # 파싱
        recurrence = parser.parse(problem.expression, initial_conditions)

        # 메타데이터 설정
        recurrence.name = problem.name
        recurrence.description = problem.description
        recurrence.difficulty_level = problem.difficulty_level

        # ID 생성
        problem_id = str(hash(problem.expression + str(datetime.now())))
        recurrence.id = problem_id

        # 저장
        problems_db[problem_id] = recurrence

        logger.info(f"Created problem {problem_id}: {problem.name}")

        return {"id": problem_id, "status": "created"}

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create problem: {str(e)}")


@app.delete("/api/problems/{problem_id}")
async def delete_problem(problem_id: str):
    """문제 삭제"""
    if problem_id not in problems_db:
        raise HTTPException(status_code=404, detail="Problem not found")

    del problems_db[problem_id]

    return {"status": "deleted", "problem_id": problem_id}


# ----- 답안 제출 및 Morphing -----

@app.post("/api/submit", response_model=MorphResponse)
async def submit_answer(
    submission: AnswerSubmission,
    morpher: ConditionMorpher = Depends(get_morpher)
):
    """
    답안 제출 및 Morphing 처리

    핵심 API - 실시간 조건 변경의 중심
    """
    # 1. 문제 조회
    if submission.problem_id not in problems_db:
        raise HTTPException(status_code=404, detail="Problem not found")

    problem = problems_db[submission.problem_id]

    # 2. 정답 계산
    try:
        expected_value = problem.evaluate(submission.n_value)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to evaluate problem: {str(e)}")

    # 3. 정답 확인
    is_correct = abs(submission.answer - expected_value) < 0.01  # 소수점 오차 허용

    # 4. 학생 상태 조회 또는 생성
    state_key = f"{submission.student_id}:{submission.problem_id}"
    if state_key not in student_states_db:
        student_states_db[state_key] = StudentState(
            student_id=submission.student_id,
            current_problem=problem,
            session_id=submission.session_id
        )

    state = student_states_db[state_key]

    # 5. 시도 기록
    attempt = StudentAttempt(
        timestamp=datetime.now(),
        problem_id=submission.problem_id,
        answer=submission.answer,
        expected_value=expected_value,
        is_correct=is_correct,
        time_spent_seconds=submission.time_spent_seconds,
        problem_expression=problem.expression,
        difficulty_level=problem.difficulty_level
    )

    state.update(attempt)

    # 6. Morphing 평가
    new_problem = morpher.morph(problem, state)
    morphed = (new_problem.expression != problem.expression)

    # 7. Morphing 발생 시 문제 업데이트
    if morphed:
        # 새 문제 ID 생성 및 저장
        new_problem_id = str(hash(new_problem.expression + str(datetime.now())))
        new_problem.id = new_problem_id
        problems_db[new_problem_id] = new_problem

        # 학생 상태 업데이트
        state.current_problem = new_problem

        logger.info(f"Morphed problem for student {submission.student_id}: "
                   f"{problem.expression} → {new_problem.expression}")

    # 8. 피드백 생성
    feedback = _generate_feedback(is_correct, state, morphed)

    return MorphResponse(
        is_correct=is_correct,
        morphed=morphed,
        new_problem=new_problem.to_dict() if morphed else None,
        feedback=feedback,
        student_state=state.to_dict(),
        expected_value=expected_value
    )


def _generate_feedback(is_correct: bool, state: StudentState, morphed: bool) -> str:
    """피드백 메시지 생성"""
    if is_correct:
        if state.consecutive_correct >= 3:
            return "정답입니다! 연속으로 잘 풀고 있네요. 조금 더 어려운 문제로 넘어가 볼까요?"
        else:
            return "정답입니다! 계속 열심히 해보세요!"
    else:
        if state.consecutive_wrong >= 3:
            return "틀렸습니다. 조금 더 쉬운 문제부터 다시 시작해 봅시다."
        elif state.consecutive_wrong >= 2:
            return "틀렸습니다. 천천히 다시 생각해 보세요."
        else:
            return "틀렸습니다. 다시 한번 시도해 보세요!"


# ----- 학생 상태 조회 -----

@app.get("/api/student/{student_id}/state", response_model=StudentStateResponse)
async def get_student_state(student_id: str, problem_id: Optional[str] = None):
    """학생 현재 상태 조회"""
    # 특정 문제의 상태 또는 전체 평균
    if problem_id:
        state_key = f"{student_id}:{problem_id}"
        if state_key not in student_states_db:
            raise HTTPException(status_code=404, detail="Student state not found")

        state = student_states_db[state_key]

        return StudentStateResponse(
            student_id=state.student_id,
            consecutive_correct=state.consecutive_correct,
            consecutive_wrong=state.consecutive_wrong,
            total_correct=state.total_correct,
            total_attempts=state.total_attempts,
            mastery_score=state.mastery_score,
            difficulty_level=state.difficulty_level
        )
    else:
        # 전체 평균 계산
        states = [s for k, s in student_states_db.items() if k.startswith(f"{student_id}:")]

        if not states:
            raise HTTPException(status_code=404, detail="No states found for student")

        total_attempts = sum(s.total_attempts for s in states)
        total_correct = sum(s.total_correct for s in states)
        avg_mastery = sum(s.mastery_score for s in states) / len(states)

        return StudentStateResponse(
            student_id=student_id,
            consecutive_correct=0,
            consecutive_wrong=0,
            total_correct=total_correct,
            total_attempts=total_attempts,
            mastery_score=avg_mastery,
            difficulty_level=1
        )


@app.get("/api/student/{student_id}/history")
async def get_student_history(student_id: str, limit: int = Query(50, ge=1, le=100)):
    """학생 시도 이력 조회"""
    # 모든 상태에서 시도 이력 수집
    all_attempts = []

    for state_key, state in student_states_db.items():
        if state_key.startswith(f"{student_id}:"):
            all_attempts.extend(state.attempts)

    # 최신순 정렬
    all_attempts.sort(key=lambda a: a.timestamp, reverse=True)

    # 제한
    all_attempts = all_attempts[:limit]

    return {
        'student_id': student_id,
        'total_attempts': len(all_attempts),
        'attempts': [
            {
                'timestamp': a.timestamp.isoformat(),
                'problem_id': a.problem_id,
                'answer': a.answer,
                'expected_value': a.expected_value,
                'is_correct': a.is_correct,
                'time_spent_seconds': a.time_spent_seconds,
                'problem_expression': a.problem_expression,
                'difficulty_level': a.difficulty_level
            }
            for a in all_attempts
        ]
    }


# ----- 수동 Morphing (교사용) -----

@app.post("/api/morph/manual")
async def manual_morph(
    student_id: str,
    problem_id: str,
    target_difficulty: Optional[int] = Query(None, ge=1, le=5),
    target_concept: Optional[str] = None,
    morpher: ConditionMorpher = Depends(get_morpher)
):
    """수동 Morphing (교사용)"""
    # 학생 상태 조회
    state_key = f"{student_id}:{problem_id}"
    if state_key not in student_states_db:
        raise HTTPException(status_code=404, detail="Student state not found")

    state = student_states_db[state_key]

    # Morphing 수행
    new_problem = morpher.manual_morph(state, target_difficulty, target_concept)

    # 새 문제 저장
    new_problem_id = str(hash(new_problem.expression + str(datetime.now())))
    new_problem.id = new_problem_id
    problems_db[new_problem_id] = new_problem

    # 상태 업데이트
    state.current_problem = new_problem

    # WebSocket으로 학생에게 푸시
    await manager.send_message(student_id, {
        'type': 'manual_morph',
        'morphed': True,
        'new_problem': new_problem.to_dict(),
        'reason': 'teacher_adjustment'
    })

    return {
        'status': 'morphed',
        'new_problem_id': new_problem_id,
        'new_problem': new_problem.to_dict()
    }


# ----- Moodle 연동 -----

@app.post("/api/moodle/import")
async def import_from_moodle(request: MoodleImportRequest):
    """Moodle에서 문제 가져오기"""
    # Moodle 설정 (환경 변수에서 읽어야 함)
    # 여기서는 예시로 하드코딩
    config = MoodleConfig(
        moodle_url="https://lms.kaist.ac.kr",
        webservice_token="your_token_here",
        db_host="moodle_db_host",
        db_user="readonly_user",
        db_password="password"
    )

    service = MoodleIntegrationService(config)

    try:
        # 문제 가져오기
        recurrences = service.import_questions_from_course(
            request.course_id,
            request.category_id
        )

        # 저장
        imported_ids = []
        for rec in recurrences:
            problem_id = rec.id or str(hash(rec.expression + str(datetime.now())))
            rec.id = problem_id
            problems_db[problem_id] = rec
            imported_ids.append(problem_id)

        logger.info(f"Imported {len(imported_ids)} problems from Moodle course {request.course_id}")

        return {
            'status': 'success',
            'imported_count': len(imported_ids),
            'problem_ids': imported_ids
        }

    except Exception as e:
        logger.error(f"Failed to import from Moodle: {e}")
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")


@app.get("/api/moodle/courses")
async def list_moodle_courses():
    """Moodle 코스 목록"""
    # 구현 필요
    return {"message": "Not implemented yet"}


# ----- WebSocket -----

@app.websocket("/ws/{student_id}")
async def websocket_endpoint(websocket: WebSocket, student_id: str):
    """WebSocket 엔드포인트"""
    await manager.connect(student_id, websocket)

    try:
        while True:
            # 클라이언트로부터 메시지 수신
            data = await websocket.receive_json()

            # Ping/Pong 처리
            if data.get('type') == 'ping':
                await websocket.send_json({'type': 'pong'})
                continue

            # 기타 메시지 처리 (필요시)
            logger.info(f"Received message from {student_id}: {data}")

    except WebSocketDisconnect:
        manager.disconnect(student_id)
    except Exception as e:
        logger.error(f"WebSocket error for {student_id}: {e}")
        manager.disconnect(student_id)


# ===== 시작 시 초기화 =====

@app.on_event("startup")
async def startup_event():
    """앱 시작 시 초기화"""
    logger.info("Condition Morph API starting up...")

    # 샘플 문제 로드
    from backend.models.recurrence import (
        create_arithmetic_sequence,
        create_geometric_sequence,
        create_fibonacci_sequence
    )

    samples = [
        create_arithmetic_sequence(1, 2),
        create_geometric_sequence(1, 2),
        create_fibonacci_sequence()
    ]

    for sample in samples:
        problem_id = str(hash(sample.expression))
        sample.id = problem_id
        problems_db[problem_id] = sample

    logger.info(f"Loaded {len(problems_db)} sample problems")
    logger.info("Condition Morph API ready!")


@app.on_event("shutdown")
async def shutdown_event():
    """앱 종료 시 정리"""
    logger.info("Condition Morph API shutting down...")
    # 연결 정리 등


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
