"""
Efficiency Score (TES) API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from ...database import get_db
from ...schemas.efficiency import (
    TESCalculationRequest,
    TESCalculationResponse,
    EfficiencyScoreResponse,
    TESComponentScore,
    TESRawMetrics,
    TESCohortContext
)
from ...services.efficiency_calculator import EfficiencyCalculator, InsufficientDataError
from ...models.efficiency import EfficiencyScore

router = APIRouter()


@router.post("/calculate", response_model=TESCalculationResponse)
def calculate_tes(request: TESCalculationRequest, db: Session = Depends(get_db)):
    """
    Calculate Thought Efficiency Score (TES) for a student in a module.

    This endpoint:
    1. Fetches all student attempts for the module
    2. Calculates the 4 TES components (correctness, speed, first-try, consistency)
    3. Computes weighted TES score (0-100)
    4. Determines percentile rank within cohort
    5. Assigns letter grade (A-F)
    6. Caches result in database

    Requires at least 10 attempts for sufficient data.
    """
    calculator = EfficiencyCalculator(db)

    try:
        result = calculator.calculate_tes(
            student_id=request.student_id,
            module_id=request.module_id,
            force_recalc=request.force_recalc
        )

        # Transform to response format
        response = TESCalculationResponse(
            tes_score=result["tes_score"],
            tes_percentile=result["tes_percentile"],
            tes_grade=result["tes_grade"],
            components={
                key: TESComponentScore(**value)
                for key, value in result["components"].items()
            },
            raw_metrics=TESRawMetrics(**result["raw_metrics"]),
            problem_type_scores=result["problem_type_scores"],
            cohort_context=TESCohortContext(**result["cohort_context"]),
            sufficient_data=result["sufficient_data"],
            calculated_at=result["calculated_at"],
            next_update_eligible_at=result["next_update_eligible_at"]
        )

        return response

    except InsufficientDataError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TES calculation failed: {str(e)}")


@router.get("/scores/{student_id}/{module_id}", response_model=EfficiencyScoreResponse)
def get_efficiency_score(
    student_id: UUID,
    module_id: UUID,
    db: Session = Depends(get_db)
):
    """Get the current TES score for a student in a module."""
    score = db.query(EfficiencyScore).filter(
        EfficiencyScore.student_id == student_id,
        EfficiencyScore.module_id == module_id
    ).first()

    if not score:
        raise HTTPException(
            status_code=404,
            detail="No efficiency score found. Submit at least 10 attempts first."
        )

    return score


@router.get("/scores/{student_id}", response_model=list[EfficiencyScoreResponse])
def get_student_scores(
    student_id: UUID,
    include_insufficient: bool = False,
    db: Session = Depends(get_db)
):
    """Get all TES scores for a student across all modules."""
    query = db.query(EfficiencyScore).filter(
        EfficiencyScore.student_id == student_id
    )

    if not include_insufficient:
        query = query.filter(EfficiencyScore.sufficient_data == True)

    scores = query.order_by(EfficiencyScore.calculated_at.desc()).all()
    return scores
