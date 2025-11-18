"""
Highlight Clip Generator Service
Uses Claude API to extract and generate highlight clips from educational modules
"""

import os
import json
import logging
from typing import List, Dict, Any, Optional
from anthropic import Anthropic

logger = logging.getLogger(__name__)


class HighlightGenerator:
    """Generate highlight clips using Claude AI"""

    def __init__(self):
        api_key = os.getenv("CLAUDE_API_KEY")
        if not api_key:
            logger.warning("CLAUDE_API_KEY not set, using mock mode")
            self.client = None
        else:
            self.client = Anthropic(api_key=api_key)

    async def generate_highlights(
        self,
        module_name: str,
        module_description: str,
        world_model: Dict[str, Any],
        grade_level: str
    ) -> List[Dict[str, Any]]:
        """
        Generate highlight clips for a module

        Args:
            module_name: Name of the educational module
            module_description: Description of the module
            world_model: AI-generated world model (concepts, relationships)
            grade_level: Target grade level

        Returns:
            List of highlight clip dictionaries
        """

        if not self.client:
            return self._generate_mock_highlights(module_name, grade_level)

        try:
            prompt = self._build_highlight_extraction_prompt(
                module_name, module_description, world_model, grade_level
            )

            message = self.client.messages.create(
                model="claude-sonnet-4-5-20250929",
                max_tokens=4000,
                temperature=0.7,
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )

            # Parse Claude's response
            response_text = message.content[0].text
            highlights = self._parse_highlights_response(response_text)

            logger.info(f"Generated {len(highlights)} highlights for {module_name}")
            return highlights

        except Exception as e:
            logger.error(f"Error generating highlights with Claude: {str(e)}")
            return self._generate_mock_highlights(module_name, grade_level)

    def _build_highlight_extraction_prompt(
        self,
        module_name: str,
        module_description: str,
        world_model: Dict[str, Any],
        grade_level: str
    ) -> str:
        """Build prompt for Claude to extract highlight clips"""

        return f"""You are an expert educational content designer specializing in creating engaging learning highlights.

Your task is to analyze an educational module and extract 5-7 key highlight clips that capture the most important concepts and learning activities.

## Module Information

**Module Name:** {module_name}
**Description:** {module_description}
**Grade Level:** {grade_level}
**World Model:** {json.dumps(world_model, indent=2)}

## Your Task

Generate 5-7 highlight clips that:

1. **Capture Core Concepts**: Each clip should focus on one key concept or skill
2. **Progressive Difficulty**: Start with foundational concepts, build to more complex
3. **Engaging Content**: Use interactive elements, examples, and visualizations
4. **Bite-Sized Learning**: Each clip should take 5-15 minutes to complete
5. **Clear Learning Goals**: Students should know what they'll learn from each clip

## Clip Types

Choose from these types:
- **concept**: Introduces a new concept with explanation and examples
- **activity**: Interactive practice or exploration
- **example**: Step-by-step worked example
- **assessment**: Quick check for understanding
- **summary**: Recap of multiple related concepts

## Output Format

Return your response as a JSON array with this structure:

```json
[
  {{
    "title": "Understanding Fractions - The Basics",
    "description": "Learn what fractions are using pizza slices and visual models",
    "clip_type": "concept",
    "key_concepts": ["fraction", "numerator", "denominator", "part", "whole"],
    "difficulty_level": 1,
    "estimated_duration_minutes": 8,
    "content": {{
      "introduction": "What happens when we share a pizza equally?",
      "main_content": {{
        "explanation": "A fraction represents a part of a whole...",
        "visual_example": "pizza divided into 8 slices",
        "interactive_element": "drag and drop slices"
      }},
      "practice_questions": [
        "If you eat 2 slices of an 8-slice pizza, what fraction did you eat?"
      ],
      "key_takeaway": "Fractions show us parts of a whole using two numbers"
    }}
  }},
  ...
]
```

## Guidelines

- Use age-appropriate language for {grade_level}
- Include concrete examples and visual descriptions
- Design for interactivity where possible
- Ensure logical progression from simple to complex
- Make content engaging and relatable

Generate the highlight clips now:"""

    def _parse_highlights_response(self, response_text: str) -> List[Dict[str, Any]]:
        """Parse Claude's JSON response into highlight clips"""

        try:
            # Extract JSON from response (handle markdown code blocks)
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                json_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                json_text = response_text[json_start:json_end].strip()
            else:
                json_text = response_text.strip()

            highlights = json.loads(json_text)

            # Validate and clean highlights
            validated = []
            for highlight in highlights:
                if self._validate_highlight(highlight):
                    validated.append(highlight)

            return validated

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse highlights JSON: {str(e)}")
            logger.debug(f"Response text: {response_text}")
            return []

    def _validate_highlight(self, highlight: Dict[str, Any]) -> bool:
        """Validate highlight clip structure"""

        required_fields = ['title', 'description', 'clip_type', 'content']
        for field in required_fields:
            if field not in highlight:
                logger.warning(f"Highlight missing required field: {field}")
                return False

        # Set defaults for optional fields
        if 'key_concepts' not in highlight:
            highlight['key_concepts'] = []
        if 'difficulty_level' not in highlight:
            highlight['difficulty_level'] = 3
        if 'estimated_duration_minutes' not in highlight:
            highlight['estimated_duration_minutes'] = 10

        return True

    def _generate_mock_highlights(
        self, module_name: str, grade_level: str
    ) -> List[Dict[str, Any]]:
        """Generate mock highlights for development/testing"""

        return [
            {
                "title": f"{module_name} - 개념 소개",
                "description": f"{grade_level} 학생들을 위한 핵심 개념 소개",
                "clip_type": "concept",
                "content": {
                    "introduction": "새로운 개념을 배워봅시다",
                    "main_content": {
                        "explanation": "이 개념은 수학에서 중요한 기초입니다",
                        "visual_example": "시각적 예시",
                        "interactive_element": "인터랙티브 요소"
                    },
                    "key_takeaway": "핵심 개념을 이해했습니다"
                },
                "key_concepts": ["기본개념", "기초"],
                "difficulty_level": 2,
                "estimated_duration_minutes": 10
            },
            {
                "title": f"{module_name} - 연습 활동",
                "description": "배운 개념을 연습해봅시다",
                "clip_type": "activity",
                "content": {
                    "introduction": "직접 해보면서 배워요",
                    "activities": [
                        {"type": "practice", "description": "연습 문제 1"},
                        {"type": "practice", "description": "연습 문제 2"}
                    ]
                },
                "key_concepts": ["연습", "적용"],
                "difficulty_level": 3,
                "estimated_duration_minutes": 15
            },
            {
                "title": f"{module_name} - 예제 문제",
                "description": "단계별 예제 풀이",
                "clip_type": "example",
                "content": {
                    "problem": "예제 문제",
                    "solution_steps": [
                        "1단계: 문제 이해하기",
                        "2단계: 전략 세우기",
                        "3단계: 풀이하기",
                        "4단계: 답 확인하기"
                    ]
                },
                "key_concepts": ["문제해결", "전략"],
                "difficulty_level": 3,
                "estimated_duration_minutes": 12
            }
        ]

    async def generate_daily_recommendations(self) -> List[Dict[str, Any]]:
        """
        Generate daily highlight recommendations using AI

        Returns:
            List of recommendations with clip_id, grade_level, reason, confidence
        """

        from .database import get_db_connection

        try:
            # Get all available highlights
            conn = get_db_connection()
            cursor = conn.cursor()

            cursor.execute("""
                SELECT hc.id, hc.title, hc.description, hc.clip_type,
                       hc.key_concepts, hc.difficulty_level, m.grade_level,
                       COALESCE(ca.avg_completion_rate, 0) as completion_rate,
                       COALESCE(ca.success_rate, 0) as success_rate
                FROM highlight_clips hc
                JOIN modules m ON hc.module_id = m.id
                LEFT JOIN clip_analytics ca ON hc.id = ca.clip_id
                WHERE m.status = 'active'
                ORDER BY hc.created_at DESC
                LIMIT 50
            """)

            clips = cursor.fetchall()
            cursor.close()
            conn.close()

            if not clips:
                return []

            # Use Claude to select best clips for today
            if self.client:
                recommendations = await self._ai_select_daily_clips(clips)
            else:
                recommendations = self._mock_daily_recommendations(clips)

            return recommendations

        except Exception as e:
            logger.error(f"Error generating daily recommendations: {str(e)}")
            return []

    async def _ai_select_daily_clips(
        self, clips: List[tuple]
    ) -> List[Dict[str, Any]]:
        """Use Claude to intelligently select daily highlights"""

        clips_data = []
        for clip in clips[:20]:  # Limit to avoid token limits
            clips_data.append({
                "id": str(clip[0]),
                "title": clip[1],
                "description": clip[2],
                "clip_type": clip[3],
                "key_concepts": clip[4],
                "difficulty": clip[5],
                "grade_level": clip[6],
                "completion_rate": float(clip[7]) if clip[7] else 0,
                "success_rate": float(clip[8]) if clip[8] else 0
            })

        prompt = f"""You are an educational content curator. Select the 3-5 best highlight clips for today's learning recommendations.

Available clips:
{json.dumps(clips_data, indent=2)}

Selection criteria:
1. Variety: Choose clips from different modules and topics
2. Difficulty progression: Include easy, medium, and challenging clips
3. Engagement: Prefer clips with good historical performance
4. Relevance: Focus on fundamental concepts and popular topics
5. Grade level diversity: Cover multiple grade levels

Return a JSON array with 3-5 recommendations:

```json
[
  {{
    "clip_id": "uuid-here",
    "target_grade_level": "grade_3",
    "reason": "Excellent introduction to fractions with high engagement",
    "confidence": 0.95
  }}
]
```"""

        try:
            message = self.client.messages.create(
                model="claude-sonnet-4-5-20250929",
                max_tokens=2000,
                temperature=0.5,
                messages=[{"role": "user", "content": prompt}]
            )

            response_text = message.content[0].text

            # Parse JSON response
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                json_text = response_text[json_start:json_end].strip()
            else:
                json_text = response_text.strip()

            recommendations = json.loads(json_text)
            return recommendations

        except Exception as e:
            logger.error(f"Error in AI clip selection: {str(e)}")
            return self._mock_daily_recommendations(clips)

    def _mock_daily_recommendations(
        self, clips: List[tuple]
    ) -> List[Dict[str, Any]]:
        """Mock daily recommendations for development"""

        recommendations = []
        for i, clip in enumerate(clips[:5]):
            recommendations.append({
                "clip_id": str(clip[0]),
                "target_grade_level": clip[6],
                "reason": f"추천 하이라이트: {clip[1]}",
                "confidence": 0.85 - (i * 0.05)
            })

        return recommendations
