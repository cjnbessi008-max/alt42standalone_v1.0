"""
API endpoints for mistake pattern analysis and warnings
"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.config import settings
from ..models import schemas
from ..models.database import MistakePattern, MistakeWarning, Student
from ..services.pattern_analyzer import PatternAnalyzerService

router = APIRouter(prefix="/patterns", tags=["Mistake Patterns"])


@router.post("/analyze/{student_id}", response_model=schemas.PatternAnalysisResponse)
async def analyze_student_patterns(
    student_id: UUID,
    module_id: Optional[UUID] = None,
    days_back: int = 30,
    min_frequency: int = 2,
    db: Session = Depends(get_db)
):
    """
    Analyze mistake patterns for a student using AI

    This endpoint:
    1. Fetches recent incorrect attempts
    2. Uses Claude AI to identify common mistake patterns
    3. Saves patterns to database
    4. Returns analysis results
    """
    # Verify student exists
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {student_id} not found"
        )

    # Initialize pattern analyzer
    analyzer = PatternAnalyzerService(db=db, anthropic_api_key=settings.ANTHROPIC_API_KEY)

    # Analyze patterns
    patterns = await analyzer.analyze_student_patterns(
        student_id=student_id,
        module_id=module_id,
        days_back=days_back,
        min_frequency=min_frequency
    )

    return schemas.PatternAnalysisResponse(
        student_id=student_id,
        patterns=[schemas.MistakePatternResponse.from_orm(p) for p in patterns],
        total_patterns=len(patterns),
        analysis_timestamp=datetime.utcnow()
    )


@router.get("/student/{student_id}", response_model=List[schemas.MistakePatternResponse])
async def get_student_patterns(
    student_id: UUID,
    module_id: Optional[UUID] = None,
    include_inactive: bool = False,
    db: Session = Depends(get_db)
):
    """
    Get all mistake patterns for a student
    """
    query = db.query(MistakePattern).filter(MistakePattern.student_id == student_id)

    if module_id:
        query = query.filter(MistakePattern.module_id == module_id)

    if not include_inactive:
        query = query.filter(MistakePattern.is_active == True)

    patterns = query.order_by(MistakePattern.last_occurrence.desc()).all()

    return [schemas.MistakePatternResponse.from_orm(p) for p in patterns]


@router.get("/summary/{student_id}")
async def get_pattern_summary(
    student_id: UUID,
    module_id: Optional[UUID] = None,
    db: Session = Depends(get_db)
):
    """
    Get a summary of student's mistake patterns
    """
    analyzer = PatternAnalyzerService(db=db, anthropic_api_key=settings.ANTHROPIC_API_KEY)
    summary = await analyzer.get_student_mistake_summary(
        student_id=student_id,
        module_id=module_id
    )

    # Convert patterns to response format
    summary["patterns"] = [
        schemas.MistakePatternResponse.from_orm(p) for p in summary["patterns"]
    ]

    return summary


@router.post("/check-warnings", response_model=schemas.WarningCheckResponse)
async def check_warnings_for_problem(
    request: schemas.WarningCheckRequest,
    db: Session = Depends(get_db)
):
    """
    Check if a problem triggers any mistake pattern warnings for a student

    This is called BEFORE a student attempts a problem to show preventive warnings
    """
    analyzer = PatternAnalyzerService(db=db, anthropic_api_key=settings.ANTHROPIC_API_KEY)

    matching_patterns, warning_messages = await analyzer.check_for_warnings(
        student_id=request.student_id,
        problem_id=request.problem_id,
        problem_content=request.problem_content
    )

    if not matching_patterns:
        return schemas.WarningCheckResponse(
            has_warnings=False,
            warnings=[],
            recommended_focus_areas=[]
        )

    # Create warning records
    warnings = []
    for pattern, message in zip(matching_patterns, warning_messages):
        warning = MistakeWarning(
            student_id=request.student_id,
            problem_id=request.problem_id,
            pattern_id=pattern.id,
            warning_type=pattern.pattern_type,
            message=message,
            severity=pattern.severity
        )
        db.add(warning)
        warnings.append(warning)

    db.commit()

    # Get recommended focus areas
    focus_areas = list(set([
        pattern.pattern_category or pattern.pattern_type
        for pattern in matching_patterns
    ]))

    return schemas.WarningCheckResponse(
        has_warnings=True,
        warnings=[schemas.MistakeWarningResponse.from_orm(w) for w in warnings],
        recommended_focus_areas=focus_areas
    )


@router.put("/patterns/{pattern_id}", response_model=schemas.MistakePatternResponse)
async def update_pattern(
    pattern_id: UUID,
    update_data: schemas.MistakePatternUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a mistake pattern (e.g., mark as inactive)
    """
    pattern = db.query(MistakePattern).filter(MistakePattern.id == pattern_id).first()
    if not pattern:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pattern with ID {pattern_id} not found"
        )

    # Update fields
    update_dict = update_data.dict(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(pattern, field, value)

    db.commit()
    db.refresh(pattern)

    return schemas.MistakePatternResponse.from_orm(pattern)


@router.post("/warnings/{warning_id}/dismiss")
async def dismiss_warning(
    warning_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Mark a warning as dismissed by the student
    """
    warning = db.query(MistakeWarning).filter(MistakeWarning.id == warning_id).first()
    if not warning:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Warning with ID {warning_id} not found"
        )

    warning.is_dismissed = True
    warning.dismissed_at = datetime.utcnow()

    db.commit()

    return {"status": "success", "message": "Warning dismissed"}


@router.get("/warnings/student/{student_id}", response_model=List[schemas.MistakeWarningResponse])
async def get_student_warnings(
    student_id: UUID,
    include_dismissed: bool = False,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Get all warnings for a student
    """
    query = db.query(MistakeWarning).filter(MistakeWarning.student_id == student_id)

    if not include_dismissed:
        query = query.filter(MistakeWarning.is_dismissed == False)

    warnings = query.order_by(MistakeWarning.shown_at.desc()).limit(limit).all()

    return [schemas.MistakeWarningResponse.from_orm(w) for w in warnings]
