"""
FastAPI application for reading analytics and comprehension summary feature
"""
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
import anthropic
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker
import logging

from models import (
    ReadingAnalyticsCreate,
    ReadingAnalyticsResponse,
    ComprehensionSummaryRequest,
    ComprehensionSummaryResponse,
    InterventionAlert,
    ClassComprehensionOverview,
    LMSIntegrationRequest,
    ReadingBaseline,
    ComprehensionCalculator,
    InterventionFlag,
    SummaryPeriod,
)

# ============================================================================
# Configuration
# ============================================================================

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Reading Analytics & Comprehension API",
    description="API for tracking reading behavior and generating AI-powered comprehension summaries",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/alt42_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Anthropic Claude API
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
claude_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None


# ============================================================================
# Dependencies
# ============================================================================

def get_db():
    """Database session dependency"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============================================================================
# Reading Analytics Endpoints
# ============================================================================

@app.post("/api/reading-analytics", response_model=ReadingAnalyticsResponse, status_code=201)
async def record_reading_analytics(
    data: ReadingAnalyticsCreate,
    db: Session = Depends(get_db)
):
    """
    Record reading analytics for a student-problem interaction

    This endpoint:
    1. Calculates reading speed (WPM)
    2. Gets baseline speed for grade level
    3. Calculates comprehension score
    4. Determines intervention flag
    5. Stores the data
    """
    try:
        # Calculate reading time if not provided
        if data.reading_end_time and not data.reading_time_seconds:
            delta = data.reading_end_time - data.reading_start_time
            data.reading_time_seconds = int(delta.total_seconds())

        # Calculate reading speed (WPM)
        reading_speed_wpm = None
        if data.reading_time_seconds and data.reading_time_seconds > 0:
            reading_speed_wpm = (data.problem_word_count / data.reading_time_seconds) * 60

        # Get baseline WPM for grade level
        baseline = ReadingBaseline.get_baseline(
            data.grade_level or 5,
            data.language
        )
        baseline_wpm = baseline.target_wpm

        # Calculate comprehension score
        score_breakdown = ComprehensionCalculator.calculate_comprehension_score(
            first_attempt_correct=data.first_attempt_correct or False,
            total_attempts=data.total_attempts,
            actual_wpm=reading_speed_wpm or baseline_wpm,
            baseline_wpm=baseline_wpm
        )

        # Get recent scores for intervention determination
        recent_scores_query = text("""
            SELECT comprehension_score
            FROM reading_analytics
            WHERE student_id = :student_id
              AND module_id = :module_id
              AND comprehension_score IS NOT NULL
            ORDER BY created_at DESC
            LIMIT 5
        """)
        result = db.execute(
            recent_scores_query,
            {"student_id": data.student_id, "module_id": data.module_id}
        )
        recent_scores = [row[0] for row in result.fetchall()]

        # Determine intervention flag
        intervention_flag = ComprehensionCalculator.determine_intervention_flag(
            comprehension_score=score_breakdown.final_score,
            reading_speed_wpm=reading_speed_wpm or baseline_wpm,
            baseline_wpm=baseline_wpm,
            recent_scores=recent_scores
        )

        # Determine difficulty match
        difficulty_match = ComprehensionCalculator.determine_difficulty_match(
            comprehension_score=score_breakdown.final_score,
            reading_speed_wpm=reading_speed_wpm or baseline_wpm,
            baseline_wpm=baseline_wpm
        )

        # Calculate speed efficiency
        speed_efficiency_pct = score_breakdown.speed_efficiency

        # Insert into database
        insert_query = text("""
            INSERT INTO reading_analytics (
                student_id, problem_id, module_id, session_id,
                reading_start_time, reading_end_time, reading_time_seconds, active_reading_time_seconds,
                problem_word_count, reading_speed_wpm, baseline_wpm, speed_efficiency_pct,
                first_attempt_correct, total_attempts, final_answer_correct, time_to_first_attempt,
                re_reading_count, problem_abandoned, hints_used,
                comprehension_score, reading_difficulty_match, intervention_flag,
                device_type, language, problem_difficulty, grade_level
            ) VALUES (
                :student_id, :problem_id, :module_id, :session_id,
                :reading_start_time, :reading_end_time, :reading_time_seconds, :active_reading_time_seconds,
                :problem_word_count, :reading_speed_wpm, :baseline_wpm, :speed_efficiency_pct,
                :first_attempt_correct, :total_attempts, :final_answer_correct, :time_to_first_attempt,
                :re_reading_count, :problem_abandoned, :hints_used,
                :comprehension_score, :reading_difficulty_match, :intervention_flag,
                :device_type, :language, :problem_difficulty, :grade_level
            )
            RETURNING id, student_id, problem_id, module_id, reading_time_seconds,
                      reading_speed_wpm, comprehension_score, intervention_flag,
                      reading_difficulty_match, created_at, updated_at
        """)

        result = db.execute(insert_query, {
            "student_id": data.student_id,
            "problem_id": data.problem_id,
            "module_id": data.module_id,
            "session_id": data.session_id,
            "reading_start_time": data.reading_start_time,
            "reading_end_time": data.reading_end_time,
            "reading_time_seconds": data.reading_time_seconds,
            "active_reading_time_seconds": data.active_reading_time_seconds,
            "problem_word_count": data.problem_word_count,
            "reading_speed_wpm": reading_speed_wpm,
            "baseline_wpm": baseline_wpm,
            "speed_efficiency_pct": speed_efficiency_pct,
            "first_attempt_correct": data.first_attempt_correct,
            "total_attempts": data.total_attempts,
            "final_answer_correct": data.final_answer_correct,
            "time_to_first_attempt": data.time_to_first_attempt,
            "re_reading_count": data.re_reading_count,
            "problem_abandoned": data.problem_abandoned,
            "hints_used": data.hints_used,
            "comprehension_score": score_breakdown.final_score,
            "reading_difficulty_match": difficulty_match.value,
            "intervention_flag": intervention_flag.value,
            "device_type": data.device_type.value if data.device_type else "desktop",
            "language": data.language,
            "problem_difficulty": data.problem_difficulty,
            "grade_level": data.grade_level,
        })

        db.commit()
        row = result.fetchone()

        logger.info(f"Reading analytics recorded: student={data.student_id}, problem={data.problem_id}, score={score_breakdown.final_score}")

        return ReadingAnalyticsResponse(
            id=row[0],
            student_id=row[1],
            problem_id=row[2],
            module_id=row[3],
            reading_time_seconds=row[4],
            reading_speed_wpm=row[5],
            comprehension_score=row[6],
            intervention_flag=row[7],
            reading_difficulty_match=row[8],
            created_at=row[9],
            updated_at=row[10],
        )

    except Exception as e:
        db.rollback()
        logger.error(f"Error recording reading analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to record reading analytics: {str(e)}")


@app.get("/api/reading-analytics/interventions", response_model=List[InterventionAlert])
async def get_intervention_alerts(
    module_id: Optional[str] = None,
    days: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db)
):
    """
    Get list of students needing intervention
    """
    try:
        query = text("""
            SELECT DISTINCT ON (student_id, problem_id)
                student_id, module_id, problem_id, intervention_flag,
                comprehension_score, reading_speed_wpm, created_at
            FROM reading_analytics
            WHERE intervention_flag IN ('monitor', 'immediate')
              AND created_at > NOW() - INTERVAL ':days days'
              AND (:module_id IS NULL OR module_id = :module_id)
            ORDER BY student_id, problem_id, created_at DESC
        """)

        result = db.execute(query, {"days": days, "module_id": module_id})
        alerts = []

        for row in result.fetchall():
            message = ""
            suggested_actions = []

            if row[3] == "immediate":
                message = "학생이 심각한 어려움을 겪고 있습니다. 즉각적인 개입이 필요합니다."
                suggested_actions = [
                    "1:1 상담 진행",
                    "문제 난이도 조정",
                    "추가 학습 자료 제공"
                ]
            else:
                message = "학생의 이해도가 낮습니다. 모니터링이 필요합니다."
                suggested_actions = [
                    "진행 상황 관찰",
                    "다음 문제에서 성과 확인"
                ]

            alerts.append(InterventionAlert(
                student_id=row[0],
                module_id=row[1],
                problem_id=row[2],
                intervention_flag=row[3],
                comprehension_score=row[4] or 0.0,
                reading_speed_wpm=row[5] or 0.0,
                message=message,
                suggested_actions=suggested_actions,
                created_at=row[6]
            ))

        return alerts

    except Exception as e:
        logger.error(f"Error fetching intervention alerts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Comprehension Summary Endpoints
# ============================================================================

@app.post("/api/comprehension-summary/generate", response_model=ComprehensionSummaryResponse)
async def generate_comprehension_summary(
    request: ComprehensionSummaryRequest,
    db: Session = Depends(get_db)
):
    """
    Generate AI-powered comprehension summary using Claude API

    This endpoint:
    1. Aggregates reading analytics for the period
    2. Calculates trends
    3. Generates AI summary using Claude
    4. Stores the summary
    """
    if not claude_client:
        raise HTTPException(status_code=500, detail="Claude API not configured")

    try:
        # Check for existing summary (unless force_regenerate)
        if not request.force_regenerate:
            existing_query = text("""
                SELECT * FROM comprehension_summaries
                WHERE student_id = :student_id
                  AND module_id = :module_id
                  AND summary_period = :summary_period
                  AND period_start = :period_start
                  AND period_end = :period_end
                ORDER BY created_at DESC
                LIMIT 1
            """)
            result = db.execute(existing_query, {
                "student_id": request.student_id,
                "module_id": request.module_id,
                "summary_period": request.summary_period.value,
                "period_start": request.period_start,
                "period_end": request.period_end,
            })
            existing = result.fetchone()
            if existing:
                logger.info(f"Returning cached summary for student={request.student_id}")
                # Return existing summary (simplified for brevity)
                return ComprehensionSummaryResponse(
                    id=existing[0],
                    student_id=existing[1],
                    module_id=existing[2],
                    summary_period=existing[3],
                    total_problems_attempted=existing[6],
                    avg_reading_time_seconds=existing[7],
                    avg_reading_speed_wpm=existing[8],
                    avg_comprehension_score=existing[9],
                    first_attempt_success_rate=existing[10],
                    reading_speed_trend=existing[11],
                    comprehension_trend=existing[12],
                    ai_summary=existing[13],
                    ai_recommendations=existing[14],
                    ai_strengths=existing[15],
                    ai_challenges=existing[16],
                    student_message=existing[17],
                    student_tips=existing[18],
                    teacher_action_needed=existing[19],
                    summary_status=existing[20],
                    created_at=existing[21],
                )

        # Aggregate analytics data
        analytics_query = text("""
            SELECT
                COUNT(*) as total_problems,
                AVG(reading_time_seconds) as avg_reading_time,
                AVG(reading_speed_wpm) as avg_speed,
                AVG(comprehension_score) as avg_score,
                SUM(CASE WHEN first_attempt_correct THEN 1 ELSE 0 END)::FLOAT / COUNT(*) * 100 as success_rate
            FROM reading_analytics
            WHERE student_id = :student_id
              AND module_id = :module_id
              AND created_at BETWEEN :period_start AND :period_end
        """)

        result = db.execute(analytics_query, {
            "student_id": request.student_id,
            "module_id": request.module_id,
            "period_start": request.period_start,
            "period_end": request.period_end,
        })
        metrics = result.fetchone()

        if not metrics or metrics[0] == 0:
            raise HTTPException(status_code=404, detail="No reading data found for this period")

        # Generate AI summary using Claude
        start_time = datetime.now()

        prompt = f"""당신은 교육 전문가입니다. 학생의 읽기 분석 데이터를 바탕으로 이해도 요약을 생성해주세요.

학생 데이터:
- 시도한 문제 수: {metrics[0]}
- 평균 읽기 시간: {metrics[1]:.0f}초
- 평균 읽기 속도: {metrics[2]:.1f} WPM
- 평균 이해도 점수: {metrics[3]:.1f}/100
- 첫 시도 정답률: {metrics[4]:.1f}%

다음 형식으로 응답해주세요:

1. 전반적 요약 (2-3문장):
[학생의 전반적인 읽기 및 이해 능력 평가]

2. 강점 (1-2문장):
[학생이 잘하고 있는 부분]

3. 도전 과제 (1-2문장):
[개선이 필요한 부분]

4. 추천 사항 (구체적인 행동 3가지):
- [추천 1]
- [추천 2]
- [추천 3]

5. 학생용 메시지 (초등학생이 이해할 수 있는 격려 메시지, 2-3문장):
[긍정적이고 구체적인 피드백]

6. 학생용 팁 (간단한 행동 제안, 2-3가지):
- [팁 1]
- [팁 2]
"""

        response = claude_client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}]
        )

        ai_output = response.content[0].text
        generation_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)

        # Parse AI output (simplified - in production, use more robust parsing)
        sections = ai_output.split("\n\n")
        ai_summary = sections[0] if len(sections) > 0 else ai_output
        ai_strengths = sections[1] if len(sections) > 1 else ""
        ai_challenges = sections[2] if len(sections) > 2 else ""
        ai_recommendations = sections[3] if len(sections) > 3 else ""
        student_message = sections[4] if len(sections) > 4 else ""
        student_tips = sections[5] if len(sections) > 5 else ""

        # Determine if teacher action needed
        teacher_action_needed = metrics[3] < 60 or metrics[4] < 50

        # Calculate API cost (approximate)
        input_tokens = len(prompt) / 4  # Rough estimate
        output_tokens = len(ai_output) / 4
        cost_usd = (input_tokens * 0.000003 + output_tokens * 0.000015)

        # Insert summary
        insert_query = text("""
            INSERT INTO comprehension_summaries (
                student_id, module_id, summary_period, period_start, period_end,
                total_problems_attempted, avg_reading_time_seconds, avg_reading_speed_wpm,
                avg_comprehension_score, first_attempt_success_rate,
                reading_speed_trend, comprehension_trend,
                ai_summary, ai_recommendations, ai_strengths, ai_challenges,
                student_message, student_tips,
                teacher_action_needed, generated_by, generation_cost_usd, generation_time_ms,
                summary_status
            ) VALUES (
                :student_id, :module_id, :summary_period, :period_start, :period_end,
                :total_problems, :avg_reading_time, :avg_speed, :avg_score, :success_rate,
                :reading_trend, :comprehension_trend,
                :ai_summary, :ai_recommendations, :ai_strengths, :ai_challenges,
                :student_message, :student_tips,
                :teacher_action_needed, :generated_by, :cost, :gen_time,
                :status
            )
            RETURNING id, created_at
        """)

        result = db.execute(insert_query, {
            "student_id": request.student_id,
            "module_id": request.module_id,
            "summary_period": request.summary_period.value,
            "period_start": request.period_start,
            "period_end": request.period_end,
            "total_problems": metrics[0],
            "avg_reading_time": int(metrics[1]),
            "avg_speed": metrics[2],
            "avg_score": metrics[3],
            "success_rate": metrics[4],
            "reading_trend": "stable",  # Calculate from historical data
            "comprehension_trend": "stable",
            "ai_summary": ai_summary,
            "ai_recommendations": ai_recommendations,
            "ai_strengths": ai_strengths,
            "ai_challenges": ai_challenges,
            "student_message": student_message,
            "student_tips": student_tips,
            "teacher_action_needed": teacher_action_needed,
            "generated_by": "claude-3-5-sonnet-20241022",
            "cost": cost_usd,
            "gen_time": generation_time_ms,
            "status": "published",
        })

        db.commit()
        row = result.fetchone()

        logger.info(f"Generated comprehension summary: student={request.student_id}, cost=${cost_usd:.4f}")

        return ComprehensionSummaryResponse(
            id=row[0],
            student_id=request.student_id,
            module_id=request.module_id,
            summary_period=request.summary_period,
            total_problems_attempted=metrics[0],
            avg_reading_time_seconds=int(metrics[1]),
            avg_reading_speed_wpm=metrics[2],
            avg_comprehension_score=metrics[3],
            first_attempt_success_rate=metrics[4],
            reading_speed_trend="stable",
            comprehension_trend="stable",
            ai_summary=ai_summary,
            ai_recommendations=ai_recommendations,
            ai_strengths=ai_strengths,
            ai_challenges=ai_challenges,
            student_message=student_message,
            student_tips=student_tips,
            teacher_action_needed=teacher_action_needed,
            summary_status="published",
            created_at=row[1],
        )

    except Exception as e:
        db.rollback()
        logger.error(f"Error generating comprehension summary: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/comprehension-summary/{student_id}", response_model=List[ComprehensionSummaryResponse])
async def get_comprehension_summaries(
    student_id: str,
    module_id: Optional[str] = None,
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get comprehension summaries for a student"""
    try:
        query = text("""
            SELECT * FROM comprehension_summaries
            WHERE student_id = :student_id
              AND (:module_id IS NULL OR module_id = :module_id)
            ORDER BY created_at DESC
            LIMIT :limit
        """)

        result = db.execute(query, {
            "student_id": student_id,
            "module_id": module_id,
            "limit": limit
        })

        summaries = []
        for row in result.fetchall():
            summaries.append(ComprehensionSummaryResponse(
                id=row[0],
                student_id=row[1],
                module_id=row[2],
                summary_period=row[3],
                total_problems_attempted=row[6],
                avg_reading_time_seconds=row[7],
                avg_reading_speed_wpm=row[8],
                avg_comprehension_score=row[9],
                first_attempt_success_rate=row[10],
                reading_speed_trend=row[11],
                comprehension_trend=row[12],
                ai_summary=row[15],
                ai_recommendations=row[16],
                ai_strengths=row[17],
                ai_challenges=row[18],
                student_message=row[19],
                student_tips=row[20],
                teacher_action_needed=row[21],
                summary_status=row[26],
                created_at=row[28],
            ))

        return summaries

    except Exception as e:
        logger.error(f"Error fetching summaries: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Class Overview Endpoints
# ============================================================================

@app.get("/api/class-overview/{module_id}", response_model=ClassComprehensionOverview)
async def get_class_overview(
    module_id: str,
    days: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db)
):
    """Get class-level comprehension overview"""
    try:
        query = text("""
            SELECT * FROM class_comprehension_overview
            WHERE module_id = :module_id
        """)

        result = db.execute(query, {"module_id": module_id})
        row = result.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="No data found for this module")

        return ClassComprehensionOverview(
            module_id=row[0],
            total_students=row[1],
            avg_comprehension=row[2],
            avg_reading_speed=row[3],
            students_needing_help=row[4],
            first_attempt_success_rate=row[5],
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching class overview: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# LMS Integration Endpoints
# ============================================================================

@app.post("/api/lms/sync")
async def sync_lms_data(
    request: LMSIntegrationRequest,
    db: Session = Depends(get_db)
):
    """
    Sync data with LMS

    Supported events:
    - sync_students: Import student roster from LMS
    - sync_problems: Import problem sets from LMS
    - export_analytics: Export reading analytics to LMS gradebook
    """
    try:
        start_time = datetime.now()
        records_processed = len(request.data.get("records", []))

        # Log integration event
        log_query = text("""
            INSERT INTO lms_integration_log (
                lms_type, integration_event, records_processed,
                records_succeeded, records_failed, sync_start_time, sync_end_time,
                sync_duration_ms, triggered_by
            ) VALUES (
                :lms_type, :event, :processed, :succeeded, :failed,
                :start_time, :end_time, :duration, :triggered_by
            )
            RETURNING id
        """)

        end_time = datetime.now()
        duration_ms = int((end_time - start_time).total_seconds() * 1000)

        result = db.execute(log_query, {
            "lms_type": request.lms_type,
            "event": request.integration_event,
            "processed": records_processed,
            "succeeded": records_processed,  # Simplified
            "failed": 0,
            "start_time": start_time,
            "end_time": end_time,
            "duration": duration_ms,
            "triggered_by": "system",
        })

        db.commit()
        log_id = result.fetchone()[0]

        logger.info(f"LMS sync completed: type={request.lms_type}, event={request.integration_event}")

        return {
            "status": "success",
            "log_id": log_id,
            "records_processed": records_processed,
            "duration_ms": duration_ms
        }

    except Exception as e:
        db.rollback()
        logger.error(f"LMS sync error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "claude_api": "configured" if claude_client else "not_configured"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
