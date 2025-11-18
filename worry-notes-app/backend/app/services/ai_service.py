"""
AI Service - Claude API Integration for Worry Note Analysis
"""
import json
from typing import Dict, List, Optional
from anthropic import Anthropic, AsyncAnthropic
from loguru import logger

from app.core.config import settings


class AIService:
    """
    AI Service for analyzing worry notes using Claude API
    """

    def __init__(self):
        self.client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = "claude-3-5-sonnet-20241022"

    async def categorize_worry_note(
        self,
        content: str,
        student_context: Optional[Dict] = None
    ) -> Dict:
        """
        Categorize and analyze a worry note

        Args:
            content: The worry note content
            student_context: Optional student context from LMS

        Returns:
            Dict with analysis results: {
                "category": str,
                "subcategories": List[str],
                "priority": str,
                "is_crisis": bool,
                "crisis_type": Optional[str],
                "themes": List[str],
                "sentiment": float,
                "suggested_response": str,
                "confidence": float,
                "keywords": List[str]
            }
        """
        try:
            prompt = self._build_categorization_prompt(content, student_context)

            response = await self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                temperature=0.3,  # Lower temperature for more consistent categorization
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            # Extract JSON from response
            response_text = response.content[0].text
            analysis = self._parse_ai_response(response_text)

            logger.info(f"AI categorization completed: category={analysis.get('category')}, priority={analysis.get('priority')}")

            return analysis

        except Exception as e:
            logger.error(f"Error in AI categorization: {str(e)}")
            # Return default categorization on error
            return self._get_default_analysis()

    def _build_categorization_prompt(
        self,
        content: str,
        student_context: Optional[Dict] = None
    ) -> str:
        """Build the prompt for Claude API"""

        context_info = ""
        if student_context:
            context_info = f"""
Student Context:
- Recent performance: {student_context.get('average_grade', 'N/A')}
- Engagement score: {student_context.get('engagement_score', 'N/A')}
- Recent submissions: {len(student_context.get('recent_assignments', []))} assignments
- Upcoming deadlines: {len(student_context.get('upcoming_deadlines', []))} deadlines
"""

        prompt = f"""You are an educational support AI analyzing a student's concern.

Student's concern:
\"\"\"
{content}
\"\"\"
{context_info}

Task: Analyze this concern and provide a comprehensive assessment.

Categories (choose ONE primary category):
- academic: Subject-specific difficulties, homework help, learning gaps, assignment confusion
- emotional: Stress, anxiety, motivation issues, confidence concerns, overwhelm
- technical: Platform issues, access problems, tool difficulties, login issues
- environmental: Time management, home environment, health issues, schedule problems
- social: Peer interaction, group work concerns, collaboration issues
- other: Uncategorized concerns

Priority Levels (choose ONE):
- urgent: Immediate intervention needed (crisis language, severe distress, imminent deadline with high stress)
- high: Important, needs quick response (consistent struggles, declining performance, moderate distress)
- medium: Standard concern (clarification questions, mild confusion, general worry)
- low: Informational or minor issue (general questions, low stress)

Crisis Detection:
Check for crisis indicators:
- Self-harm or suicide ideation (keywords: "hurt myself", "end it", "not worth living", etc.)
- Abuse or violence mentions
- Severe distress or panic attacks
- Emergency situations requiring immediate intervention

If ANY crisis indicators are present, set is_crisis=true and specify crisis_type.

Sentiment Analysis:
Score from -1.0 (very negative/distressed) to +1.0 (positive/hopeful)

Output Format (JSON):
{{
  "category": "academic|emotional|technical|environmental|social|other",
  "subcategories": ["specific", "tags", "if", "applicable"],
  "priority": "urgent|high|medium|low",
  "is_crisis": true|false,
  "crisis_type": "self_harm|abuse|severe_distress|emergency|null",
  "themes": ["key", "theme", "words"],
  "sentiment": -0.4,
  "suggested_response": "A 2-3 sentence empathetic response template the teacher can use or modify",
  "confidence": 0.85,
  "keywords": ["important", "words", "from", "the", "concern"],
  "reasoning": "Brief explanation of why this categorization was chosen"
}}

IMPORTANT:
- Be empathetic and supportive in suggested responses
- Never minimize the student's concerns
- Flag ANY potential crisis situations - err on the side of caution
- Korean text should be analyzed with same criteria

Provide ONLY the JSON output, no additional text.
"""
        return prompt

    def _parse_ai_response(self, response_text: str) -> Dict:
        """Parse AI response and extract JSON"""
        try:
            # Try to find JSON in the response
            start = response_text.find('{')
            end = response_text.rfind('}') + 1

            if start != -1 and end != 0:
                json_str = response_text[start:end]
                analysis = json.loads(json_str)

                # Validate required fields
                required_fields = ['category', 'priority', 'is_crisis', 'sentiment', 'suggested_response']
                for field in required_fields:
                    if field not in analysis:
                        logger.warning(f"Missing required field in AI response: {field}")
                        analysis[field] = self._get_default_value(field)

                return analysis
            else:
                logger.error("No JSON found in AI response")
                return self._get_default_analysis()

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {str(e)}")
            return self._get_default_analysis()
        except Exception as e:
            logger.error(f"Error parsing AI response: {str(e)}")
            return self._get_default_analysis()

    def _get_default_analysis(self) -> Dict:
        """Return default analysis when AI fails"""
        return {
            "category": "other",
            "subcategories": [],
            "priority": "medium",
            "is_crisis": False,
            "crisis_type": None,
            "themes": [],
            "sentiment": 0.0,
            "suggested_response": "Thank you for sharing your concern. I'll review this and get back to you soon.",
            "confidence": 0.0,
            "keywords": [],
            "reasoning": "Default analysis due to AI service error"
        }

    def _get_default_value(self, field: str):
        """Get default value for a missing field"""
        defaults = {
            "category": "other",
            "priority": "medium",
            "is_crisis": False,
            "sentiment": 0.0,
            "suggested_response": "Thank you for sharing your concern.",
            "confidence": 0.0,
            "subcategories": [],
            "themes": [],
            "keywords": [],
            "crisis_type": None,
            "reasoning": ""
        }
        return defaults.get(field)

    async def generate_response_suggestion(
        self,
        worry_note_content: str,
        student_context: Optional[Dict] = None,
        previous_responses: Optional[List[str]] = None
    ) -> str:
        """
        Generate a suggested response for a teacher

        Args:
            worry_note_content: The student's concern
            student_context: Optional student context
            previous_responses: Previous teacher responses in this conversation

        Returns:
            Suggested response text
        """
        try:
            context_info = ""
            if student_context:
                context_info = f"\nStudent context: Engagement={student_context.get('engagement_score')}, Recent grades={student_context.get('average_grade')}"

            previous_info = ""
            if previous_responses:
                previous_info = f"\nPrevious responses:\n" + "\n".join([f"- {r}" for r in previous_responses[-3:]])

            prompt = f"""You are an educational support assistant helping a teacher respond to a student's concern.

Student's concern:
\"\"\"
{worry_note_content}
\"\"\"{context_info}{previous_info}

Generate a warm, empathetic, and helpful response (2-4 sentences) that:
1. Acknowledges the student's concern
2. Offers specific, actionable help
3. Encourages the student
4. Is appropriate for the educational context

The response should be something the teacher can use directly or easily modify.

Provide ONLY the suggested response text, no additional formatting or explanation.
"""

            response = await self.client.messages.create(
                model=self.model,
                max_tokens=500,
                temperature=0.7,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            suggested_response = response.content[0].text.strip()
            return suggested_response

        except Exception as e:
            logger.error(f"Error generating response suggestion: {str(e)}")
            return "Thank you for sharing your concern. Let's work together to address this. Can you tell me more about what specific support would be most helpful?"


# Singleton instance
ai_service = AIService()
