"""
AI-powered recommendation API routes
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID

from app.db.database import get_db
from app.services.ai_recommendation import AIRecommendationService
from app.core.auth import get_current_active_user
from app.models.student_solution import Student

router = APIRouter()


@router.get("/student/{student_id}/analysis")
async def get_student_learning_analysis(
    student_id: UUID,
    current_user: Student = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed learning pattern analysis for a student
    Teachers can view any student, students can only view themselves
    """
    # Authorization check
    if not current_user.is_teacher and str(current_user.id) != str(student_id):
        raise HTTPException(status_code=403, detail="Not authorized to view this student's data")

    service = AIRecommendationService(db)
    analysis = service.analyze_student_learning_pattern(str(student_id))

    return {
        "student_id": str(student_id),
        "analysis": analysis
    }


@router.get("/student/{student_id}/recommendations")
async def get_personalized_recommendations(
    student_id: UUID,
    limit: int = 5,
    current_user: Student = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get AI-powered personalized problem recommendations for a student
    """
    # Authorization check
    if not current_user.is_teacher and str(current_user.id) != str(student_id):
        raise HTTPException(status_code=403, detail="Not authorized")

    service = AIRecommendationService(db)
    recommendations = await service.get_personalized_recommendations(
        str(student_id),
        limit=limit
    )

    return recommendations


@router.get("/my-recommendations")
async def get_my_recommendations(
    limit: int = 5,
    current_user: Student = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get personalized recommendations for the current user
    """
    service = AIRecommendationService(db)
    recommendations = await service.get_personalized_recommendations(
        str(current_user.id),
        limit=limit
    )

    return recommendations


@router.get("/student/{student_id}/learning-path")
async def get_learning_path(
    student_id: UUID,
    module_id: Optional[UUID] = None,
    current_user: Student = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Generate a personalized learning path for a student
    """
    # Authorization check
    if not current_user.is_teacher and str(current_user.id) != str(student_id):
        raise HTTPException(status_code=403, detail="Not authorized")

    service = AIRecommendationService(db)
    learning_path = await service.generate_learning_path(
        str(student_id),
        module_id=str(module_id) if module_id else None
    )

    return learning_path


@router.get("/my-learning-path")
async def get_my_learning_path(
    module_id: Optional[UUID] = None,
    current_user: Student = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get personalized learning path for the current user
    """
    service = AIRecommendationService(db)
    learning_path = await service.generate_learning_path(
        str(current_user.id),
        module_id=str(module_id) if module_id else None
    )

    return learning_path


@router.get("/teacher/intervention-recommendations")
async def get_intervention_recommendations(
    current_user: Student = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get intervention recommendations for all students (teacher only)
    """
    if not current_user.is_teacher:
        raise HTTPException(status_code=403, detail="Teacher access required")

    # Get all students who have attempted problems
    from app.models.student_solution import StudentSolution
    student_ids = db.query(StudentSolution.student_id).distinct().all()

    service = AIRecommendationService(db)
    all_recommendations = []

    for (student_id,) in student_ids:
        rec = await service.get_teacher_intervention_recommendations(str(student_id))
        all_recommendations.append(rec)

    # Sort by intervention priority
    priority_order = {"high": 0, "medium": 1, "low": 2}
    all_recommendations.sort(
        key=lambda x: priority_order.get(x.get('intervention_priority', 'low'), 3)
    )

    return {
        "recommendations": all_recommendations,
        "total_students": len(all_recommendations),
        "high_priority_count": sum(1 for r in all_recommendations if r.get('intervention_priority') == 'high'),
        "medium_priority_count": sum(1 for r in all_recommendations if r.get('intervention_priority') == 'medium')
    }


@router.get("/teacher/student/{student_id}/intervention")
async def get_student_intervention(
    student_id: UUID,
    current_user: Student = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed intervention recommendations for a specific student (teacher only)
    """
    if not current_user.is_teacher:
        raise HTTPException(status_code=403, detail="Teacher access required")

    service = AIRecommendationService(db)
    intervention = await service.get_teacher_intervention_recommendations(str(student_id))

    return intervention


@router.get("/dashboard/insights")
async def get_dashboard_insights(
    current_user: Student = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get quick insights for dashboard
    """
    service = AIRecommendationService(db)

    if current_user.is_teacher:
        # Teacher dashboard insights
        from app.models.student_solution import StudentSolution

        total_students = db.query(Student).filter(Student.is_teacher == False).count()
        active_students = db.query(StudentSolution.student_id).distinct().count()

        return {
            "total_students": total_students,
            "active_students": active_students,
            "engagement_rate": round((active_students / total_students * 100) if total_students > 0 else 0, 2)
        }
    else:
        # Student dashboard insights
        analysis = service.analyze_student_learning_pattern(str(current_user.id))
        recommendations = await service.get_personalized_recommendations(
            str(current_user.id),
            limit=3
        )

        return {
            "learning_analysis": analysis,
            "quick_recommendations": recommendations,
            "progress_summary": {
                "problems_completed": analysis.get('total_problems_attempted', 0),
                "accuracy": analysis.get('accuracy_rate', 0),
                "learning_pace": analysis.get('learning_pace', 'unknown')
            }
        }
