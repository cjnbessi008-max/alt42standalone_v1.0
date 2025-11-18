"""
Analysis API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging

from app.core.database import get_db
from app.schemas.analysis import AnalysisRequest, AnalysisResponse, InefficientDetection
from app.services.analysis_service import AnalysisService
from app.models.submission import Submission
from app.models.student import Student

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/analysis", tags=["analysis"])


@router.post("/analyze", response_model=AnalysisResponse, status_code=status.HTTP_200_OK)
async def analyze_code(
    request: AnalysisRequest,
    db: Session = Depends(get_db)
):
    """
    Analyze PHP code for loop inefficiencies

    This endpoint accepts PHP code and returns a detailed analysis of
    inefficient loop patterns, performance issues, and optimization suggestions.
    """
    try:
        # Create submission if student_id provided
        submission_id = None
        if request.student_id:
            # Verify student exists or create
            student = db.query(Student).filter(Student.id == request.student_id).first()
            if not student:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Student with ID {request.student_id} not found"
                )

            # Create submission
            submission = Submission(
                student_id=request.student_id,
                code=request.code,
                moodle_assignment_id=request.assignment_id
            )
            db.add(submission)
            db.commit()
            db.refresh(submission)
            submission_id = submission.id

        # Analyze code
        analysis_service = AnalysisService(db)
        result = analysis_service.analyze_code(request.code, submission_id)

        # Convert to response format
        inefficiencies = [
            InefficientDetection(
                type=ineff.type.value if hasattr(ineff.type, 'value') else str(ineff.type),
                severity=ineff.severity.value if hasattr(ineff.severity, 'value') else str(ineff.severity),
                line_number=ineff.line_number,
                end_line_number=ineff.end_line_number,
                message=ineff.message,
                suggestion=ineff.suggestion,
                code_snippet=ineff.code_snippet,
                estimated_complexity_before=ineff.estimated_complexity_before,
                estimated_complexity_after=ineff.estimated_complexity_after,
                context=ineff.context
            )
            for ineff in result['inefficiencies']
        ]

        return AnalysisResponse(
            submission_id=submission_id,
            total_loops=result['total_loops'],
            inefficient_loops=result['inefficient_loops'],
            efficiency_score=result['efficiency_score'],
            total_issues=result['total_issues'],
            critical_issues=result['critical_issues'],
            warning_issues=result['warning_issues'],
            info_issues=result['info_issues'],
            inefficiencies=inefficiencies,
            recommendations=result['recommendations'],
            analysis_duration_ms=result['analysis_duration_ms'],
            analyzed_at=result['analyzed_at']
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in analyze_code endpoint: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing code: {str(e)}"
        )


@router.get("/submission/{submission_id}", response_model=AnalysisResponse)
async def get_submission_analysis(
    submission_id: str,
    db: Session = Depends(get_db)
):
    """Get analysis results for a specific submission"""
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Submission {submission_id} not found"
        )

    if not submission.analysis_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No analysis found for submission {submission_id}"
        )

    analysis = submission.analysis_result

    # Convert inefficiencies
    inefficiencies = [
        InefficientDetection(
            type=ineff.type.value,
            severity=ineff.severity.value,
            line_number=ineff.line_number,
            end_line_number=ineff.end_line_number,
            message=ineff.message,
            suggestion=ineff.suggestion,
            code_snippet=ineff.code_snippet,
            estimated_complexity_before=ineff.estimated_complexity_before,
            estimated_complexity_after=ineff.estimated_complexity_after,
            context=ineff.context or {}
        )
        for ineff in analysis.inefficiencies
    ]

    return AnalysisResponse(
        submission_id=submission_id,
        total_loops=analysis.total_loops,
        inefficient_loops=analysis.inefficient_loops,
        efficiency_score=analysis.efficiency_score,
        total_issues=analysis.total_issues,
        critical_issues=analysis.critical_issues,
        warning_issues=analysis.warning_issues,
        info_issues=analysis.info_issues,
        inefficiencies=inefficiencies,
        recommendations=analysis.recommendations or [],
        analysis_duration_ms=analysis.analysis_duration_ms,
        analyzed_at=analysis.analyzed_at
    )


@router.get("/student/{student_id}/submissions")
async def get_student_submissions(
    student_id: str,
    db: Session = Depends(get_db)
):
    """Get all submissions for a student"""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student {student_id} not found"
        )

    submissions = db.query(Submission).filter(
        Submission.student_id == student_id
    ).order_by(Submission.submitted_at.desc()).all()

    return {
        "student_id": student_id,
        "total_submissions": len(submissions),
        "submissions": [
            {
                "id": sub.id,
                "filename": sub.filename,
                "submitted_at": sub.submitted_at,
                "analyzed": sub.analysis_result is not None,
                "efficiency_score": sub.analysis_result.efficiency_score if sub.analysis_result else None
            }
            for sub in submissions
        ]
    }
