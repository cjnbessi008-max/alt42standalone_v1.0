"""
Equation Simplification Service
Uses SymPy to parse equations and generate step-by-step simplifications
Part of KAIST Touch Math Academy AI Education System
"""

import uuid
from typing import List, Dict, Any, Tuple, Optional
from sympy import (
    sympify, latex, simplify, expand, factor, collect, cancel,
    Symbol, Expr, Add, Mul, Pow, Number, gcd, lcm
)
from sympy.parsing.latex import parse_latex
import re


class EquationStep:
    """Represents a single step in equation simplification"""

    def __init__(
        self,
        equation: str,
        description: str,
        rule: str,
        delay: int = 1500,
        changed_elements: Optional[List[str]] = None,
        highlight_color: str = "#FFA726"
    ):
        self.id = str(uuid.uuid4())
        self.equation = equation
        self.description = description
        self.rule = rule
        self.delay = delay
        self.changed_elements = changed_elements or []
        self.highlight_color = highlight_color

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "equation": self.equation,
            "description": self.description,
            "rule": self.rule,
            "delay": self.delay,
            "changedElements": self.changed_elements,
            "highlightColor": self.highlight_color,
        }


class EquationSimplifier:
    """Main service for equation simplification with step tracking"""

    def __init__(self):
        self.steps: List[EquationStep] = []

    def parse_equation(self, equation_str: str) -> Expr:
        """
        Parse equation string (LaTeX or plain text) to SymPy expression

        Args:
            equation_str: Equation as LaTeX or plain string

        Returns:
            SymPy expression

        Raises:
            ValueError: If equation cannot be parsed
        """
        try:
            # Try LaTeX parsing first
            if '\\' in equation_str:
                return parse_latex(equation_str)
            else:
                # Plain text parsing
                return sympify(equation_str)
        except Exception as e:
            raise ValueError(f"Failed to parse equation: {str(e)}")

    def to_latex(self, expr: Expr) -> str:
        """Convert SymPy expression to LaTeX"""
        return latex(expr)

    def simplify_with_steps(
        self,
        equation_str: str,
        strategy: str = "auto"
    ) -> List[EquationStep]:
        """
        Simplify equation and generate step-by-step explanation

        Args:
            equation_str: Input equation (LaTeX or plain text)
            strategy: Simplification strategy ("auto", "expand", "factor", "collect")

        Returns:
            List of EquationStep objects
        """
        self.steps = []

        try:
            # Parse initial equation
            expr = self.parse_equation(equation_str)
            initial_latex = self.to_latex(expr)

            # Add initial step
            self.steps.append(EquationStep(
                equation=initial_latex,
                description="시작 수식 (Starting equation)",
                rule="입력 (Input)",
                delay=0,
            ))

            # Apply simplification strategy
            if strategy == "expand":
                self._expand_with_steps(expr)
            elif strategy == "factor":
                self._factor_with_steps(expr)
            elif strategy == "collect":
                self._collect_with_steps(expr)
            else:
                self._auto_simplify_with_steps(expr)

            return self.steps

        except Exception as e:
            raise ValueError(f"Simplification failed: {str(e)}")

    def _auto_simplify_with_steps(self, expr: Expr) -> None:
        """Automatically determine best simplification strategy"""

        # Step 1: Expand if there are products
        if expr.has(Mul) and not expr.is_Add:
            expanded = expand(expr)
            if expanded != expr:
                self.steps.append(EquationStep(
                    equation=self.to_latex(expanded),
                    description="괄호를 풀어서 전개합니다 (Expand parentheses)",
                    rule="분배 법칙 (Distributive property)",
                    changed_elements=self._find_changed_terms(expr, expanded),
                ))
                expr = expanded

        # Step 2: Combine like terms
        if expr.is_Add:
            collected = collect(expr, expr.free_symbols)
            if collected != expr:
                self.steps.append(EquationStep(
                    equation=self.to_latex(collected),
                    description="동류항을 모읍니다 (Combine like terms)",
                    rule="동류항 정리 (Like terms collection)",
                    changed_elements=self._find_changed_terms(expr, collected),
                ))
                expr = collected

        # Step 3: Simplify fractions
        if expr.has(Pow) and any(p.exp.is_negative for p in expr.atoms(Pow)):
            cancelled = cancel(expr)
            if cancelled != expr:
                self.steps.append(EquationStep(
                    equation=self.to_latex(cancelled),
                    description="분수를 약분합니다 (Simplify fractions)",
                    rule="약분 (Cancellation)",
                    changed_elements=self._find_changed_terms(expr, cancelled),
                ))
                expr = cancelled

        # Step 4: Final simplification
        simplified = simplify(expr)
        if simplified != expr:
            self.steps.append(EquationStep(
                equation=self.to_latex(simplified),
                description="최종 정리 (Final simplification)",
                rule="대수 정리 (Algebraic simplification)",
                changed_elements=self._find_changed_terms(expr, simplified),
            ))

    def _expand_with_steps(self, expr: Expr) -> None:
        """Expand expression with detailed steps"""

        expanded = expand(expr)
        if expanded != expr:
            self.steps.append(EquationStep(
                equation=self.to_latex(expanded),
                description="모든 괄호를 전개합니다 (Expand all parentheses)",
                rule="분배 법칙 (Distributive property)",
                changed_elements=self._find_changed_terms(expr, expanded),
            ))

            # Combine like terms
            collected = collect(expanded, expanded.free_symbols)
            if collected != expanded:
                self.steps.append(EquationStep(
                    equation=self.to_latex(collected),
                    description="동류항을 모읍니다 (Combine like terms)",
                    rule="동류항 정리 (Like terms collection)",
                    changed_elements=self._find_changed_terms(expanded, collected),
                ))

    def _factor_with_steps(self, expr: Expr) -> None:
        """Factor expression with detailed steps"""

        factored = factor(expr)
        if factored != expr:
            self.steps.append(EquationStep(
                equation=self.to_latex(factored),
                description="인수분해를 합니다 (Factor the expression)",
                rule="인수분해 (Factorization)",
                changed_elements=self._find_changed_terms(expr, factored),
            ))

    def _collect_with_steps(self, expr: Expr) -> None:
        """Collect terms with detailed steps"""

        symbols = list(expr.free_symbols)
        if not symbols:
            return

        for symbol in symbols:
            collected = collect(expr, symbol)
            if collected != expr:
                self.steps.append(EquationStep(
                    equation=self.to_latex(collected),
                    description=f"{symbol}에 대해 정리합니다 (Collect terms with {symbol})",
                    rule="동류항 정리 (Like terms collection)",
                    changed_elements=[str(symbol)],
                ))
                expr = collected

    def _find_changed_terms(self, expr1: Expr, expr2: Expr) -> List[str]:
        """
        Find which terms changed between two expressions

        Returns:
            List of changed term strings
        """
        try:
            terms1 = set(str(arg) for arg in expr1.args) if expr1.is_Add or expr1.is_Mul else {str(expr1)}
            terms2 = set(str(arg) for arg in expr2.args) if expr2.is_Add or expr2.is_Mul else {str(expr2)}

            changed = terms1.symmetric_difference(terms2)
            return list(changed)[:5]  # Limit to 5 most significant changes
        except Exception:
            return []

    def solve_linear_equation(self, equation_str: str, variable: str = 'x') -> List[EquationStep]:
        """
        Solve linear equation step by step

        Args:
            equation_str: Equation like "2*x + 5 = 13"
            variable: Variable to solve for

        Returns:
            List of EquationStep objects showing solution process
        """
        from sympy import Eq, solve

        self.steps = []

        try:
            # Parse equation (handle = sign)
            left, right = equation_str.split('=')
            left_expr = self.parse_equation(left.strip())
            right_expr = self.parse_equation(right.strip())

            # Create equation
            equation = Eq(left_expr, right_expr)

            # Add initial step
            self.steps.append(EquationStep(
                equation=self.to_latex(equation),
                description="주어진 방정식 (Given equation)",
                rule="입력 (Input)",
                delay=0,
            ))

            # Solve
            x = Symbol(variable)
            solution = solve(equation, x)

            if solution:
                solution_latex = f"{variable} = {latex(solution[0])}"
                self.steps.append(EquationStep(
                    equation=solution_latex,
                    description=f"{variable}의 값을 구합니다 (Solve for {variable})",
                    rule="방정식 풀이 (Equation solving)",
                    changed_elements=[variable],
                ))

            return self.steps

        except Exception as e:
            raise ValueError(f"Failed to solve equation: {str(e)}")


# Example usage
if __name__ == "__main__":
    simplifier = EquationSimplifier()

    # Test 1: Simplify polynomial
    print("=== Test 1: Simplify polynomial ===")
    steps = simplifier.simplify_with_steps("(x + 2) * (x + 3)")
    for i, step in enumerate(steps):
        print(f"Step {i + 1}: {step.equation}")
        print(f"  Description: {step.description}")
        print(f"  Rule: {step.rule}")
        print()

    # Test 2: Solve equation
    print("=== Test 2: Solve equation ===")
    steps = simplifier.solve_linear_equation("2*x + 5 = 13")
    for i, step in enumerate(steps):
        print(f"Step {i + 1}: {step.equation}")
        print(f"  Description: {step.description}")
        print(f"  Rule: {step.rule}")
        print()
