from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
import time
import logging
import uuid
from typing import Dict, Any

from ..models.schemas import AnalysisRequest, AnalysisResponse, FallacyInstance
from ..services.reasoning_analyzer import analyzer
from ..config.database import get_db

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/analyze", response_model=AnalysisResponse, status_code=200)
async def analyze_argument(request: AnalysisRequest, db=Depends(get_db)):
    """
    Analyze an argument for logical fallacies and reasoning errors.
    """
    try:
        start_time = time.time()
        logger.info(f"Received analysis request for argument: {request.argument_id}")

        # Perform AI analysis
        analysis_result = analyzer.analyze_argument(request.content)

        # Calculate processing time
        processing_time_ms = int((time.time() - start_time) * 1000)

        # Save refutation to database
        refutation_id = await save_refutation(
            db=db,
            argument_id=request.argument_id,
            analysis_result=analysis_result,
            processing_time_ms=processing_time_ms
        )

        # Save fallacy instances
        if analysis_result.get("fallacies"):
            await save_fallacy_instances(
                db=db,
                refutation_id=refutation_id,
                fallacies=analysis_result["fallacies"]
            )

        # Prepare response
        response = AnalysisResponse(
            argument_id=request.argument_id,
            refutation_id=refutation_id,
            analysis_summary=analysis_result.get("analysis_summary", ""),
            logical_structure=analysis_result.get("logical_structure"),
            premise_analysis=analysis_result.get("premise_analysis"),
            conclusion_analysis=analysis_result.get("conclusion_analysis"),
            refutation_text=analysis_result.get("refutation_text", ""),
            correct_reasoning=analysis_result.get("correct_reasoning"),
            guided_questions=analysis_result.get("guided_questions", []),
            fallacies=[FallacyInstance(**f) for f in analysis_result.get("fallacies", [])],
            confidence_score=analysis_result.get("confidence_score", 0.5),
            processing_time_ms=processing_time_ms,
            created_at=datetime.now()
        )

        logger.info(f"Analysis completed for argument {request.argument_id} in {processing_time_ms}ms")
        return response

    except Exception as e:
        logger.error(f"Error analyzing argument: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


async def save_refutation(
    db: Any,
    argument_id: str,
    analysis_result: Dict[str, Any],
    processing_time_ms: int
) -> str:
    """Save refutation to database"""
    try:
        cursor = db.cursor()

        refutation_id = str(uuid.uuid4())

        query = """
            INSERT INTO refutations (
                id, argument_id, analysis_summary, logical_structure,
                premise_analysis, conclusion_analysis, refutation_text,
                correct_reasoning, guided_questions, confidence_score,
                ai_model, processing_time_ms
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
        """

        import json

        cursor.execute(query, (
            refutation_id,
            argument_id,
            analysis_result.get("analysis_summary"),
            json.dumps(analysis_result.get("logical_structure")),
            json.dumps(analysis_result.get("premise_analysis")),
            json.dumps(analysis_result.get("conclusion_analysis")),
            analysis_result.get("refutation_text"),
            analysis_result.get("correct_reasoning"),
            json.dumps(analysis_result.get("guided_questions", [])),
            analysis_result.get("confidence_score", 0.5),
            analyzer.model,
            processing_time_ms
        ))

        db.commit()
        cursor.close()

        logger.info(f"Saved refutation {refutation_id} to database")
        return refutation_id

    except Exception as e:
        db.rollback()
        logger.error(f"Error saving refutation: {e}")
        raise


async def save_fallacy_instances(
    db: Any,
    refutation_id: str,
    fallacies: list
) -> None:
    """Save detected fallacies to database"""
    try:
        cursor = db.cursor()

        for fallacy in fallacies:
            # Find fallacy ID by name
            cursor.execute(
                "SELECT id FROM fallacies WHERE name = %s",
                (fallacy["name"],)
            )
            result = cursor.fetchone()

            if not result:
                logger.warning(f"Fallacy '{fallacy['name']}' not found in database, skipping")
                continue

            fallacy_id = result["id"]

            # Insert fallacy instance
            query = """
                INSERT INTO fallacy_instances (
                    refutation_id, fallacy_id, excerpt, explanation,
                    severity, position_start, position_end
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            """

            cursor.execute(query, (
                refutation_id,
                fallacy_id,
                fallacy.get("excerpt", ""),
                fallacy.get("explanation", ""),
                fallacy.get("severity", "medium"),
                fallacy.get("position_start"),
                fallacy.get("position_end")
            ))

        db.commit()
        cursor.close()

        logger.info(f"Saved {len(fallacies)} fallacy instances for refutation {refutation_id}")

    except Exception as e:
        db.rollback()
        logger.error(f"Error saving fallacy instances: {e}")
        raise


@router.get("/fallacies/{fallacy_name}")
async def get_fallacy_info(fallacy_name: str):
    """Get detailed information about a specific fallacy"""
    try:
        info = analyzer.get_fallacy_suggestions(fallacy_name)
        return {
            "success": True,
            "data": info
        }
    except Exception as e:
        logger.error(f"Error getting fallacy info: {e}")
        raise HTTPException(status_code=500, detail=str(e))
