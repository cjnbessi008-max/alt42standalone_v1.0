"""
Derivative Calculator Module
Calculates higher-order derivatives using symbolic computation
"""

from typing import List, Dict, Any, Optional, Tuple
import sympy as sp
import numpy as np
from sympy import symbols, sympify, lambdify, diff
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application


class DerivativeCalculator:
    """
    Calculate higher-order derivatives of mathematical functions
    Supports both symbolic and numerical computation
    """

    def __init__(self):
        self.x = symbols('x')
        self.transformations = standard_transformations + (implicit_multiplication_application,)

    def parse_function(self, function_str: str) -> sp.Expr:
        """
        Parse a string representation of a function into a SymPy expression

        Args:
            function_str: String representation of the function (e.g., "x**2 + 3*x + 1")

        Returns:
            SymPy expression object

        Examples:
            >>> calc = DerivativeCalculator()
            >>> calc.parse_function("x^2 + 2x + 1")
            x**2 + 2*x + 1
        """
        try:
            # Replace ^ with ** for power operations
            function_str = function_str.replace('^', '**')

            # Parse the expression
            expr = parse_expr(function_str, transformations=self.transformations)
            return expr
        except Exception as e:
            raise ValueError(f"Failed to parse function: {function_str}. Error: {str(e)}")

    def calculate_derivatives(self, function_str: str, max_order: int = 4) -> Dict[int, sp.Expr]:
        """
        Calculate derivatives up to the specified order

        Args:
            function_str: String representation of the function
            max_order: Maximum derivative order to calculate (default: 4)

        Returns:
            Dictionary mapping derivative order to SymPy expression
            {0: f(x), 1: f'(x), 2: f''(x), ...}

        Examples:
            >>> calc = DerivativeCalculator()
            >>> derivatives = calc.calculate_derivatives("x**3 + 2*x**2 + x", max_order=2)
            >>> print(derivatives[0])  # Original function
            x**3 + 2*x**2 + x
            >>> print(derivatives[1])  # First derivative
            3*x**2 + 4*x + 1
            >>> print(derivatives[2])  # Second derivative
            6*x + 4
        """
        expr = self.parse_function(function_str)
        derivatives = {0: expr}

        current_expr = expr
        for order in range(1, max_order + 1):
            try:
                current_expr = diff(current_expr, self.x)
                derivatives[order] = current_expr

                # Stop if derivative becomes zero
                if current_expr == 0:
                    break
            except Exception as e:
                print(f"Warning: Failed to calculate derivative of order {order}: {str(e)}")
                break

        return derivatives

    def evaluate_at_points(
        self,
        derivatives: Dict[int, sp.Expr],
        x_values: np.ndarray
    ) -> Dict[int, np.ndarray]:
        """
        Evaluate derivatives at specific x values

        Args:
            derivatives: Dictionary of derivative expressions
            x_values: Array of x values to evaluate

        Returns:
            Dictionary mapping derivative order to y values

        Examples:
            >>> calc = DerivativeCalculator()
            >>> derivatives = calc.calculate_derivatives("x**2")
            >>> x_vals = np.linspace(-5, 5, 100)
            >>> y_vals = calc.evaluate_at_points(derivatives, x_vals)
        """
        evaluated = {}

        for order, expr in derivatives.items():
            try:
                # Convert SymPy expression to numerical function
                func = lambdify(self.x, expr, modules=['numpy'])

                # Evaluate at all x values
                y_values = func(x_values)

                # Handle potential numerical issues
                if isinstance(y_values, np.ndarray):
                    # Replace infinities and NaNs with None for JSON serialization
                    y_values = np.where(np.isfinite(y_values), y_values, np.nan)

                evaluated[order] = y_values
            except Exception as e:
                print(f"Warning: Failed to evaluate derivative of order {order}: {str(e)}")
                evaluated[order] = np.full_like(x_values, np.nan)

        return evaluated

    def get_derivative_info(
        self,
        function_str: str,
        max_order: int = 4,
        domain: Tuple[float, float] = (-10, 10),
        num_points: int = 500
    ) -> Dict[str, Any]:
        """
        Get comprehensive derivative information including symbolic and numerical data

        Args:
            function_str: String representation of the function
            max_order: Maximum derivative order (default: 4)
            domain: Tuple of (min_x, max_x) for evaluation domain
            num_points: Number of points to evaluate

        Returns:
            Dictionary containing:
            - symbolic: Symbolic expressions for each derivative
            - numerical: Numerical values at evaluation points
            - x_values: Array of x values used for evaluation
            - metadata: Additional information

        Examples:
            >>> calc = DerivativeCalculator()
            >>> info = calc.get_derivative_info("x**3 - 3*x**2 + 2*x", max_order=3)
        """
        # Calculate symbolic derivatives
        derivatives = self.calculate_derivatives(function_str, max_order)

        # Generate evaluation points
        x_values = np.linspace(domain[0], domain[1], num_points)

        # Evaluate at points
        numerical_values = self.evaluate_at_points(derivatives, x_values)

        # Prepare result
        result = {
            'symbolic': {
                order: str(expr) for order, expr in derivatives.items()
            },
            'numerical': {
                order: values.tolist() for order, values in numerical_values.items()
            },
            'x_values': x_values.tolist(),
            'metadata': {
                'function': function_str,
                'max_order': max_order,
                'domain': domain,
                'num_points': num_points,
                'actual_orders': list(derivatives.keys())
            }
        }

        return result

    def find_critical_points(self, function_str: str, domain: Tuple[float, float] = (-10, 10)) -> Dict[str, List[float]]:
        """
        Find critical points (where first derivative = 0) and inflection points (where second derivative = 0)

        Args:
            function_str: String representation of the function
            domain: Domain to search for critical points

        Returns:
            Dictionary with 'critical_points' and 'inflection_points'
        """
        derivatives = self.calculate_derivatives(function_str, max_order=2)

        result = {
            'critical_points': [],
            'inflection_points': []
        }

        try:
            # Find critical points (f'(x) = 0)
            if 1 in derivatives:
                critical_solutions = sp.solve(derivatives[1], self.x)
                result['critical_points'] = [
                    float(sol.evalf()) for sol in critical_solutions
                    if sol.is_real and domain[0] <= float(sol.evalf()) <= domain[1]
                ]

            # Find inflection points (f''(x) = 0)
            if 2 in derivatives:
                inflection_solutions = sp.solve(derivatives[2], self.x)
                result['inflection_points'] = [
                    float(sol.evalf()) for sol in inflection_solutions
                    if sol.is_real and domain[0] <= float(sol.evalf()) <= domain[1]
                ]
        except Exception as e:
            print(f"Warning: Failed to find critical/inflection points: {str(e)}")

        return result


if __name__ == "__main__":
    # Example usage
    calc = DerivativeCalculator()

    # Test with a polynomial function
    print("=== Testing Derivative Calculator ===\n")

    function = "x**3 - 3*x**2 + 2*x + 1"
    print(f"Function: {function}\n")

    # Calculate derivatives
    derivatives = calc.calculate_derivatives(function, max_order=4)
    print("Derivatives:")
    for order, expr in derivatives.items():
        order_name = ["f(x)", "f'(x)", "f''(x)", "f'''(x)", "f''''(x)"][order]
        print(f"  {order_name} = {expr}")

    print("\n" + "="*50 + "\n")

    # Get comprehensive info
    info = calc.get_derivative_info(function, max_order=3)
    print(f"Symbolic derivatives: {info['symbolic']}")

    # Find critical points
    critical = calc.find_critical_points(function)
    print(f"\nCritical points: {critical['critical_points']}")
    print(f"Inflection points: {critical['inflection_points']}")
