"""
Problem generator service for creating math problems
"""

import random
from typing import Tuple
from ..models.problem import ProblemType


class ProblemGenerator:
    """Generates math problems based on difficulty level"""

    def __init__(self):
        """Initialize problem generator"""
        # Define difficulty ranges for each level
        self.difficulty_configs = {
            1: {  # Level 1: Single-digit addition/subtraction
                'addition': (1, 9),
                'subtraction': (1, 9),
                'multiplication': None  # Not available at level 1
            },
            2: {  # Level 2: Two-digit addition/subtraction, simple multiplication
                'addition': (10, 99),
                'subtraction': (1, 50),
                'multiplication': (2, 5)
            },
            3: {  # Level 3: Larger numbers and multiplication
                'addition': (50, 200),
                'subtraction': (10, 100),
                'multiplication': (2, 12)
            }
        }

    def generate_problem(self, difficulty_level: int = 1) -> Tuple[ProblemType, int, int, int]:
        """
        Generate a random problem based on difficulty level

        Args:
            difficulty_level: 1-3, defaults to 1

        Returns:
            Tuple of (problem_type, operand_1, operand_2, correct_answer)
        """
        if difficulty_level not in self.difficulty_configs:
            difficulty_level = 1

        config = self.difficulty_configs[difficulty_level]

        # Choose problem type based on available types at this level
        available_types = []
        if config['addition']:
            available_types.append(ProblemType.ADDITION)
        if config['subtraction']:
            available_types.append(ProblemType.SUBTRACTION)
        if config['multiplication']:
            available_types.append(ProblemType.MULTIPLICATION)

        problem_type = random.choice(available_types)

        # Generate operands based on type
        if problem_type == ProblemType.ADDITION:
            operand_1, operand_2 = self._generate_addition(config['addition'])
            answer = operand_1 + operand_2

        elif problem_type == ProblemType.SUBTRACTION:
            operand_1, operand_2 = self._generate_subtraction(config['subtraction'])
            answer = operand_1 - operand_2

        else:  # MULTIPLICATION
            operand_1, operand_2 = self._generate_multiplication(config['multiplication'])
            answer = operand_1 * operand_2

        return problem_type, operand_1, operand_2, answer

    def _generate_addition(self, range_tuple: Tuple[int, int]) -> Tuple[int, int]:
        """Generate addition problem operands"""
        min_val, max_val = range_tuple
        operand_1 = random.randint(min_val, max_val)
        operand_2 = random.randint(min_val, max_val)
        return operand_1, operand_2

    def _generate_subtraction(self, range_tuple: Tuple[int, int]) -> Tuple[int, int]:
        """Generate subtraction problem operands (ensure positive result)"""
        min_val, max_val = range_tuple
        operand_1 = random.randint(min_val, max_val)
        operand_2 = random.randint(min_val, operand_1)  # Ensure operand_2 <= operand_1
        return operand_1, operand_2

    def _generate_multiplication(self, range_tuple: Tuple[int, int]) -> Tuple[int, int]:
        """Generate multiplication problem operands"""
        min_val, max_val = range_tuple
        operand_1 = random.randint(min_val, max_val)
        operand_2 = random.randint(min_val, max_val)
        return operand_1, operand_2

    def get_problem_difficulty(self, problem_type: ProblemType, operand_1: int, operand_2: int) -> int:
        """
        Determine difficulty level of a problem

        Args:
            problem_type: Type of problem
            operand_1: First operand
            operand_2: Second operand

        Returns:
            Difficulty level (1-3)
        """
        # Simple heuristic based on operand ranges
        max_operand = max(operand_1, operand_2)

        if problem_type == ProblemType.MULTIPLICATION:
            if max_operand <= 5:
                return 2
            else:
                return 3
        else:  # Addition or Subtraction
            if max_operand <= 9:
                return 1
            elif max_operand <= 99:
                return 2
            else:
                return 3
