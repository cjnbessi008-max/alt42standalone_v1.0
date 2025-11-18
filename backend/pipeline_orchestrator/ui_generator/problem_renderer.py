"""
Problem Renderer - Generates highlighted problem HTML/JSON for frontend

This module takes the output from the text processor and generates
frontend-ready data structures for rendering highlighted problems.
"""

import json
from typing import Dict, List
import sys
import os

# Add parent directory to path to import text_processor
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from rule_engine.text_processor import ProbabilityTextProcessor


class ProblemRenderer:
    """Renders problems with highlighted key conditions"""

    def __init__(self):
        self.text_processor = ProbabilityTextProcessor()

    def process_problem(
        self,
        problem_text: str,
        problem_id: str = None,
        problem_type: str = "probability",
        language: str = "ko"
    ) -> Dict:
        """
        Process a problem and generate complete rendering data

        Args:
            problem_text: The problem statement
            problem_id: Optional problem identifier
            problem_type: Type of problem (probability, combination, etc.)
            language: Language code (ko, en)

        Returns:
            Dictionary with complete rendering data including:
            - problem metadata
            - highlight conditions
            - styling information
        """
        # Extract key conditions
        highlight_data = self.text_processor.generate_highlight_metadata(
            problem_text, problem_id
        )

        # Enhance with rendering-specific data
        render_data = {
            **highlight_data,
            "problem_type": problem_type,
            "language": language,
            "render_config": self._get_render_config(),
            "styles": self._get_condition_styles()
        }

        return render_data

    def _get_render_config(self) -> Dict:
        """Get rendering configuration"""
        return {
            "enable_tooltips": True,
            "highlight_mode": "click",  # or "hover", "always"
            "mobile_optimized": True,
            "accessibility": {
                "screen_reader_support": True,
                "keyboard_navigation": True,
                "high_contrast_mode": True
            }
        }

    def _get_condition_styles(self) -> Dict:
        """Get styling information for each condition type"""
        return {
            "independence": {
                "background_color": "#E3F2FD",
                "text_color": "#0D47A1",
                "border_color": "#1976D2",
                "font_weight": "bold",
                "icon": "🔗",
                "label_ko": "독립성",
                "label_en": "Independence"
            },
            "constraint": {
                "background_color": "#FFF3CD",
                "text_color": "#856404",
                "border_color": "#FFC107",
                "font_weight": "bold",
                "icon": "⚠️",
                "label_ko": "제약조건",
                "label_en": "Constraint"
            },
            "assumption": {
                "background_color": "#E8F5E9",
                "text_color": "#2E7D32",
                "border_color": "#4CAF50",
                "font_weight": "normal",
                "icon": "ℹ️",
                "label_ko": "가정",
                "label_en": "Assumption"
            },
            "probability": {
                "background_color": "#FCE4EC",
                "text_color": "#AD1457",
                "border_color": "#EC407A",
                "font_weight": "bold",
                "icon": "📊",
                "label_ko": "확률",
                "label_en": "Probability"
            },
            "event": {
                "background_color": "#E0F2F1",
                "text_color": "#00695C",
                "border_color": "#26A69A",
                "font_weight": "normal",
                "icon": "🎯",
                "label_ko": "사건",
                "label_en": "Event"
            },
            "sample_space": {
                "background_color": "#FFF8E1",
                "text_color": "#F57F17",
                "border_color": "#FFEB3B",
                "font_weight": "normal",
                "icon": "📋",
                "label_ko": "표본공간",
                "label_en": "Sample Space"
            },
            "requirement": {
                "background_color": "#F3E5F5",
                "text_color": "#6A1B9A",
                "border_color": "#9C27B0",
                "font_weight": "bold",
                "icon": "✓",
                "label_ko": "요구사항",
                "label_en": "Requirement"
            },
            "exception": {
                "background_color": "#FFEBEE",
                "text_color": "#C62828",
                "border_color": "#EF5350",
                "font_weight": "bold",
                "icon": "⛔",
                "label_ko": "예외",
                "label_en": "Exception"
            }
        }

    def generate_json(self, problem_text: str, **kwargs) -> str:
        """Generate JSON string for API response"""
        data = self.process_problem(problem_text, **kwargs)
        return json.dumps(data, ensure_ascii=False, indent=2)

    def save_to_file(self, problem_text: str, output_path: str, **kwargs):
        """Save rendering data to JSON file"""
        data = self.process_problem(problem_text, **kwargs)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Saved rendering data to: {output_path}")


# Example usage and API integration example
if __name__ == "__main__":
    renderer = ProblemRenderer()

    # Example 1: Korean probability problem
    problem_kr = """
    주머니에 빨간 공 3개와 파란 공 5개가 들어있다.
    이 주머니에서 임의로 2개의 공을 동시에 꺼낼 때,
    두 공이 모두 같은 색일 확률을 구하시오.
    단, 각 공을 선택할 확률은 모두 같다.
    """

    print("=== Processing Korean Problem ===")
    result = renderer.process_problem(
        problem_kr,
        problem_id="prob_kr_001",
        problem_type="probability",
        language="ko"
    )

    print(f"\nFound {result['total_conditions']} conditions:")
    for cond in result['conditions']:
        style = result['styles'][cond['type']]
        print(f"  - {style['icon']} {style['label_ko']}: {cond['text'][:50]}...")

    # Save to file
    renderer.save_to_file(
        problem_kr,
        "problem_kr_001.json",
        problem_id="prob_kr_001",
        problem_type="probability",
        language="ko"
    )

    # Example 2: English probability problem
    problem_en = """
    A bag contains 3 red balls and 5 blue balls.
    If we randomly select 2 balls simultaneously,
    find the probability that both balls are the same color.
    Assume that each ball has an equal probability of being selected.
    """

    print("\n" + "="*60)
    print("=== Processing English Problem ===")
    result = renderer.process_problem(
        problem_en,
        problem_id="prob_en_001",
        problem_type="probability",
        language="en"
    )

    print(f"\nFound {result['total_conditions']} conditions:")
    for cond in result['conditions']:
        style = result['styles'][cond['type']]
        print(f"  - {style['icon']} {style['label_en']}: {cond['text'][:50]}...")

    # Generate JSON string (for API response)
    print("\n" + "="*60)
    print("=== JSON Output (API Format) ===")
    json_output = renderer.generate_json(
        problem_en,
        problem_id="prob_en_001",
        problem_type="probability",
        language="en"
    )
    print(json_output[:500] + "...\n(truncated)")
