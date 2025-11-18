"""Bias Analysis API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from uuid import uuid4

from ..database import get_db
from ..schemas.bias_analysis import BiasAnalysisRequest, BiasAnalysisResponse, BiasMetrics
from ..services.bias_analyzer import BiasAnalyzer
from ..models.bias_analysis_result import BiasAnalysisResult

router = APIRouter()


@router.post("/frequency", response_model=BiasAnalysisResponse)
def analyze_frequency_bias(
    request: BiasAnalysisRequest,
    db: Session = Depends(get_db)
):
    """
    Analyze usage frequency bias.

    Identifies tools that are over-used or under-used compared to uniform distribution.
    Uses chi-square test and diversity metrics (Shannon entropy, Gini coefficient).
    """
    analyzer = BiasAnalyzer(db)

    try:
        results = analyzer.analyze_frequency_bias(
            time_period_start=request.time_period_start,
            time_period_end=request.time_period_end
        )

        if "error" in results:
            raise HTTPException(status_code=404, detail=results["error"])

        # Extract statistical metrics
        stats = results.get('statistical_tests', {})
        metrics = BiasMetrics(
            chi_square_statistic=stats.get('chi_square_statistic'),
            p_value=stats.get('p_value'),
            gini_coefficient=stats.get('gini_coefficient'),
            shannon_entropy=stats.get('shannon_entropy'),
            bias_score=stats.get('bias_score')
        )

        # Save to database
        bias_record = BiasAnalysisResult(
            id=uuid4(),
            analysis_type='frequency',
            time_period_start=request.time_period_start,
            time_period_end=request.time_period_end,
            filters=request.model_dump(exclude_unset=True),
            results=results,
            statistical_significance=metrics.model_dump(),
            recommendations=results.get('recommendations', [])
        )
        db.add(bias_record)
        db.commit()
        db.refresh(bias_record)

        return BiasAnalysisResponse(
            id=bias_record.id,
            analysis_type='frequency',
            analysis_date=bias_record.analysis_date,
            time_period_start=request.time_period_start,
            time_period_end=request.time_period_end,
            filters=request.model_dump(exclude_unset=True),
            results=results,
            statistical_significance=metrics,
            recommendations=results.get('recommendations'),
            summary=results.get('summary')
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/demographic", response_model=BiasAnalysisResponse)
def analyze_demographic_bias(
    request: BiasAnalysisRequest,
    db: Session = Depends(get_db)
):
    """
    Analyze demographic bias.

    Identifies if tools are equally effective across different student demographics
    (grade level, performance level).
    """
    analyzer = BiasAnalyzer(db)

    try:
        results = analyzer.analyze_demographic_bias(
            time_period_start=request.time_period_start,
            time_period_end=request.time_period_end
        )

        if "error" in results:
            raise HTTPException(status_code=404, detail=results["error"])

        metrics = BiasMetrics(
            bias_score=results.get('bias_score')
        )

        # Save to database
        bias_record = BiasAnalysisResult(
            id=uuid4(),
            analysis_type='demographic',
            time_period_start=request.time_period_start,
            time_period_end=request.time_period_end,
            filters=request.model_dump(exclude_unset=True),
            results=results,
            statistical_significance=metrics.model_dump(),
            recommendations=results.get('recommendations', [])
        )
        db.add(bias_record)
        db.commit()
        db.refresh(bias_record)

        return BiasAnalysisResponse(
            id=bias_record.id,
            analysis_type='demographic',
            analysis_date=bias_record.analysis_date,
            time_period_start=request.time_period_start,
            time_period_end=request.time_period_end,
            filters=request.model_dump(exclude_unset=True),
            results=results,
            statistical_significance=metrics,
            recommendations=results.get('recommendations'),
            summary=results.get('summary')
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/temporal", response_model=BiasAnalysisResponse)
def analyze_temporal_bias(
    request: BiasAnalysisRequest,
    db: Session = Depends(get_db)
):
    """
    Analyze temporal bias.

    Identifies if certain tools are only used at specific times of day or days of week.
    """
    analyzer = BiasAnalyzer(db)

    try:
        results = analyzer.analyze_temporal_bias(
            time_period_start=request.time_period_start,
            time_period_end=request.time_period_end
        )

        if "error" in results:
            raise HTTPException(status_code=404, detail=results["error"])

        metrics = BiasMetrics(
            bias_score=results.get('bias_score')
        )

        # Save to database
        bias_record = BiasAnalysisResult(
            id=uuid4(),
            analysis_type='temporal',
            time_period_start=request.time_period_start,
            time_period_end=request.time_period_end,
            filters=request.model_dump(exclude_unset=True),
            results=results,
            statistical_significance=metrics.model_dump(),
            recommendations=results.get('recommendations', [])
        )
        db.add(bias_record)
        db.commit()
        db.refresh(bias_record)

        return BiasAnalysisResponse(
            id=bias_record.id,
            analysis_type='temporal',
            analysis_date=bias_record.analysis_date,
            time_period_start=request.time_period_start,
            time_period_end=request.time_period_end,
            filters=request.model_dump(exclude_unset=True),
            results=results,
            statistical_significance=metrics,
            recommendations=results.get('recommendations'),
            summary=results.get('summary')
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/effectiveness", response_model=BiasAnalysisResponse)
def analyze_effectiveness_bias(
    request: BiasAnalysisRequest,
    db: Session = Depends(get_db)
):
    """
    Analyze effectiveness bias.

    Identifies which tools are most/least effective and variance in effectiveness.
    """
    analyzer = BiasAnalyzer(db)

    try:
        results = analyzer.analyze_effectiveness_bias(
            time_period_start=request.time_period_start,
            time_period_end=request.time_period_end
        )

        if "error" in results:
            raise HTTPException(status_code=404, detail=results["error"])

        metrics = BiasMetrics(
            bias_score=results.get('bias_score')
        )

        # Save to database
        bias_record = BiasAnalysisResult(
            id=uuid4(),
            analysis_type='effectiveness',
            time_period_start=request.time_period_start,
            time_period_end=request.time_period_end,
            filters=request.model_dump(exclude_unset=True),
            results=results,
            statistical_significance=metrics.model_dump(),
            recommendations=results.get('recommendations', [])
        )
        db.add(bias_record)
        db.commit()
        db.refresh(bias_record)

        return BiasAnalysisResponse(
            id=bias_record.id,
            analysis_type='effectiveness',
            analysis_date=bias_record.analysis_date,
            time_period_start=request.time_period_start,
            time_period_end=request.time_period_end,
            filters=request.model_dump(exclude_unset=True),
            results=results,
            statistical_significance=metrics,
            recommendations=results.get('recommendations'),
            summary=results.get('summary')
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/history")
def get_analysis_history(
    analysis_type: Optional[str] = None,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get history of bias analyses."""
    query = db.query(BiasAnalysisResult)

    if analysis_type:
        query = query.filter(BiasAnalysisResult.analysis_type == analysis_type)

    results = query.order_by(BiasAnalysisResult.analysis_date.desc()).limit(limit).all()

    return {
        "count": len(results),
        "analyses": [
            {
                "id": str(r.id),
                "type": r.analysis_type,
                "date": r.analysis_date,
                "bias_score": r.statistical_significance.get('bias_score') if r.statistical_significance else None,
                "recommendations_count": len(r.recommendations) if r.recommendations else 0
            }
            for r in results
        ]
    }


@router.get("/{analysis_id}", response_model=BiasAnalysisResponse)
def get_analysis_result(analysis_id: str, db: Session = Depends(get_db)):
    """Get a specific analysis result by ID."""
    from uuid import UUID

    try:
        analysis_uuid = UUID(analysis_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")

    result = db.query(BiasAnalysisResult).filter(BiasAnalysisResult.id == analysis_uuid).first()

    if not result:
        raise HTTPException(status_code=404, detail="Analysis not found")

    metrics = BiasMetrics(**result.statistical_significance) if result.statistical_significance else None

    return BiasAnalysisResponse(
        id=result.id,
        analysis_type=result.analysis_type,
        analysis_date=result.analysis_date,
        time_period_start=result.time_period_start,
        time_period_end=result.time_period_end,
        filters=result.filters,
        results=result.results,
        statistical_significance=metrics,
        recommendations=result.recommendations,
        summary=result.results.get('summary') if result.results else None
    )
