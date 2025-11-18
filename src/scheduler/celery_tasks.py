"""
Celery Tasks for Daily Quality Score Evaluation
================================================
Automated scheduled tasks for fetching student responses from Moodle
and evaluating thinking quality scores.

Author: AI Agent (Claude)
Date: 2025-11-18
Version: 1.0.0
"""

from celery import Celery, Task
from celery.schedules import crontab
import logging
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
import json


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Initialize Celery app
app = Celery('lms_integration')

# Load configuration
app.config_from_object('scheduler.celeryconfig')


# ============================================================================
# Database Helper Functions
# ============================================================================

def get_db_connection():
    """Get PostgreSQL database connection"""
    return psycopg2.connect(
        os.getenv('DATABASE_URL'),
        cursor_factory=RealDictCursor
    )


def create_evaluation_job(conn, job_type: str = 'daily_evaluation') -> str:
    """
    Create a new evaluation job record

    Args:
        conn: Database connection
        job_type: Type of job

    Returns:
        Job ID (UUID)
    """
    with conn.cursor() as cursor:
        cursor.execute("""
            INSERT INTO evaluation_jobs (job_type, status, triggered_by)
            VALUES (%s, 'pending', 'scheduler')
            RETURNING id::text
        """, (job_type,))

        job_id = cursor.fetchone()['id']
        conn.commit()

        logger.info(f"Created evaluation job: {job_id}")
        return job_id


def update_job_status(
    conn,
    job_id: str,
    status: str,
    metrics: Dict[str, Any] = None
):
    """
    Update evaluation job status and metrics

    Args:
        conn: Database connection
        job_id: Job ID
        status: New status
        metrics: Optional metrics dictionary
    """
    with conn.cursor() as cursor:
        if metrics:
            cursor.execute("""
                UPDATE evaluation_jobs
                SET status = %s,
                    total_responses = %s,
                    evaluated_count = %s,
                    failed_count = %s,
                    avg_score = %s,
                    completed_at = CASE WHEN %s IN ('completed', 'failed') THEN NOW() ELSE NULL END,
                    duration_seconds = CASE WHEN %s IN ('completed', 'failed')
                        THEN EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER
                        ELSE NULL
                    END,
                    updated_at = NOW()
                WHERE id = %s::uuid
            """, (
                status,
                metrics.get('total_responses', 0),
                metrics.get('evaluated_count', 0),
                metrics.get('failed_count', 0),
                metrics.get('avg_score'),
                status,
                status,
                job_id
            ))
        else:
            cursor.execute("""
                UPDATE evaluation_jobs
                SET status = %s,
                    started_at = CASE WHEN %s = 'running' THEN NOW() ELSE started_at END,
                    updated_at = NOW()
                WHERE id = %s::uuid
            """, (status, status, job_id))

        conn.commit()


def get_moodle_config(conn) -> Dict[str, Any]:
    """
    Get active Moodle configuration

    Args:
        conn: Database connection

    Returns:
        Configuration dictionary
    """
    with conn.cursor() as cursor:
        cursor.execute("""
            SELECT *
            FROM moodle_config
            WHERE is_active = TRUE
            LIMIT 1
        """)

        config = cursor.fetchone()

        if not config:
            raise ValueError("No active Moodle configuration found")

        return dict(config)


# ============================================================================
# Main Evaluation Tasks
# ============================================================================

@app.task(bind=True, max_retries=3)
def evaluate_daily_quality_scores(self):
    """
    Daily task: Fetch responses from Moodle and evaluate quality scores

    Scheduled to run at 02:00 KST daily

    Returns:
        Dictionary with job statistics
    """
    logger.info("=" * 60)
    logger.info("Starting daily quality score evaluation")
    logger.info("=" * 60)

    conn = None
    job_id = None

    try:
        # Connect to database
        conn = get_db_connection()

        # Create evaluation job
        job_id = create_evaluation_job(conn, 'daily_evaluation')
        update_job_status(conn, job_id, 'running')

        # Get Moodle configuration
        moodle_config = get_moodle_config(conn)

        # Import here to avoid circular imports
        from lms.moodle_connector import MoodleConnector, MoodleConfig
        from evaluation.quality_scorer import QualityScoreEvaluator
        from cryptography.fernet import Fernet

        # Decrypt Moodle token
        encryption_key = os.getenv('ENCRYPTION_KEY')
        fernet = Fernet(encryption_key.encode())
        decrypted_token = fernet.decrypt(
            moodle_config['api_token_encrypted'].encode()
        ).decode()

        # Initialize Moodle connector
        moodle = MoodleConnector(MoodleConfig(
            moodle_url=moodle_config['moodle_url'],
            ws_token=decrypted_token
        ))

        # Initialize quality evaluator
        evaluator = QualityScoreEvaluator(
            api_key=os.getenv('ANTHROPIC_API_KEY')
        )

        # Fetch responses from last 24 hours
        since = datetime.now() - timedelta(days=1)
        course_id = moodle_config.get('course_id')

        if not course_id:
            raise ValueError("No course_id configured")

        logger.info(f"Fetching responses from course {course_id} since {since}")
        responses = moodle.get_all_course_responses(course_id, since=since)

        logger.info(f"Found {len(responses)} responses to evaluate")

        # Store responses in database
        response_ids = store_student_responses(conn, responses)

        # Get pending responses (not yet evaluated)
        pending_responses = get_pending_responses(conn, limit=1000)

        logger.info(f"Processing {len(pending_responses)} pending responses")

        # Evaluate in batches
        batch_size = int(os.getenv('BATCH_SIZE', 50))
        evaluated_count = 0
        failed_count = 0
        total_score_sum = 0.0

        for i in range(0, len(pending_responses), batch_size):
            batch = pending_responses[i:i + batch_size]
            logger.info(f"Evaluating batch {i // batch_size + 1} ({len(batch)} responses)")

            for resp in batch:
                try:
                    # Mark as in progress
                    mark_response_status(conn, resp['id'], 'in_progress')

                    # Get student info
                    student_info = get_student_info(conn, resp['moodle_student_id'])

                    # Evaluate
                    score = evaluator.evaluate(
                        response_text=resp['response_text'],
                        student_name=student_info.get('full_name', 'Student'),
                        grade_level=student_info.get('grade_level', 'Unknown'),
                        activity_name=resp['activity_name'],
                        question_text=resp.get('question_text')
                    )

                    # Store quality score
                    store_quality_score(conn, resp['id'], score)

                    # Mark as completed
                    mark_response_status(conn, resp['id'], 'completed')

                    evaluated_count += 1
                    total_score_sum += score.total_score

                    logger.info(
                        f"✓ Evaluated response {resp['id']}: "
                        f"{score.total_score}/100 (Grade: {score.grade_letter.value})"
                    )

                except Exception as e:
                    logger.error(f"✗ Failed to evaluate response {resp['id']}: {e}")
                    mark_response_status(conn, resp['id'], 'failed', error=str(e))
                    failed_count += 1

        # Calculate average score
        avg_score = total_score_sum / evaluated_count if evaluated_count > 0 else None

        # Update job with final metrics
        metrics = {
            'total_responses': len(pending_responses),
            'evaluated_count': evaluated_count,
            'failed_count': failed_count,
            'avg_score': avg_score
        }

        update_job_status(conn, job_id, 'completed', metrics)

        # Send notification email
        send_evaluation_summary_email(job_id, metrics)

        logger.info("=" * 60)
        logger.info("Daily quality score evaluation completed")
        logger.info(f"Evaluated: {evaluated_count}/{len(pending_responses)}")
        logger.info(f"Average Score: {avg_score:.2f}/100" if avg_score else "No scores")
        logger.info("=" * 60)

        return metrics

    except Exception as e:
        logger.error(f"Daily evaluation failed: {e}")

        if job_id and conn:
            update_job_status(
                conn,
                job_id,
                'failed',
                metrics={'error_log': str(e)}
            )

        # Retry task
        raise self.retry(exc=e, countdown=300)  # Retry after 5 minutes

    finally:
        if conn:
            conn.close()


@app.task
def sync_student_roster(course_id: int = None):
    """
    Sync student roster from Moodle

    Args:
        course_id: Optional specific course ID, otherwise use configured course

    Returns:
        Number of students synced
    """
    logger.info("Starting student roster sync")

    conn = None

    try:
        conn = get_db_connection()

        # Get Moodle configuration
        moodle_config = get_moodle_config(conn)

        # Import connectors
        from lms.moodle_connector import MoodleConnector, MoodleConfig
        from cryptography.fernet import Fernet

        # Decrypt token
        encryption_key = os.getenv('ENCRYPTION_KEY')
        fernet = Fernet(encryption_key.encode())
        decrypted_token = fernet.decrypt(
            moodle_config['api_token_encrypted'].encode()
        ).decode()

        # Initialize connector
        moodle = MoodleConnector(MoodleConfig(
            moodle_url=moodle_config['moodle_url'],
            ws_token=decrypted_token
        ))

        # Get course ID
        target_course_id = course_id or moodle_config.get('course_id')

        if not target_course_id:
            raise ValueError("No course_id provided or configured")

        # Fetch students
        students = moodle.get_course_students(target_course_id)

        logger.info(f"Fetched {len(students)} students from course {target_course_id}")

        # Store/update students in database
        synced_count = 0

        with conn.cursor() as cursor:
            for student in students:
                cursor.execute("""
                    INSERT INTO moodle_students (
                        moodle_user_id, username, email, full_name,
                        first_name, last_name, enrolled_courses, synced_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
                    ON CONFLICT (moodle_user_id)
                    DO UPDATE SET
                        username = EXCLUDED.username,
                        email = EXCLUDED.email,
                        full_name = EXCLUDED.full_name,
                        first_name = EXCLUDED.first_name,
                        last_name = EXCLUDED.last_name,
                        enrolled_courses = EXCLUDED.enrolled_courses,
                        synced_at = NOW(),
                        updated_at = NOW()
                """, (
                    student.get('id'),
                    student.get('username'),
                    student.get('email'),
                    student.get('fullname'),
                    student.get('firstname'),
                    student.get('lastname'),
                    json.dumps([target_course_id])
                ))

                synced_count += 1

            conn.commit()

        logger.info(f"Synced {synced_count} students to database")

        return synced_count

    except Exception as e:
        logger.error(f"Student roster sync failed: {e}")
        raise

    finally:
        if conn:
            conn.close()


# ============================================================================
# Helper Functions
# ============================================================================

def store_student_responses(conn, responses: List) -> List[str]:
    """Store student responses in database"""
    response_ids = []

    with conn.cursor() as cursor:
        for response in responses:
            # Get moodle_student_id from moodle_user_id
            cursor.execute("""
                SELECT id FROM moodle_students WHERE moodle_user_id = %s
            """, (response.moodle_user_id,))

            student_record = cursor.fetchone()

            if not student_record:
                logger.warning(
                    f"Student {response.moodle_user_id} not found in database, skipping"
                )
                continue

            moodle_student_id = student_record['id']

            # Insert response
            cursor.execute("""
                INSERT INTO student_responses (
                    moodle_student_id, moodle_user_id, response_type,
                    activity_id, activity_name, response_text,
                    response_html, response_metadata, submitted_at,
                    question_text, max_points, evaluation_status
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending')
                ON CONFLICT (moodle_user_id, activity_id, response_type, submitted_at)
                DO NOTHING
                RETURNING id::text
            """, (
                moodle_student_id,
                response.moodle_user_id,
                response.response_type.value,
                response.activity_id,
                response.activity_name,
                response.response_text,
                response.response_html,
                json.dumps(response.metadata or {}),
                response.submitted_at,
                response.question_text,
                response.max_points
            ))

            result = cursor.fetchone()
            if result:
                response_ids.append(result['id'])

        conn.commit()

    return response_ids


def get_pending_responses(conn, limit: int = 1000) -> List[Dict]:
    """Get responses pending evaluation"""
    with conn.cursor() as cursor:
        cursor.execute("""
            SELECT *
            FROM student_responses
            WHERE evaluation_status = 'pending'
            ORDER BY submitted_at ASC
            LIMIT %s
        """, (limit,))

        return cursor.fetchall()


def get_student_info(conn, student_id: str) -> Dict:
    """Get student information"""
    with conn.cursor() as cursor:
        cursor.execute("""
            SELECT * FROM moodle_students WHERE id = %s::uuid
        """, (student_id,))

        return cursor.fetchone() or {}


def mark_response_status(
    conn,
    response_id: str,
    status: str,
    error: str = None
):
    """Mark response evaluation status"""
    with conn.cursor() as cursor:
        cursor.execute("""
            UPDATE student_responses
            SET evaluation_status = %s,
                last_evaluation_error = %s,
                updated_at = NOW()
            WHERE id = %s::uuid
        """, (status, error, response_id))

        conn.commit()


def store_quality_score(conn, response_id: str, score):
    """Store quality score in database"""
    with conn.cursor() as cursor:
        cursor.execute("""
            INSERT INTO quality_scores (
                student_response_id,
                moodle_student_id,
                total_score,
                grade_letter,
                comprehension_score,
                analysis_score,
                synthesis_score,
                logical_reasoning_score,
                creativity_score,
                clarity_score,
                ai_model_used,
                ai_analysis,
                ai_strengths,
                ai_improvements,
                confidence_level,
                evaluation_duration_ms,
                prompt_tokens,
                completion_tokens
            ) VALUES (
                %s::uuid,
                (SELECT moodle_student_id FROM student_responses WHERE id = %s::uuid),
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
        """, (
            response_id,
            response_id,
            score.total_score,
            score.grade_letter.value,
            score.component_scores.comprehension,
            score.component_scores.analysis,
            score.component_scores.synthesis,
            score.component_scores.logical_reasoning,
            score.component_scores.creativity,
            score.component_scores.clarity,
            score.ai_model_used,
            score.detailed_feedback,
            json.dumps(score.strengths),
            json.dumps(score.areas_for_improvement),
            score.confidence_level,
            score.evaluation_duration_ms,
            score.prompt_tokens,
            score.completion_tokens
        ))

        conn.commit()


def send_evaluation_summary_email(job_id: str, metrics: Dict):
    """Send evaluation summary email to administrators"""
    # TODO: Implement email sending using SMTP
    logger.info(f"Would send email summary for job {job_id}")
    logger.info(f"Metrics: {metrics}")
    pass


# ============================================================================
# Celery Beat Schedule (defined in celeryconfig.py)
# ============================================================================

if __name__ == "__main__":
    # For testing individual tasks
    print("Testing Celery tasks...")

    # Test student roster sync
    # result = sync_student_roster.delay(course_id=123)
    # print(f"Roster sync task: {result.id}")

    # Test daily evaluation
    # result = evaluate_daily_quality_scores.delay()
    # print(f"Evaluation task: {result.id}")
