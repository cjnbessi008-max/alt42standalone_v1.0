"""Correlation analysis API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.models.analysis import AnalysisType
from app.services.correlation_service import get_correlation_service

router = APIRouter()


class CorrelationAnalysisRequest(BaseModel):
    """Request model for correlation analysis."""

    analysis_name: Optional[str] = None
    analysis_type: str = "pearson"  # pearson, spearman, kendall, linear_regression
    course_id: Optional[int] = None
    quiz_id: Optional[int] = None
    student_ids: Optional[List[int]] = None


@router.post("/analyze", response_model=Dict[str, Any])
async def run_correlation_analysis(
    request: CorrelationAnalysisRequest,
    db: Session = Depends(get_db),
):
    """
    Run correlation analysis between reasoning density and accuracy rates.

    Args:
        request: Analysis parameters
        db: Database session

    Returns:
        Analysis results including correlation coefficient, p-value, etc.
    """
    # Validate analysis type
    try:
        analysis_type = AnalysisType(request.analysis_type.lower())
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid analysis type. Must be one of: {[t.value for t in AnalysisType]}",
        )

    # Get correlation service
    service = get_correlation_service()

    # Perform analysis
    results = service.perform_analysis(
        db=db,
        analysis_type=analysis_type,
        course_id=request.course_id,
        quiz_id=request.quiz_id,
        student_ids=request.student_ids,
        analysis_name=request.analysis_name,
    )

    if "error" in results:
        raise HTTPException(status_code=400, detail=results["error"])

    return results


@router.get("/results/{analysis_id}", response_model=Dict[str, Any])
async def get_analysis_results(
    analysis_id: int,
    db: Session = Depends(get_db),
):
    """Get results of a previously run correlation analysis."""
    from app.models.analysis import CorrelationAnalysis

    analysis = (
        db.query(CorrelationAnalysis)
        .filter(CorrelationAnalysis.id == analysis_id)
        .first()
    )

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    return {
        "id": analysis.id,
        "analysis_name": analysis.analysis_name,
        "analysis_type": analysis.analysis_type.value,
        "course_id": analysis.course_id,
        "quiz_id": analysis.quiz_id,
        "sample_size": analysis.sample_size,
        "correlation_coefficient": float(analysis.correlation_coefficient),
        "p_value": float(analysis.p_value),
        "r_squared": float(analysis.r_squared) if analysis.r_squared else None,
        "confidence_interval": {
            "lower": float(analysis.confidence_interval_lower),
            "upper": float(analysis.confidence_interval_upper),
        },
        "is_significant": analysis.is_significant,
        "significance_level": float(analysis.significance_level),
        "effect_size": analysis.effect_size,
        "analysis_date": analysis.analysis_date.isoformat(),
        "notes": analysis.notes,
    }


@router.get("/visualize/{analysis_id}", response_model=Dict[str, Any])
async def get_visualization_data(
    analysis_id: int,
    db: Session = Depends(get_db),
):
    """Get data formatted for visualization (scatter plot, trend line, etc.)."""
    service = get_correlation_service()
    viz_data = service.get_visualization_data(db, analysis_id)

    if "error" in viz_data:
        raise HTTPException(status_code=404, detail=viz_data["error"])

    return viz_data


@router.get("/list", response_model=List[Dict[str, Any]])
async def list_analyses(
    course_id: Optional[int] = None,
    quiz_id: Optional[int] = None,
    limit: int = Query(default=20, le=100),
    db: Session = Depends(get_db),
):
    """List all correlation analyses, optionally filtered by course or quiz."""
    from app.models.analysis import CorrelationAnalysis

    query = db.query(CorrelationAnalysis)

    if course_id:
        query = query.filter(CorrelationAnalysis.course_id == course_id)

    if quiz_id:
        query = query.filter(CorrelationAnalysis.quiz_id == quiz_id)

    analyses = query.order_by(CorrelationAnalysis.analysis_date.desc()).limit(limit).all()

    return [
        {
            "id": a.id,
            "analysis_name": a.analysis_name,
            "analysis_type": a.analysis_type.value,
            "sample_size": a.sample_size,
            "correlation_coefficient": float(a.correlation_coefficient),
            "is_significant": a.is_significant,
            "effect_size": a.effect_size,
            "analysis_date": a.analysis_date.isoformat(),
        }
        for a in analyses
    ]


@router.delete("/{analysis_id}")
async def delete_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
):
    """Delete a correlation analysis."""
    from app.models.analysis import CorrelationAnalysis, CorrelationDataPoint

    analysis = (
        db.query(CorrelationAnalysis)
        .filter(CorrelationAnalysis.id == analysis_id)
        .first()
    )

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    # Delete data points first
    db.query(CorrelationDataPoint).filter(
        CorrelationDataPoint.correlation_analysis_id == analysis_id
    ).delete()

    # Delete analysis
    db.delete(analysis)
    db.commit()

    return {"status": "success", "message": "Analysis deleted"}
