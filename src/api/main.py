"""
FastAPI Application - LMS Integration & Quality Scoring
=======================================================
RESTful API for Moodle LMS integration and quality score management.

Author: AI Agent (Claude)
Date: 2025-11-18
Version: 1.0.0
"""

from fastapi import FastAPI, HTTPException, Depends, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import logging
from dotenv import load_dotenv


# Load environment variables
load_dotenv()


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ============================================================================
# FastAPI Application
# ============================================================================

app = FastAPI(
    title="LMS Integration API",
    description="Moodle LMS integration with AI-powered quality score evaluation",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)


# ============================================================================
# CORS Configuration
# ============================================================================

origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Database Connection
# ============================================================================

def get_db():
    """Database connection dependency"""
    conn = psycopg2.connect(
        os.getenv('DATABASE_URL'),
        cursor_factory=RealDictCursor
    )
    try:
        yield conn
    finally:
        conn.close()


# ============================================================================
# Pydantic Models
# ============================================================================

class QualityScoreResponse(BaseModel):
    """Quality score response model"""
    id: str
    student_id: str
    student_name: str
    total_score: float
    grade_letter: str
    comprehension_score: float
    analysis_score: float
    synthesis_score: float
    logical_reasoning_score: float
    creativity_score: float
    clarity_score: float
    detailed_feedback: str
    strengths: List[str]
    areas_for_improvement: List[str]
    confidence_level: float
    evaluated_at: datetime


class StudentScoreSummary(BaseModel):
    """Student score summary model"""
    student_id: str
    student_name: str
    total_responses: int
    avg_score: float
    recent_scores: List[float]
    last_evaluated_at: Optional[datetime]


class EvaluationJobStatus(BaseModel):
    """Evaluation job status model"""
    job_id: str
    status: str
    total_responses: int
    evaluated_count: int
    failed_count: int
    avg_score: Optional[float]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    duration_seconds: Optional[int]


class EvaluationTriggerRequest(BaseModel):
    """Request to trigger manual evaluation"""
    course_id: Optional[int] = None
    lookback_days: int = Field(default=1, ge=1, le=30)


# ============================================================================
# Health Check Endpoints
# ============================================================================

@app.get("/", tags=["Health"])
async def root():
    """Root endpoint - API information"""
    return {
        "name": "LMS Integration API",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/health", tags=["Health"])
async def health_check(db=Depends(get_db)):
    """Health check endpoint"""
    try:
        # Test database connection
        with db.cursor() as cursor:
            cursor.execute("SELECT 1")

        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
        )


# ============================================================================
# Quality Score Endpoints
# ============================================================================

@app.get("/api/quality-scores/student/{student_id}", tags=["Quality Scores"])
async def get_student_scores(
    student_id: str,
    limit: int = Query(default=10, ge=1, le=100),
    db=Depends(get_db)
):
    """Get quality scores for a specific student"""
    try:
        with db.cursor() as cursor:
            # Get student info
            cursor.execute("""
                SELECT id, moodle_user_id, full_name
                FROM moodle_students
                WHERE id = %s::uuid
            """, (student_id,))

            student = cursor.fetchone()

            if not student:
                raise HTTPException(status_code=404, detail="Student not found")

            # Get quality scores
            cursor.execute("""
                SELECT
                    qs.id::text,
                    qs.moodle_student_id::text as student_id,
                    ms.full_name as student_name,
                    qs.total_score,
                    qs.grade_letter,
                    qs.comprehension_score,
                    qs.analysis_score,
                    qs.synthesis_score,
                    qs.logical_reasoning_score,
                    qs.creativity_score,
                    qs.clarity_score,
                    qs.ai_analysis as detailed_feedback,
                    qs.ai_strengths as strengths,
                    qs.ai_improvements as areas_for_improvement,
                    qs.confidence_level,
                    qs.evaluated_at
                FROM quality_scores qs
                JOIN moodle_students ms ON qs.moodle_student_id = ms.id
                WHERE qs.moodle_student_id = %s::uuid
                ORDER BY qs.evaluated_at DESC
                LIMIT %s
            """, (student_id, limit))

            scores = cursor.fetchall()

            return {
                "student": dict(student),
                "scores": [dict(score) for score in scores]
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching student scores: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/quality-scores/response/{response_id}", tags=["Quality Scores"])
async def get_response_score(response_id: str, db=Depends(get_db)):
    """Get quality score for a specific response"""
    try:
        with db.cursor() as cursor:
            cursor.execute("""
                SELECT
                    qs.id::text,
                    qs.moodle_student_id::text as student_id,
                    ms.full_name as student_name,
                    sr.activity_name,
                    sr.response_text,
                    sr.submitted_at,
                    qs.total_score,
                    qs.grade_letter,
                    qs.comprehension_score,
                    qs.analysis_score,
                    qs.synthesis_score,
                    qs.logical_reasoning_score,
                    qs.creativity_score,
                    qs.clarity_score,
                    qs.ai_analysis as detailed_feedback,
                    qs.ai_strengths as strengths,
                    qs.ai_improvements as areas_for_improvement,
                    qs.confidence_level,
                    qs.evaluated_at,
                    qs.evaluation_duration_ms,
                    qs.ai_model_used
                FROM quality_scores qs
                JOIN student_responses sr ON qs.student_response_id = sr.id
                JOIN moodle_students ms ON qs.moodle_student_id = ms.id
                WHERE sr.id = %s::uuid
            """, (response_id,))

            score = cursor.fetchone()

            if not score:
                raise HTTPException(status_code=404, detail="Score not found for this response")

            return dict(score)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching response score: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/quality-scores/stats", tags=["Quality Scores"])
async def get_quality_stats(
    days: int = Query(default=30, ge=1, le=365),
    db=Depends(get_db)
):
    """Get overall quality score statistics"""
    try:
        with db.cursor() as cursor:
            cutoff_date = datetime.now() - timedelta(days=days)

            # Overall statistics
            cursor.execute("""
                SELECT
                    COUNT(*)::int as total_evaluations,
                    AVG(total_score)::numeric(5,2) as avg_score,
                    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_score)::numeric(5,2) as median_score,
                    MIN(total_score)::numeric(5,2) as min_score,
                    MAX(total_score)::numeric(5,2) as max_score,
                    STDDEV(total_score)::numeric(5,2) as std_dev
                FROM quality_scores
                WHERE evaluated_at >= %s
            """, (cutoff_date,))

            stats = cursor.fetchone()

            # Grade distribution
            cursor.execute("""
                SELECT
                    grade_letter,
                    COUNT(*)::int as count
                FROM quality_scores
                WHERE evaluated_at >= %s
                GROUP BY grade_letter
                ORDER BY grade_letter
            """, (cutoff_date,))

            grade_distribution = {row['grade_letter']: row['count'] for row in cursor.fetchall()}

            # Component averages
            cursor.execute("""
                SELECT
                    AVG(comprehension_score)::numeric(5,2) as avg_comprehension,
                    AVG(analysis_score)::numeric(5,2) as avg_analysis,
                    AVG(synthesis_score)::numeric(5,2) as avg_synthesis,
                    AVG(logical_reasoning_score)::numeric(5,2) as avg_logical_reasoning,
                    AVG(creativity_score)::numeric(5,2) as avg_creativity,
                    AVG(clarity_score)::numeric(5,2) as avg_clarity
                FROM quality_scores
                WHERE evaluated_at >= %s
            """, (cutoff_date,))

            component_averages = cursor.fetchone()

            return {
                "period_days": days,
                "overall": dict(stats) if stats else {},
                "grade_distribution": grade_distribution,
                "component_averages": dict(component_averages) if component_averages else {}
            }

    except Exception as e:
        logger.error(f"Error fetching quality stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Scheduler Endpoints
# ============================================================================

@app.get("/api/scheduler/jobs", tags=["Scheduler"])
async def list_evaluation_jobs(
    limit: int = Query(default=20, ge=1, le=100),
    db=Depends(get_db)
):
    """List recent evaluation jobs"""
    try:
        with db.cursor() as cursor:
            cursor.execute("""
                SELECT
                    id::text as job_id,
                    job_type,
                    status,
                    total_responses,
                    evaluated_count,
                    failed_count,
                    avg_score,
                    started_at,
                    completed_at,
                    duration_seconds
                FROM evaluation_jobs
                ORDER BY started_at DESC NULLS LAST
                LIMIT %s
            """, (limit,))

            jobs = cursor.fetchall()

            return {"jobs": [dict(job) for job in jobs]}

    except Exception as e:
        logger.error(f"Error fetching evaluation jobs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/scheduler/jobs/{job_id}", tags=["Scheduler"])
async def get_job_details(job_id: str, db=Depends(get_db)):
    """Get details for a specific evaluation job"""
    try:
        with db.cursor() as cursor:
            cursor.execute("""
                SELECT
                    id::text as job_id,
                    job_type,
                    status,
                    total_responses,
                    evaluated_count,
                    failed_count,
                    skipped_count,
                    avg_score,
                    median_score,
                    min_score,
                    max_score,
                    started_at,
                    completed_at,
                    duration_seconds,
                    error_log,
                    retry_count
                FROM evaluation_jobs
                WHERE id = %s::uuid
            """, (job_id,))

            job = cursor.fetchone()

            if not job:
                raise HTTPException(status_code=404, detail="Job not found")

            return dict(job)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching job details: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/scheduler/jobs/trigger", tags=["Scheduler"])
async def trigger_evaluation(request: EvaluationTriggerRequest):
    """Manually trigger quality score evaluation"""
    try:
        from scheduler.celery_tasks import evaluate_daily_quality_scores

        # Trigger Celery task
        task = evaluate_daily_quality_scores.delay()

        return {
            "message": "Evaluation task triggered",
            "task_id": task.id,
            "status": "pending"
        }

    except Exception as e:
        logger.error(f"Error triggering evaluation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# LMS Integration Endpoints
# ============================================================================

@app.get("/api/lms/moodle/config", tags=["LMS Integration"])
async def get_moodle_config(db=Depends(get_db)):
    """Get Moodle configuration (excluding sensitive data)"""
    try:
        with db.cursor() as cursor:
            cursor.execute("""
                SELECT
                    id::text,
                    moodle_url,
                    course_id,
                    is_active,
                    last_sync_at
                FROM moodle_config
                WHERE is_active = TRUE
                LIMIT 1
            """)

            config = cursor.fetchone()

            if not config:
                raise HTTPException(status_code=404, detail="No active Moodle configuration found")

            return dict(config)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching Moodle config: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/lms/moodle/sync", tags=["LMS Integration"])
async def sync_moodle_roster(course_id: Optional[int] = None):
    """Trigger student roster sync from Moodle"""
    try:
        from scheduler.celery_tasks import sync_student_roster

        # Trigger Celery task
        task = sync_student_roster.delay(course_id=course_id)

        return {
            "message": "Student roster sync triggered",
            "task_id": task.id,
            "status": "pending"
        }

    except Exception as e:
        logger.error(f"Error triggering roster sync: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/lms/students", tags=["LMS Integration"])
async def list_students(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db=Depends(get_db)
):
    """List students from Moodle roster"""
    try:
        with db.cursor() as cursor:
            # Get total count
            cursor.execute("SELECT COUNT(*) FROM moodle_students WHERE is_active = TRUE")
            total = cursor.fetchone()['count']

            # Get students
            cursor.execute("""
                SELECT
                    id::text,
                    moodle_user_id,
                    full_name,
                    email,
                    grade_level,
                    synced_at,
                    last_activity_at
                FROM moodle_students
                WHERE is_active = TRUE
                ORDER BY full_name
                LIMIT %s OFFSET %s
            """, (limit, offset))

            students = cursor.fetchall()

            return {
                "total": total,
                "limit": limit,
                "offset": offset,
                "students": [dict(student) for student in students]
            }

    except Exception as e:
        logger.error(f"Error listing students: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Reports Endpoint
# ============================================================================

@app.get("/api/reports/daily/{date}", tags=["Reports"])
async def get_daily_report(date: str, db=Depends(get_db)):
    """Get daily evaluation report for a specific date (YYYY-MM-DD)"""
    try:
        report_date = datetime.strptime(date, "%Y-%m-%d").date()

        with db.cursor() as cursor:
            # Get jobs for the date
            cursor.execute("""
                SELECT *
                FROM v_daily_evaluation_summary
                WHERE evaluation_date = %s
            """, (report_date,))

            summary = cursor.fetchone()

            if not summary:
                raise HTTPException(status_code=404, detail="No evaluation data for this date")

            return dict(summary)

    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching daily report: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Run Application
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", 8000)),
        reload=os.getenv("ENVIRONMENT") == "development"
    )
