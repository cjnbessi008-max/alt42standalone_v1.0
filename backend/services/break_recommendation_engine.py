"""
Break Recommendation Engine
Generates personalized break recommendations based on DMN scores,
student preferences, and contextual factors
"""

from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from uuid import UUID
from dataclasses import dataclass
from enum import Enum
import random
import logging

logger = logging.getLogger(__name__)


# =============================================================================
# Enums and Data Classes
# =============================================================================

class BreakType(str, Enum):
    """Types of breaks"""
    MICRO_BREAK = "micro_break"  # 1-2 minutes
    ACTIVE_REST = "active_rest"  # 5 minutes
    SCHEDULED_BREAK = "scheduled_break"  # 5-10 minutes
    EXTENDED_REST = "extended_rest"  # 10-15 minutes


class UrgencyLevel(str, Enum):
    """Urgency of break recommendation"""
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


class ActivityType(str, Enum):
    """Types of break activities"""
    PHYSICAL = "physical"
    COGNITIVE = "cognitive"
    VISUAL = "visual"
    SOCIAL = "social"
    HYDRATION = "hydration"
    MINDFULNESS = "mindfulness"


@dataclass
class BreakActivity:
    """Individual break activity"""
    activity_id: str
    type: ActivityType
    name: str
    description: str
    instructions: List[str]
    duration_minutes: int
    difficulty_level: str  # easy, moderate, challenging
    benefits: List[str]
    equipment_needed: List[str] = None


@dataclass
class StudentPreferences:
    """Student preferences for breaks"""
    preferred_break_duration: int = 5
    preferred_activities: List[str] = None
    sensitivity: float = 1.0
    avoid_activities: List[str] = None
    notification_enabled: bool = True


@dataclass
class BreakContext:
    """Context for generating break recommendation"""
    dmn_score: float
    fatigue_level: str
    session_duration_minutes: float
    time_of_day: datetime
    current_module: Optional[str] = None
    difficulty_level: Optional[str] = None
    last_break_time: Optional[datetime] = None
    breaks_taken_today: int = 0
    student_preferences: Optional[StudentPreferences] = None


@dataclass
class BreakRecommendation:
    """Complete break recommendation"""
    recommendation_id: UUID
    break_type: BreakType
    duration_minutes: int
    urgency_level: UrgencyLevel
    activities: List[BreakActivity]
    motivational_message: str
    return_time: datetime
    tips: List[str]
    reasoning: str  # Why this break was recommended


# =============================================================================
# Break Activity Library
# =============================================================================

class BreakActivityLibrary:
    """Library of break activities"""

    @staticmethod
    def get_all_activities() -> List[BreakActivity]:
        """Get all available break activities"""
        return [
            # Physical Activities
            BreakActivity(
                activity_id="phys_desk_stretch",
                type=ActivityType.PHYSICAL,
                name="Desk Stretches",
                description="Simple stretching routine at your desk",
                instructions=[
                    "Stand up and reach arms overhead",
                    "Rotate shoulders backward 10 times",
                    "Tilt head side to side gently",
                    "Stretch arms across chest",
                    "Roll wrists and ankles"
                ],
                duration_minutes=3,
                difficulty_level="easy",
                benefits=["Reduces muscle tension", "Improves circulation", "Prevents stiffness"],
                equipment_needed=[]
            ),

            BreakActivity(
                activity_id="phys_walk",
                type=ActivityType.PHYSICAL,
                name="Quick Walk",
                description="Short walking break to boost energy",
                instructions=[
                    "Walk around your room or hallway",
                    "Maintain a comfortable pace",
                    "Swing arms naturally",
                    "Take deep breaths while walking",
                    "Notice your surroundings"
                ],
                duration_minutes=5,
                difficulty_level="easy",
                benefits=["Boosts energy", "Improves mood", "Enhances creativity"],
                equipment_needed=[]
            ),

            BreakActivity(
                activity_id="phys_stairs",
                type=ActivityType.PHYSICAL,
                name="Stair Climb",
                description="Climb stairs for quick energy boost",
                instructions=[
                    "Find a nearby staircase",
                    "Walk up and down 2-3 flights",
                    "Use handrail for safety",
                    "Breathe deeply throughout",
                    "Take your time, don't rush"
                ],
                duration_minutes=5,
                difficulty_level="moderate",
                benefits=["Increases heart rate", "Energizes body", "Improves focus"],
                equipment_needed=["stairs"]
            ),

            # Cognitive Activities
            BreakActivity(
                activity_id="cog_breathing",
                type=ActivityType.COGNITIVE,
                name="Mindful Breathing",
                description="Deep breathing exercise for mental clarity",
                instructions=[
                    "Sit comfortably with back straight",
                    "Close eyes gently",
                    "Breathe in slowly for 4 counts",
                    "Hold for 2 counts",
                    "Exhale slowly for 6 counts",
                    "Repeat 5-8 times"
                ],
                duration_minutes=2,
                difficulty_level="easy",
                benefits=["Reduces stress", "Improves focus", "Calms nervous system"],
                equipment_needed=[]
            ),

            BreakActivity(
                activity_id="cog_meditation",
                type=ActivityType.COGNITIVE,
                name="Mini Meditation",
                description="Brief meditation for mental reset",
                instructions=[
                    "Sit or lie comfortably",
                    "Close your eyes",
                    "Focus on your breathing",
                    "Let thoughts pass without judgment",
                    "Gently return focus to breath when mind wanders",
                    "Continue for 3-5 minutes"
                ],
                duration_minutes=5,
                difficulty_level="moderate",
                benefits=["Mental clarity", "Stress reduction", "Improved concentration"],
                equipment_needed=[]
            ),

            BreakActivity(
                activity_id="cog_progressive_relax",
                type=ActivityType.COGNITIVE,
                name="Progressive Relaxation",
                description="Systematic muscle relaxation technique",
                instructions=[
                    "Sit or lie comfortably",
                    "Tense feet muscles for 5 seconds, then release",
                    "Move up to calves, tense and release",
                    "Continue with thighs, abdomen, arms",
                    "Notice the relaxation in each muscle group",
                    "End with face and scalp muscles"
                ],
                duration_minutes=4,
                difficulty_level="moderate",
                benefits=["Reduces physical tension", "Promotes relaxation", "Body awareness"],
                equipment_needed=[]
            ),

            # Visual Activities
            BreakActivity(
                activity_id="vis_eye_rest",
                type=ActivityType.VISUAL,
                name="Eye Rest Exercise",
                description="20-20-20 rule for eye strain relief",
                instructions=[
                    "Look away from screen",
                    "Focus on object 20 feet (6 meters) away",
                    "Maintain focus for 20 seconds",
                    "Blink several times",
                    "Repeat 2-3 times",
                    "Close eyes for 30 seconds"
                ],
                duration_minutes=2,
                difficulty_level="easy",
                benefits=["Reduces eye strain", "Prevents dry eyes", "Maintains eye health"],
                equipment_needed=[]
            ),

            BreakActivity(
                activity_id="vis_palming",
                type=ActivityType.VISUAL,
                name="Eye Palming",
                description="Relaxation technique for tired eyes",
                instructions=[
                    "Rub hands together to warm them",
                    "Gently cup hands over closed eyes",
                    "Don't press on eyes, just cover them",
                    "Enjoy the darkness for 1-2 minutes",
                    "Breathe deeply and relax",
                    "Remove hands slowly and blink"
                ],
                duration_minutes=2,
                difficulty_level="easy",
                benefits=["Relaxes eye muscles", "Reduces eye fatigue", "Calming effect"],
                equipment_needed=[]
            ),

            # Social Activities
            BreakActivity(
                activity_id="soc_chat",
                type=ActivityType.SOCIAL,
                name="Quick Social Break",
                description="Brief social interaction for mood boost",
                instructions=[
                    "Step away from your workspace",
                    "Have a brief chat with someone nearby (2-3 minutes)",
                    "Share something positive or funny",
                    "Keep conversation light and brief",
                    "Return feeling refreshed"
                ],
                duration_minutes=3,
                difficulty_level="easy",
                benefits=["Social connection", "Mood boost", "Mental break"],
                equipment_needed=[]
            ),

            # Hydration Activities
            BreakActivity(
                activity_id="hyd_water",
                type=ActivityType.HYDRATION,
                name="Hydration Break",
                description="Get water and refresh",
                instructions=[
                    "Stand up and walk to water source",
                    "Drink at least one glass of water",
                    "Notice the sensation of drinking",
                    "Take deep breaths",
                    "Optional: splash cool water on face",
                    "Return feeling refreshed"
                ],
                duration_minutes=3,
                difficulty_level="easy",
                benefits=["Maintains hydration", "Boosts energy", "Improves focus"],
                equipment_needed=["water"]
            ),

            # Mindfulness Activities
            BreakActivity(
                activity_id="mind_gratitude",
                type=ActivityType.MINDFULNESS,
                name="Gratitude Moment",
                description="Brief gratitude practice",
                instructions=[
                    "Think of 3 things you're grateful for today",
                    "They can be small or large",
                    "Focus on the feeling of gratitude",
                    "Take a deep breath for each one",
                    "Smile and return to work"
                ],
                duration_minutes=2,
                difficulty_level="easy",
                benefits=["Positive mood", "Mental reset", "Perspective shift"],
                equipment_needed=[]
            ),

            BreakActivity(
                activity_id="mind_body_scan",
                type=ActivityType.MINDFULNESS,
                name="Quick Body Scan",
                description="Brief body awareness practice",
                instructions=[
                    "Sit comfortably",
                    "Notice sensations in your feet",
                    "Move attention up through legs, torso",
                    "Notice shoulders, arms, hands",
                    "Finish with head and face",
                    "Take a deep breath"
                ],
                duration_minutes=3,
                difficulty_level="easy",
                benefits=["Body awareness", "Stress reduction", "Grounding"],
                equipment_needed=[]
            ),
        ]

    @staticmethod
    def get_activities_by_type(activity_type: ActivityType) -> List[BreakActivity]:
        """Filter activities by type"""
        return [a for a in BreakActivityLibrary.get_all_activities() if a.type == activity_type]

    @staticmethod
    def get_activities_by_duration(max_duration: int) -> List[BreakActivity]:
        """Filter activities by maximum duration"""
        return [a for a in BreakActivityLibrary.get_all_activities() if a.duration_minutes <= max_duration]


# =============================================================================
# Break Recommendation Engine
# =============================================================================

class BreakRecommendationEngine:
    """Engine for generating personalized break recommendations"""

    def __init__(self):
        self.activity_library = BreakActivityLibrary()
        logger.info("Break Recommendation Engine initialized")

    def generate_recommendation(
        self,
        context: BreakContext
    ) -> BreakRecommendation:
        """
        Generate a personalized break recommendation

        Args:
            context: Context information for recommendation

        Returns:
            BreakRecommendation object
        """
        logger.info(f"Generating break recommendation (DMN: {context.dmn_score}, Fatigue: {context.fatigue_level})")

        # Determine break type and duration
        break_type, duration = self._determine_break_type_and_duration(context)

        # Determine urgency
        urgency = self._determine_urgency(context)

        # Select appropriate activities
        activities = self._select_activities(break_type, duration, context)

        # Generate motivational message
        message = self._generate_motivational_message(context, break_type)

        # Generate tips
        tips = self._generate_tips(context, break_type)

        # Generate reasoning
        reasoning = self._generate_reasoning(context, break_type)

        # Calculate return time
        return_time = datetime.utcnow() + timedelta(minutes=duration)

        recommendation = BreakRecommendation(
            recommendation_id=UUID(int=random.getrandbits(128)),
            break_type=break_type,
            duration_minutes=duration,
            urgency_level=urgency,
            activities=activities,
            motivational_message=message,
            return_time=return_time,
            tips=tips,
            reasoning=reasoning
        )

        logger.info(f"Recommendation generated: {break_type.value}, {duration}min, {urgency.value} urgency")

        return recommendation

    def _determine_break_type_and_duration(
        self,
        context: BreakContext
    ) -> Tuple[BreakType, int]:
        """Determine appropriate break type and duration"""

        # Apply student preferences if available
        if context.student_preferences:
            preferred_duration = context.student_preferences.preferred_break_duration
        else:
            preferred_duration = 5

        # Critical fatigue - extended rest needed
        if context.dmn_score >= 0.85:
            return BreakType.EXTENDED_REST, min(15, max(10, preferred_duration))

        # High fatigue - active rest
        elif context.dmn_score >= 0.65:
            return BreakType.ACTIVE_REST, min(10, max(5, preferred_duration))

        # Long session without break - scheduled break
        elif context.session_duration_minutes >= 45:
            # Check if recent break
            if context.last_break_time:
                time_since_break = (datetime.utcnow() - context.last_break_time).total_seconds() / 60
                if time_since_break >= 30:
                    return BreakType.SCHEDULED_BREAK, 5
                else:
                    return BreakType.MICRO_BREAK, 2
            else:
                return BreakType.SCHEDULED_BREAK, 5

        # Mild fatigue or proactive break
        elif context.dmn_score >= 0.40:
            return BreakType.MICRO_BREAK, 2

        # Default
        else:
            return BreakType.MICRO_BREAK, 2

    def _determine_urgency(self, context: BreakContext) -> UrgencyLevel:
        """Determine urgency level of break recommendation"""

        if context.dmn_score >= 0.85:
            return UrgencyLevel.CRITICAL

        elif context.dmn_score >= 0.75:
            return UrgencyLevel.HIGH

        elif context.dmn_score >= 0.55:
            return UrgencyLevel.MODERATE

        else:
            return UrgencyLevel.LOW

    def _select_activities(
        self,
        break_type: BreakType,
        duration: int,
        context: BreakContext
    ) -> List[BreakActivity]:
        """Select appropriate activities for the break"""

        all_activities = self.activity_library.get_all_activities()

        # Filter by duration
        suitable_activities = [a for a in all_activities if a.duration_minutes <= duration]

        # Apply student preferences
        if context.student_preferences and context.student_preferences.preferred_activities:
            # Prioritize preferred activity types
            preferred = [
                a for a in suitable_activities
                if a.type.value in context.student_preferences.preferred_activities
            ]
            if preferred:
                suitable_activities = preferred

        # Exclude avoided activities
        if context.student_preferences and context.student_preferences.avoid_activities:
            suitable_activities = [
                a for a in suitable_activities
                if a.activity_id not in context.student_preferences.avoid_activities
            ]

        # Select activities based on break type and context
        selected = []

        if break_type == BreakType.MICRO_BREAK:
            # Quick, easy activities
            candidates = [a for a in suitable_activities if a.difficulty_level == "easy" and a.duration_minutes <= 2]
            selected = random.sample(candidates, min(2, len(candidates)))

        elif break_type == BreakType.ACTIVE_REST:
            # Mix of physical and cognitive
            physical = [a for a in suitable_activities if a.type == ActivityType.PHYSICAL]
            cognitive = [a for a in suitable_activities if a.type in [ActivityType.COGNITIVE, ActivityType.VISUAL]]

            if physical:
                selected.append(random.choice(physical))
            if cognitive:
                selected.append(random.choice(cognitive))

        elif break_type == BreakType.SCHEDULED_BREAK:
            # Balanced mix
            physical = [a for a in suitable_activities if a.type == ActivityType.PHYSICAL]
            visual = [a for a in suitable_activities if a.type == ActivityType.VISUAL]
            hydration = [a for a in suitable_activities if a.type == ActivityType.HYDRATION]

            if physical:
                selected.append(random.choice(physical))
            if visual:
                selected.append(random.choice(visual))
            if hydration:
                selected.append(random.choice(hydration))

        elif break_type == BreakType.EXTENDED_REST:
            # More comprehensive break
            physical = [a for a in suitable_activities if a.type == ActivityType.PHYSICAL]
            cognitive = [a for a in suitable_activities if a.type == ActivityType.COGNITIVE]
            social = [a for a in suitable_activities if a.type == ActivityType.SOCIAL]

            if physical:
                selected.append(random.choice(physical))
            if cognitive:
                selected.append(random.choice(cognitive))
            if social and random.random() > 0.5:
                selected.append(random.choice(social))

        # Ensure at least one activity
        if not selected and suitable_activities:
            selected = [random.choice(suitable_activities)]

        return selected

    def _generate_motivational_message(
        self,
        context: BreakContext,
        break_type: BreakType
    ) -> str:
        """Generate motivational message for the break"""

        messages_by_urgency = {
            UrgencyLevel.CRITICAL: [
                "You've been working really hard! Your brain needs a proper rest now.",
                "Time for a well-deserved break. Your focus will thank you!",
                "Let's pause here. Taking a break will help you learn better."
            ],
            UrgencyLevel.HIGH: [
                "Great work so far! A quick break will help you stay sharp.",
                "You're doing well! Let's take a brief rest to recharge.",
                "Time for a break! You'll come back even more focused."
            ],
            UrgencyLevel.MODERATE: [
                "Nice progress! A short break will keep you going strong.",
                "You're on a roll! Let's take a quick breather.",
                "Keep up the good work! A brief rest will help you continue."
            ],
            UrgencyLevel.LOW: [
                "Great job! A quick break can help maintain your focus.",
                "You're doing well! A short rest will keep you energized.",
                "Nice work! A brief break will help you stay fresh."
            ]
        }

        urgency = self._determine_urgency(context)
        messages = messages_by_urgency.get(urgency, messages_by_urgency[UrgencyLevel.MODERATE])

        return random.choice(messages)

    def _generate_tips(
        self,
        context: BreakContext,
        break_type: BreakType
    ) -> List[str]:
        """Generate helpful tips for the break"""

        all_tips = [
            "Step away from your screen completely",
            "Drink some water to stay hydrated",
            "Move your body gently",
            "Take deep breaths",
            "Look at something far away to rest your eyes",
            "Stretch your arms and shoulders",
            "Don't check your phone during the break",
            "Get some fresh air if possible"
        ]

        # Select relevant tips based on break type
        if break_type in [BreakType.EXTENDED_REST, BreakType.SCHEDULED_BREAK]:
            num_tips = 3
        else:
            num_tips = 2

        return random.sample(all_tips, min(num_tips, len(all_tips)))

    def _generate_reasoning(
        self,
        context: BreakContext,
        break_type: BreakType
    ) -> str:
        """Generate explanation for why this break was recommended"""

        reasons = []

        if context.dmn_score >= 0.75:
            reasons.append(f"High cognitive load detected (DMN score: {context.dmn_score:.2f})")

        if context.session_duration_minutes >= 45:
            reasons.append(f"Long study session ({context.session_duration_minutes:.0f} minutes)")

        if context.last_break_time:
            time_since_break = (datetime.utcnow() - context.last_break_time).total_seconds() / 60
            if time_since_break >= 30:
                reasons.append(f"No break for {time_since_break:.0f} minutes")

        if not reasons:
            reasons.append("Proactive break to maintain optimal learning")

        return "; ".join(reasons)

    def evaluate_break_effectiveness(
        self,
        dmn_before: float,
        dmn_after: float,
        break_duration: int,
        activities_completed: List[str]
    ) -> Dict[str, any]:
        """
        Evaluate how effective a break was

        Returns effectiveness analysis
        """
        dmn_reduction = dmn_before - dmn_after
        reduction_percentage = (dmn_reduction / dmn_before * 100) if dmn_before > 0 else 0

        # Expected reduction based on duration
        expected_reduction = min(0.4, break_duration * 0.05)

        effectiveness_ratio = dmn_reduction / expected_reduction if expected_reduction > 0 else 0

        if effectiveness_ratio >= 1.0:
            effectiveness = "excellent"
        elif effectiveness_ratio >= 0.7:
            effectiveness = "good"
        elif effectiveness_ratio >= 0.4:
            effectiveness = "moderate"
        else:
            effectiveness = "low"

        return {
            "effectiveness": effectiveness,
            "dmn_reduction": round(dmn_reduction, 3),
            "reduction_percentage": round(reduction_percentage, 1),
            "effectiveness_ratio": round(effectiveness_ratio, 2),
            "recommendation": self._get_effectiveness_recommendation(effectiveness)
        }

    def _get_effectiveness_recommendation(self, effectiveness: str) -> str:
        """Get recommendation based on effectiveness"""
        recommendations = {
            "excellent": "Your break was very effective! Continue with similar activities.",
            "good": "Good break! Your focus has improved.",
            "moderate": "Break helped, but consider taking longer breaks or different activities.",
            "low": "Break wasn't very effective. Try more active or longer breaks next time."
        }
        return recommendations.get(effectiveness, "")


if __name__ == "__main__":
    # Example usage
    logging.basicConfig(level=logging.INFO)

    engine = BreakRecommendationEngine()

    # Simulate context
    context = BreakContext(
        dmn_score=0.72,
        fatigue_level="moderate",
        session_duration_minutes=42,
        time_of_day=datetime.now(),
        current_module="fractions",
        difficulty_level="medium",
        breaks_taken_today=1,
        student_preferences=StudentPreferences(
            preferred_break_duration=5,
            preferred_activities=["physical", "cognitive"],
            sensitivity=1.0
        )
    )

    recommendation = engine.generate_recommendation(context)

    print(f"\n=== Break Recommendation ===")
    print(f"Type: {recommendation.break_type.value}")
    print(f"Duration: {recommendation.duration_minutes} minutes")
    print(f"Urgency: {recommendation.urgency_level.value}")
    print(f"Message: {recommendation.motivational_message}")
    print(f"Reasoning: {recommendation.reasoning}")
    print(f"\nActivities:")
    for activity in recommendation.activities:
        print(f"  - {activity.name} ({activity.duration_minutes}min)")
    print(f"\nTips:")
    for tip in recommendation.tips:
        print(f"  - {tip}")
