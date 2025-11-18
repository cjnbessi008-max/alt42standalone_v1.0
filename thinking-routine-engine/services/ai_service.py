"""AI Service using Claude for thinking routine generation"""
import anthropic
from config import settings
from typing import Dict, List, Optional
import json
import logging
import time

logger = logging.getLogger(__name__)


class AIService:
    """Service for AI-powered analysis and recommendation generation"""

    def __init__(self):
        self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = settings.CLAUDE_MODEL

    def generate_thinking_routine(
        self,
        student_data: Dict,
        top_patterns: Dict,
        gap_analysis: List[Dict]
    ) -> Dict:
        """Generate personalized thinking routine using AI"""
        start_time = time.time()

        prompt = self._build_routine_generation_prompt(student_data, top_patterns, gap_analysis)

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=settings.CLAUDE_MAX_TOKENS,
                temperature=settings.CLAUDE_TEMPERATURE,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            response_text = message.content[0].text
            latency_ms = int((time.time() - start_time) * 1000)

            # Log interaction
            self._log_interaction(
                interaction_type="routine_generation",
                prompt=prompt,
                response=response_text,
                tokens_used=message.usage.input_tokens + message.usage.output_tokens,
                latency_ms=latency_ms,
                success=True
            )

            # Parse the structured response
            routine = self._parse_routine_response(response_text)
            return routine

        except Exception as e:
            logger.error(f"Error generating thinking routine: {str(e)}")
            self._log_interaction(
                interaction_type="routine_generation",
                prompt=prompt,
                response="",
                tokens_used=0,
                latency_ms=int((time.time() - start_time) * 1000),
                success=False,
                error_message=str(e)
            )
            return self._get_fallback_routine()

    def generate_recommendations(
        self,
        student_data: Dict,
        top_patterns: Dict,
        gap_analysis: List[Dict]
    ) -> List[Dict]:
        """Generate personalized recommendations using AI"""
        start_time = time.time()

        prompt = self._build_recommendations_prompt(student_data, top_patterns, gap_analysis)

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=settings.CLAUDE_MAX_TOKENS,
                temperature=settings.CLAUDE_TEMPERATURE,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            response_text = message.content[0].text
            latency_ms = int((time.time() - start_time) * 1000)

            self._log_interaction(
                interaction_type="recommendation_generation",
                prompt=prompt,
                response=response_text,
                tokens_used=message.usage.input_tokens + message.usage.output_tokens,
                latency_ms=latency_ms,
                success=True
            )

            recommendations = self._parse_recommendations_response(response_text)
            return recommendations

        except Exception as e:
            logger.error(f"Error generating recommendations: {str(e)}")
            self._log_interaction(
                interaction_type="recommendation_generation",
                prompt=prompt,
                response="",
                tokens_used=0,
                latency_ms=int((time.time() - start_time) * 1000),
                success=False,
                error_message=str(e)
            )
            return self._get_fallback_recommendations(gap_analysis)

    def analyze_learning_patterns(
        self,
        top_performers_data: List[Dict]
    ) -> List[Dict]:
        """Use AI to identify common patterns among top performers"""
        start_time = time.time()

        prompt = self._build_pattern_analysis_prompt(top_performers_data)

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=settings.CLAUDE_MAX_TOKENS,
                temperature=0.3,  # Lower temperature for pattern identification
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            response_text = message.content[0].text
            latency_ms = int((time.time() - start_time) * 1000)

            self._log_interaction(
                interaction_type="pattern_analysis",
                prompt=prompt,
                response=response_text,
                tokens_used=message.usage.input_tokens + message.usage.output_tokens,
                latency_ms=latency_ms,
                success=True
            )

            patterns = self._parse_patterns_response(response_text)
            return patterns

        except Exception as e:
            logger.error(f"Error analyzing patterns: {str(e)}")
            return []

    def _build_routine_generation_prompt(
        self,
        student_data: Dict,
        top_patterns: Dict,
        gap_analysis: List[Dict]
    ) -> str:
        """Build prompt for thinking routine generation"""
        return f"""You are an expert educational psychologist and learning strategist specializing in optimal study routines.

**Task**: Generate a personalized thinking routine for a student based on their current performance and top performer patterns.

**Student Current Performance**:
- Average study session duration: {student_data.get('avg_session_duration', 0)} minutes
- Total study sessions (last 90 days): {student_data.get('total_sessions', 0)}
- Completion rate: {student_data.get('completion_rate', 0)}%
- Average grade: {student_data.get('avg_grade', 0)}%
- Peak performance time: {student_data.get('peak_performance_time', 'afternoon')}
- Learning velocity (improvement rate): {student_data.get('learning_velocity', 0)}

**Top Performer Benchmarks**:
- Optimal study duration: {top_patterns.get('optimal_study_duration', 0)} minutes
- Optimal sessions per week: {top_patterns.get('optimal_session_frequency', 0)}
- Common study time: {top_patterns.get('recommended_time_of_day', 'afternoon')}

**Performance Gaps**:
{json.dumps(gap_analysis, indent=2)}

**Instructions**:
Generate a comprehensive thinking routine with the following four components:

1. **Morning Routine** (3-5 specific actions for morning learning preparation)
2. **Study Approach** (5-7 evidence-based learning strategies tailored to close identified gaps)
3. **Problem-Solving Steps** (A clear 5-7 step methodology for approaching difficult problems)
4. **Review Schedule** (Specific spaced repetition schedule with timing)

**Format your response as JSON**:
{{
  "morning_routine": "specific morning routine steps...",
  "study_approach": "detailed study approach...",
  "problem_solving_steps": "numbered problem-solving methodology...",
  "review_schedule": "specific review schedule with timing..."
}}

Focus on actionable, specific recommendations that address the student's performance gaps while incorporating proven top-performer strategies.
"""

    def _build_recommendations_prompt(
        self,
        student_data: Dict,
        top_patterns: Dict,
        gap_analysis: List[Dict]
    ) -> str:
        """Build prompt for generating recommendations"""
        return f"""You are an expert educational advisor providing personalized learning recommendations.

**Student Performance Data**:
{json.dumps(student_data, indent=2)}

**Top Performer Patterns**:
{json.dumps(top_patterns, indent=2)}

**Identified Performance Gaps**:
{json.dumps(gap_analysis, indent=2)}

**Task**: Generate 5-7 prioritized, actionable recommendations to help this student improve their performance.

Each recommendation should include:
- **category**: One of [Time Management, Study Technique, Consistency, Active Learning, Progress Tracking]
- **title**: Short, actionable title (5-8 words)
- **description**: Detailed explanation (2-3 sentences) with specific actions
- **priority**: high, medium, or low
- **expected_impact**: Score from 1-10 indicating potential impact on performance

**Format your response as JSON**:
{{
  "recommendations": [
    {{
      "category": "Time Management",
      "title": "...",
      "description": "...",
      "priority": "high",
      "expected_impact": 8.5
    }},
    ...
  ]
}}

Prioritize recommendations that:
1. Address the largest performance gaps
2. Are immediately actionable
3. Have proven effectiveness among top performers
4. Build on the student's existing strengths
"""

    def _build_pattern_analysis_prompt(self, top_performers_data: List[Dict]) -> str:
        """Build prompt for analyzing top performer patterns"""
        return f"""You are a data scientist specializing in learning analytics and educational patterns.

**Task**: Analyze the behavioral patterns of top-performing students and identify the key factors contributing to their success.

**Top Performers Data**:
{json.dumps(top_performers_data[:10], indent=2)}  # Limit to 10 for token efficiency

**Instructions**:
Identify 5-10 common patterns among these top performers. For each pattern, provide:
- **pattern_type**: Category (e.g., study_duration, timing, frequency, engagement_style)
- **pattern_name**: Brief name for the pattern
- **description**: Clear description of the pattern
- **frequency**: Percentage of top performers exhibiting this pattern
- **impact_score**: Estimated impact on performance (1-10)
- **evidence**: Key data points supporting this pattern

**Format your response as JSON**:
{{
  "patterns": [
    {{
      "pattern_type": "...",
      "pattern_name": "...",
      "description": "...",
      "frequency": 85.5,
      "impact_score": 8.5,
      "evidence": {{"key": "value"}}
    }},
    ...
  ]
}}

Focus on patterns that are:
1. Statistically significant (>70% frequency)
2. Actionable and replicable
3. Not obvious or trivial
4. Have measurable impact
"""

    def _parse_routine_response(self, response: str) -> Dict:
        """Parse AI response for routine generation"""
        try:
            # Try to extract JSON from response
            start = response.find('{')
            end = response.rfind('}') + 1
            if start != -1 and end > start:
                json_str = response[start:end]
                return json.loads(json_str)
        except Exception as e:
            logger.warning(f"Could not parse routine JSON: {str(e)}")

        # Fallback: parse as text sections
        return {
            'morning_routine': self._extract_section(response, 'morning_routine', 'morning routine'),
            'study_approach': self._extract_section(response, 'study_approach', 'study approach'),
            'problem_solving_steps': self._extract_section(response, 'problem_solving_steps', 'problem solving'),
            'review_schedule': self._extract_section(response, 'review_schedule', 'review schedule'),
        }

    def _parse_recommendations_response(self, response: str) -> List[Dict]:
        """Parse AI response for recommendations"""
        try:
            start = response.find('{')
            end = response.rfind('}') + 1
            if start != -1 and end > start:
                json_str = response[start:end]
                data = json.loads(json_str)
                return data.get('recommendations', [])
        except Exception as e:
            logger.warning(f"Could not parse recommendations JSON: {str(e)}")

        return []

    def _parse_patterns_response(self, response: str) -> List[Dict]:
        """Parse AI response for pattern analysis"""
        try:
            start = response.find('{')
            end = response.rfind('}') + 1
            if start != -1 and end > start:
                json_str = response[start:end]
                data = json.loads(json_str)
                return data.get('patterns', [])
        except Exception as e:
            logger.warning(f"Could not parse patterns JSON: {str(e)}")

        return []

    def _extract_section(self, text: str, key: str, fallback_keyword: str) -> str:
        """Extract a section from text response"""
        # Try to find the section by key
        if f'"{key}"' in text:
            start = text.find(f'"{key}"')
            start = text.find(':', start) + 1
            end = text.find('",', start)
            if end == -1:
                end = text.find('"', start + 1)
            if start != -1 and end > start:
                return text[start:end].strip(' "')

        # Fallback: search for keyword
        if fallback_keyword.lower() in text.lower():
            lines = text.split('\n')
            section_lines = []
            in_section = False

            for line in lines:
                if fallback_keyword.lower() in line.lower():
                    in_section = True
                    continue
                if in_section:
                    if line.strip() and (line[0].isdigit() or line.strip().startswith('-') or line.strip().startswith('•')):
                        section_lines.append(line.strip())
                    elif len(section_lines) > 0 and not line.strip():
                        break

            if section_lines:
                return '\n'.join(section_lines)

        return "Content generated by AI"

    def _get_fallback_routine(self) -> Dict:
        """Fallback routine if AI fails"""
        return {
            'morning_routine': "1. Review previous day's concepts (10 min)\n2. Set specific learning goals\n3. Preview today's material",
            'study_approach': "• Focus on understanding over memorization\n• Use active recall techniques\n• Practice with increasing difficulty\n• Teach concepts to solidify understanding",
            'problem_solving_steps': "1. Read and understand the problem\n2. Identify known and unknown information\n3. Break into smaller steps\n4. Execute solution\n5. Verify and reflect",
            'review_schedule': "• Same day: Quick review (10 min)\n• Next day: Practice problems (20 min)\n• Weekly: Comprehensive review (30-45 min)\n• Before tests: Cumulative review",
        }

    def _get_fallback_recommendations(self, gap_analysis: List[Dict]) -> List[Dict]:
        """Fallback recommendations if AI fails"""
        recommendations = []

        for gap in gap_analysis[:5]:
            recommendations.append({
                'category': 'Performance Improvement',
                'title': f"Improve {gap['area']}",
                'description': gap.get('improvement_strategy', 'Focus on consistent practice and improvement.'),
                'priority': 'high' if gap['gap'] > 20 else 'medium',
                'expected_impact': min(10, gap['gap'] / 5),
            })

        return recommendations

    def _log_interaction(
        self,
        interaction_type: str,
        prompt: str,
        response: str,
        tokens_used: int,
        latency_ms: int,
        success: bool,
        error_message: Optional[str] = None
    ):
        """Log AI interaction for audit and improvement"""
        # In production, save to database
        logger.info(f"AI Interaction: {interaction_type}, Tokens: {tokens_used}, Latency: {latency_ms}ms, Success: {success}")
        if error_message:
            logger.error(f"AI Error: {error_message}")
