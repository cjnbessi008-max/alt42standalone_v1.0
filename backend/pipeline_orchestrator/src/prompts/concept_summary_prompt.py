"""
Prompt templates for concept summary generation using Claude AI
"""

CONCEPT_SUMMARY_SYSTEM_PROMPT = """You are an expert mathematics educator specializing in creating clear, age-appropriate definitions for mathematical concepts. Your summaries are used in an AI-powered education system for KAIST Touch Math Academy.

Your task is to generate concise, student-friendly one-line summaries that:
- Are accurate and pedagogically sound
- Use age-appropriate language for the target grade level
- Focus on the essential meaning of the concept
- Use concrete, relatable language instead of abstract terminology
- Avoid mathematical jargon when possible
- Are engaging and memorable for students

You will respond in JSON format with the summary and supporting information."""


def get_concept_summary_prompt(
    concept_name: str,
    grade_level: int,
    concept_description: str = None,
    module_context: str = None,
    related_concepts: list = None
) -> str:
    """
    Generate the user prompt for concept summary generation

    Args:
        concept_name: The name of the concept to summarize
        grade_level: Target grade level (1-12)
        concept_description: Optional detailed description of the concept
        module_context: Optional context about the module this concept belongs to
        related_concepts: Optional list of related concepts

    Returns:
        Formatted prompt string
    """
    related_str = ", ".join(related_concepts) if related_concepts else "None"

    prompt = f"""Generate a one-line summary for the following mathematical concept:

**Concept Name:** {concept_name}
**Target Grade Level:** {grade_level}
**Concept Description:** {concept_description or "Not provided"}
**Module Context:** {module_context or "General mathematics"}
**Related Concepts:** {related_str}

**Requirements:**
1. Maximum 150 characters (including spaces)
2. Written for grade {grade_level} students
3. Use simple, everyday language
4. Make it memorable and engaging
5. Focus on what students need to understand, not formal definitions

**Good Examples:**
- Grade 3, "Fractions": "A fraction is a part of something whole, like slicing a pizza into equal pieces"
- Grade 5, "Variables": "Letters that stand in for mystery numbers we need to figure out"
- Grade 4, "Equations": "Math sentences that show two things are equal, like a balanced scale"
- Grade 6, "Ratios": "A way to compare two amounts, like mixing 2 cups of juice with 3 cups of water"

**Bad Examples (avoid these):**
- Too formal: "A fraction is a numerical quantity that is not a whole number"
- Too vague: "Fractions are used in math"
- Too complex: "Fractional representations of rational numbers in p/q form"

Please respond with a JSON object in this exact format:
{{
    "summary": "[Your one-line summary here - max 150 chars]",
    "alternative_summaries": [
        "[Alternative version 1]",
        "[Alternative version 2]"
    ],
    "confidence": 0.95,
    "rationale": "[Brief explanation of why this summary works for this grade level]"
}}

Generate the summary now:"""

    return prompt


CONCEPT_VALIDATION_PROMPT = """You are a quality reviewer for educational content. Evaluate if the following concept summary is appropriate for the target grade level.

**Concept:** {concept_name}
**Grade Level:** {grade_level}
**Summary:** {summary}

Evaluate on these criteria:
1. **Age-appropriate language** (1-5): Is the vocabulary suitable for this grade?
2. **Accuracy** (1-5): Is the summary mathematically correct?
3. **Clarity** (1-5): Will students understand this easily?
4. **Engagement** (1-5): Is it interesting and memorable?
5. **Conciseness** (1-5): Is it brief without losing meaning?

Respond in JSON format:
{{
    "overall_score": 4.2,
    "age_appropriate": 5,
    "accuracy": 4,
    "clarity": 4,
    "engagement": 5,
    "conciseness": 4,
    "approved": true,
    "feedback": "[Any suggestions for improvement]"
}}"""


# Few-shot examples for better consistency
FEW_SHOT_EXAMPLES = [
    {
        "grade_level": 3,
        "concept": "Addition",
        "summary": "Putting numbers together to find out how many you have in total",
        "confidence": 0.98
    },
    {
        "grade_level": 4,
        "concept": "Perimeter",
        "summary": "The distance around the outside of a shape, like walking around a playground",
        "confidence": 0.95
    },
    {
        "grade_level": 5,
        "concept": "Decimals",
        "summary": "Numbers with a dot that show parts smaller than one whole, like $3.50",
        "confidence": 0.97
    },
    {
        "grade_level": 6,
        "concept": "Negative Numbers",
        "summary": "Numbers below zero, like temperatures on a cold winter day or floors below ground",
        "confidence": 0.96
    },
    {
        "grade_level": 7,
        "concept": "Proportions",
        "summary": "When two ratios are equal, like recipes that keep the same taste when doubled",
        "confidence": 0.94
    },
    {
        "grade_level": 8,
        "concept": "Linear Equations",
        "summary": "Math sentences where the answer makes a straight line on a graph",
        "confidence": 0.92
    }
]
