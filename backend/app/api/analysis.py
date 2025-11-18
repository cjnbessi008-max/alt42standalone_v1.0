"""
Gap Analysis API endpoints
This is the core API for quantifying logical gaps in solutions
"""
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.models.solution import Solution, SolutionStatus
from app.models.problem import Problem
from app.models.analysis import GapAnalysis, DetectedGap, StepComparison, FeedbackItem
from app.api.schemas import GapAnalysisResponse, DetectedGapResponse, StepComparisonResponse, FeedbackItemResponse
from app.services.gap_analyzer import GapAnalyzer

router = APIRouter(prefix="/analysis", tags=["analysis"])


async def perform_gap_analysis(
    solution_id: UUID,
    db: Session
):
    """Background task to perform gap analysis"""
    # Get solution and problem
    solution = db.query(Solution).filter(Solution.id == solution_id).first()
    if not solution:
        return

    problem = db.query(Problem).filter(Problem.id == solution.problem_id).first()
    if not problem:
        return

    # Perform AI analysis
    analyzer = GapAnalyzer()
    analysis_result = await analyzer.analyze_solution(problem, solution)

    # Create GapAnalysis record
    gap_analysis = GapAnalysis(
        solution_id=solution_id,
        completeness_score=analysis_result["completeness_score"],
        logic_continuity_score=analysis_result["logic_continuity_score"],
        correctness_score=analysis_result["correctness_score"],
        overall_score=analysis_result["overall_score"],
        total_gaps_detected=analysis_result["total_gaps_detected"],
        critical_gaps_count=analysis_result["critical_gaps_count"],
        missing_steps_count=analysis_result["missing_steps_count"],
        logical_errors_count=analysis_result["logical_errors_count"],
        ai_summary=analysis_result.get("ai_summary"),
        ai_feedback=analysis_result.get("ai_feedback"),
        ai_model_used=analysis_result.get("ai_model_used"),
        detailed_analysis=analysis_result
    )
    db.add(gap_analysis)
    db.flush()  # Get the gap_analysis.id

    # Create DetectedGap records
    for gap_data in analysis_result.get("detected_gaps", []):
        detected_gap = DetectedGap(
            analysis_id=gap_analysis.id,
            gap_type=gap_data.get("gap_type"),
            severity=gap_data.get("severity"),
            after_step_number=gap_data.get("after_step_number"),
            before_step_number=gap_data.get("before_step_number"),
            description=gap_data.get("description"),
            expected_content=gap_data.get("expected_content"),
            suggestion=gap_data.get("suggestion"),
            metadata=gap_data.get("metadata", {})
        )
        db.add(detected_gap)

    # Create StepComparison records
    for comparison_data in analysis_result.get("step_comparisons", []):
        step_comparison = StepComparison(
            analysis_id=gap_analysis.id,
            student_step_number=comparison_data.get("student_step_number"),
            expected_step_number=comparison_data.get("expected_step_number"),
            similarity_score=comparison_data.get("similarity_score"),
            match_type=comparison_data.get("match_type"),
            student_content=comparison_data.get("student_content"),
            expected_content=comparison_data.get("expected_content"),
            comparison_notes=comparison_data.get("comparison_notes"),
            metadata=comparison_data.get("metadata", {})
        )
        db.add(step_comparison)

    # Create FeedbackItem records
    for feedback_data in analysis_result.get("feedback_items", []):
        feedback_item = FeedbackItem(
            analysis_id=gap_analysis.id,
            feedback_type=feedback_data.get("feedback_type"),
            content=feedback_data.get("content"),
            priority=feedback_data.get("priority", 2),
            related_step_number=feedback_data.get("related_step_number"),
            metadata=feedback_data.get("metadata", {})
        )
        db.add(feedback_item)

    # Update solution status
    solution.status = SolutionStatus.ANALYZED

    db.commit()


@router.post("/solutions/{solution_id}", response_model=dict, status_code=status.HTTP_202_ACCEPTED)
async def analyze_solution(
    solution_id: UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Trigger gap analysis for a solution
    This is an async operation - use GET endpoint to retrieve results
    """
    # Verify solution exists
    solution = db.query(Solution).filter(Solution.id == solution_id).first()
    if not solution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Solution with id {solution_id} not found"
        )

    # Check if already analyzed
    existing_analysis = db.query(GapAnalysis).filter(
        GapAnalysis.solution_id == solution_id
    ).first()
    if existing_analysis:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Solution has already been analyzed. Use GET to retrieve results."
        )

    # Add background task for analysis
    background_tasks.add_task(perform_gap_analysis, solution_id, db)

    return {
        "message": "Gap analysis started",
        "solution_id": str(solution_id),
        "status": "processing"
    }


@router.get("/solutions/{solution_id}", response_model=GapAnalysisResponse)
async def get_analysis_results(
    solution_id: UUID,
    include_details: bool = True,
    db: Session = Depends(get_db)
):
    """Get gap analysis results for a solution"""
    analysis = db.query(GapAnalysis).filter(
        GapAnalysis.solution_id == solution_id
    ).first()

    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No analysis found for solution {solution_id}. Please trigger analysis first."
        )

    response_data = GapAnalysisResponse.model_validate(analysis)

    if include_details:
        # Load related data
        detected_gaps = db.query(DetectedGap).filter(
            DetectedGap.analysis_id == analysis.id
        ).all()
        response_data.detected_gaps = [DetectedGapResponse.model_validate(g) for g in detected_gaps]

        step_comparisons = db.query(StepComparison).filter(
            StepComparison.analysis_id == analysis.id
        ).all()
        response_data.step_comparisons = [StepComparisonResponse.model_validate(s) for s in step_comparisons]

        feedback_items = db.query(FeedbackItem).filter(
            FeedbackItem.analysis_id == analysis.id
        ).order_by(FeedbackItem.priority).all()
        response_data.feedback_items = [FeedbackItemResponse.model_validate(f) for f in feedback_items]

    return response_data


@router.get("/{analysis_id}", response_model=GapAnalysisResponse)
async def get_analysis_by_id(
    analysis_id: UUID,
    include_details: bool = True,
    db: Session = Depends(get_db)
):
    """Get gap analysis results by analysis ID"""
    analysis = db.query(GapAnalysis).filter(GapAnalysis.id == analysis_id).first()

    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis with id {analysis_id} not found"
        )

    response_data = GapAnalysisResponse.model_validate(analysis)

    if include_details:
        detected_gaps = db.query(DetectedGap).filter(
            DetectedGap.analysis_id == analysis_id
        ).all()
        response_data.detected_gaps = [DetectedGapResponse.model_validate(g) for g in detected_gaps]

        step_comparisons = db.query(StepComparison).filter(
            StepComparison.analysis_id == analysis_id
        ).all()
        response_data.step_comparisons = [StepComparisonResponse.model_validate(s) for s in step_comparisons]

        feedback_items = db.query(FeedbackItem).filter(
            FeedbackItem.analysis_id == analysis_id
        ).order_by(FeedbackItem.priority).all()
        response_data.feedback_items = [FeedbackItemResponse.model_validate(f) for f in feedback_items]

    return response_data


@router.get("/gaps/{analysis_id}", response_model=List[DetectedGapResponse])
async def get_detected_gaps(
    analysis_id: UUID,
    severity: str = None,
    db: Session = Depends(get_db)
):
    """Get all detected gaps for an analysis"""
    query = db.query(DetectedGap).filter(DetectedGap.analysis_id == analysis_id)

    if severity:
        query = query.filter(DetectedGap.severity == severity)

    gaps = query.all()
    return [DetectedGapResponse.model_validate(g) for g in gaps]
