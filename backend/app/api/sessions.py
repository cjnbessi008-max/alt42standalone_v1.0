"""
API endpoints for learning sessions and activity tracking
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List
from uuid import UUID
from datetime import datetime

from ..core.database import get_db
from ..models.schemas import (
    LearningSessionCreate,
    LearningSessionUpdate,
    LearningSessionResponse,
    ActivityEventCreate,
    ActivityEventResponse,
    AnalyzeSessionRequest,
    ThinkingFlowAnalysisResponse,
    ThinkingFlowGraphData,
    StudentProgressSummary,
)
from ..services.thinking_flow_analyzer import ThinkingFlowAnalyzer

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("/", response_model=dict)
async def create_session(
    session_data: LearningSessionCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new learning session"""
    query = """
    INSERT INTO learning_sessions (student_id, module_id, problem_id, started_at, status)
    VALUES ($1, $2, $3, $4, 'in_progress')
    RETURNING id, student_id, module_id, problem_id, started_at, status
    """

    result = await db.execute(
        query,
        str(session_data.student_id),
        str(session_data.module_id),
        str(session_data.problem_id),
        datetime.utcnow(),
    )

    row = result.fetchone()
    if not row:
        raise HTTPException(status_code=500, detail="Failed to create session")

    return {
        "id": row[0],
        "student_id": row[1],
        "module_id": row[2],
        "problem_id": row[3],
        "started_at": row[4],
        "status": row[5],
    }


@router.get("/{session_id}", response_model=dict)
async def get_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get session details by ID"""
    query = """
    SELECT id, student_id, module_id, problem_id, started_at, completed_at,
           total_time_seconds, is_correct, submitted_answer, status
    FROM learning_sessions
    WHERE id = $1
    """

    result = await db.execute(query, str(session_id))
    row = result.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "id": row[0],
        "student_id": row[1],
        "module_id": row[2],
        "problem_id": row[3],
        "started_at": row[4],
        "completed_at": row[5],
        "total_time_seconds": row[6],
        "is_correct": row[7],
        "submitted_answer": row[8],
        "status": row[9],
    }


@router.patch("/{session_id}", response_model=dict)
async def update_session(
    session_id: UUID,
    update_data: LearningSessionUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update session (e.g., mark as completed)"""
    updates = []
    values = []
    param_count = 1

    if update_data.completed_at is not None:
        updates.append(f"completed_at = ${param_count}")
        values.append(update_data.completed_at)
        param_count += 1

    if update_data.total_time_seconds is not None:
        updates.append(f"total_time_seconds = ${param_count}")
        values.append(update_data.total_time_seconds)
        param_count += 1

    if update_data.is_correct is not None:
        updates.append(f"is_correct = ${param_count}")
        values.append(update_data.is_correct)
        param_count += 1

    if update_data.submitted_answer is not None:
        updates.append(f"submitted_answer = ${param_count}")
        values.append(update_data.submitted_answer)
        param_count += 1

    if update_data.status is not None:
        updates.append(f"status = ${param_count}")
        values.append(update_data.status)
        param_count += 1

    if not updates:
        raise HTTPException(status_code=400, detail="No updates provided")

    updates.append("updated_at = CURRENT_TIMESTAMP")
    values.append(str(session_id))

    query = f"""
    UPDATE learning_sessions
    SET {', '.join(updates)}
    WHERE id = ${param_count}
    RETURNING id, student_id, module_id, problem_id, started_at, completed_at,
              total_time_seconds, is_correct, submitted_answer, status
    """

    result = await db.execute(query, *values)
    row = result.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "id": row[0],
        "student_id": row[1],
        "module_id": row[2],
        "problem_id": row[3],
        "started_at": row[4],
        "completed_at": row[5],
        "total_time_seconds": row[6],
        "is_correct": row[7],
        "submitted_answer": row[8],
        "status": row[9],
    }


@router.post("/events", response_model=dict, status_code=201)
async def track_activity_event(
    event: ActivityEventCreate,
    db: AsyncSession = Depends(get_db),
):
    """Track a student activity event"""
    query = """
    INSERT INTO activity_events (session_id, event_type, event_data, time_since_start_ms, timestamp)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, session_id, event_type, event_data, timestamp, time_since_start_ms
    """

    result = await db.execute(
        query,
        str(event.session_id),
        event.event_type,
        event.event_data,
        event.time_since_start_ms,
        datetime.utcnow(),
    )

    row = result.fetchone()
    if not row:
        raise HTTPException(status_code=500, detail="Failed to create event")

    return {
        "id": row[0],
        "session_id": row[1],
        "event_type": row[2],
        "event_data": row[3],
        "timestamp": row[4],
        "time_since_start_ms": row[5],
        "message": "Event tracked successfully",
    }


@router.get("/{session_id}/events", response_model=List[dict])
async def get_session_events(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get all events for a session"""
    query = """
    SELECT id, session_id, event_type, event_data, timestamp, time_since_start_ms
    FROM activity_events
    WHERE session_id = $1
    ORDER BY time_since_start_ms ASC
    """

    result = await db.execute(query, str(session_id))
    rows = result.fetchall()

    return [
        {
            "id": row[0],
            "session_id": row[1],
            "event_type": row[2],
            "event_data": row[3],
            "timestamp": row[4],
            "time_since_start_ms": row[5],
        }
        for row in rows
    ]


@router.post("/{session_id}/analyze", response_model=ThinkingFlowGraphData)
async def analyze_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Analyze a session to generate thinking flow data

    This endpoint:
    1. Retrieves all activity events for the session
    2. Analyzes delay patterns and thinking flow
    3. Generates graph-ready visualization data
    4. Stores analysis results in database
    """
    # Get session info
    session_query = """
    SELECT s.id, s.student_id, s.module_id, s.problem_id, p.expected_time_seconds
    FROM learning_sessions s
    LEFT JOIN problems p ON s.problem_id = p.id
    WHERE s.id = $1
    """

    session_result = await db.execute(session_query, str(session_id))
    session_row = session_result.fetchone()

    if not session_row:
        raise HTTPException(status_code=404, detail="Session not found")

    expected_time = session_row[4]

    # Get all events
    events_query = """
    SELECT id, event_type, event_data, time_since_start_ms
    FROM activity_events
    WHERE session_id = $1
    ORDER BY time_since_start_ms ASC
    """

    events_result = await db.execute(events_query, str(session_id))
    event_rows = events_result.fetchall()

    if not event_rows:
        raise HTTPException(
            status_code=400, detail="No events found for this session"
        )

    # Convert to list of dicts
    events = [
        {
            "id": row[0],
            "event_type": row[1],
            "event_data": row[2],
            "time_since_start_ms": row[3],
        }
        for row in event_rows
    ]

    # Analyze using ThinkingFlowAnalyzer
    analyzer = ThinkingFlowAnalyzer()
    analysis = analyzer.analyze_session(events, expected_time)

    # Generate graph data
    graph_data = analyzer.generate_graph_data(analysis, events)

    # Store analysis in database
    analysis_query = """
    INSERT INTO thinking_flow_analysis (
        session_id, analysis_type, delay_segments, thinking_pattern,
        struggle_points, cognitive_load_score, persistence_score, efficiency_score
    )
    VALUES ($1, 'comprehensive', $2, $3, $4, $5, $6, $7)
    RETURNING id, analyzed_at
    """

    analysis_result = await db.execute(
        analysis_query,
        str(session_id),
        analysis["delay_segments"],
        analysis["thinking_pattern"],
        analysis["struggle_points"],
        analysis["cognitive_load_score"],
        analysis["persistence_score"],
        analysis["efficiency_score"],
    )

    analysis_row = analysis_result.fetchone()

    # Store individual delay segments
    if analysis["delay_segments"]:
        for segment in analysis["delay_segments"]:
            segment_query = """
            INSERT INTO delay_segments (
                analysis_id, start_time_ms, end_time_ms, duration_ms, segment_type, context
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            """

            await db.execute(
                segment_query,
                str(analysis_row[0]),
                segment["start_time_ms"],
                segment["end_time_ms"],
                segment["duration_ms"],
                segment["segment_type"],
                segment.get("context"),
            )

    await db.commit()

    # Return graph data
    return ThinkingFlowGraphData(
        session_id=session_id,
        timeline=graph_data["timeline"],
        delay_segments=graph_data["delay_segments"],
        thinking_metrics=graph_data["thinking_metrics"],
        phase_breakdown=graph_data["phase_breakdown"],
        recommendations=graph_data["recommendations"],
    )


@router.get("/student/{student_id}/progress", response_model=dict)
async def get_student_progress(
    student_id: UUID,
    module_id: UUID = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Get student progress summary with thinking flow insights"""
    # Base query
    where_clause = "WHERE s.student_id = $1"
    params = [str(student_id)]

    if module_id:
        where_clause += " AND s.module_id = $2"
        params.append(str(module_id))

    query = f"""
    SELECT
        COUNT(*) as total_sessions,
        COUNT(*) FILTER (WHERE s.status = 'completed') as completed_sessions,
        AVG(s.total_time_seconds) as avg_time,
        AVG(CASE WHEN s.is_correct THEN 1.0 ELSE 0.0 END) as success_rate,
        AVG(a.cognitive_load_score) as avg_cognitive_load,
        AVG(a.persistence_score) as avg_persistence,
        AVG(a.efficiency_score) as avg_efficiency
    FROM learning_sessions s
    LEFT JOIN thinking_flow_analysis a ON s.id = a.session_id
    {where_clause}
    """

    result = await db.execute(query, *params)
    row = result.fetchone()

    if not row or row[0] == 0:
        raise HTTPException(status_code=404, detail="No sessions found for student")

    # Determine improvement trend
    # (simplified - in production, would analyze temporal patterns)
    avg_efficiency = row[6] or 0
    if avg_efficiency > 70:
        trend = "improving"
    elif avg_efficiency > 40:
        trend = "stable"
    else:
        trend = "needs_support"

    return {
        "student_id": student_id,
        "module_id": module_id,
        "total_sessions": row[0],
        "completed_sessions": row[1],
        "average_completion_time": row[2],
        "success_rate": row[3] or 0.0,
        "average_cognitive_load": row[4] or 0.0,
        "average_persistence": row[5] or 0.0,
        "average_efficiency": row[6] or 0.0,
        "improvement_trend": trend,
    }
