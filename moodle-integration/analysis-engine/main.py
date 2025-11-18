"""
Reasoning Path Analysis Engine

AI-powered grading engine for analyzing student reasoning paths.
Integrates with Claude API for intelligent assessment.

@package   reasoning_path_analyzer
@copyright 2025 KAIST Touch Math Academy
@license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
"""

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from anthropic import Anthropic
import os
import logging
from datetime import datetime
import hashlib
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Reasoning Path Analysis Engine",
    description="AI-powered grading for mathematical reasoning paths",
    version="1.0.0"
)

# CORS middleware for Moodle integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Anthropic client
anthropic_client = Anthropic(
    api_key=os.getenv("ANTHROPIC_API_KEY")
)

# Configuration
API_KEY = os.getenv("ANALYSIS_API_KEY", "default-key-change-in-production")
CLAUDE_MODEL = "claude-3-5-sonnet-20241022"


# Data models
class ReasoningStep(BaseModel):
    """Individual reasoning step from student."""
    type: str = Field(default="calculation", description="Step type")
    content: str = Field(..., description="Step content")
    description: Optional[str] = Field(None, description="Student explanation")
    latex: Optional[str] = Field(None, description="Mathematical expression")


class GradingWeights(BaseModel):
    """Weights for different grading criteria."""
    completeness: float = 40.0
    coherence: float = 30.0
    method: float = 20.0
    clarity: float = 10.0


class ReasoningPathRequest(BaseModel):
    """Request for reasoning path analysis."""
    attempt_id: int
    question_text: str
    steps: List[ReasoningStep]
    expected_steps: Optional[List[Dict[str, Any]]] = None
    grading_rubric: Optional[Dict[str, Any]] = None
    min_steps_required: int = 3
    weights: GradingWeights = GradingWeights()


class StepScore(BaseModel):
    """Score for individual step."""
    is_correct: Optional[bool]
    partial_credit: Optional[float]
    quality: Optional[float]


class AnalysisResponse(BaseModel):
    """Analysis result."""
    completeness_score: float
    logical_coherence_score: float
    method_appropriateness_score: float
    clarity_score: float
    final_grade: float
    feedback: str
    model: str = CLAUDE_MODEL
    metadata: Dict[str, Any] = {}
    step_scores: Optional[Dict[int, StepScore]] = None


# Authentication
def verify_api_key(authorization: str = Header(None)):
    """Verify API key from Authorization header."""
    if not authorization:
        raise HTTPException(status_code=401, detail="No authorization header")

    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
        if token != API_KEY:
            raise HTTPException(status_code=401, detail="Invalid API key")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header format")


# Helper functions
def build_reasoning_analysis_prompt(
    question_text: str,
    steps: List[ReasoningStep],
    expected_steps: Optional[List[Dict]] = None,
    rubric: Optional[Dict] = None
) -> str:
    """Build prompt for Claude API to analyze reasoning path."""

    prompt = f"""You are an expert mathematics educator evaluating a student's reasoning path for a problem.

**Problem:**
{question_text}

**Student's Reasoning Steps:**
"""

    for i, step in enumerate(steps, 1):
        prompt += f"\n{i}. "
        if step.description:
            prompt += f"{step.description}\n   "
        prompt += f"{step.content}"
        if step.latex:
            prompt += f"\n   (Math: {step.latex})"
        prompt += "\n"

    if expected_steps:
        prompt += "\n**Expected Solution Approach:**\n"
        for i, exp_step in enumerate(expected_steps, 1):
            desc = exp_step.get('description', exp_step.get('content', ''))
            prompt += f"{i}. {desc}\n"

    prompt += """

**Grading Task:**
Evaluate the student's reasoning path based on these criteria:

1. **Completeness (0-100):** Are all necessary reasoning steps present? Are there logical gaps?
   - All key steps present: 90-100
   - Minor gaps: 70-89
   - Significant missing steps: 50-69
   - Major gaps: 0-49

2. **Logical Coherence (0-100):** Do steps follow logically? Are there contradictions?
   - Perfect logical flow: 90-100
   - Minor logical issues: 70-89
   - Some contradictions or unclear connections: 50-69
   - Major logical problems: 0-49

3. **Method Appropriateness (0-100):** Is the approach suitable for this problem?
   - Optimal method: 90-100
   - Valid but not optimal: 70-89
   - Questionable approach: 50-69
   - Inappropriate method: 0-49

4. **Clarity & Communication (0-100):** Is the reasoning clearly explained?
   - Crystal clear: 90-100
   - Generally clear: 70-89
   - Somewhat unclear: 50-69
   - Confusing: 0-49

**Response Format (JSON):**
{
    "completeness": {
        "score": <0-100>,
        "explanation": "<detailed explanation>"
    },
    "coherence": {
        "score": <0-100>,
        "explanation": "<detailed explanation>"
    },
    "method": {
        "score": <0-100>,
        "explanation": "<detailed explanation>"
    },
    "clarity": {
        "score": <0-100>,
        "explanation": "<detailed explanation>"
    },
    "step_analysis": [
        {
            "step_number": <int>,
            "is_correct": <true/false>,
            "partial_credit": <0-1>,
            "quality": <0-1>,
            "comments": "<feedback for this step>"
        }
    ],
    "overall_feedback": "<constructive feedback for student>",
    "strengths": ["<strength 1>", "<strength 2>", ...],
    "areas_for_improvement": ["<area 1>", "<area 2>", ...]
}

Provide your analysis:"""

    return prompt


def parse_ai_response(response_text: str) -> Dict[str, Any]:
    """Parse Claude API response into structured data."""
    try:
        # Extract JSON from response (Claude may wrap in markdown)
        if "```json" in response_text:
            start = response_text.find("```json") + 7
            end = response_text.find("```", start)
            json_str = response_text[start:end].strip()
        elif "```" in response_text:
            start = response_text.find("```") + 3
            end = response_text.find("```", start)
            json_str = response_text[start:end].strip()
        else:
            json_str = response_text.strip()

        return json.loads(json_str)
    except (json.JSONDecodeError, ValueError) as e:
        logger.error(f"Failed to parse AI response: {e}")
        logger.error(f"Response text: {response_text}")
        raise HTTPException(
            status_code=500,
            detail="Failed to parse AI analysis response"
        )


def calculate_final_grade(
    scores: Dict[str, float],
    weights: GradingWeights
) -> float:
    """Calculate weighted final grade."""
    final = (
        (scores['completeness'] * weights.completeness / 100) +
        (scores['coherence'] * weights.coherence / 100) +
        (scores['method'] * weights.method / 100) +
        (scores['clarity'] * weights.clarity / 100)
    )
    return round(final, 2)


def format_feedback(analysis: Dict[str, Any]) -> str:
    """Format AI analysis into student-friendly feedback."""
    feedback_parts = []

    # Overall feedback
    if 'overall_feedback' in analysis:
        feedback_parts.append(analysis['overall_feedback'])

    # Strengths
    if 'strengths' in analysis and analysis['strengths']:
        feedback_parts.append("\n**Strengths:**")
        for strength in analysis['strengths']:
            feedback_parts.append(f"- {strength}")

    # Areas for improvement
    if 'areas_for_improvement' in analysis and analysis['areas_for_improvement']:
        feedback_parts.append("\n**Areas for Improvement:**")
        for area in analysis['areas_for_improvement']:
            feedback_parts.append(f"- {area}")

    # Criteria explanations
    feedback_parts.append("\n**Detailed Analysis:**")
    for criterion in ['completeness', 'coherence', 'method', 'clarity']:
        if criterion in analysis and 'explanation' in analysis[criterion]:
            label = criterion.replace('_', ' ').title()
            score = analysis[criterion].get('score', 0)
            explanation = analysis[criterion]['explanation']
            feedback_parts.append(f"\n*{label} ({score}/100):* {explanation}")

    return "\n".join(feedback_parts)


# API endpoints
@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "Reasoning Path Analysis Engine",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """Detailed health check."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "anthropic_configured": bool(os.getenv("ANTHROPIC_API_KEY")),
    }


@app.post("/api/analyze-reasoning", response_model=AnalysisResponse)
async def analyze_reasoning_path(
    request: ReasoningPathRequest,
    authorization: str = Header(None)
):
    """
    Analyze student's reasoning path and provide grading.

    This endpoint uses Claude API to intelligently assess:
    - Completeness of reasoning
    - Logical coherence
    - Method appropriateness
    - Clarity of communication
    """
    # Verify authentication
    verify_api_key(authorization)

    logger.info(f"Analyzing reasoning path for attempt {request.attempt_id}")

    try:
        # Build analysis prompt
        prompt = build_reasoning_analysis_prompt(
            request.question_text,
            request.steps,
            request.expected_steps,
            request.grading_rubric
        )

        # Call Claude API
        logger.info("Calling Claude API for analysis")
        response = anthropic_client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=4000,
            temperature=0.3,  # Lower temperature for more consistent grading
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )

        # Parse response
        response_text = response.content[0].text
        logger.info(f"Received AI response: {len(response_text)} characters")

        analysis = parse_ai_response(response_text)

        # Extract scores
        scores = {
            'completeness': analysis['completeness']['score'],
            'coherence': analysis['coherence']['score'],
            'method': analysis['method']['score'],
            'clarity': analysis['clarity']['score'],
        }

        # Calculate final grade
        final_grade = calculate_final_grade(scores, request.weights)

        # Format feedback
        feedback = format_feedback(analysis)

        # Extract step scores
        step_scores = {}
        if 'step_analysis' in analysis:
            for step_data in analysis['step_analysis']:
                step_num = step_data['step_number']
                step_scores[step_num] = StepScore(
                    is_correct=step_data.get('is_correct'),
                    partial_credit=step_data.get('partial_credit'),
                    quality=step_data.get('quality')
                )

        # Build response
        result = AnalysisResponse(
            completeness_score=scores['completeness'],
            logical_coherence_score=scores['coherence'],
            method_appropriateness_score=scores['method'],
            clarity_score=scores['clarity'],
            final_grade=final_grade,
            feedback=feedback,
            model=CLAUDE_MODEL,
            metadata={
                'attempt_id': request.attempt_id,
                'step_count': len(request.steps),
                'timestamp': datetime.now().isoformat(),
                'weights_used': request.weights.dict(),
            },
            step_scores=step_scores if step_scores else None
        )

        logger.info(f"Analysis complete: final_grade={final_grade}")
        return result

    except Exception as e:
        logger.error(f"Error analyzing reasoning path: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )


@app.post("/api/batch-analyze")
async def batch_analyze(
    requests: List[ReasoningPathRequest],
    authorization: str = Header(None)
):
    """Analyze multiple reasoning paths in batch."""
    verify_api_key(authorization)

    results = []
    for req in requests:
        try:
            result = await analyze_reasoning_path(req, authorization)
            results.append({
                "attempt_id": req.attempt_id,
                "success": True,
                "result": result
            })
        except Exception as e:
            results.append({
                "attempt_id": req.attempt_id,
                "success": False,
                "error": str(e)
            })

    return {
        "total": len(requests),
        "successful": sum(1 for r in results if r['success']),
        "failed": sum(1 for r in results if not r['success']),
        "results": results
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
