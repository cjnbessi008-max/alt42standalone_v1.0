"""
Problem Management Endpoints
API routes for problem creation, analysis, and retrieval
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import time
import logging

from app.db.database import get_db
from app.db.models import Problem, DerivativeRule, ProblemRule
from app.schemas.problem import (
    ProblemCreate,
    ProblemFromMoodle,
    ProblemResponse,
    AnalysisRequest,
    AnalysisResponse,
    DetectedRuleResponse
)
from app.services.claude_analyzer import ClaudeDerivativeAnalyzer
from app.services.moodle_client import MoodleClient

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_problem(
    request: AnalysisRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Analyze a derivative problem and detect core rules
    """
    start_time = time.time()

    try:
        # Create problem in database
        problem = Problem(
            problem_text=request.problem_text,
            problem_latex=request.problem_text if '\\' in request.problem_text or '$' in request.problem_text else None
        )
        db.add(problem)
        await db.flush()

        # Analyze with Claude AI
        analyzer = ClaudeDerivativeAnalyzer()
        analysis_result = await analyzer.analyze_problem(
            problem.problem_text,
            problem.problem_latex
        )

        # Update problem with analysis
        problem.ai_analysis = analysis_result.get('overall_analysis', '')
        if 'difficulty' in analysis_result:
            problem.difficulty_level = analysis_result['difficulty']

        # Save detected rules
        detected_rules = []
        for rule_data in analysis_result.get('detected_rules', [])[:3]:  # Top 3 only
            # Find or get rule by type
            rule_type = analyzer.map_rule_type(rule_data['rule_type'])
            stmt = select(DerivativeRule).where(
                DerivativeRule.rule_type == rule_type,
                DerivativeRule.is_core_rule == True
            )
            result = await db.execute(stmt)
            rule = result.scalar_one_or_none()

            if rule:
                # Create problem-rule mapping
                problem_rule = ProblemRule(
                    problem_id=problem.id,
                    rule_id=rule.id,
                    matched_expression=rule_data.get('matched_expression', ''),
                    confidence_score=rule_data.get('confidence', 1.0),
                    ai_explanation=rule_data.get('explanation', ''),
                    highlight_start=rule_data.get('highlight_positions', {}).get('start'),
                    highlight_end=rule_data.get('highlight_positions', {}).get('end')
                )
                db.add(problem_rule)

                detected_rules.append(DetectedRuleResponse(
                    rule_id=rule.id,
                    rule_name=rule.rule_name,
                    rule_type=rule.rule_type,
                    rule_formula=rule.rule_formula,
                    matched_expression=rule_data.get('matched_expression'),
                    highlight_start=rule_data.get('highlight_positions', {}).get('start'),
                    highlight_end=rule_data.get('highlight_positions', {}).get('end'),
                    confidence_score=rule_data.get('confidence', 1.0),
                    ai_explanation=rule_data.get('explanation'),
                    description=rule.description
                ))

        await db.commit()

        processing_time = (time.time() - start_time) * 1000  # Convert to ms

        return AnalysisResponse(
            success=True,
            problem_id=problem.id,
            problem_text=problem.problem_text,
            problem_latex=problem.problem_latex,
            detected_rules=detected_rules,
            ai_analysis=problem.ai_analysis,
            processing_time_ms=processing_time
        )

    except Exception as e:
        logger.error(f"Error analyzing problem: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze problem: {str(e)}"
        )


@router.post("/fetch-from-moodle", response_model=AnalysisResponse)
async def fetch_from_moodle(
    request: ProblemFromMoodle,
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch a problem from Moodle and analyze it
    """
    start_time = time.time()

    try:
        # Fetch from Moodle
        moodle_client = MoodleClient()
        question_data = await moodle_client.get_question_data(request.question_id)

        if not question_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Question {request.question_id} not found in Moodle"
            )

        # Extract problem text
        problem_text, problem_latex = moodle_client.extract_problem_text(question_data)

        if not problem_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No problem text found in Moodle question"
            )

        # Analyze the problem
        analysis_request = AnalysisRequest(
            problem_text=problem_latex or problem_text,
            use_ai=True
        )

        result = await analyze_problem(analysis_request, db)

        # Update with Moodle question ID
        stmt = select(Problem).where(Problem.id == result.problem_id)
        db_result = await db.execute(stmt)
        problem = db_result.scalar_one()
        problem.moodle_question_id = request.question_id
        await db.commit()

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching from Moodle: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch problem from Moodle: {str(e)}"
        )


@router.get("/{problem_id}", response_model=ProblemResponse)
async def get_problem(
    problem_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a problem by ID with detected rules
    """
    try:
        stmt = select(Problem).options(
            selectinload(Problem.problem_rules).selectinload(ProblemRule.rule)
        ).where(Problem.id == problem_id)

        result = await db.execute(stmt)
        problem = result.scalar_one_or_none()

        if not problem:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Problem {problem_id} not found"
            )

        # Build detected rules list
        detected_rules = [
            DetectedRuleResponse(
                rule_id=pr.rule.id,
                rule_name=pr.rule.rule_name,
                rule_type=pr.rule.rule_type,
                rule_formula=pr.rule.rule_formula,
                matched_expression=pr.matched_expression,
                highlight_start=pr.highlight_start,
                highlight_end=pr.highlight_end,
                confidence_score=float(pr.confidence_score),
                ai_explanation=pr.ai_explanation,
                description=pr.rule.description
            )
            for pr in problem.problem_rules
        ]

        return ProblemResponse(
            id=problem.id,
            moodle_question_id=problem.moodle_question_id,
            problem_text=problem.problem_text,
            problem_latex=problem.problem_latex,
            difficulty_level=problem.difficulty_level,
            ai_analysis=problem.ai_analysis,
            detected_rules=detected_rules,
            created_at=problem.created_at,
            updated_at=problem.updated_at
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving problem: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve problem: {str(e)}"
        )
