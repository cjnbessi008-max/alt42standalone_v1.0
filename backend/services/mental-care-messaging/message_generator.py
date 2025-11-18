"""
Mental Care Message Generator
Generates supportive, encouraging messages for students
Based on learning speed and performance triggers
"""

from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum
import random


class MessageType(Enum):
    """Types of mental care messages"""
    ENCOURAGEMENT = "encouragement"
    BREAK_SUGGESTION = "break_suggestion"
    STRATEGY_TIP = "strategy_tip"
    CELEBRATION = "celebration"


@dataclass
class MentalCareMessage:
    """A mental care message in multiple languages"""
    message_type: MessageType
    trigger_reason: str
    text_ko: str  # Korean
    text_en: str  # English
    severity: str  # low, medium, high
    recommended_actions: List[str]


class MentalCareMessageGenerator:
    """Generates contextual mental care messages for students"""

    def __init__(self):
        self.message_templates = self._initialize_message_templates()

    def _initialize_message_templates(self) -> Dict[str, List[Dict[str, str]]]:
        """Initialize bilingual message templates"""
        return {
            # Speed decrease messages
            'speed_decrease_20%': [
                {
                    'ko': '잠깐! 조금 천천히 풀고 있는 것 같아요. 괜찮아요, 속도보다 이해가 더 중요해요! 😊',
                    'en': "Taking your time? That's okay! Understanding is more important than speed! 😊",
                    'type': MessageType.ENCOURAGEMENT,
                    'severity': 'low'
                },
                {
                    'ko': '천천히 가도 괜찮아요. 정확하게 이해하면서 가는 게 더 중요해요! 💪',
                    'en': "It's fine to go slowly. Understanding correctly is what matters most! 💪",
                    'type': MessageType.ENCOURAGEMENT,
                    'severity': 'low'
                },
            ],
            'speed_decrease_40%': [
                {
                    'ko': '조금 어려워진 것 같나요? 이럴 때는 한 문제씩 차근차근 풀어보는 게 좋아요. 힌트가 필요하면 언제든지 물어보세요! 🤔',
                    'en': "Feeling a bit challenging? Try solving one problem at a time carefully. Ask for a hint anytime! 🤔",
                    'type': MessageType.STRATEGY_TIP,
                    'severity': 'medium'
                },
                {
                    'ko': '속도가 줄어들었네요. 혹시 피곤하신가요? 잠깐 쉬었다 하는 것도 좋은 방법이에요! 🌟',
                    'en': "Your pace has slowed down. Are you getting tired? Taking a short break can help! 🌟",
                    'type': MessageType.BREAK_SUGGESTION,
                    'severity': 'medium'
                },
            ],
            'speed_decrease_60%': [
                {
                    'ko': '많이 힘들어 보이네요. 지금은 잠깐 쉬는 게 어떨까요? 휴식 후에 더 잘 할 수 있을 거예요! 💙',
                    'en': "This seems quite challenging. How about taking a break? You'll do better after resting! 💙",
                    'type': MessageType.BREAK_SUGGESTION,
                    'severity': 'high'
                },
                {
                    'ko': '어려운 부분이 있나요? 선생님께 도움을 요청하거나, 이전 문제를 다시 복습해보는 것은 어떨까요? 🙋',
                    'en': "Having trouble? Consider asking your teacher for help, or reviewing previous problems. 🙋",
                    'type': MessageType.STRATEGY_TIP,
                    'severity': 'high'
                },
            ],

            # Consecutive errors
            'consecutive_errors': [
                {
                    'ko': '여러 번 틀렸지만 괜찮아요! 실수를 통해 배우는 거예요. 다시 한 번 차근차근 풀어볼까요? 🌱',
                    'en': "Several mistakes, but that's okay! We learn from errors. Let's try again step by step? 🌱",
                    'type': MessageType.ENCOURAGEMENT,
                    'severity': 'medium'
                },
                {
                    'ko': '이 문제가 까다롭나봐요. 비슷한 예제를 먼저 확인해보거나, 힌트를 사용해보는 건 어떨까요? 💡',
                    'en': "This problem seems tricky. How about checking similar examples first, or using a hint? 💡",
                    'type': MessageType.STRATEGY_TIP,
                    'severity': 'medium'
                },
            ],

            # Long session
            'long_session': [
                {
                    'ko': '와! 오랜 시간 열심히 했네요! 👏 이제 잠깐 쉬는 시간을 가지는 게 어떨까요? 스트레칭이나 물 마시기를 추천해요!',
                    'en': "Wow! You've been working hard for a long time! 👏 How about a short break? Try stretching or drinking some water!",
                    'type': MessageType.BREAK_SUGGESTION,
                    'severity': 'medium'
                },
                {
                    'ko': '90분 이상 집중했어요! 정말 대단해요! 🌟 10분만 쉬었다가 다시 시작하면 더 잘 할 수 있을 거예요.',
                    'en': "You've been focused for over 90 minutes! That's amazing! 🌟 A 10-minute break will help you do even better.",
                    'type': MessageType.BREAK_SUGGESTION,
                    'severity': 'medium'
                },
            ],

            # Low accuracy
            'low_accuracy': [
                {
                    'ko': '정답률이 조금 낮아졌어요. 너무 빨리 풀려고 서두르지 않았나요? 천천히, 정확하게 풀어보세요! 🎯',
                    'en': "Your accuracy has decreased. Are you rushing? Take your time and solve carefully! 🎯",
                    'type': MessageType.STRATEGY_TIP,
                    'severity': 'medium'
                },
                {
                    'ko': '실수가 많아진 것 같아요. 각 단계를 꼼꼼히 확인하면서 풀어보는 건 어떨까요? 📝',
                    'en': "Seems like there are more mistakes. How about checking each step carefully? 📝",
                    'type': MessageType.STRATEGY_TIP,
                    'severity': 'medium'
                },
            ],

            # Stuck on problem
            'stuck_on_problem': [
                {
                    'ko': '이 문제에서 오래 막혀있네요. 괜찮아요! 힌트를 사용하거나, 다른 문제를 먼저 풀어보는 것도 좋은 전략이에요. 🔍',
                    'en': "You've been stuck on this problem for a while. That's fine! Using a hint or trying a different problem first is a good strategy. 🔍",
                    'type': MessageType.STRATEGY_TIP,
                    'severity': 'medium'
                },
                {
                    'ko': '어려운 문제네요! 비슷한 문제를 먼저 풀어보거나, 개념을 다시 확인해보는 건 어떨까요? 📚',
                    'en': "This is a tough problem! How about trying similar problems first, or reviewing the concept? 📚",
                    'type': MessageType.STRATEGY_TIP,
                    'severity': 'medium'
                },
            ],

            # Celebration / Positive reinforcement
            'improvement_detected': [
                {
                    'ko': '속도가 빨라지고 있어요! 정말 잘하고 있어요! 계속 이렇게 해봐요! 🎉',
                    'en': "Your speed is improving! You're doing great! Keep it up! 🎉",
                    'type': MessageType.CELEBRATION,
                    'severity': 'low'
                },
                {
                    'ko': '점점 더 잘하고 있어요! 이 속도로 계속 가면 곧 끝낼 수 있을 거예요! 🚀',
                    'en': "You're getting better and better! At this pace, you'll finish soon! 🚀",
                    'type': MessageType.CELEBRATION,
                    'severity': 'low'
                },
            ],

            'high_accuracy': [
                {
                    'ko': '정확도가 정말 높아요! 완벽해요! 👍 이대로 계속 가세요!',
                    'en': "Your accuracy is really high! Perfect! 👍 Keep going!",
                    'type': MessageType.CELEBRATION,
                    'severity': 'low'
                },
            ],
        }

    def generate_message(
        self,
        trigger_reason: str,
        severity: str,
        recommended_actions: List[str],
        student_name: Optional[str] = None
    ) -> MentalCareMessage:
        """
        Generate a mental care message based on the trigger

        Args:
            trigger_reason: Why the message is being sent
            severity: low, medium, or high
            recommended_actions: List of recommended actions
            student_name: Optional student name for personalization

        Returns:
            MentalCareMessage with Korean and English text
        """
        # Get appropriate message templates
        templates = self.message_templates.get(trigger_reason, [])

        if not templates:
            # Default encouragement message
            templates = [
                {
                    'ko': '잘하고 있어요! 계속 열심히 해봐요! 😊',
                    'en': "You're doing well! Keep up the good work! 😊",
                    'type': MessageType.ENCOURAGEMENT,
                    'severity': 'low'
                }
            ]

        # Select a random template
        template = random.choice(templates)

        # Personalize if student name is provided
        text_ko = template['ko']
        text_en = template['en']

        if student_name:
            text_ko = f"{student_name}님, {text_ko}"
            text_en = f"{student_name}, {text_en}"

        return MentalCareMessage(
            message_type=template.get('type', MessageType.ENCOURAGEMENT),
            trigger_reason=trigger_reason,
            text_ko=text_ko,
            text_en=text_en,
            severity=severity,
            recommended_actions=recommended_actions
        )

    def generate_custom_message(
        self,
        text_ko: str,
        text_en: str,
        message_type: MessageType,
        trigger_reason: str,
        severity: str = 'low',
        recommended_actions: Optional[List[str]] = None
    ) -> MentalCareMessage:
        """Generate a custom mental care message"""
        return MentalCareMessage(
            message_type=message_type,
            trigger_reason=trigger_reason,
            text_ko=text_ko,
            text_en=text_en,
            severity=severity,
            recommended_actions=recommended_actions or []
        )

    def get_break_time_suggestion(self, session_duration_minutes: int) -> Dict[str, str]:
        """Get break time suggestion based on session duration"""
        if session_duration_minutes > 120:  # 2+ hours
            return {
                'ko': '15-20분 정도 충분히 쉬세요. 산책하거나 간단한 운동을 하면 좋아요!',
                'en': 'Take a 15-20 minute break. A walk or light exercise would be great!'
            }
        elif session_duration_minutes > 90:  # 1.5+ hours
            return {
                'ko': '10-15분 정도 쉬세요. 스트레칭을 하거나 간식을 먹으면 좋아요!',
                'en': 'Take a 10-15 minute break. Stretching or having a snack would help!'
            }
        else:  # 60-90 minutes
            return {
                'ko': '5-10분 정도 잠깐 쉬세요. 눈을 감고 심호흡을 해보세요!',
                'en': 'Take a 5-10 minute break. Close your eyes and take deep breaths!'
            }


# Example usage
if __name__ == "__main__":
    generator = MentalCareMessageGenerator()

    # Generate message for speed decrease
    message = generator.generate_message(
        trigger_reason='speed_decrease_40%',
        severity='medium',
        recommended_actions=['encourage', 'suggest_strategy'],
        student_name='민수'
    )

    print(f"Message Type: {message.message_type.value}")
    print(f"Korean: {message.text_ko}")
    print(f"English: {message.text_en}")
    print(f"Severity: {message.severity}")
    print(f"Actions: {message.recommended_actions}")

    print("\n" + "="*50 + "\n")

    # Generate message for long session
    message2 = generator.generate_message(
        trigger_reason='long_session',
        severity='medium',
        recommended_actions=['suggest_break'],
        student_name='지연'
    )

    print(f"Message Type: {message2.message_type.value}")
    print(f"Korean: {message2.text_ko}")
    print(f"English: {message2.text_en}")

    # Get break suggestion
    break_suggestion = generator.get_break_time_suggestion(95)
    print(f"\nBreak suggestion: {break_suggestion['ko']}")
