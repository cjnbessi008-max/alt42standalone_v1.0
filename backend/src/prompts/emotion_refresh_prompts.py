"""
Emotion Refresh Routine - AI Prompts
====================================
Claude AI prompt templates for generating personalized refresh activities
and feedback messages.
"""

from typing import Dict, List, Optional


def get_activity_generation_prompt(
    grade_level: int,
    emotion_type: str,
    emotion_score: int,
    session_duration_minutes: int,
    subject: str = "수학",
    past_preferences: Optional[List[str]] = None,
) -> str:
    """
    Generate prompt for Claude to create a personalized 1-minute refresh activity.

    Args:
        grade_level: Student's grade level (1-12)
        emotion_type: Current emotion (happy, stressed, tired, bored, frustrated, focused, anxious)
        emotion_score: Emotion intensity (1-10)
        session_duration_minutes: How long student has been learning
        subject: Subject being studied (default: "수학")
        past_preferences: List of previously successful activity types

    Returns:
        Formatted prompt string for Claude API
    """
    past_prefs_str = ", ".join(past_preferences) if past_preferences else "없음"

    prompt = f"""Role: You are a wellness and education expert specializing in quick emotional regulation techniques for students.

Context:
- Student Grade Level: {grade_level}학년
- Current Emotion: {emotion_type} (강도: {emotion_score}/10)
- Learning Duration: {session_duration_minutes}분
- Subject: {subject}
- Previous Successful Activities: {past_prefs_str}

Task: Generate a personalized 1-minute (60 seconds) emotion refresh routine in Korean.

Constraints:
- Must be exactly 60 seconds total
- Age-appropriate for grade {grade_level}
- Can be done while sitting at a desk
- No special equipment needed
- Should improve "{emotion_type}" emotion
- Clear step-by-step instructions
- Use encouraging, friendly tone
- Instructions must be in Korean

Activity Types Available:
1. breathing - 호흡 운동 (4-7-8, box breathing, etc.)
2. stretch - 간단한 스트레칭 (neck, shoulders, wrists)
3. mindfulness - 마인드풀니스 (5-4-3-2-1 senses, body scan)
4. energy - 에너지 부스트 (gentle movement, rhythm)

Output Format (JSON):
{{
  "title": "Korean title (short and friendly, max 15 characters)",
  "description": "Korean description (encouraging tone, 1-2 sentences)",
  "activity_type": "breathing|stretch|mindfulness|energy",
  "steps": [
    {{
      "time_seconds": 0,
      "instruction": "Korean instruction (clear and simple, one action)",
      "duration_seconds": 5,
      "visual_cue": "relax|inhale|exhale|hold|stretch|focus"
    }},
    {{
      "time_seconds": 5,
      "instruction": "Next instruction",
      "duration_seconds": 10,
      "visual_cue": "inhale|exhale|hold|stretch|focus|relax"
    }}
  ],
  "total_duration": 60,
  "expected_outcome": "Korean description of expected feeling after activity",
  "encouragement": "Korean encouraging message for completion (with 1 emoji)"
}}

Important:
- All steps' duration_seconds must sum to exactly 60 seconds
- Each step should have clear timing and a single action
- Visual cues help with animations: relax, inhale, exhale, hold, stretch, focus
- Use simple, clear Korean suitable for grade {grade_level} students
- Be empathetic to the student's current "{emotion_type}" state

Generate the activity now (JSON only, no additional text):"""

    return prompt


def get_feedback_generation_prompt(
    pre_emotion: str,
    pre_score: int,
    post_emotion: str,
    post_score: int,
    improvement: float,
    completed: bool,
    grade_level: int = 5,
) -> str:
    """
    Generate prompt for Claude to create encouraging feedback message.

    Args:
        pre_emotion: Emotion type before activity
        pre_score: Emotion score before activity (1-10)
        post_emotion: Emotion type after activity
        post_score: Emotion score after activity (1-10)
        improvement: Change in score (post - pre)
        completed: Whether student completed the activity
        grade_level: Student's grade level for age-appropriate language

    Returns:
        Formatted prompt string for Claude API
    """
    completion_status = "완료했습니다" if completed else "중간에 멈췄습니다"

    prompt = f"""Role: You are an encouraging mentor for students.

Context:
- Student Grade Level: {grade_level}학년
- Pre-activity emotion: {pre_emotion} (점수: {pre_score}/10)
- Post-activity emotion: {post_emotion} (점수: {post_score}/10)
- Improvement: {improvement:+.1f} 점
- Student status: {completion_status}

Task: Generate an encouraging, age-appropriate feedback message in Korean.

Guidelines:
- Be genuinely encouraging, not patronizing
- Acknowledge the effort (even if not completed)
- If improvement is large (>=3), celebrate it enthusiastically
- If improvement is moderate (1-2), be warmly positive
- If improvement is small or negative, still be supportive and suggest it's okay to try again
- Use simple Korean appropriate for {grade_level}학년
- Keep it to 1-2 short sentences
- Use exactly ONE emoji at the end (choose based on improvement level)
- Do NOT use phrases like "You're absolutely right" or excessive praise
- Be warm but honest

Examples:
- Large improvement: "와! 기분이 많이 좋아졌네요. 필요할 때마다 다시 해보세요 🌟"
- Moderate: "기분이 나아졌어요. 잘했어요! 😊"
- Small/negative: "괜찮아요. 다음에 다시 시도해보면 도움이 될 거예요 💪"
- Not completed: "시도한 것만으로도 좋아요. 다음엔 끝까지 해볼까요? 🙂"

Generate the feedback message now (Korean text only, 1-2 sentences with 1 emoji):"""

    return prompt


def get_personalized_activity_recommendation_prompt(
    student_emotion_history: List[Dict],
    past_activities: List[Dict],
    current_emotion: str,
    current_score: int,
) -> str:
    """
    Generate prompt for personalized activity recommendation based on history.

    Args:
        student_emotion_history: List of recent emotion check-ins
        past_activities: List of past activities with effectiveness scores
        current_emotion: Current emotion type
        current_score: Current emotion score

    Returns:
        Formatted prompt string for Claude API
    """
    # Format history
    history_str = "\n".join([
        f"  - {h['emotion_type']} ({h['score']}/10) at {h['timestamp']}"
        for h in student_emotion_history[-5:]  # Last 5 check-ins
    ])

    # Format past activities
    activities_str = "\n".join([
        f"  - {a['activity_type']}: improvement +{a['improvement']:.1f}, "
        f"rating {'👍' if a['rating'] > 0 else '👎' if a['rating'] < 0 else '중립'}"
        for a in past_activities[-5:]  # Last 5 activities
    ])

    prompt = f"""Role: You are a personalized wellness recommendation expert for students.

Context:
Current State:
- Emotion: {current_emotion} (점수: {current_score}/10)

Recent Emotion History (last 5 check-ins):
{history_str}

Past Activity Performance (last 5 sessions):
{activities_str}

Task: Recommend the most suitable activity type for this student right now.

Analysis Guidelines:
1. Look for patterns in emotion history
2. Identify which activity types worked best previously
3. Consider current emotion vs. past successful combinations
4. Balance between proven effective activities and trying new approaches
5. If student rated an activity negatively (👎), avoid that type

Output Format (JSON):
{{
  "recommended_activity_type": "breathing|stretch|mindfulness|energy",
  "reasoning": "Korean explanation (2-3 sentences) why this is recommended",
  "confidence": 0.0-1.0
}}

Generate the recommendation now (JSON only):"""

    return prompt


def get_emotion_pattern_analysis_prompt(
    emotion_data: List[Dict],
    learning_performance: List[Dict],
) -> str:
    """
    Generate prompt for analyzing correlation between emotions and learning performance.

    Args:
        emotion_data: List of emotion check-ins with timestamps
        learning_performance: List of learning metrics (accuracy, completion, etc.)

    Returns:
        Formatted prompt string for Claude API
    """
    emotion_summary = "\n".join([
        f"  - {e['date']}: {e['avg_score']:.1f}/10 (주로 {e['common_emotion']})"
        for e in emotion_data
    ])

    performance_summary = "\n".join([
        f"  - {p['date']}: 정답률 {p['accuracy']:.0%}, 완료 문제 {p['completed']}"
        for p in learning_performance
    ])

    prompt = f"""Role: You are an educational data analyst specializing in emotional well-being and learning outcomes.

Context:
Student Emotion Trends (last 7 days):
{emotion_summary}

Learning Performance (last 7 days):
{performance_summary}

Task: Analyze the relationship between emotional state and learning performance.

Analysis Guidelines:
1. Identify any correlation patterns
2. Note days with unusual emotion or performance
3. Suggest insights for teachers
4. Recommend when emotion support might be most helpful
5. Be objective - acknowledge if no clear pattern exists

Output Format (JSON):
{{
  "correlation_strength": "strong|moderate|weak|none",
  "correlation_direction": "positive|negative|mixed|unclear",
  "key_insights": [
    "Korean insight 1",
    "Korean insight 2"
  ],
  "recommendations": [
    "Korean recommendation for teachers"
  ],
  "confidence": 0.0-1.0
}}

Generate the analysis now (JSON only):"""

    return prompt


# Constants for emotion types
EMOTION_TYPES = {
    "happy": "행복",
    "stressed": "스트레스",
    "tired": "피곤",
    "bored": "지루함",
    "frustrated": "화남",
    "focused": "집중",
    "anxious": "불안",
}

# Activity type mappings
ACTIVITY_TYPES = {
    "breathing": "호흡 운동",
    "stretch": "스트레칭",
    "mindfulness": "마인드풀니스",
    "energy": "에너지 부스트",
}

# Visual cue types for animations
VISUAL_CUES = [
    "relax",
    "inhale",
    "exhale",
    "hold",
    "stretch",
    "focus",
]
