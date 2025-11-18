"""
Thinking Points API

RESTful API endpoints for tracking and analyzing student thinking patterns
during problem-solving activities.

Endpoints:
- POST   /api/modules/{module_id}/thinking-points
- GET    /api/modules/{module_id}/thinking-points/student/{student_id}
- GET    /api/modules/{module_id}/thinking-points/problem/{problem_id}
- GET    /api/modules/{module_id}/thinking-points/heatmap/{problem_id}
- GET    /api/modules/{module_id}/thinking-points/summary
- GET    /api/modules/{module_id}/thinking-points/insights/{student_id}
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import UUID
import asyncio

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, and_, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import ThinkingPoint, ThinkingPointSummary, StudentThinkingInsight
from ..auth import get_current_user, User
from ..permissions import check_module_access

# ============================================================================
# ROUTER
# ============================================================================

router = APIRouter(
    prefix="/api/modules/{module_id}/thinking-points",
    tags=["thinking-points"],
)

# ============================================================================
# PYDANTIC MODELS (DTOs)
# ============================================================================

class InteractionEvent(BaseModel):
    """Single interaction event"""
    type: str = Field(..., description="Event type: focus, blur, input, click, pause_start, pause_end, help, hint")
    section: str = Field(..., description="Section identifier")
    timestamp: int = Field(..., description="Unix timestamp in milliseconds")
    data: Optional[Dict[str, Any]] = Field(None, description="Additional event data")

class ThinkingPointSubmit(BaseModel):
    """Data structure for submitting thinking points"""
    student_id: UUID
    problem_id: UUID
    section_identifier: str = Field(..., max_length=100)
    section_type: str = Field(..., regex="^(problem_level|step_level|concept_level|interaction_level)$")
    time_spent_seconds: int = Field(0, ge=0)
    active_time_seconds: int = Field(0, ge=0)
    passive_time_seconds: int = Field(0, ge=0)
    interaction_count: int = Field(0, ge=0)
    focus_count: int = Field(0, ge=0)
    blur_count: int = Field(0, ge=0)
    pause_count: int = Field(0, ge=0)
    longest_pause_seconds: int = Field(0, ge=0)
    backtrack_count: int = Field(0, ge=0)
    help_requested_count: int = Field(0, ge=0)
    hint_used_count: int = Field(0, ge=0)
    events: List[InteractionEvent] = Field(default_factory=list)
    first_interaction_at: Optional[datetime] = None
    last_interaction_at: Optional[datetime] = None

class ThinkingPointBatchSubmit(BaseModel):
    """Batch submission of multiple thinking points"""
    thinking_points: List[ThinkingPointSubmit]

class ThinkingPointResponse(BaseModel):
    """Response model for thinking point data"""
    id: UUID
    student_id: UUID
    problem_id: UUID
    module_id: UUID
    section_identifier: str
    section_type: str
    time_spent_seconds: int
    active_time_seconds: int
    passive_time_seconds: int
    interaction_count: int
    thinking_pattern: Optional[str]
    pause_count: int
    longest_pause_seconds: int
    backtrack_count: int
    help_requested_count: int
    hint_used_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class HeatmapSection(BaseModel):
    """Heatmap data for a single section"""
    section_identifier: str
    section_type: str
    avg_time_seconds: float
    median_time_seconds: float
    struggle_rate: float
    total_students: int
    needs_attention: bool
    difficulty_score: float

class HeatmapResponse(BaseModel):
    """Heatmap visualization data for a problem"""
    problem_id: UUID
    sections: List[HeatmapSection]
    overall_difficulty: float
    high_struggle_sections: List[str]

class InsightResponse(BaseModel):
    """Personalized insights for a student"""
    student_id: UUID
    module_id: UUID
    dominant_pattern: Optional[str]
    avg_problem_time_seconds: float
    total_problems_attempted: int
    struggle_sections: List[str]
    mastery_sections: List[str]
    needs_support: bool
    support_priority: Optional[str]
    suggested_review_topics: List[str]

    class Config:
        from_attributes = True

class SummaryResponse(BaseModel):
    """Summary statistics for a module"""
    module_id: UUID
    total_students: int
    total_problems: int
    avg_completion_time_seconds: float
    sections_needing_attention: List[Dict[str, Any]]
    common_struggle_areas: List[str]

# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("", status_code=status.HTTP_201_CREATED)
async def submit_thinking_points(
    module_id: UUID,
    data: ThinkingPointBatchSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit thinking points data (batch)

    Accepts multiple thinking point records and stores them in the database.
    Automatically classifies thinking patterns and triggers summary recalculation.
    """
    # Verify user has access to this module
    await check_module_access(db, current_user.id, module_id)

    created_points = []

    for tp_data in data.thinking_points:
        # Classify thinking pattern
        pattern = classify_thinking_pattern(
            time_spent=tp_data.time_spent_seconds,
            pause_count=tp_data.pause_count,
            longest_pause=tp_data.longest_pause_seconds,
            backtrack_count=tp_data.backtrack_count,
            help_count=tp_data.help_requested_count,
            interaction_count=tp_data.interaction_count
        )

        # Create thinking point record
        thinking_point = ThinkingPoint(
            student_id=tp_data.student_id,
            problem_id=tp_data.problem_id,
            module_id=module_id,
            section_identifier=tp_data.section_identifier,
            section_type=tp_data.section_type,
            time_spent_seconds=tp_data.time_spent_seconds,
            active_time_seconds=tp_data.active_time_seconds,
            passive_time_seconds=tp_data.passive_time_seconds,
            interaction_count=tp_data.interaction_count,
            focus_count=tp_data.focus_count,
            blur_count=tp_data.blur_count,
            pause_count=tp_data.pause_count,
            longest_pause_seconds=tp_data.longest_pause_seconds,
            avg_pause_seconds=tp_data.longest_pause_seconds / max(tp_data.pause_count, 1),
            thinking_pattern=pattern,
            backtrack_count=tp_data.backtrack_count,
            help_requested_count=tp_data.help_requested_count,
            hint_used_count=tp_data.hint_used_count,
            events=[event.dict() for event in tp_data.events],
            first_interaction_at=tp_data.first_interaction_at,
            last_interaction_at=tp_data.last_interaction_at
        )

        db.add(thinking_point)
        created_points.append(thinking_point)

    await db.commit()

    # Trigger async summary recalculation (fire-and-forget)
    unique_problem_sections = set(
        (tp.problem_id, tp.section_identifier) for tp in created_points
    )

    for problem_id, section_id in unique_problem_sections:
        asyncio.create_task(
            recalculate_summary(db, problem_id, section_id)
        )

    return {
        "status": "success",
        "message": f"Successfully submitted {len(created_points)} thinking points",
        "count": len(created_points)
    }


@router.get("/student/{student_id}", response_model=List[ThinkingPointResponse])
async def get_student_thinking_points(
    module_id: UUID,
    student_id: UUID,
    problem_id: Optional[UUID] = Query(None, description="Filter by problem ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get thinking points for a specific student

    Returns all thinking point records for the student, optionally filtered by problem.
    """
    # Check permissions (student can view own data, teachers can view all)
    if current_user.id != student_id and not current_user.is_teacher:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this student's data"
        )

    query = select(ThinkingPoint).where(
        and_(
            ThinkingPoint.student_id == student_id,
            ThinkingPoint.module_id == module_id
        )
    )

    if problem_id:
        query = query.where(ThinkingPoint.problem_id == problem_id)

    result = await db.execute(query)
    thinking_points = result.scalars().all()

    return thinking_points


@router.get("/problem/{problem_id}", response_model=List[ThinkingPointResponse])
async def get_problem_thinking_points(
    module_id: UUID,
    problem_id: UUID,
    section_identifier: Optional[str] = Query(None, description="Filter by section"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all thinking points for a problem (teacher view)

    Returns aggregate data showing how all students interacted with the problem.
    """
    # Only teachers can access this
    if not current_user.is_teacher:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teacher access required"
        )

    query = select(ThinkingPoint).where(
        and_(
            ThinkingPoint.problem_id == problem_id,
            ThinkingPoint.module_id == module_id
        )
    )

    if section_identifier:
        query = query.where(ThinkingPoint.section_identifier == section_identifier)

    result = await db.execute(query)
    thinking_points = result.scalars().all()

    return thinking_points


@router.get("/heatmap/{problem_id}", response_model=HeatmapResponse)
async def get_problem_heatmap(
    module_id: UUID,
    problem_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get heatmap visualization data for a problem

    Returns section-by-section breakdown showing where students spend time
    and struggle the most.
    """
    # Teachers only
    if not current_user.is_teacher:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teacher access required"
        )

    # Get summaries for all sections of this problem
    query = select(ThinkingPointSummary).where(
        and_(
            ThinkingPointSummary.problem_id == problem_id,
            ThinkingPointSummary.module_id == module_id
        )
    ).order_by(ThinkingPointSummary.avg_time_spent_seconds.desc())

    result = await db.execute(query)
    summaries = result.scalars().all()

    if not summaries:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No data available for this problem yet"
        )

    sections = [
        HeatmapSection(
            section_identifier=s.section_identifier,
            section_type="concept_level",  # Default, should come from data
            avg_time_seconds=s.avg_time_spent_seconds,
            median_time_seconds=s.median_time_spent_seconds,
            struggle_rate=s.struggle_rate,
            total_students=s.total_students,
            needs_attention=s.needs_attention,
            difficulty_score=s.difficulty_score
        )
        for s in summaries
    ]

    overall_difficulty = sum(s.difficulty_score for s in sections) / len(sections)
    high_struggle_sections = [
        s.section_identifier
        for s in summaries
        if s.struggle_rate > 0.5
    ]

    return HeatmapResponse(
        problem_id=problem_id,
        sections=sections,
        overall_difficulty=overall_difficulty,
        high_struggle_sections=high_struggle_sections
    )


@router.get("/summary", response_model=SummaryResponse)
async def get_module_summary(
    module_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get overall summary statistics for a module

    Provides high-level analytics across all problems and students.
    """
    # Teachers and admins only
    if not (current_user.is_teacher or current_user.is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teacher or admin access required"
        )

    # Count unique students and problems
    student_count_query = select(func.count(func.distinct(ThinkingPoint.student_id))).where(
        ThinkingPoint.module_id == module_id
    )
    problem_count_query = select(func.count(func.distinct(ThinkingPoint.problem_id))).where(
        ThinkingPoint.module_id == module_id
    )

    student_count = await db.scalar(student_count_query) or 0
    problem_count = await db.scalar(problem_count_query) or 0

    # Average completion time (problem-level thinking points)
    avg_time_query = select(func.avg(ThinkingPoint.time_spent_seconds)).where(
        and_(
            ThinkingPoint.module_id == module_id,
            ThinkingPoint.section_identifier == "__problem_overall__"
        )
    )
    avg_time = await db.scalar(avg_time_query) or 0

    # Sections needing attention
    attention_query = select(ThinkingPointSummary).where(
        and_(
            ThinkingPointSummary.module_id == module_id,
            ThinkingPointSummary.needs_attention == True
        )
    ).order_by(desc(ThinkingPointSummary.difficulty_score)).limit(10)

    result = await db.execute(attention_query)
    attention_sections = result.scalars().all()

    sections_needing_attention = [
        {
            "section": s.section_identifier,
            "difficulty_score": s.difficulty_score,
            "struggle_rate": s.struggle_rate,
            "avg_time_seconds": s.avg_time_spent_seconds
        }
        for s in attention_sections
    ]

    # Common struggle areas
    common_struggle_areas = [s.section_identifier for s in attention_sections[:5]]

    return SummaryResponse(
        module_id=module_id,
        total_students=student_count,
        total_problems=problem_count,
        avg_completion_time_seconds=avg_time,
        sections_needing_attention=sections_needing_attention,
        common_struggle_areas=common_struggle_areas
    )


@router.get("/insights/{student_id}", response_model=InsightResponse)
async def get_student_insights(
    module_id: UUID,
    student_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get personalized learning insights for a student

    Analyzes the student's thinking patterns and provides recommendations.
    """
    # Check permissions
    if current_user.id != student_id and not current_user.is_teacher:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view these insights"
        )

    # Get or generate insights
    query = select(StudentThinkingInsight).where(
        and_(
            StudentThinkingInsight.student_id == student_id,
            StudentThinkingInsight.module_id == module_id
        )
    )

    result = await db.execute(query)
    insights = result.scalar_one_or_none()

    if not insights:
        # Generate insights on-the-fly
        insights = await generate_student_insights(db, student_id, module_id)

    return insights

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def classify_thinking_pattern(
    time_spent: int,
    pause_count: int,
    longest_pause: int,
    backtrack_count: int,
    help_count: int,
    interaction_count: int
) -> str:
    """
    Classify thinking pattern based on metrics

    Returns: 'productive', 'struggle', 'confusion', or 'mastery'
    """
    # Calculate interaction pace (interactions per minute)
    if time_spent > 0:
        avg_interaction_pace = (interaction_count / time_spent) * 60
    else:
        avg_interaction_pace = 0

    # Classification logic
    if help_count > 2 or (backtrack_count > 3 and longest_pause > 30):
        return "confusion"
    elif longest_pause > 45 or pause_count > 5:
        return "struggle"
    elif avg_interaction_pace > 3 and pause_count < 3 and backtrack_count == 0:
        return "mastery"
    else:
        return "productive"


async def recalculate_summary(
    db: AsyncSession,
    problem_id: UUID,
    section_identifier: str
):
    """
    Recalculate summary statistics for a problem section

    This is called asynchronously after new thinking points are submitted.
    """
    # Call the database function (defined in migration)
    await db.execute(
        "SELECT recalculate_thinking_point_summary(:problem_id, :section_id)",
        {"problem_id": str(problem_id), "section_id": section_identifier}
    )
    await db.commit()


async def generate_student_insights(
    db: AsyncSession,
    student_id: UUID,
    module_id: UUID
) -> StudentThinkingInsight:
    """
    Generate personalized insights for a student

    Analyzes all thinking points and creates an insight record.
    """
    # Get all thinking points for this student
    query = select(ThinkingPoint).where(
        and_(
            ThinkingPoint.student_id == student_id,
            ThinkingPoint.module_id == module_id
        )
    )
    result = await db.execute(query)
    points = result.scalars().all()

    if not points:
        # Create empty insights
        insights = StudentThinkingInsight(
            student_id=student_id,
            module_id=module_id,
            dominant_pattern="productive",
            avg_problem_time_seconds=0,
            total_problems_attempted=0,
            struggle_sections=[],
            mastery_sections=[],
            needs_support=False,
            support_priority="low"
        )
    else:
        # Analyze patterns
        pattern_counts = {}
        for point in points:
            pattern = point.thinking_pattern or "productive"
            pattern_counts[pattern] = pattern_counts.get(pattern, 0) + 1

        dominant_pattern = max(pattern_counts, key=pattern_counts.get)

        # Calculate average problem time
        problem_points = [p for p in points if p.section_type == "problem_level"]
        avg_time = sum(p.time_spent_seconds for p in problem_points) / max(len(problem_points), 1)

        # Identify struggle and mastery sections
        struggle_sections = [
            p.section_identifier
            for p in points
            if p.thinking_pattern == "struggle" or p.thinking_pattern == "confusion"
        ]
        mastery_sections = [
            p.section_identifier
            for p in points
            if p.thinking_pattern == "mastery"
        ]

        # Determine support needs
        struggle_rate = pattern_counts.get("struggle", 0) + pattern_counts.get("confusion", 0)
        struggle_rate = struggle_rate / len(points)

        needs_support = struggle_rate > 0.4
        if struggle_rate > 0.7:
            support_priority = "critical"
        elif struggle_rate > 0.5:
            support_priority = "high"
        elif struggle_rate > 0.3:
            support_priority = "medium"
        else:
            support_priority = "low"

        insights = StudentThinkingInsight(
            student_id=student_id,
            module_id=module_id,
            dominant_pattern=dominant_pattern,
            avg_problem_time_seconds=avg_time,
            total_problems_attempted=len(set(p.problem_id for p in points)),
            struggle_sections=list(set(struggle_sections)),
            mastery_sections=list(set(mastery_sections)),
            needs_support=needs_support,
            support_priority=support_priority,
            suggested_review_topics=list(set(struggle_sections))[:5]
        )

    db.add(insights)
    await db.commit()
    await db.refresh(insights)

    return insights
