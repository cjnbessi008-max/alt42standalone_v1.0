"""Bias analysis service with statistical methods."""
import pandas as pd
import numpy as np
from scipy import stats
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..models.usage_session import UsageSession
from ..models.student import Student
from ..models.concept_tool import ConceptTool


class BiasAnalyzer:
    """Service for analyzing bias in concept tool usage."""

    def __init__(self, db: Session):
        self.db = db

    def analyze_frequency_bias(
        self,
        time_period_start: Optional[datetime] = None,
        time_period_end: Optional[datetime] = None,
        **filters
    ) -> Dict[str, Any]:
        """
        Analyze usage frequency bias.

        Identifies if certain tools are over-used or under-used compared to uniform distribution.
        Uses chi-square test for uniform distribution and calculates diversity metrics.
        """
        # Build query
        query = self.db.query(
            ConceptTool.tool_name,
            ConceptTool.tool_category,
            func.count(UsageSession.id).label('usage_count')
        ).join(UsageSession, ConceptTool.id == UsageSession.tool_id)

        if time_period_start:
            query = query.filter(UsageSession.session_start >= time_period_start)
        if time_period_end:
            query = query.filter(UsageSession.session_start <= time_period_end)

        query = query.group_by(ConceptTool.tool_name, ConceptTool.tool_category)
        results = query.all()

        if not results:
            return {"error": "No data available for analysis"}

        # Convert to dataframe
        df = pd.DataFrame(results, columns=['tool_name', 'tool_category', 'usage_count'])
        total_usage = df['usage_count'].sum()
        df['usage_percentage'] = (df['usage_count'] / total_usage * 100).round(2)
        df['expected_percentage'] = 100.0 / len(df)

        # Chi-square test for uniform distribution
        observed = df['usage_count'].values
        expected_uniform = np.full(len(observed), observed.mean())
        chi2_stat, p_value = stats.chisquare(observed, expected_uniform)

        # Shannon entropy (diversity index)
        probabilities = df['usage_count'] / df['usage_count'].sum()
        shannon_entropy = -np.sum(probabilities * np.log2(probabilities + 1e-10))
        max_entropy = np.log2(len(df))
        normalized_entropy = shannon_entropy / max_entropy if max_entropy > 0 else 0

        # Gini coefficient (concentration measure)
        sorted_usage = np.sort(observed)
        n = len(sorted_usage)
        cumsum = np.cumsum(sorted_usage)
        gini = (2 * np.sum((n - np.arange(1, n + 1) + 1) * sorted_usage)) / (n * cumsum[-1]) - 1 if cumsum[-1] > 0 else 0

        # Identify over-used and under-used tools
        df['deviation_from_mean'] = df['usage_count'] - observed.mean()
        df['z_score'] = (df['usage_count'] - observed.mean()) / (observed.std() + 1e-10)

        over_used = df[df['z_score'] > 1.5].sort_values('z_score', ascending=False)
        under_used = df[df['z_score'] < -1.5].sort_values('z_score')

        # Calculate bias score (0-100, higher means more bias)
        bias_score = (1 - normalized_entropy) * 50 + gini * 50

        # Generate recommendations
        recommendations = []
        if bias_score > 70:
            recommendations.append("High usage concentration detected. Consider promoting diverse tool usage.")
        if len(over_used) > 0:
            top_overused = over_used.iloc[0]['tool_name']
            recommendations.append(f"Tool '{top_overused}' is significantly over-used. Balance with alternatives.")
        if len(under_used) > 0:
            top_underused = under_used.iloc[0]['tool_name']
            recommendations.append(f"Tool '{top_underused}' is under-utilized. Increase awareness or accessibility.")
        if normalized_entropy > 0.8:
            recommendations.append("Tool usage is well-distributed. Continue encouraging diversity.")

        return {
            "tool_usage": df.to_dict('records'),
            "over_used_tools": over_used[['tool_name', 'usage_count', 'usage_percentage', 'z_score']].to_dict('records'),
            "under_used_tools": under_used[['tool_name', 'usage_count', 'usage_percentage', 'z_score']].to_dict('records'),
            "statistical_tests": {
                "chi_square_statistic": float(chi2_stat),
                "p_value": float(p_value),
                "is_significant": p_value < 0.05,
                "shannon_entropy": float(shannon_entropy),
                "normalized_diversity": float(normalized_entropy),
                "gini_coefficient": float(gini),
                "bias_score": float(bias_score)
            },
            "recommendations": recommendations,
            "summary": self._generate_frequency_summary(bias_score, len(over_used), len(under_used))
        }

    def analyze_demographic_bias(
        self,
        time_period_start: Optional[datetime] = None,
        time_period_end: Optional[datetime] = None,
        **filters
    ) -> Dict[str, Any]:
        """
        Analyze demographic bias.

        Identifies if tool effectiveness or usage patterns differ across student demographics.
        """
        # Query tool usage by student demographics
        query = self.db.query(
            Student.grade_level,
            Student.performance_level,
            ConceptTool.tool_name,
            func.count(UsageSession.id).label('usage_count'),
            func.avg(UsageSession.success_rate).label('avg_success_rate'),
            func.avg(UsageSession.duration_seconds).label('avg_duration')
        ).join(UsageSession, Student.id == UsageSession.student_id)\
         .join(ConceptTool, UsageSession.tool_id == ConceptTool.id)

        if time_period_start:
            query = query.filter(UsageSession.session_start >= time_period_start)
        if time_period_end:
            query = query.filter(UsageSession.session_start <= time_period_end)

        query = query.group_by(Student.grade_level, Student.performance_level, ConceptTool.tool_name)
        results = query.all()

        if not results:
            return {"error": "No data available for analysis"}

        df = pd.DataFrame(results, columns=[
            'grade_level', 'performance_level', 'tool_name',
            'usage_count', 'avg_success_rate', 'avg_duration'
        ])

        # Analyze by performance level
        perf_analysis = []
        for tool in df['tool_name'].unique():
            tool_data = df[df['tool_name'] == tool]
            if len(tool_data) < 2:
                continue

            # ANOVA test for success rate differences across performance levels
            groups = [group['avg_success_rate'].values for name, group in tool_data.groupby('performance_level')]
            if len(groups) > 1 and all(len(g) > 0 for g in groups):
                try:
                    f_stat, p_value = stats.f_oneway(*groups)
                    perf_analysis.append({
                        'tool_name': tool,
                        'f_statistic': float(f_stat),
                        'p_value': float(p_value),
                        'has_bias': p_value < 0.05,
                        'by_performance': tool_data[['performance_level', 'avg_success_rate', 'usage_count']].to_dict('records')
                    })
                except Exception:
                    pass

        # Calculate overall bias score
        significant_biases = sum(1 for analysis in perf_analysis if analysis.get('has_bias', False))
        bias_score = (significant_biases / max(len(perf_analysis), 1)) * 100

        # Generate recommendations
        recommendations = []
        if bias_score > 50:
            recommendations.append("Significant performance-level bias detected. Tools may not be equally effective for all students.")

        for analysis in perf_analysis:
            if analysis.get('has_bias'):
                recommendations.append(
                    f"Tool '{analysis['tool_name']}' shows different effectiveness across performance levels. "
                    "Consider adaptive content or targeted support."
                )

        return {
            "demographic_analysis": perf_analysis,
            "bias_score": float(bias_score),
            "recommendations": recommendations,
            "summary": f"Analyzed {len(perf_analysis)} tools across demographics. {significant_biases} tools show significant bias."
        }

    def analyze_temporal_bias(
        self,
        time_period_start: Optional[datetime] = None,
        time_period_end: Optional[datetime] = None,
        **filters
    ) -> Dict[str, Any]:
        """
        Analyze temporal bias in tool usage.

        Identifies if certain tools are only used at specific times.
        """
        query = self.db.query(
            func.date_trunc('day', UsageSession.session_start).label('date'),
            func.extract('hour', UsageSession.session_start).label('hour'),
            func.extract('dow', UsageSession.session_start).label('day_of_week'),
            ConceptTool.tool_name,
            func.count(UsageSession.id).label('usage_count')
        ).join(ConceptTool, UsageSession.tool_id == ConceptTool.id)

        if time_period_start:
            query = query.filter(UsageSession.session_start >= time_period_start)
        if time_period_end:
            query = query.filter(UsageSession.session_start <= time_period_end)

        query = query.group_by('date', 'hour', 'day_of_week', ConceptTool.tool_name)
        results = query.all()

        if not results:
            return {"error": "No data available for analysis"}

        df = pd.DataFrame(results, columns=['date', 'hour', 'day_of_week', 'tool_name', 'usage_count'])

        # Analyze by hour of day
        hourly = df.groupby(['hour', 'tool_name'])['usage_count'].sum().reset_index()
        hourly_pivot = hourly.pivot(index='hour', columns='tool_name', values='usage_count').fillna(0)

        # Analyze by day of week
        daily = df.groupby(['day_of_week', 'tool_name'])['usage_count'].sum().reset_index()
        daily_pivot = daily.pivot(index='day_of_week', columns='tool_name', values='usage_count').fillna(0)

        # Calculate temporal concentration for each tool
        tool_temporal_scores = {}
        for tool in df['tool_name'].unique():
            tool_data = df[df['tool_name'] == tool]
            hourly_dist = tool_data.groupby('hour')['usage_count'].sum()

            # Calculate concentration (inverse of entropy)
            if len(hourly_dist) > 0:
                probs = hourly_dist / hourly_dist.sum()
                entropy = -np.sum(probs * np.log2(probs + 1e-10))
                max_entropy = np.log2(24)  # 24 hours
                concentration = 1 - (entropy / max_entropy)
                tool_temporal_scores[tool] = float(concentration)

        # Overall bias score
        avg_concentration = np.mean(list(tool_temporal_scores.values())) if tool_temporal_scores else 0
        bias_score = avg_concentration * 100

        recommendations = []
        if bias_score > 60:
            recommendations.append("High temporal concentration detected. Tools are used primarily at specific times.")

        high_concentration_tools = [tool for tool, score in tool_temporal_scores.items() if score > 0.7]
        if high_concentration_tools:
            recommendations.append(
                f"Tools with limited time usage: {', '.join(high_concentration_tools[:3])}. "
                "Consider promoting usage throughout the day."
            )

        return {
            "hourly_distribution": hourly.to_dict('records'),
            "daily_distribution": daily.to_dict('records'),
            "tool_temporal_concentration": tool_temporal_scores,
            "bias_score": float(bias_score),
            "recommendations": recommendations,
            "summary": f"Temporal concentration score: {bias_score:.1f}/100. Higher values indicate time-specific usage patterns."
        }

    def analyze_effectiveness_bias(
        self,
        time_period_start: Optional[datetime] = None,
        time_period_end: Optional[datetime] = None,
        **filters
    ) -> Dict[str, Any]:
        """
        Analyze effectiveness bias.

        Identifies which tools are most/least effective overall and for specific groups.
        """
        query = self.db.query(
            ConceptTool.tool_name,
            ConceptTool.tool_category,
            func.avg(UsageSession.success_rate).label('avg_success_rate'),
            func.stddev(UsageSession.success_rate).label('stddev_success_rate'),
            func.count(UsageSession.id).label('usage_count'),
            func.avg(UsageSession.duration_seconds).label('avg_duration')
        ).join(UsageSession, ConceptTool.id == UsageSession.tool_id)\
         .filter(UsageSession.success_rate.isnot(None))

        if time_period_start:
            query = query.filter(UsageSession.session_start >= time_period_start)
        if time_period_end:
            query = query.filter(UsageSession.session_start <= time_period_end)

        query = query.group_by(ConceptTool.tool_name, ConceptTool.tool_category)
        results = query.all()

        if not results:
            return {"error": "No data available for analysis"}

        df = pd.DataFrame(results, columns=[
            'tool_name', 'tool_category', 'avg_success_rate',
            'stddev_success_rate', 'usage_count', 'avg_duration'
        ])

        # Calculate effectiveness score (weighted)
        df['effectiveness_score'] = (
            df['avg_success_rate'] * 0.7 +  # Success rate weight
            (1 / (df['stddev_success_rate'] + 1)) * 10 * 0.3  # Consistency weight
        )

        # Rank tools
        df['rank'] = df['effectiveness_score'].rank(ascending=False)
        df = df.sort_values('effectiveness_score', ascending=False)

        # Identify most and least effective
        most_effective = df.head(5)
        least_effective = df.tail(5)

        # Calculate bias (variance in effectiveness)
        effectiveness_variance = df['effectiveness_score'].var()
        effectiveness_range = df['effectiveness_score'].max() - df['effectiveness_score'].min()
        bias_score = min((effectiveness_range / 100) * 100, 100)

        recommendations = []
        if bias_score > 60:
            recommendations.append("High variance in tool effectiveness. Review and improve low-performing tools.")

        if len(least_effective) > 0:
            worst_tool = least_effective.iloc[0]['tool_name']
            recommendations.append(f"Tool '{worst_tool}' has lowest effectiveness. Consider redesign or additional support.")

        if len(most_effective) > 0:
            best_tool = most_effective.iloc[0]['tool_name']
            recommendations.append(f"Tool '{best_tool}' shows highest effectiveness. Analyze and replicate successful patterns.")

        return {
            "tool_effectiveness": df[['tool_name', 'tool_category', 'avg_success_rate', 'effectiveness_score', 'usage_count']].to_dict('records'),
            "most_effective": most_effective[['tool_name', 'avg_success_rate', 'effectiveness_score']].to_dict('records'),
            "least_effective": least_effective[['tool_name', 'avg_success_rate', 'effectiveness_score']].to_dict('records'),
            "bias_score": float(bias_score),
            "variance": float(effectiveness_variance),
            "recommendations": recommendations,
            "summary": f"Effectiveness variance: {effectiveness_variance:.2f}. Bias score: {bias_score:.1f}/100."
        }

    @staticmethod
    def _generate_frequency_summary(bias_score: float, num_overused: int, num_underused: int) -> str:
        """Generate human-readable summary for frequency bias."""
        if bias_score > 70:
            severity = "High"
        elif bias_score > 40:
            severity = "Moderate"
        else:
            severity = "Low"

        return (
            f"{severity} usage bias detected (score: {bias_score:.1f}/100). "
            f"{num_overused} tool(s) over-used, {num_underused} tool(s) under-used. "
            f"{'Action recommended.' if bias_score > 50 else 'Continue monitoring.'}"
        )
