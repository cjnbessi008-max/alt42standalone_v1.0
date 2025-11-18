"""
Claude AI-Powered Derivative Analyzer
Uses Anthropic's Claude API for intelligent rule detection
"""

import anthropic
import json
import re
from typing import List, Dict, Tuple
import logging

from app.core.config import settings
from app.db.models import RuleType

logger = logging.getLogger(__name__)


class ClaudeDerivativeAnalyzer:
    """AI-powered derivative rule analyzer using Claude"""

    def __init__(self):
        self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = settings.CLAUDE_MODEL

    async def analyze_problem(self, problem_text: str, problem_latex: str = None) -> Dict:
        """
        Analyze a derivative problem using Claude AI

        Returns:
            - detected_rules: List of detected rules with explanations
            - analysis: Overall problem analysis
            - difficulty: Estimated difficulty level
        """

        expression = problem_latex if problem_latex else problem_text

        prompt = f"""You are an expert calculus tutor analyzing a derivative problem.

Problem: {expression}

Your task:
1. Identify the TOP 3 CORE derivative rules needed to solve this problem
2. For each rule, explain WHY it applies and WHERE in the expression it's used
3. Provide confidence scores (0.0-1.0) for each rule detection
4. Assess the overall difficulty (easy/medium/hard)

Available core rules:
- Power Rule: d/dx[x^n] = n·x^(n-1)
- Chain Rule: d/dx[f(g(x))] = f'(g(x))·g'(x)
- Product Rule: d/dx[f·g] = f'·g + f·g'
- Quotient Rule: d/dx[f/g] = (f'·g - f·g')/g²
- Constant Rule: d/dx[c] = 0
- Sum Rule: d/dx[f + g] = f' + g'

Respond in JSON format:
{{
  "detected_rules": [
    {{
      "rule_type": "power_rule",
      "rule_name": "Power Rule",
      "matched_expression": "x^3",
      "explanation": "The term x^3 requires the power rule...",
      "confidence": 0.95,
      "highlight_positions": {{"start": 10, "end": 13}}
    }}
  ],
  "overall_analysis": "This problem requires...",
  "difficulty": "medium",
  "step_by_step_hint": "First apply... then..."
}}

Focus on the 3 MOST IMPORTANT rules only."""

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=2048,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            # Parse Claude's response
            response_text = message.content[0].text

            # Extract JSON from response (handle markdown code blocks)
            json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                # Try to find JSON directly
                json_str = response_text

            result = json.loads(json_str)

            logger.info(f"Claude analysis completed: {len(result.get('detected_rules', []))} rules detected")
            return result

        except Exception as e:
            logger.error(f"Claude API error: {str(e)}")
            # Fallback to regex-based detection
            return await self._fallback_analysis(expression)

    async def _fallback_analysis(self, expression: str) -> Dict:
        """Fallback regex-based analysis if Claude API fails"""
        logger.warning("Using fallback regex-based analysis")

        detected_rules = []

        # Power Rule detection
        if re.search(r'x\s*\^|x\^\{|\^[\d\-]', expression):
            detected_rules.append({
                "rule_type": "power_rule",
                "rule_name": "Power Rule",
                "matched_expression": self._extract_power_expression(expression),
                "explanation": "Detected exponent notation indicating power rule application",
                "confidence": 0.85,
                "highlight_positions": None
            })

        # Chain Rule detection
        if re.search(r'\([^\)]+\)\s*\^|sin\(|cos\(|tan\(|ln\(|log\(|e\^|sqrt\(', expression):
            detected_rules.append({
                "rule_type": "chain_rule",
                "rule_name": "Chain Rule",
                "matched_expression": self._extract_chain_expression(expression),
                "explanation": "Detected composite function requiring chain rule",
                "confidence": 0.80,
                "highlight_positions": None
            })

        # Product Rule detection
        if re.search(r'\([^\)]+\)\s*\*\s*\([^\)]+\)|[a-z]\s*\*\s*[a-z]|[a-z]\s+[a-z]', expression):
            detected_rules.append({
                "rule_type": "product_rule",
                "rule_name": "Product Rule",
                "matched_expression": self._extract_product_expression(expression),
                "explanation": "Detected product of functions requiring product rule",
                "confidence": 0.75,
                "highlight_positions": None
            })

        return {
            "detected_rules": detected_rules[:3],  # Top 3 only
            "overall_analysis": "Automatic rule detection completed (fallback mode)",
            "difficulty": "medium",
            "step_by_step_hint": "Apply the detected rules in order"
        }

    def _extract_power_expression(self, text: str) -> str:
        """Extract power rule expression"""
        match = re.search(r'x\^[\d\-]+|x\^\{[^\}]+\}', text)
        return match.group(0) if match else "x^n"

    def _extract_chain_expression(self, text: str) -> str:
        """Extract chain rule expression"""
        patterns = [
            r'\([^\)]+\)\^[\d\-]+',
            r'sin\([^\)]+\)',
            r'cos\([^\)]+\)',
            r'ln\([^\)]+\)',
            r'e\^[^\s]+'
        ]
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(0)
        return "f(g(x))"

    def _extract_product_expression(self, text: str) -> str:
        """Extract product rule expression"""
        match = re.search(r'\([^\)]+\)\s*\*\s*\([^\)]+\)', text)
        return match.group(0) if match else "f(x)·g(x)"

    def map_rule_type(self, rule_type_str: str) -> RuleType:
        """Map string rule type to enum"""
        mapping = {
            "power_rule": RuleType.POWER_RULE,
            "chain_rule": RuleType.CHAIN_RULE,
            "product_rule": RuleType.PRODUCT_RULE,
            "quotient_rule": RuleType.QUOTIENT_RULE,
            "constant_rule": RuleType.CONSTANT_RULE,
            "sum_rule": RuleType.SUM_RULE
        }
        return mapping.get(rule_type_str, RuleType.POWER_RULE)
