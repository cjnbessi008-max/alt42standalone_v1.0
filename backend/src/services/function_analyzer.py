"""
Function Analyzer Service
Analyzes mathematical functions to determine intervals with specific properties
"""
import numpy as np
from sympy import symbols, sympify, diff, solve, lambdify
from sympy.calculus.util import continuous_domain
from sympy.sets import Interval as SympyInterval
from typing import List, Dict, Tuple
import warnings

warnings.filterwarnings('ignore')

class FunctionAnalyzer:
    """Analyzes mathematical functions and identifies intervals with specific properties"""

    # Color scheme for different properties
    COLOR_SCHEME = {
        "increasing": "#4CAF50",      # Green
        "decreasing": "#F44336",      # Red
        "concave_up": "#2196F3",      # Blue
        "concave_down": "#FF9800",    # Orange
        "positive": "#9C27B0",        # Purple
        "negative": "#795548",        # Brown
    }

    PROPERTY_DESCRIPTIONS = {
        "increasing": "증가 구간 (Increasing)",
        "decreasing": "감소 구간 (Decreasing)",
        "concave_up": "아래로 볼록 (Concave Up)",
        "concave_down": "위로 볼록 (Concave Down)",
        "positive": "양수 구간 (Positive)",
        "negative": "음수 구간 (Negative)",
    }

    def __init__(self):
        self.x = symbols('x')

    def analyze(self, expression: str, x_min: float, x_max: float,
                properties: List[str]) -> Dict:
        """
        Main analysis function

        Args:
            expression: Mathematical expression as string (e.g., "x**2 - 4*x + 3")
            x_min: Minimum x value for analysis
            x_max: Maximum x value for analysis
            properties: List of properties to analyze

        Returns:
            Dictionary with intervals, plot points, and derivatives
        """
        # Parse expression
        try:
            f = sympify(expression)
        except Exception as e:
            raise ValueError(f"Invalid expression: {e}")

        # Calculate derivatives
        f_prime = diff(f, self.x)
        f_double_prime = diff(f_prime, self.x)

        # Generate plot points
        plot_points = self._generate_plot_points(f, x_min, x_max)

        # Analyze intervals for each requested property
        intervals = []

        if "increasing" in properties or "decreasing" in properties:
            intervals.extend(self._analyze_monotonicity(f_prime, x_min, x_max))

        if "concave_up" in properties or "concave_down" in properties:
            intervals.extend(self._analyze_concavity(f_double_prime, x_min, x_max))

        if "positive" in properties or "negative" in properties:
            intervals.extend(self._analyze_sign(f, x_min, x_max))

        return {
            "expression": expression,
            "intervals": intervals,
            "plot_points": plot_points,
            "derivative": str(f_prime),
            "second_derivative": str(f_double_prime)
        }

    def _generate_plot_points(self, f, x_min: float, x_max: float,
                             num_points: int = 200) -> List[Dict[str, float]]:
        """Generate points for plotting the function"""
        try:
            f_lambda = lambdify(self.x, f, 'numpy')
            x_vals = np.linspace(x_min, x_max, num_points)
            y_vals = f_lambda(x_vals)

            # Handle potential NaN or inf values
            valid_indices = np.isfinite(y_vals)
            x_vals = x_vals[valid_indices]
            y_vals = y_vals[valid_indices]

            return [{"x": float(x), "y": float(y)} for x, y in zip(x_vals, y_vals)]
        except Exception as e:
            raise ValueError(f"Error generating plot points: {e}")

    def _analyze_monotonicity(self, f_prime, x_min: float, x_max: float) -> List[Dict]:
        """Analyze increasing/decreasing intervals using first derivative"""
        intervals = []

        try:
            # Find critical points (where f'(x) = 0 or undefined)
            critical_points = self._find_critical_points(f_prime, x_min, x_max)

            # Test intervals between critical points
            test_points = [x_min] + critical_points + [x_max]
            f_prime_lambda = lambdify(self.x, f_prime, 'numpy')

            for i in range(len(test_points) - 1):
                start = test_points[i]
                end = test_points[i + 1]
                mid = (start + end) / 2

                try:
                    derivative_value = float(f_prime_lambda(mid))

                    if derivative_value > 0.001:  # Increasing
                        intervals.append({
                            "start": float(start),
                            "end": float(end),
                            "property": "increasing",
                            "color": self.COLOR_SCHEME["increasing"],
                            "description": self.PROPERTY_DESCRIPTIONS["increasing"]
                        })
                    elif derivative_value < -0.001:  # Decreasing
                        intervals.append({
                            "start": float(start),
                            "end": float(end),
                            "property": "decreasing",
                            "color": self.COLOR_SCHEME["decreasing"],
                            "description": self.PROPERTY_DESCRIPTIONS["decreasing"]
                        })
                except:
                    continue

        except Exception as e:
            print(f"Error in monotonicity analysis: {e}")

        return intervals

    def _analyze_concavity(self, f_double_prime, x_min: float, x_max: float) -> List[Dict]:
        """Analyze concave up/down intervals using second derivative"""
        intervals = []

        try:
            # Find inflection points (where f''(x) = 0 or undefined)
            inflection_points = self._find_critical_points(f_double_prime, x_min, x_max)

            # Test intervals between inflection points
            test_points = [x_min] + inflection_points + [x_max]
            f_double_prime_lambda = lambdify(self.x, f_double_prime, 'numpy')

            for i in range(len(test_points) - 1):
                start = test_points[i]
                end = test_points[i + 1]
                mid = (start + end) / 2

                try:
                    second_derivative_value = float(f_double_prime_lambda(mid))

                    if second_derivative_value > 0.001:  # Concave up
                        intervals.append({
                            "start": float(start),
                            "end": float(end),
                            "property": "concave_up",
                            "color": self.COLOR_SCHEME["concave_up"],
                            "description": self.PROPERTY_DESCRIPTIONS["concave_up"]
                        })
                    elif second_derivative_value < -0.001:  # Concave down
                        intervals.append({
                            "start": float(start),
                            "end": float(end),
                            "property": "concave_down",
                            "color": self.COLOR_SCHEME["concave_down"],
                            "description": self.PROPERTY_DESCRIPTIONS["concave_down"]
                        })
                except:
                    continue

        except Exception as e:
            print(f"Error in concavity analysis: {e}")

        return intervals

    def _analyze_sign(self, f, x_min: float, x_max: float) -> List[Dict]:
        """Analyze positive/negative intervals"""
        intervals = []

        try:
            # Find roots (where f(x) = 0)
            roots = self._find_critical_points(f, x_min, x_max)

            # Test intervals between roots
            test_points = [x_min] + roots + [x_max]
            f_lambda = lambdify(self.x, f, 'numpy')

            for i in range(len(test_points) - 1):
                start = test_points[i]
                end = test_points[i + 1]
                mid = (start + end) / 2

                try:
                    value = float(f_lambda(mid))

                    if value > 0.001:  # Positive
                        intervals.append({
                            "start": float(start),
                            "end": float(end),
                            "property": "positive",
                            "color": self.COLOR_SCHEME["positive"],
                            "description": self.PROPERTY_DESCRIPTIONS["positive"]
                        })
                    elif value < -0.001:  # Negative
                        intervals.append({
                            "start": float(start),
                            "end": float(end),
                            "property": "negative",
                            "color": self.COLOR_SCHEME["negative"],
                            "description": self.PROPERTY_DESCRIPTIONS["negative"]
                        })
                except:
                    continue

        except Exception as e:
            print(f"Error in sign analysis: {e}")

        return intervals

    def _find_critical_points(self, expr, x_min: float, x_max: float) -> List[float]:
        """Find critical points (roots or undefined points) within range"""
        try:
            solutions = solve(expr, self.x)

            # Filter to real solutions within range
            critical_points = []
            for sol in solutions:
                try:
                    val = float(sol.evalf())
                    if x_min < val < x_max and np.isfinite(val):
                        critical_points.append(val)
                except:
                    continue

            return sorted(critical_points)
        except:
            return []
