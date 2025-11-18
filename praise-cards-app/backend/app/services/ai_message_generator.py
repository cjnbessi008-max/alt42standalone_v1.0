from typing import Optional
from anthropic import Anthropic
from ..config import settings
from ..models import Achievement, Student
from ..models.achievement import AchievementType


class AIMessageGenerator:
    """Generates personalized praise messages using Claude AI"""

    def __init__(self):
        self.client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    def generate_praise_message(
        self, student: Student, achievement: Achievement
    ) -> str:
        """
        Generate a personalized, encouraging message for the student
        Returns a warm, motivating message in Korean
        """

        # Create context-aware prompt
        prompt = self._create_prompt(student, achievement)

        try:
            # Call Claude API
            message = self.client.messages.create(
                model=settings.ANTHROPIC_MODEL,
                max_tokens=300,
                temperature=0.8,
                messages=[{"role": "user", "content": prompt}],
            )

            # Extract the text response
            ai_message = message.content[0].text.strip()

            # Ensure it's not too long (limit to 200 chars for card display)
            if len(ai_message) > 200:
                ai_message = ai_message[:197] + "..."

            return ai_message

        except Exception as e:
            # Fallback to default messages if API fails
            return self._get_fallback_message(achievement.achievement_type)

    def _create_prompt(self, student: Student, achievement: Achievement) -> str:
        """Create a context-aware prompt for Claude"""

        base_prompt = f"""당신은 학생들을 격려하는 친절한 선생님입니다.

학생 정보:
- 이름: {student.name}
- 학년: {student.grade_level}학년
- 연속 학습일: {student.consecutive_days}일
- 완료한 모듈 수: {student.total_modules_completed}개

성취 정보:
- 타입: {achievement.achievement_type.value}
- 제목: {achievement.title}
- 설명: {achievement.description}
"""

        # Add achievement-specific context
        if achievement.achievement_type == AchievementType.HIGH_ACCURACY:
            base_prompt += f"- 정확도: {achievement.value}%\n"
        elif achievement.achievement_type == AchievementType.CONSECUTIVE_DAYS:
            base_prompt += f"- 연속일: {achievement.value}일\n"
        elif achievement.achievement_type == AchievementType.LEARNING_TIME:
            base_prompt += f"- 학습 시간: {achievement.value}분\n"

        base_prompt += """
이 학생을 위한 짧고 따뜻한 격려 메시지를 2-3문장으로 작성해주세요.
요구사항:
1. 반말로 친근하게 작성
2. 구체적인 성취를 언급
3. 긍정적이고 진심이 느껴지는 톤
4. 100-150자 정도의 길이
5. 이모지는 사용하지 말 것

예시:
- "와, 정말 꾸준하구나! 3일 연속으로 학습하는 모습이 정말 멋져. 이 습관을 계속 유지하면 분명 놀라운 결과를 볼 거야!"
- "80% 정확도라니, 네가 얼마나 집중했는지 보여. 어려운 문제도 포기하지 않고 풀어낸 네 노력이 자랑스러워."

격려 메시지:"""

        return base_prompt

    def _get_fallback_message(self, achievement_type: AchievementType) -> str:
        """Get fallback message if AI generation fails"""

        fallback_messages = {
            AchievementType.HIGH_ACCURACY: "정확도가 정말 높네요! 집중력이 대단해요. 이런 실력이면 어떤 문제도 해결할 수 있을 거예요!",
            AchievementType.CONSECUTIVE_DAYS: "꾸준함이 빛을 발하고 있어요! 매일 학습하는 습관은 가장 큰 무기가 될 거예요. 계속 이대로 가요!",
            AchievementType.MODULE_COMPLETED: "모듈을 완료했네요! 끝까지 해내는 끈기가 정말 멋져요. 다음 단계도 충분히 해낼 수 있을 거예요!",
            AchievementType.LEARNING_TIME: "오늘 정말 열심히 했네요! 이렇게 시간을 투자하는 모습이 인상적이에요. 노력은 절대 배신하지 않아요!",
            AchievementType.PROGRESS_BOOST: "와, 진도가 쑥쑥 나가고 있네요! 속도도 빠르고 이해도도 높은 것 같아요. 이 페이스를 유지해봐요!",
            AchievementType.PERFECT_SCORE: "만점이라니 완벽해요! 모든 문제를 정확하게 푼 당신의 실력이 자랑스러워요!",
            AchievementType.FIRST_MODULE: "첫 모듈 완료 축하해요! 시작이 반이라는 말처럼, 이미 중요한 첫걸음을 뗐어요!",
            AchievementType.SPEED_LEARNER: "학습 속도가 정말 빠르네요! 빠르면서도 정확한 당신의 능력이 돋보여요!",
        }

        return fallback_messages.get(
            achievement_type, "정말 잘하고 있어요! 계속 이렇게 노력하면 분명 좋은 결과가 있을 거예요!"
        )

    def get_card_design(self, achievement_type: AchievementType) -> str:
        """Determine card design/theme based on achievement type"""

        design_mapping = {
            AchievementType.HIGH_ACCURACY: "accuracy",
            AchievementType.CONSECUTIVE_DAYS: "streak",
            AchievementType.MODULE_COMPLETED: "trophy",
            AchievementType.LEARNING_TIME: "clock",
            AchievementType.PROGRESS_BOOST: "rocket",
            AchievementType.PERFECT_SCORE: "star",
            AchievementType.FIRST_MODULE: "celebration",
            AchievementType.SPEED_LEARNER: "lightning",
        }

        return design_mapping.get(achievement_type, "default")
