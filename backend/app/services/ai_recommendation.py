"""
AI-powered recommendation service using Claude API
"""
import anthropic
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.core.config import settings
from app.models.student_solution import (
    Student, StudentSolution, StudentAction, Problem, Module, ActionType
)


class AIRecommendationService:
    """Service for AI-powered learning recommendations"""

    def __init__(self, db: Session):
        self.db = db
        self.client = None
        if settings.ANTHROPIC_API_KEY:
            self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    def analyze_student_learning_pattern(self, student_id: str) -> Dict[str, Any]:
        """
        Analyze student's learning patterns using their solution history
        """
        # Get student's recent solutions
        solutions = self.db.query(StudentSolution).filter(
            StudentSolution.student_id == student_id
        ).order_by(StudentSolution.started_at.desc()).limit(50).all()

        if not solutions:
            return {
                "pattern_type": "new_student",
                "strengths": [],
                "weaknesses": [],
                "learning_pace": "unknown",
                "engagement_level": "unknown"
            }

        # Calculate statistics
        total_solutions = len(solutions)
        correct_solutions = sum(1 for s in solutions if s.is_correct)
        accuracy_rate = correct_solutions / total_solutions if total_solutions > 0 else 0

        avg_time = sum(s.time_spent_seconds for s in solutions) / total_solutions
        avg_attempts = sum(s.attempts_count for s in solutions) / total_solutions
        avg_hints = sum(s.hints_used_count for s in solutions) / total_solutions

        # Categorize learning patterns
        pattern_analysis = {
            "total_problems_attempted": total_solutions,
            "accuracy_rate": round(accuracy_rate * 100, 2),
            "avg_time_per_problem": round(avg_time, 2),
            "avg_attempts_per_problem": round(avg_attempts, 2),
            "avg_hints_used": round(avg_hints, 2),
            "learning_pace": self._categorize_pace(avg_time),
            "problem_solving_style": self._categorize_style(avg_attempts, avg_hints),
            "engagement_level": self._categorize_engagement(total_solutions, avg_time)
        }

        # Identify strengths and weaknesses
        pattern_analysis["strengths"] = self._identify_strengths(pattern_analysis)
        pattern_analysis["weaknesses"] = self._identify_weaknesses(pattern_analysis)

        return pattern_analysis

    def _categorize_pace(self, avg_time: float) -> str:
        """Categorize learning pace based on average time"""
        if avg_time < 60:
            return "fast"
        elif avg_time < 180:
            return "moderate"
        else:
            return "slow"

    def _categorize_style(self, avg_attempts: float, avg_hints: float) -> str:
        """Categorize problem-solving style"""
        if avg_attempts <= 2 and avg_hints < 1:
            return "confident_solver"
        elif avg_hints >= 2:
            return "guidance_seeker"
        elif avg_attempts > 5:
            return "persistent_explorer"
        else:
            return "balanced_learner"

    def _categorize_engagement(self, total_problems: int, avg_time: float) -> str:
        """Categorize engagement level"""
        if total_problems >= 20 and avg_time > 60:
            return "highly_engaged"
        elif total_problems >= 10:
            return "moderately_engaged"
        else:
            return "low_engagement"

    def _identify_strengths(self, analysis: Dict) -> List[str]:
        """Identify student strengths"""
        strengths = []
        if analysis["accuracy_rate"] >= 80:
            strengths.append("high_accuracy")
        if analysis["avg_attempts_per_problem"] <= 3:
            strengths.append("efficient_problem_solving")
        if analysis["learning_pace"] == "fast":
            strengths.append("quick_learner")
        if analysis["engagement_level"] == "highly_engaged":
            strengths.append("high_engagement")
        return strengths

    def _identify_weaknesses(self, analysis: Dict) -> List[str]:
        """Identify areas for improvement"""
        weaknesses = []
        if analysis["accuracy_rate"] < 50:
            weaknesses.append("low_accuracy")
        if analysis["avg_hints_used"] >= 3:
            weaknesses.append("heavy_hint_dependency")
        if analysis["avg_attempts_per_problem"] > 7:
            weaknesses.append("struggle_with_problem_solving")
        if analysis["engagement_level"] == "low_engagement":
            weaknesses.append("needs_motivation")
        return weaknesses

    async def get_personalized_recommendations(
        self,
        student_id: str,
        limit: int = 5
    ) -> Dict[str, Any]:
        """
        Get AI-powered personalized problem recommendations
        """
        pattern = self.analyze_student_learning_pattern(student_id)

        if not self.client:
            # Fallback to rule-based recommendations
            return self._get_rule_based_recommendations(student_id, pattern, limit)

        # Use Claude API for advanced recommendations
        prompt = f"""Analyze this student's learning pattern and recommend next steps:

Student Learning Pattern:
- Accuracy Rate: {pattern['accuracy_rate']}%
- Average Time per Problem: {pattern['avg_time_per_problem']} seconds
- Learning Pace: {pattern['learning_pace']}
- Problem Solving Style: {pattern['problem_solving_style']}
- Engagement Level: {pattern['engagement_level']}
- Strengths: {', '.join(pattern.get('strengths', []))}
- Weaknesses: {', '.join(pattern.get('weaknesses', []))}

Based on this pattern, provide:
1. Top {limit} recommended problem types or topics
2. Difficulty level recommendation (easy/medium/hard)
3. Specific learning strategies
4. Motivational message for the student

Format your response as a structured recommendation."""

        try:
            message = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1024,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            ai_recommendation = message.content[0].text

            return {
                "student_id": student_id,
                "pattern_analysis": pattern,
                "ai_recommendations": ai_recommendation,
                "generated_at": datetime.utcnow().isoformat()
            }

        except Exception as e:
            print(f"Claude API error: {str(e)}")
            return self._get_rule_based_recommendations(student_id, pattern, limit)

    def _get_rule_based_recommendations(
        self,
        student_id: str,
        pattern: Dict,
        limit: int
    ) -> Dict[str, Any]:
        """
        Fallback rule-based recommendations when AI is not available
        """
        recommendations = []

        # Rule-based logic
        if pattern['accuracy_rate'] < 50:
            recommendations.append({
                "type": "difficulty_adjustment",
                "suggestion": "Start with easier problems to build confidence",
                "difficulty": "easy"
            })
        elif pattern['accuracy_rate'] > 80:
            recommendations.append({
                "type": "challenge",
                "suggestion": "Try more challenging problems",
                "difficulty": "hard"
            })
        else:
            recommendations.append({
                "type": "continue",
                "suggestion": "Continue with current difficulty level",
                "difficulty": "medium"
            })

        if "heavy_hint_dependency" in pattern.get('weaknesses', []):
            recommendations.append({
                "type": "independence",
                "suggestion": "Try solving problems without hints first"
            })

        if pattern['learning_pace'] == "slow":
            recommendations.append({
                "type": "time_management",
                "suggestion": "Focus on understanding concepts rather than speed"
            })

        return {
            "student_id": student_id,
            "pattern_analysis": pattern,
            "recommendations": recommendations[:limit],
            "generated_at": datetime.utcnow().isoformat()
        }

    async def get_teacher_intervention_recommendations(
        self,
        student_id: str
    ) -> Dict[str, Any]:
        """
        Generate recommendations for teacher intervention
        """
        pattern = self.analyze_student_learning_pattern(student_id)
        student = self.db.query(Student).filter(Student.id == student_id).first()

        if not student:
            return {"error": "Student not found"}

        # Check for red flags
        red_flags = []
        intervention_priority = "low"

        if pattern['accuracy_rate'] < 40:
            red_flags.append("Very low accuracy rate - may need foundational review")
            intervention_priority = "high"

        if pattern.get('engagement_level') == "low_engagement":
            red_flags.append("Low engagement - may need motivation or different approach")
            if intervention_priority != "high":
                intervention_priority = "medium"

        if pattern['avg_attempts_per_problem'] > 8:
            red_flags.append("Struggling with problem-solving - needs scaffolding")
            intervention_priority = "high"

        if not self.client:
            return {
                "student_name": student.name,
                "intervention_priority": intervention_priority,
                "red_flags": red_flags,
                "suggested_actions": self._get_rule_based_interventions(pattern),
                "generated_at": datetime.utcnow().isoformat()
            }

        # Use Claude for nuanced intervention recommendations
        prompt = f"""As an educational expert, analyze this student's performance and recommend teacher interventions:

Student: {student.name}
Learning Pattern:
- Accuracy: {pattern['accuracy_rate']}%
- Problems Attempted: {pattern['total_problems_attempted']}
- Learning Pace: {pattern['learning_pace']}
- Problem Solving Style: {pattern['problem_solving_style']}
- Engagement: {pattern['engagement_level']}

Red Flags Detected:
{chr(10).join('- ' + flag for flag in red_flags) if red_flags else '- None'}

Provide specific, actionable recommendations for the teacher including:
1. Whether intervention is needed (low/medium/high priority)
2. Specific teaching strategies
3. One-on-one session topics if needed
4. Motivational approaches
5. Parent communication points if applicable"""

        try:
            message = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1024,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            return {
                "student_name": student.name,
                "student_id": student_id,
                "intervention_priority": intervention_priority,
                "red_flags": red_flags,
                "pattern_analysis": pattern,
                "ai_recommendations": message.content[0].text,
                "generated_at": datetime.utcnow().isoformat()
            }

        except Exception as e:
            print(f"Claude API error: {str(e)}")
            return {
                "student_name": student.name,
                "intervention_priority": intervention_priority,
                "red_flags": red_flags,
                "suggested_actions": self._get_rule_based_interventions(pattern),
                "generated_at": datetime.utcnow().isoformat()
            }

    def _get_rule_based_interventions(self, pattern: Dict) -> List[str]:
        """Rule-based intervention suggestions"""
        interventions = []

        if pattern['accuracy_rate'] < 50:
            interventions.append("Schedule one-on-one session to review fundamentals")

        if "heavy_hint_dependency" in pattern.get('weaknesses', []):
            interventions.append("Teach problem-solving strategies and metacognition")

        if pattern.get('engagement_level') == "low_engagement":
            interventions.append("Incorporate more interactive or gamified elements")

        if pattern['learning_pace'] == "slow":
            interventions.append("Provide additional practice materials and resources")

        return interventions

    async def generate_learning_path(
        self,
        student_id: str,
        module_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate a personalized learning path for the student
        """
        pattern = self.analyze_student_learning_pattern(student_id)
        student = self.db.query(Student).filter(Student.id == student_id).first()

        # Get available problems
        query = self.db.query(Problem)
        if module_id:
            query = query.filter(Problem.module_id == module_id)
        available_problems = query.all()

        if not self.client:
            # Simple rule-based path
            return self._generate_rule_based_path(student, pattern, available_problems)

        # Use Claude to generate sophisticated learning path
        problems_summary = "\n".join([
            f"- {p.problem_type} (Difficulty: {p.difficulty_level})"
            for p in available_problems[:20]
        ])

        prompt = f"""Create a personalized learning path for this student:

Student Profile:
- Name: {student.name}
- Grade Level: {student.grade_level or 'Not specified'}
- Accuracy Rate: {pattern['accuracy_rate']}%
- Learning Pace: {pattern['learning_pace']}
- Problem Solving Style: {pattern['problem_solving_style']}
- Strengths: {', '.join(pattern.get('strengths', []))}
- Weaknesses: {', '.join(pattern.get('weaknesses', []))}

Available Problem Types:
{problems_summary}

Create a step-by-step learning path with:
1. Recommended sequence of topics/problem types
2. Suggested difficulty progression
3. Estimated time commitment
4. Milestones and checkpoints
5. Tips for maximum learning effectiveness"""

        try:
            message = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1536,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            return {
                "student_id": student_id,
                "student_name": student.name,
                "pattern_analysis": pattern,
                "learning_path": message.content[0].text,
                "generated_at": datetime.utcnow().isoformat()
            }

        except Exception as e:
            print(f"Claude API error: {str(e)}")
            return self._generate_rule_based_path(student, pattern, available_problems)

    def _generate_rule_based_path(
        self,
        student: Student,
        pattern: Dict,
        problems: List[Problem]
    ) -> Dict[str, Any]:
        """Generate simple rule-based learning path"""
        # Determine starting difficulty
        if pattern['accuracy_rate'] < 50:
            start_difficulty = 1
        elif pattern['accuracy_rate'] > 80:
            start_difficulty = 3
        else:
            start_difficulty = 2

        path_steps = [
            {
                "step": 1,
                "difficulty": start_difficulty,
                "problem_count": 5,
                "goal": "Establish baseline performance"
            },
            {
                "step": 2,
                "difficulty": start_difficulty + 1,
                "problem_count": 8,
                "goal": "Progressive challenge"
            },
            {
                "step": 3,
                "difficulty": start_difficulty + 2,
                "problem_count": 10,
                "goal": "Mastery and confidence building"
            }
        ]

        return {
            "student_id": str(student.id),
            "student_name": student.name,
            "pattern_analysis": pattern,
            "learning_path": {
                "steps": path_steps,
                "estimated_duration": "2-3 weeks",
                "focus_areas": pattern.get('weaknesses', [])
            },
            "generated_at": datetime.utcnow().isoformat()
        }
