"""
Ranking & Achievement API
LMS Integration for AI Education System Pipeline

Provides RESTful endpoints for:
- Student rankings and leaderboards
- Achievement tracking and progress
- Performance analytics and graphs
- Points and rewards system
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import date, datetime, timedelta
from pydantic import BaseModel, Field
from uuid import UUID
import logging

# Initialize logger
logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter(prefix="/api/v1", tags=["ranking-achievement"])


# ====================================================================
# PYDANTIC MODELS (Request/Response schemas)
# ====================================================================

class AchievementBase(BaseModel):
    """Base achievement model"""
    name: str
    name_ko: str
    description: str
    description_ko: str
    category: str
    points: int
    tier: Optional[str] = None
    icon_url: Optional[str] = None


class AchievementResponse(AchievementBase):
    """Achievement response model"""
    id: UUID
    badge_color: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class StudentAchievementResponse(BaseModel):
    """Student achievement with earned date"""
    achievement: AchievementResponse
    earned_at: datetime
    module_name: Optional[str] = None

    class Config:
        from_attributes = True


class AchievementProgressResponse(BaseModel):
    """Achievement progress tracking"""
    achievement: AchievementResponse
    current_value: int
    target_value: int
    progress_percentage: float
    last_updated: datetime

    class Config:
        from_attributes = True


class RankingResponse(BaseModel):
    """Student ranking response"""
    student_id: UUID
    student_name: str
    grade_level: str
    global_rank: Optional[int] = None
    grade_rank: Optional[int] = None
    total_points: int
    modules_completed: int
    problems_solved: int
    accuracy_percentage: float
    current_streak_days: int
    achievements_earned: int
    last_activity_at: Optional[datetime] = None


class ModuleRankingResponse(BaseModel):
    """Module-specific ranking"""
    student_id: UUID
    student_name: str
    module_id: UUID
    module_name: str
    module_rank: Optional[int] = None
    completion_percentage: float
    average_score: float
    time_spent_minutes: int
    problems_attempted: int
    problems_correct: int


class LeaderboardResponse(BaseModel):
    """Leaderboard response with rankings"""
    leaderboard_type: str
    scope: Optional[str] = None  # e.g., "Grade 3", "Fractions Module"
    updated_at: datetime
    rankings: List[RankingResponse]


class PerformanceGraphData(BaseModel):
    """Time-series data for performance graphs"""
    metric_name: str
    metric_name_ko: str
    period: str  # daily, weekly, monthly
    data_points: List[dict]  # [{date, value, label}, ...]
    summary_stats: dict  # {avg, max, min, trend}


class StudentDashboardResponse(BaseModel):
    """Comprehensive student dashboard data"""
    student_id: UUID
    student_name: str
    overall_stats: dict
    recent_achievements: List[StudentAchievementResponse]
    ranking_info: RankingResponse
    performance_graphs: List[PerformanceGraphData]
    current_goals: List[AchievementProgressResponse]


class PointTransaction(BaseModel):
    """Point transaction record"""
    id: UUID
    points_change: int
    transaction_type: str
    description: Optional[str] = None
    created_at: datetime


class RewardResponse(BaseModel):
    """Reward item"""
    id: UUID
    name: str
    name_ko: str
    description: Optional[str] = None
    description_ko: Optional[str] = None
    reward_type: str
    cost_points: int
    icon_url: Optional[str] = None
    is_unlocked: bool = False
    is_equipped: bool = False


# ====================================================================
# ENDPOINT: GLOBAL LEADERBOARD
# ====================================================================

@router.get("/leaderboard/global", response_model=LeaderboardResponse)
async def get_global_leaderboard(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db = Depends(get_db)
):
    """
    Get global leaderboard across all students.

    Query Parameters:
    - limit: Number of rankings to return (default: 100, max: 500)
    - offset: Pagination offset (default: 0)

    Returns:
    - Leaderboard with top-ranked students globally
    """
    try:
        query = """
            SELECT * FROM v_global_leaderboard
            ORDER BY global_rank NULLS LAST
            LIMIT $1 OFFSET $2
        """

        rankings = await db.fetch(query, limit, offset)

        return LeaderboardResponse(
            leaderboard_type="global",
            updated_at=datetime.now(),
            rankings=[RankingResponse(**dict(r)) for r in rankings]
        )
    except Exception as e:
        logger.error(f"Error fetching global leaderboard: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch leaderboard")


# ====================================================================
# ENDPOINT: GRADE-LEVEL LEADERBOARD
# ====================================================================

@router.get("/leaderboard/grade/{grade_level}", response_model=LeaderboardResponse)
async def get_grade_leaderboard(
    grade_level: str,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db = Depends(get_db)
):
    """
    Get leaderboard for specific grade level.

    Path Parameters:
    - grade_level: Grade level (e.g., "3", "4", "5")

    Query Parameters:
    - limit: Number of rankings to return
    - offset: Pagination offset
    """
    try:
        query = """
            SELECT * FROM v_global_leaderboard
            WHERE grade_level = $1
            ORDER BY grade_rank NULLS LAST
            LIMIT $2 OFFSET $3
        """

        rankings = await db.fetch(query, grade_level, limit, offset)

        return LeaderboardResponse(
            leaderboard_type="grade",
            scope=f"Grade {grade_level}",
            updated_at=datetime.now(),
            rankings=[RankingResponse(**dict(r)) for r in rankings]
        )
    except Exception as e:
        logger.error(f"Error fetching grade leaderboard: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch grade leaderboard")


# ====================================================================
# ENDPOINT: MODULE LEADERBOARD
# ====================================================================

@router.get("/leaderboard/module/{module_id}", response_model=List[ModuleRankingResponse])
async def get_module_leaderboard(
    module_id: UUID,
    limit: int = Query(50, ge=1, le=500),
    db = Depends(get_db)
):
    """
    Get leaderboard for specific module.

    Path Parameters:
    - module_id: Module UUID

    Query Parameters:
    - limit: Number of rankings to return
    """
    try:
        query = """
            SELECT
                mr.student_id,
                s.name AS student_name,
                mr.module_id,
                m.name AS module_name,
                mr.module_rank,
                mr.completion_percentage,
                mr.average_score,
                mr.time_spent_minutes,
                mr.problems_attempted,
                mr.problems_correct
            FROM module_rankings mr
            JOIN students s ON mr.student_id = s.id
            JOIN modules m ON mr.module_id = m.id
            WHERE mr.module_id = $1
            ORDER BY mr.module_rank NULLS LAST
            LIMIT $2
        """

        rankings = await db.fetch(query, module_id, limit)

        return [ModuleRankingResponse(**dict(r)) for r in rankings]
    except Exception as e:
        logger.error(f"Error fetching module leaderboard: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch module leaderboard")


# ====================================================================
# ENDPOINT: STUDENT RANKING
# ====================================================================

@router.get("/students/{student_id}/ranking", response_model=RankingResponse)
async def get_student_ranking(
    student_id: UUID,
    db = Depends(get_db)
):
    """
    Get comprehensive ranking information for a student.

    Path Parameters:
    - student_id: Student UUID
    """
    try:
        query = """
            SELECT * FROM v_global_leaderboard
            WHERE student_id = $1
        """

        ranking = await db.fetchrow(query, student_id)

        if not ranking:
            raise HTTPException(status_code=404, detail="Student ranking not found")

        return RankingResponse(**dict(ranking))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching student ranking: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch student ranking")


# ====================================================================
# ENDPOINT: ACHIEVEMENTS - LIST ALL
# ====================================================================

@router.get("/achievements", response_model=List[AchievementResponse])
async def get_all_achievements(
    category: Optional[str] = None,
    tier: Optional[str] = None,
    is_active: bool = True,
    db = Depends(get_db)
):
    """
    Get all available achievements.

    Query Parameters:
    - category: Filter by category (optional)
    - tier: Filter by tier (optional)
    - is_active: Show only active achievements (default: true)
    """
    try:
        filters = ["is_active = $1"]
        params = [is_active]
        param_count = 1

        if category:
            param_count += 1
            filters.append(f"category = ${param_count}")
            params.append(category)

        if tier:
            param_count += 1
            filters.append(f"tier = ${param_count}")
            params.append(tier)

        where_clause = " AND ".join(filters)

        query = f"""
            SELECT * FROM achievements
            WHERE {where_clause}
            ORDER BY display_order, created_at
        """

        achievements = await db.fetch(query, *params)

        return [AchievementResponse(**dict(a)) for a in achievements]
    except Exception as e:
        logger.error(f"Error fetching achievements: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch achievements")


# ====================================================================
# ENDPOINT: STUDENT ACHIEVEMENTS
# ====================================================================

@router.get("/students/{student_id}/achievements", response_model=List[StudentAchievementResponse])
async def get_student_achievements(
    student_id: UUID,
    db = Depends(get_db)
):
    """
    Get all achievements earned by a student.

    Path Parameters:
    - student_id: Student UUID
    """
    try:
        query = """
            SELECT
                sa.earned_at,
                sa.module_id,
                m.name AS module_name,
                a.id AS achievement_id,
                a.name,
                a.name_ko,
                a.description,
                a.description_ko,
                a.category,
                a.points,
                a.tier,
                a.icon_url,
                a.badge_color,
                a.is_active,
                a.created_at
            FROM student_achievements sa
            JOIN achievements a ON sa.achievement_id = a.id
            LEFT JOIN modules m ON sa.module_id = m.id
            WHERE sa.student_id = $1
            ORDER BY sa.earned_at DESC
        """

        results = await db.fetch(query, student_id)

        achievements = []
        for r in results:
            achievement = AchievementResponse(
                id=r['achievement_id'],
                name=r['name'],
                name_ko=r['name_ko'],
                description=r['description'],
                description_ko=r['description_ko'],
                category=r['category'],
                points=r['points'],
                tier=r['tier'],
                icon_url=r['icon_url'],
                badge_color=r['badge_color'],
                is_active=r['is_active'],
                created_at=r['created_at']
            )

            achievements.append(StudentAchievementResponse(
                achievement=achievement,
                earned_at=r['earned_at'],
                module_name=r['module_name']
            ))

        return achievements
    except Exception as e:
        logger.error(f"Error fetching student achievements: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch student achievements")


# ====================================================================
# ENDPOINT: ACHIEVEMENT PROGRESS
# ====================================================================

@router.get("/students/{student_id}/achievements/progress", response_model=List[AchievementProgressResponse])
async def get_achievement_progress(
    student_id: UUID,
    db = Depends(get_db)
):
    """
    Get progress toward achievements not yet earned.

    Path Parameters:
    - student_id: Student UUID
    """
    try:
        query = """
            SELECT
                ap.current_value,
                ap.target_value,
                ap.last_updated,
                a.id AS achievement_id,
                a.name,
                a.name_ko,
                a.description,
                a.description_ko,
                a.category,
                a.points,
                a.tier,
                a.icon_url,
                a.badge_color,
                a.is_active,
                a.created_at
            FROM achievement_progress ap
            JOIN achievements a ON ap.achievement_id = a.id
            WHERE ap.student_id = $1 AND a.is_active = true
            ORDER BY (ap.current_value::FLOAT / ap.target_value) DESC
        """

        results = await db.fetch(query, student_id)

        progress_list = []
        for r in results:
            achievement = AchievementResponse(
                id=r['achievement_id'],
                name=r['name'],
                name_ko=r['name_ko'],
                description=r['description'],
                description_ko=r['description_ko'],
                category=r['category'],
                points=r['points'],
                tier=r['tier'],
                icon_url=r['icon_url'],
                badge_color=r['badge_color'],
                is_active=r['is_active'],
                created_at=r['created_at']
            )

            progress_pct = (r['current_value'] / r['target_value'] * 100) if r['target_value'] > 0 else 0

            progress_list.append(AchievementProgressResponse(
                achievement=achievement,
                current_value=r['current_value'],
                target_value=r['target_value'],
                progress_percentage=round(progress_pct, 2),
                last_updated=r['last_updated']
            ))

        return progress_list
    except Exception as e:
        logger.error(f"Error fetching achievement progress: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch achievement progress")


# ====================================================================
# ENDPOINT: PERFORMANCE GRAPHS
# ====================================================================

@router.get("/students/{student_id}/performance-graphs", response_model=List[PerformanceGraphData])
async def get_performance_graphs(
    student_id: UUID,
    period: str = Query("weekly", regex="^(daily|weekly|monthly|all_time)$"),
    metrics: Optional[List[str]] = Query(None),
    db = Depends(get_db)
):
    """
    Get performance graph data for a student.

    Path Parameters:
    - student_id: Student UUID

    Query Parameters:
    - period: Time period (daily, weekly, monthly, all_time)
    - metrics: Specific metrics to fetch (optional, returns all if not specified)
    """
    try:
        # Default metrics if not specified
        if not metrics:
            metrics = [
                "accuracy_trend",
                "problems_solved_trend",
                "time_efficiency",
                "points_earned",
                "streak_history"
            ]

        graphs = []

        # Generate graph data based on period
        for metric in metrics:
            graph_data = await _generate_graph_data(db, student_id, metric, period)
            if graph_data:
                graphs.append(graph_data)

        return graphs
    except Exception as e:
        logger.error(f"Error fetching performance graphs: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch performance graphs")


async def _generate_graph_data(db, student_id: UUID, metric: str, period: str) -> Optional[PerformanceGraphData]:
    """Helper function to generate graph data for a specific metric"""

    # Calculate date range based on period
    end_date = date.today()
    if period == "daily":
        start_date = end_date - timedelta(days=30)
        interval = "1 day"
    elif period == "weekly":
        start_date = end_date - timedelta(weeks=12)
        interval = "1 week"
    elif period == "monthly":
        start_date = end_date - timedelta(days=365)
        interval = "1 month"
    else:  # all_time
        start_date = None
        interval = "1 month"

    try:
        if metric == "accuracy_trend":
            query = """
                SELECT
                    activity_date,
                    CASE
                        WHEN problems_attempted > 0
                        THEN ROUND((problems_correct::DECIMAL / problems_attempted * 100), 2)
                        ELSE 0
                    END AS accuracy
                FROM daily_activity_log
                WHERE student_id = $1
                    AND activity_date >= COALESCE($2, '2000-01-01'::DATE)
                    AND activity_date <= $3
                ORDER BY activity_date
            """

            results = await db.fetch(query, student_id, start_date, end_date)
            data_points = [
                {
                    "date": str(r['activity_date']),
                    "value": float(r['accuracy']),
                    "label": f"{r['accuracy']}%"
                }
                for r in results
            ]

            values = [r['accuracy'] for r in results] if results else [0]

            return PerformanceGraphData(
                metric_name="Accuracy Trend",
                metric_name_ko="정확도 추세",
                period=period,
                data_points=data_points,
                summary_stats={
                    "avg": round(sum(values) / len(values), 2) if values else 0,
                    "max": max(values) if values else 0,
                    "min": min(values) if values else 0,
                    "trend": "improving" if len(values) > 1 and values[-1] > values[0] else "stable"
                }
            )

        elif metric == "problems_solved_trend":
            query = """
                SELECT
                    activity_date,
                    problems_correct
                FROM daily_activity_log
                WHERE student_id = $1
                    AND activity_date >= COALESCE($2, '2000-01-01'::DATE)
                    AND activity_date <= $3
                ORDER BY activity_date
            """

            results = await db.fetch(query, student_id, start_date, end_date)
            data_points = [
                {
                    "date": str(r['activity_date']),
                    "value": r['problems_correct'],
                    "label": f"{r['problems_correct']} problems"
                }
                for r in results
            ]

            values = [r['problems_correct'] for r in results] if results else [0]

            return PerformanceGraphData(
                metric_name="Problems Solved",
                metric_name_ko="해결한 문제",
                period=period,
                data_points=data_points,
                summary_stats={
                    "avg": round(sum(values) / len(values), 2) if values else 0,
                    "max": max(values) if values else 0,
                    "min": min(values) if values else 0,
                    "total": sum(values)
                }
            )

        elif metric == "points_earned":
            query = """
                SELECT
                    activity_date,
                    points_earned
                FROM daily_activity_log
                WHERE student_id = $1
                    AND activity_date >= COALESCE($2, '2000-01-01'::DATE)
                    AND activity_date <= $3
                ORDER BY activity_date
            """

            results = await db.fetch(query, student_id, start_date, end_date)
            data_points = [
                {
                    "date": str(r['activity_date']),
                    "value": r['points_earned'],
                    "label": f"+{r['points_earned']} pts"
                }
                for r in results
            ]

            values = [r['points_earned'] for r in results] if results else [0]

            return PerformanceGraphData(
                metric_name="Points Earned",
                metric_name_ko="획득 포인트",
                period=period,
                data_points=data_points,
                summary_stats={
                    "avg": round(sum(values) / len(values), 2) if values else 0,
                    "total": sum(values)
                }
            )

        # Add more metric types as needed

    except Exception as e:
        logger.error(f"Error generating graph data for {metric}: {e}")
        return None


# ====================================================================
# ENDPOINT: STUDENT DASHBOARD
# ====================================================================

@router.get("/students/{student_id}/dashboard", response_model=StudentDashboardResponse)
async def get_student_dashboard(
    student_id: UUID,
    db = Depends(get_db)
):
    """
    Get comprehensive dashboard data for a student.

    Path Parameters:
    - student_id: Student UUID

    Returns:
    - Complete dashboard with stats, achievements, rankings, and graphs
    """
    try:
        # Get student info
        student_query = "SELECT id, name FROM students WHERE id = $1"
        student = await db.fetchrow(student_query, student_id)

        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        # Get overall stats
        stats_query = """
            SELECT
                total_points,
                modules_completed,
                problems_solved,
                accuracy_percentage,
                current_streak_days,
                longest_streak_days
            FROM student_rankings
            WHERE student_id = $1
        """
        stats = await db.fetchrow(stats_query, student_id)

        # Get recent achievements (last 5)
        achievements = await get_student_achievements(student_id, db)
        recent_achievements = achievements[:5] if achievements else []

        # Get ranking info
        ranking = await get_student_ranking(student_id, db)

        # Get performance graphs
        graphs = await get_performance_graphs(student_id, "weekly", None, db)

        # Get current goals (achievements in progress, top 5)
        goals = await get_achievement_progress(student_id, db)
        current_goals = goals[:5] if goals else []

        return StudentDashboardResponse(
            student_id=student['id'],
            student_name=student['name'],
            overall_stats={
                "total_points": stats['total_points'] if stats else 0,
                "modules_completed": stats['modules_completed'] if stats else 0,
                "problems_solved": stats['problems_solved'] if stats else 0,
                "accuracy_percentage": float(stats['accuracy_percentage']) if stats else 0.0,
                "current_streak_days": stats['current_streak_days'] if stats else 0,
                "longest_streak_days": stats['longest_streak_days'] if stats else 0
            },
            recent_achievements=recent_achievements,
            ranking_info=ranking,
            performance_graphs=graphs,
            current_goals=current_goals
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching student dashboard: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch student dashboard")


# ====================================================================
# ENDPOINT: POINT TRANSACTIONS
# ====================================================================

@router.get("/students/{student_id}/points/history", response_model=List[PointTransaction])
async def get_point_history(
    student_id: UUID,
    limit: int = Query(50, ge=1, le=500),
    transaction_type: Optional[str] = None,
    db = Depends(get_db)
):
    """
    Get point transaction history for a student.

    Path Parameters:
    - student_id: Student UUID

    Query Parameters:
    - limit: Number of transactions to return
    - transaction_type: Filter by transaction type (optional)
    """
    try:
        filters = ["student_id = $1"]
        params = [student_id]

        if transaction_type:
            filters.append("transaction_type = $2")
            params.append(transaction_type)

        where_clause = " AND ".join(filters)

        query = f"""
            SELECT id, points_change, transaction_type, description, created_at
            FROM point_transactions
            WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT ${len(params) + 1}
        """
        params.append(limit)

        transactions = await db.fetch(query, *params)

        return [PointTransaction(**dict(t)) for t in transactions]
    except Exception as e:
        logger.error(f"Error fetching point history: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch point history")


# ====================================================================
# ENDPOINT: REWARDS
# ====================================================================

@router.get("/students/{student_id}/rewards", response_model=List[RewardResponse])
async def get_student_rewards(
    student_id: UUID,
    reward_type: Optional[str] = None,
    db = Depends(get_db)
):
    """
    Get available and unlocked rewards for a student.

    Path Parameters:
    - student_id: Student UUID

    Query Parameters:
    - reward_type: Filter by reward type (optional)
    """
    try:
        filters = ["r.is_available = true"]
        params = []

        if reward_type:
            filters.append(f"r.reward_type = ${len(params) + 1}")
            params.append(reward_type)

        where_clause = " AND ".join(filters) if filters else "1=1"

        query = f"""
            SELECT
                r.id,
                r.name,
                r.name_ko,
                r.description,
                r.description_ko,
                r.reward_type,
                r.cost_points,
                r.icon_url,
                EXISTS(SELECT 1 FROM student_rewards sr WHERE sr.student_id = $1 AND sr.reward_id = r.id) AS is_unlocked,
                COALESCE((SELECT is_equipped FROM student_rewards sr WHERE sr.student_id = $1 AND sr.reward_id = r.id), false) AS is_equipped
            FROM rewards r
            WHERE {where_clause}
            ORDER BY r.display_order, r.cost_points
        """

        all_params = [student_id] + params
        rewards = await db.fetch(query, *all_params)

        return [RewardResponse(**dict(r)) for r in rewards]
    except Exception as e:
        logger.error(f"Error fetching student rewards: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch student rewards")


# ====================================================================
# HELPER FUNCTION: Database dependency
# ====================================================================

async def get_db():
    """
    Database dependency - to be implemented with actual DB connection.
    This is a placeholder for the actual database connection.
    """
    # TODO: Implement actual database connection
    # Example: return await asyncpg.connect(DATABASE_URL)
    raise NotImplementedError("Database connection not implemented")


# ====================================================================
# UTILITY ENDPOINTS
# ====================================================================

@router.post("/admin/rankings/recalculate")
async def recalculate_all_rankings(db = Depends(get_db)):
    """
    Admin endpoint: Recalculate all student rankings.
    Should be run periodically (e.g., daily cron job).
    """
    try:
        # Get all student IDs
        students = await db.fetch("SELECT id FROM students")

        updated_count = 0
        for student in students:
            await db.execute("SELECT update_student_ranking($1)", student['id'])
            updated_count += 1

        return {
            "status": "success",
            "message": f"Recalculated rankings for {updated_count} students",
            "timestamp": datetime.now()
        }
    except Exception as e:
        logger.error(f"Error recalculating rankings: {e}")
        raise HTTPException(status_code=500, detail="Failed to recalculate rankings")


@router.get("/stats/system", response_model=dict)
async def get_system_stats(db = Depends(get_db)):
    """
    Get overall system statistics.
    Useful for admin dashboards and monitoring.
    """
    try:
        stats = {}

        # Total students
        stats['total_students'] = await db.fetchval("SELECT COUNT(*) FROM students")

        # Total achievements awarded
        stats['total_achievements_awarded'] = await db.fetchval("SELECT COUNT(*) FROM student_achievements")

        # Total points distributed
        stats['total_points_distributed'] = await db.fetchval(
            "SELECT COALESCE(SUM(points_change), 0) FROM point_transactions WHERE points_change > 0"
        )

        # Active students (activity in last 7 days)
        stats['active_students_7d'] = await db.fetchval("""
            SELECT COUNT(DISTINCT student_id)
            FROM daily_activity_log
            WHERE activity_date >= CURRENT_DATE - INTERVAL '7 days'
        """)

        # Module performance
        module_stats = await db.fetchrow("""
            SELECT
                COUNT(*) AS total_modules,
                AVG(avg_completion) AS overall_avg_completion,
                AVG(avg_score) AS overall_avg_score
            FROM v_module_performance
        """)

        stats['module_stats'] = dict(module_stats) if module_stats else {}

        return stats
    except Exception as e:
        logger.error(f"Error fetching system stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch system stats")


# ====================================================================
# END OF API
# ====================================================================
