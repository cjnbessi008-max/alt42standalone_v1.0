"""Service for performing statistical correlation analysis."""
import numpy as np
import pandas as pd
from scipy import stats
from sklearn.linear_model import LinearRegression
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime
import logging

from app.models.analysis import (
    ReasoningDensityScore,
    AccuracyRate,
    CorrelationAnalysis,
    CorrelationDataPoint,
    AnalysisType,
)
from app.models.moodle import Student, QuizAttempt
from app.core.config import settings

logger = logging.getLogger(__name__)


class CorrelationAnalysisService:
    """Service for performing correlation analysis between reasoning density and accuracy."""

    def __init__(self, significance_level: float = 0.05):
        """
        Initialize correlation analysis service.

        Args:
            significance_level: Statistical significance threshold (default: 0.05)
        """
        self.significance_level = significance_level

    def calculate_accuracy_rate(
        self,
        db: Session,
        student_id: int,
        quiz_id: Optional[int] = None,
        course_id: Optional[int] = None,
    ) -> float:
        """
        Calculate accuracy rate for a student.

        Args:
            db: Database session
            student_id: Student ID
            quiz_id: Optional quiz ID to filter
            course_id: Optional course ID to filter

        Returns:
            Accuracy percentage (0-100)
        """
        query = db.query(QuizAttempt).filter(QuizAttempt.student_id == student_id)

        if quiz_id:
            query = query.filter(QuizAttempt.quiz_id == quiz_id)

        attempts = query.all()

        if not attempts:
            return 0.0

        # Calculate from question attempts
        total_questions = 0
        correct_answers = 0

        for attempt in attempts:
            for qa in attempt.question_attempts:
                total_questions += 1
                if qa.is_correct:
                    correct_answers += 1

        if total_questions == 0:
            return 0.0

        return round((correct_answers / total_questions) * 100, 2)

    def get_correlation_data(
        self,
        db: Session,
        course_id: Optional[int] = None,
        quiz_id: Optional[int] = None,
        student_ids: Optional[List[int]] = None,
    ) -> pd.DataFrame:
        """
        Gather data for correlation analysis.

        Args:
            db: Database session
            course_id: Optional course ID filter
            quiz_id: Optional quiz ID filter
            student_ids: Optional list of student IDs

        Returns:
            DataFrame with reasoning_density and accuracy_rate columns
        """
        # Query reasoning density scores
        density_query = db.query(ReasoningDensityScore)

        if student_ids:
            density_query = density_query.filter(
                ReasoningDensityScore.student_id.in_(student_ids)
            )

        density_scores = density_query.all()

        # Build data records
        data_records = []

        for density in density_scores:
            # Get corresponding quiz attempt
            quiz_attempt = (
                db.query(QuizAttempt)
                .filter(QuizAttempt.id == density.quiz_attempt_id)
                .first()
            )

            if not quiz_attempt:
                continue

            # Filter by quiz_id if specified
            if quiz_id and quiz_attempt.quiz_id != quiz_id:
                continue

            # Calculate accuracy for this attempt
            total = len(quiz_attempt.question_attempts)
            if total == 0:
                continue

            correct = sum(1 for qa in quiz_attempt.question_attempts if qa.is_correct)
            accuracy = (correct / total) * 100

            data_records.append(
                {
                    "student_id": density.student_id,
                    "quiz_attempt_id": density.quiz_attempt_id,
                    "reasoning_density": float(density.overall_density_score or 0),
                    "accuracy_rate": accuracy,
                    "time_spent": quiz_attempt.total_time_seconds or 0,
                    "attempt_number": quiz_attempt.attempt_number,
                }
            )

        df = pd.DataFrame(data_records)
        return df

    def pearson_correlation(
        self,
        x: np.ndarray,
        y: np.ndarray,
    ) -> Tuple[float, float]:
        """
        Calculate Pearson correlation coefficient.

        Args:
            x: Independent variable (reasoning density)
            y: Dependent variable (accuracy rate)

        Returns:
            Tuple of (correlation coefficient, p-value)
        """
        if len(x) < 3:
            logger.warning("Insufficient data for correlation analysis")
            return 0.0, 1.0

        r, p = stats.pearsonr(x, y)
        return float(r), float(p)

    def spearman_correlation(
        self,
        x: np.ndarray,
        y: np.ndarray,
    ) -> Tuple[float, float]:
        """
        Calculate Spearman rank correlation coefficient.

        Args:
            x: Independent variable (reasoning density)
            y: Dependent variable (accuracy rate)

        Returns:
            Tuple of (correlation coefficient, p-value)
        """
        if len(x) < 3:
            logger.warning("Insufficient data for correlation analysis")
            return 0.0, 1.0

        rho, p = stats.spearmanr(x, y)
        return float(rho), float(p)

    def kendall_correlation(
        self,
        x: np.ndarray,
        y: np.ndarray,
    ) -> Tuple[float, float]:
        """
        Calculate Kendall's tau correlation coefficient.

        Args:
            x: Independent variable (reasoning density)
            y: Dependent variable (accuracy rate)

        Returns:
            Tuple of (correlation coefficient, p-value)
        """
        if len(x) < 3:
            logger.warning("Insufficient data for correlation analysis")
            return 0.0, 1.0

        tau, p = stats.kendalltau(x, y)
        return float(tau), float(p)

    def linear_regression(
        self,
        x: np.ndarray,
        y: np.ndarray,
    ) -> Dict[str, Any]:
        """
        Perform linear regression analysis.

        Args:
            x: Independent variable (reasoning density)
            y: Dependent variable (accuracy rate)

        Returns:
            Dictionary with regression results
        """
        if len(x) < 3:
            logger.warning("Insufficient data for regression analysis")
            return {}

        # Reshape for sklearn
        X = x.reshape(-1, 1)

        # Fit model
        model = LinearRegression()
        model.fit(X, y)

        # Predictions
        y_pred = model.predict(X)

        # Calculate R-squared
        r_squared = model.score(X, y)

        # Calculate residuals
        residuals = y - y_pred

        # Calculate standard error
        mse = np.mean(residuals**2)
        rmse = np.sqrt(mse)

        return {
            "slope": float(model.coef_[0]),
            "intercept": float(model.intercept_),
            "r_squared": float(r_squared),
            "rmse": float(rmse),
            "predictions": y_pred.tolist(),
        }

    def calculate_confidence_interval(
        self,
        r: float,
        n: int,
        confidence: float = 0.95,
    ) -> Tuple[float, float]:
        """
        Calculate confidence interval for correlation coefficient.

        Uses Fisher's z-transformation.

        Args:
            r: Correlation coefficient
            n: Sample size
            confidence: Confidence level (default: 0.95)

        Returns:
            Tuple of (lower_bound, upper_bound)
        """
        if n < 4:
            return (r, r)

        # Fisher's z-transformation
        z = np.arctanh(r)

        # Standard error
        se = 1 / np.sqrt(n - 3)

        # Z-score for confidence level
        z_score = stats.norm.ppf((1 + confidence) / 2)

        # Confidence interval in z-space
        z_lower = z - z_score * se
        z_upper = z + z_score * se

        # Transform back to r-space
        r_lower = np.tanh(z_lower)
        r_upper = np.tanh(z_upper)

        return (float(r_lower), float(r_upper))

    def interpret_effect_size(self, r: float) -> str:
        """
        Interpret effect size based on correlation coefficient.

        Args:
            r: Correlation coefficient

        Returns:
            Effect size interpretation string
        """
        abs_r = abs(r)

        if abs_r < 0.1:
            return "negligible"
        elif abs_r < 0.3:
            return "small"
        elif abs_r < 0.5:
            return "medium"
        else:
            return "large"

    def perform_analysis(
        self,
        db: Session,
        analysis_type: AnalysisType,
        course_id: Optional[int] = None,
        quiz_id: Optional[int] = None,
        student_ids: Optional[List[int]] = None,
        analysis_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Perform correlation analysis.

        Args:
            db: Database session
            analysis_type: Type of correlation analysis
            course_id: Optional course ID
            quiz_id: Optional quiz ID
            student_ids: Optional student IDs
            analysis_name: Optional name for the analysis

        Returns:
            Dictionary with analysis results
        """
        # Get data
        df = self.get_correlation_data(
            db,
            course_id=course_id,
            quiz_id=quiz_id,
            student_ids=student_ids,
        )

        if len(df) < 3:
            logger.error("Insufficient data for correlation analysis")
            return {
                "error": "Insufficient data. Need at least 3 data points.",
                "sample_size": len(df),
            }

        # Extract variables
        x = df["reasoning_density"].values
        y = df["accuracy_rate"].values
        n = len(x)

        # Perform analysis based on type
        if analysis_type == AnalysisType.PEARSON:
            r, p = self.pearson_correlation(x, y)
            regression = self.linear_regression(x, y)
            r_squared = regression.get("r_squared")
        elif analysis_type == AnalysisType.SPEARMAN:
            r, p = self.spearman_correlation(x, y)
            r_squared = None
        elif analysis_type == AnalysisType.KENDALL:
            r, p = self.kendall_correlation(x, y)
            r_squared = None
        elif analysis_type == AnalysisType.LINEAR_REGRESSION:
            r, p = self.pearson_correlation(x, y)
            regression = self.linear_regression(x, y)
            r_squared = regression.get("r_squared")
        else:
            return {"error": "Invalid analysis type"}

        # Calculate confidence interval
        ci_lower, ci_upper = self.calculate_confidence_interval(r, n)

        # Interpret results
        is_significant = p < self.significance_level
        effect_size = self.interpret_effect_size(r)

        # Prepare results
        results = {
            "analysis_type": analysis_type.value,
            "sample_size": n,
            "correlation_coefficient": round(r, 4),
            "p_value": round(p, 8),
            "r_squared": round(r_squared, 4) if r_squared else None,
            "confidence_interval_lower": round(ci_lower, 4),
            "confidence_interval_upper": round(ci_upper, 4),
            "is_significant": is_significant,
            "effect_size": effect_size,
            "significance_level": self.significance_level,
            "mean_reasoning_density": round(x.mean(), 2),
            "mean_accuracy_rate": round(y.mean(), 2),
            "std_reasoning_density": round(x.std(), 2),
            "std_accuracy_rate": round(y.std(), 2),
        }

        if analysis_type in [AnalysisType.PEARSON, AnalysisType.LINEAR_REGRESSION]:
            results["regression"] = regression

        # Save to database
        correlation_analysis = CorrelationAnalysis(
            analysis_name=analysis_name
            or f"{analysis_type.value}_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            course_id=course_id,
            quiz_id=quiz_id,
            analysis_type=analysis_type,
            sample_size=n,
            correlation_coefficient=r,
            p_value=p,
            r_squared=r_squared,
            confidence_interval_lower=ci_lower,
            confidence_interval_upper=ci_upper,
            significance_level=self.significance_level,
            is_significant=is_significant,
            effect_size=effect_size,
            analysis_date=datetime.utcnow(),
        )

        db.add(correlation_analysis)
        db.commit()
        db.refresh(correlation_analysis)

        # Save data points
        for _, row in df.iterrows():
            data_point = CorrelationDataPoint(
                correlation_analysis_id=correlation_analysis.id,
                student_id=int(row["student_id"]),
                reasoning_density_score=float(row["reasoning_density"]),
                accuracy_rate=float(row["accuracy_rate"]),
                time_spent_seconds=int(row["time_spent"]),
                attempt_number=int(row["attempt_number"]),
            )
            db.add(data_point)

        db.commit()

        results["analysis_id"] = correlation_analysis.id

        return results

    def get_visualization_data(
        self,
        db: Session,
        analysis_id: int,
    ) -> Dict[str, Any]:
        """
        Get data formatted for visualization.

        Args:
            db: Database session
            analysis_id: Correlation analysis ID

        Returns:
            Dictionary with visualization data
        """
        # Get analysis
        analysis = (
            db.query(CorrelationAnalysis)
            .filter(CorrelationAnalysis.id == analysis_id)
            .first()
        )

        if not analysis:
            return {"error": "Analysis not found"}

        # Get data points
        data_points = (
            db.query(CorrelationDataPoint)
            .filter(CorrelationDataPoint.correlation_analysis_id == analysis_id)
            .all()
        )

        # Format for scatter plot
        scatter_data = [
            {
                "x": float(dp.reasoning_density_score),
                "y": float(dp.accuracy_rate),
                "student_id": dp.student_id,
            }
            for dp in data_points
        ]

        # Calculate trend line (if linear)
        x = np.array([dp["x"] for dp in scatter_data])
        y = np.array([dp["y"] for dp in scatter_data])

        if len(x) >= 2:
            # Simple linear regression for trend line
            slope, intercept = np.polyfit(x, y, 1)
            x_range = np.linspace(x.min(), x.max(), 100)
            trend_line = [
                {"x": float(xi), "y": float(slope * xi + intercept)}
                for xi in x_range
            ]
        else:
            trend_line = []

        return {
            "analysis_id": analysis_id,
            "analysis_type": analysis.analysis_type.value,
            "correlation_coefficient": float(analysis.correlation_coefficient),
            "p_value": float(analysis.p_value),
            "is_significant": analysis.is_significant,
            "scatter_data": scatter_data,
            "trend_line": trend_line,
            "sample_size": len(scatter_data),
        }


def get_correlation_service() -> CorrelationAnalysisService:
    """
    Get correlation analysis service instance.

    Returns:
        CorrelationAnalysisService instance
    """
    return CorrelationAnalysisService(significance_level=settings.SIGNIFICANCE_LEVEL)
