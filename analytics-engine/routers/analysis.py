"""Analysis router - handles peak detection analysis requests"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from uuid import uuid4
from datetime import datetime
import logging

from config.database import get_db
from models.schemas import AnalysisRequest, AnalysisResponse
from algorithms.peak_detector import PeakThinkingDetector, DetectionConfig

router = APIRouter()
logger = logging.getLogger(__name__)

def get_config_from_db(db: Session) -> DetectionConfig:
    """Load detection configuration from database"""
    config_query = text("SELECT config_key, config_value FROM system_config")
    config_rows = db.execute(config_query).fetchall()

    config_dict = {row[0]: row[1] for row in config_rows}

    return DetectionConfig(
        min_duration_sec=float(config_dict.get('peak_min_duration_sec', 30)),
        max_duration_sec=float(config_dict.get('peak_max_duration_sec', 300)),
        min_event_rate=float(config_dict.get('peak_min_event_rate', 0.5)),
        max_event_rate=float(config_dict.get('peak_max_event_rate', 3.0)),
        max_idle_sec=float(config_dict.get('peak_max_idle_sec', 10)),
        efficiency_threshold=float(config_dict.get('peak_efficiency_threshold', 0.6)),
    )

@router.post("/session/{session_id}", response_model=AnalysisResponse)
async def analyze_session(
    session_id: str,
    request: AnalysisRequest = None,
    db: Session = Depends(get_db)
):
    """
    Analyze a learning session and detect peak thinking periods
    """
    logger.info(f"Analyzing session: {session_id}")

    # Check if session exists
    session_query = text("SELECT * FROM learning_sessions WHERE id = :session_id")
    session = db.execute(session_query, {"session_id": session_id}).fetchone()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Get all events for this session
    events_query = text("""
        SELECT id, session_id, student_id, problem_id, event_type,
               event_action, event_target, event_data, timestamp, sequence_number
        FROM learning_events
        WHERE session_id = :session_id
        ORDER BY timestamp ASC
    """)

    events_rows = db.execute(events_query, {"session_id": session_id}).fetchall()

    if not events_rows:
        logger.warning(f"No events found for session {session_id}")
        return AnalysisResponse(
            session_id=session_id,
            total_events=0,
            total_duration_sec=0,
            peak_periods_detected=0,
            peak_periods=[],
            analysis_timestamp=datetime.now(),
            algorithm_version="v1.0"
        )

    # Convert to dictionary format
    events = []
    for row in events_rows:
        events.append({
            'id': row[0],
            'session_id': row[1],
            'student_id': row[2],
            'problem_id': row[3],
            'event_type': row[4],
            'event_action': row[5],
            'event_target': row[6],
            'event_data': row[7],
            'timestamp': row[8],
            'sequence_number': row[9],
        })

    # Get detection configuration
    config = get_config_from_db(db)

    # Run peak detection
    detector = PeakThinkingDetector(config)
    peak_periods = detector.detect_peaks(events)

    # Save detected peaks to database
    student_id = events[0]['student_id']
    problem_id = events[0].get('problem_id')

    for peak in peak_periods:
        peak_id = str(uuid4())

        insert_query = text("""
            INSERT INTO peak_thinking_periods
            (id, session_id, student_id, problem_id, period_start, period_end, duration_sec,
             event_count, event_rate, interaction_intensity, focus_score, efficiency_score, peak_score,
             peak_quality, confidence_level, click_count, input_count, modification_count,
             max_idle_sec, avg_response_time_ms, algorithm_version)
            VALUES
            (:id, :session_id, :student_id, :problem_id, :period_start, :period_end, :duration_sec,
             :event_count, :event_rate, :interaction_intensity, :focus_score, :efficiency_score, :peak_score,
             :peak_quality, :confidence_level, :click_count, :input_count, :modification_count,
             :max_idle_sec, :avg_response_time_ms, :algorithm_version)
        """)

        db.execute(insert_query, {
            'id': peak_id,
            'session_id': session_id,
            'student_id': student_id,
            'problem_id': problem_id,
            'period_start': peak['period_start'],
            'period_end': peak['period_end'],
            'duration_sec': peak['duration_sec'],
            'event_count': peak['event_count'],
            'event_rate': peak['event_rate'],
            'interaction_intensity': peak['interaction_intensity'],
            'focus_score': peak['focus_score'],
            'efficiency_score': peak['efficiency_score'],
            'peak_score': peak['peak_score'],
            'peak_quality': peak['peak_quality'],
            'confidence_level': peak['confidence_level'],
            'click_count': peak['click_count'],
            'input_count': peak['input_count'],
            'modification_count': peak['modification_count'],
            'max_idle_sec': peak['max_idle_sec'],
            'avg_response_time_ms': peak['avg_response_time_ms'],
            'algorithm_version': 'v1.0',
        })

        # Link events to peak period
        for event in peak['events']:
            link_query = text("""
                INSERT INTO peak_period_events (peak_period_id, event_id, event_weight)
                VALUES (:peak_id, :event_id, 1.0)
            """)
            db.execute(link_query, {
                'peak_id': peak_id,
                'event_id': event['id']
            })

    db.commit()

    logger.info(f"Analysis complete: {len(peak_periods)} peaks detected for session {session_id}")

    # Calculate total duration
    total_duration = (events[-1]['timestamp'] - events[0]['timestamp']).total_seconds()

    # Prepare response
    peak_summaries = []
    for peak in peak_periods:
        peak_summaries.append({
            'period_start': peak['period_start'].isoformat(),
            'period_end': peak['period_end'].isoformat(),
            'duration_sec': peak['duration_sec'],
            'peak_score': peak['peak_score'],
            'peak_quality': peak['peak_quality'],
            'event_count': peak['event_count'],
            'focus_score': peak['focus_score'],
        })

    return AnalysisResponse(
        session_id=session_id,
        total_events=len(events),
        total_duration_sec=total_duration,
        peak_periods_detected=len(peak_periods),
        peak_periods=peak_summaries,
        analysis_timestamp=datetime.now(),
        algorithm_version="v1.0"
    )
