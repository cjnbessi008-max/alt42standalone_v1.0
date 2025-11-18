"""
Analysis service - orchestrates code analysis
"""
import time
from typing import Dict, Any
from sqlalchemy.orm import Session
import logging

from app.services.loop_analyzer import LoopAnalyzer
from app.models.submission import Submission
from app.models.analysis_result import AnalysisResult
from app.models.inefficiency import Inefficiency
from datetime import datetime

logger = logging.getLogger(__name__)


class AnalysisService:
    """Service for analyzing code"""

    def __init__(self, db: Session):
        self.db = db
        self.analyzer = LoopAnalyzer()

    def analyze_code(self, code: str, submission_id: str = None) -> Dict[str, Any]:
        """
        Analyze PHP code for inefficiencies

        Args:
            code: PHP source code
            submission_id: Optional submission ID to save results

        Returns:
            Analysis results
        """
        start_time = time.time()

        try:
            # Run analysis
            result = self.analyzer.analyze(code)

            # Calculate duration
            duration_ms = int((time.time() - start_time) * 1000)
            result['analysis_duration_ms'] = duration_ms
            result['analyzed_at'] = datetime.utcnow()

            # Generate recommendations
            recommendations = self._generate_recommendations(result)
            result['recommendations'] = recommendations

            # Save to database if submission_id provided
            if submission_id and self.db:
                self._save_analysis_result(submission_id, result)

            return result

        except Exception as e:
            logger.error(f"Error analyzing code: {str(e)}", exc_info=True)
            raise

    def _generate_recommendations(self, analysis_result: Dict[str, Any]) -> list:
        """Generate high-level recommendations based on analysis"""
        recommendations = []
        inefficiencies = analysis_result.get('inefficiencies', [])

        # Count by type
        type_counts = {}
        for ineff in inefficiencies:
            ineff_type = ineff.type.value if hasattr(ineff.type, 'value') else str(ineff.type)
            type_counts[ineff_type] = type_counts.get(ineff_type, 0) + 1

        # Generate recommendations
        if type_counts.get('nested_loop', 0) > 0:
            recommendations.append(
                "Consider using hash maps or sets to reduce nested loop complexity"
            )

        if type_counts.get('db_query_in_loop', 0) > 0:
            recommendations.append(
                "Avoid database queries inside loops - use JOINs or fetch data before the loop"
            )

        if type_counts.get('loop_invariant', 0) > 0:
            recommendations.append(
                "Move calculations that don't change outside of loops to improve performance"
            )

        if type_counts.get('string_concat_in_loop', 0) > 0:
            recommendations.append(
                "Use arrays to collect strings and implode() after the loop instead of concatenating in loop"
            )

        if type_counts.get('inefficient_search', 0) > 0:
            recommendations.append(
                "Replace in_array() with isset() on associative arrays for faster lookups"
            )

        # General recommendations
        if analysis_result['efficiency_score'] < 70:
            recommendations.append(
                "Your code has significant performance issues. Review all highlighted inefficiencies carefully."
            )
        elif analysis_result['efficiency_score'] < 85:
            recommendations.append(
                "Your code has some performance issues. Focus on critical and warning level issues first."
            )
        else:
            recommendations.append(
                "Great job! Your code has minimal performance issues."
            )

        return recommendations

    def _save_analysis_result(self, submission_id: str, result: Dict[str, Any]) -> None:
        """Save analysis result to database"""
        try:
            # Create analysis result
            analysis = AnalysisResult(
                submission_id=submission_id,
                total_loops=result['total_loops'],
                inefficient_loops=result['inefficient_loops'],
                efficiency_score=result['efficiency_score'],
                total_issues=result['total_issues'],
                critical_issues=result['critical_issues'],
                warning_issues=result['warning_issues'],
                info_issues=result['info_issues'],
                analysis_duration_ms=result['analysis_duration_ms'],
                recommendations=result['recommendations'],
                analyzed_at=result['analyzed_at']
            )
            self.db.add(analysis)
            self.db.flush()

            # Create inefficiency records
            for ineff in result['inefficiencies']:
                inefficiency = Inefficiency(
                    analysis_result_id=analysis.id,
                    type=ineff.type,
                    severity=ineff.severity,
                    line_number=ineff.line_number,
                    end_line_number=ineff.end_line_number,
                    message=ineff.message,
                    suggestion=ineff.suggestion,
                    code_snippet=ineff.code_snippet,
                    estimated_complexity_before=ineff.estimated_complexity_before,
                    estimated_complexity_after=ineff.estimated_complexity_after,
                    context=ineff.context
                )
                self.db.add(inefficiency)

            self.db.commit()
            logger.info(f"Saved analysis result for submission {submission_id}")

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error saving analysis result: {str(e)}", exc_info=True)
            raise
