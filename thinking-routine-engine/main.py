"""Main FastAPI application for Thinking Routine Engine"""
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional
import logging

from config import settings
from database import get_moodle_db, get_app_db
from services.moodle_service import MoodleDataService
from services.ai_service import AIService
from services.analysis_service import AnalysisService
from models import app_models
from database import app_engine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create database tables
app_models.AppBase.metadata.create_all(bind=app_engine)

# Initialize FastAPI app
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description="AI-powered thinking routine generation and learning optimization",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Dependency: Get services
def get_services(moodle_db: Session = Depends(get_moodle_db)):
    """Get all required services"""
    moodle_service = MoodleDataService(moodle_db)
    ai_service = AIService()
    analysis_service = AnalysisService(moodle_service, ai_service)

    return {
        'moodle': moodle_service,
        'ai': ai_service,
        'analysis': analysis_service,
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": settings.API_TITLE,
        "version": settings.API_VERSION,
        "status": "operational",
        "endpoints": {
            "student_analysis": f"{settings.API_PREFIX}/students/{{user_id}}/analysis",
            "course_analytics": f"{settings.API_PREFIX}/courses/{{course_id}}/analytics",
            "recommendations": f"{settings.API_PREFIX}/students/{{user_id}}/courses/{{course_id}}/recommendations",
            "thinking_routine": f"{settings.API_PREFIX}/students/{{user_id}}/courses/{{course_id}}/routine",
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.get(f"{settings.API_PREFIX}/students/{{user_id}}/analysis")
async def get_student_analysis(
    user_id: int,
    course_id: Optional[int] = None,
    lookback_days: int = 90,
    services: dict = Depends(get_services)
):
    """
    Get comprehensive student performance analysis

    - **user_id**: Moodle user ID
    - **course_id**: Optional course ID (if not provided, analyzes across all courses)
    - **lookback_days**: Number of days to analyze (default: 90)
    """
    try:
        analysis_service = services['analysis']

        if course_id:
            data = analysis_service.analyze_student_comprehensive(user_id, course_id, lookback_days)
        else:
            raise HTTPException(
                status_code=400,
                detail="course_id is required for comprehensive analysis"
            )

        return JSONResponse(content=data)

    except Exception as e:
        logger.error(f"Error analyzing student {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get(f"{settings.API_PREFIX}/courses/{{course_id}}/analytics")
async def get_course_analytics(
    course_id: int,
    top_percentile: float = 10.0,
    services: dict = Depends(get_services)
):
    """
    Get course analytics and top performer patterns

    - **course_id**: Moodle course ID
    - **top_percentile**: Percentile to consider as "top performers" (default: 10.0 = top 10%)
    """
    try:
        analysis_service = services['analysis']
        data = analysis_service.analyze_top_performers(course_id, top_percentile)

        # Remove detailed top_performers_data to reduce response size
        if 'top_performers_data' in data:
            data['top_performers_summary'] = {
                'count': len(data['top_performers_data']),
                'avg_metrics': {
                    'avg_session_duration': round(
                        sum(d['avg_session_duration'] for d in data['top_performers_data']) / len(data['top_performers_data']), 2
                    ) if data['top_performers_data'] else 0,
                    'avg_sessions_per_week': round(
                        sum(d['sessions_per_week'] for d in data['top_performers_data']) / len(data['top_performers_data']), 2
                    ) if data['top_performers_data'] else 0,
                }
            }
            del data['top_performers_data']

        return JSONResponse(content=data)

    except Exception as e:
        logger.error(f"Error analyzing course {course_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get(f"{settings.API_PREFIX}/students/{{user_id}}/courses/{{course_id}}/recommendations")
async def get_recommendations(
    user_id: int,
    course_id: int,
    services: dict = Depends(get_services)
):
    """
    Get personalized learning recommendations

    - **user_id**: Moodle user ID
    - **course_id**: Moodle course ID

    Returns comprehensive recommendations including:
    - Performance percentile
    - Gap analysis vs top performers
    - Prioritized action items
    - Personalized thinking routine
    """
    try:
        analysis_service = services['analysis']
        data = analysis_service.generate_personalized_recommendations(user_id, course_id)

        return JSONResponse(content=data)

    except Exception as e:
        logger.error(f"Error generating recommendations for student {user_id} in course {course_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get(f"{settings.API_PREFIX}/students/{{user_id}}/courses/{{course_id}}/routine")
async def get_thinking_routine(
    user_id: int,
    course_id: int,
    services: dict = Depends(get_services)
):
    """
    Get personalized thinking routine (optimized endpoint)

    - **user_id**: Moodle user ID
    - **course_id**: Moodle course ID

    Returns only the thinking routine component
    """
    try:
        analysis_service = services['analysis']
        data = analysis_service.generate_personalized_recommendations(user_id, course_id)

        # Return only thinking routine and essential context
        response = {
            'userid': user_id,
            'courseid': course_id,
            'performance_percentile': data['current_performance_percentile'],
            'thinking_routine': data['thinking_routine'],
            'top_priority_actions': [r for r in data['recommendations'] if r.get('priority') == 'high'][:3],
        }

        return JSONResponse(content=response)

    except Exception as e:
        logger.error(f"Error generating routine for student {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get(f"{settings.API_PREFIX}/students/{{user_id}}/courses/{{course_id}}/gap-analysis")
async def get_gap_analysis(
    user_id: int,
    course_id: int,
    services: dict = Depends(get_services)
):
    """
    Get detailed gap analysis comparing student to top performers

    - **user_id**: Moodle user ID
    - **course_id**: Moodle course ID
    """
    try:
        analysis_service = services['analysis']

        # Get student data
        student_data = analysis_service.analyze_student_comprehensive(user_id, course_id)
        overall_grade = services['moodle'].get_overall_grade(user_id, course_id)
        student_data['overall_grade'] = overall_grade or 0

        # Get top performer patterns
        top_patterns = analysis_service.analyze_top_performers(course_id, settings.TOP_PERFORMER_PERCENTILE)

        # Generate gap analysis
        gap_analysis = analysis_service.generate_gap_analysis(student_data, top_patterns)

        return JSONResponse(content={
            'userid': user_id,
            'courseid': course_id,
            'current_performance': {
                'grade': student_data['overall_grade'],
                'percentile': analysis_service.calculate_percentile(user_id, course_id),
            },
            'top_performer_benchmarks': {
                'grade': top_patterns['avg_top_performer_grade'],
                'study_duration': top_patterns['optimal_study_duration'],
                'sessions_per_week': top_patterns['optimal_session_frequency'],
            },
            'gaps': gap_analysis,
        })

    except Exception as e:
        logger.error(f"Error generating gap analysis for student {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get(f"{settings.API_PREFIX}/courses/{{course_id}}/leaderboard")
async def get_course_leaderboard(
    course_id: int,
    top_n: int = 10,
    services: dict = Depends(get_services)
):
    """
    Get course leaderboard

    - **course_id**: Moodle course ID
    - **top_n**: Number of top students to return (default: 10)
    """
    try:
        moodle_service = services['moodle']
        all_grades = moodle_service.get_all_student_grades(course_id)

        if not all_grades:
            return JSONResponse(content={'leaderboard': []})

        # Sort by grade
        sorted_students = sorted(all_grades.items(), key=lambda x: x[1], reverse=True)[:top_n]

        # Get basic info for each student
        leaderboard = []
        for rank, (user_id, grade) in enumerate(sorted_students, 1):
            student_info = moodle_service.get_student_basic_info(user_id)
            leaderboard.append({
                'rank': rank,
                'user_id': user_id,
                'name': f"{student_info['firstname']} {student_info['lastname']}" if student_info else "Unknown",
                'grade': round(grade, 2),
            })

        return JSONResponse(content={'leaderboard': leaderboard, 'total_students': len(all_grades)})

    except Exception as e:
        logger.error(f"Error generating leaderboard for course {course_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Import datetime here for health check
from datetime import datetime


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
