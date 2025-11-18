"""
Graph Generator Module
Generates graph data for derivatives with appropriate styling
"""

from typing import Dict, List, Tuple, Any, Optional
import numpy as np
from .derivatives import DerivativeCalculator
from .visualization import LineStyleManager


class GraphGenerator:
    """
    Generate graph data for derivatives with visual styling
    Combines derivative calculations with line style management
    """

    def __init__(self):
        self.derivative_calc = DerivativeCalculator()
        self.style_manager = LineStyleManager()

    def generate_graph_data(
        self,
        function_str: str,
        max_order: int = 4,
        domain: Tuple[float, float] = (-10, 10),
        num_points: int = 500,
        color_scheme: str = 'professional',
        visible_orders: Optional[List[int]] = None
    ) -> Dict[str, Any]:
        """
        Generate complete graph data with styling for all derivatives

        Args:
            function_str: String representation of the function
            max_order: Maximum derivative order to calculate
            domain: Tuple of (min_x, max_x) for the graph domain
            num_points: Number of points to plot
            color_scheme: Color scheme to use for lines
            visible_orders: List of derivative orders to show (None = all)

        Returns:
            Dictionary containing:
            - datasets: List of dataset objects for each derivative
            - x_values: Array of x coordinates
            - metadata: Graph configuration and metadata
            - legend: Legend configuration
            - styles: Style configuration for each derivative

        Examples:
            >>> generator = GraphGenerator()
            >>> data = generator.generate_graph_data("x**3 - 2*x**2 + x", max_order=2)
        """
        # Get derivative information
        derivative_info = self.derivative_calc.get_derivative_info(
            function_str,
            max_order=max_order,
            domain=domain,
            num_points=num_points
        )

        # Get styles for all derivatives
        all_styles = self.style_manager.get_all_styles(max_order, color_scheme)

        # Determine which orders to show
        if visible_orders is None:
            visible_orders = list(derivative_info['symbolic'].keys())

        # Build datasets for each derivative
        datasets = []
        for order in sorted(visible_orders):
            if order not in derivative_info['symbolic']:
                continue

            style = all_styles[order]

            dataset = {
                'label': style['label'],
                'symbol': style['symbol'],
                'order': order,
                'data': derivative_info['numerical'][order],
                'expression': derivative_info['symbolic'][order],
                'style': {
                    'color': style['color'],
                    'line_style': style['line_style'],
                    'line_width': style['line_width'],
                    'dash_pattern': style.get('dash_pattern'),
                    'svg_dasharray': self.style_manager.get_svg_stroke_dasharray(order)
                }
            }

            datasets.append(dataset)

        # Find critical points for the original function
        critical_points = self.derivative_calc.find_critical_points(function_str, domain)

        # Build complete result
        result = {
            'datasets': datasets,
            'x_values': derivative_info['x_values'],
            'metadata': {
                'function': function_str,
                'max_order': max_order,
                'domain': domain,
                'num_points': num_points,
                'color_scheme': color_scheme,
                'visible_orders': visible_orders,
                'critical_points': critical_points.get('critical_points', []),
                'inflection_points': critical_points.get('inflection_points', [])
            },
            'legend': self.style_manager.get_legend_config(visible_orders),
            'styles': all_styles
        }

        return result

    def calculate_y_bounds(
        self,
        datasets: List[Dict[str, Any]],
        percentile: float = 95
    ) -> Tuple[float, float]:
        """
        Calculate appropriate y-axis bounds based on data

        Args:
            datasets: List of dataset dictionaries
            percentile: Percentile to use for clipping outliers

        Returns:
            Tuple of (y_min, y_max)

        Examples:
            >>> generator = GraphGenerator()
            >>> data = generator.generate_graph_data("x**2")
            >>> y_min, y_max = generator.calculate_y_bounds(data['datasets'])
        """
        all_values = []

        for dataset in datasets:
            y_values = np.array(dataset['data'])
            # Filter out NaN and infinite values
            finite_values = y_values[np.isfinite(y_values)]
            if len(finite_values) > 0:
                all_values.extend(finite_values)

        if not all_values:
            return (-10, 10)

        all_values = np.array(all_values)

        # Use percentiles to handle outliers
        y_min = np.percentile(all_values, 100 - percentile)
        y_max = np.percentile(all_values, percentile)

        # Add some padding
        padding = (y_max - y_min) * 0.1
        y_min -= padding
        y_max += padding

        return (float(y_min), float(y_max))

    def generate_grid_config(
        self,
        domain: Tuple[float, float],
        y_bounds: Tuple[float, float]
    ) -> Dict[str, Any]:
        """
        Generate grid configuration for the graph

        Args:
            domain: X-axis domain
            y_bounds: Y-axis bounds

        Returns:
            Grid configuration dictionary
        """
        x_min, x_max = domain
        y_min, y_max = y_bounds

        # Calculate reasonable tick intervals
        x_range = x_max - x_min
        y_range = y_max - y_min

        x_interval = self._calculate_tick_interval(x_range)
        y_interval = self._calculate_tick_interval(y_range)

        return {
            'x_axis': {
                'min': x_min,
                'max': x_max,
                'interval': x_interval,
                'label': 'x'
            },
            'y_axis': {
                'min': y_min,
                'max': y_max,
                'interval': y_interval,
                'label': 'y'
            },
            'show_grid': True,
            'show_axes': True,
            'grid_color': '#E0E0E0',
            'axis_color': '#000000'
        }

    def _calculate_tick_interval(self, range_value: float) -> float:
        """
        Calculate appropriate tick interval for axis

        Args:
            range_value: The range of the axis

        Returns:
            Appropriate tick interval
        """
        # Target approximately 10 ticks
        raw_interval = range_value / 10

        # Round to nice number
        magnitude = 10 ** np.floor(np.log10(raw_interval))
        normalized = raw_interval / magnitude

        if normalized <= 1:
            nice_interval = 1
        elif normalized <= 2:
            nice_interval = 2
        elif normalized <= 5:
            nice_interval = 5
        else:
            nice_interval = 10

        return nice_interval * magnitude

    def export_for_frontend(
        self,
        function_str: str,
        max_order: int = 4,
        domain: Tuple[float, float] = (-10, 10),
        num_points: int = 500,
        color_scheme: str = 'professional'
    ) -> Dict[str, Any]:
        """
        Export complete graph configuration ready for frontend rendering

        Args:
            function_str: Function to graph
            max_order: Maximum derivative order
            domain: Graph domain
            num_points: Number of points to plot
            color_scheme: Color scheme to use

        Returns:
            Complete graph configuration for frontend

        Examples:
            >>> generator = GraphGenerator()
            >>> config = generator.export_for_frontend("x**3 - 3*x**2 + 2*x")
            >>> # This can be directly sent to the frontend as JSON
        """
        # Generate graph data
        graph_data = self.generate_graph_data(
            function_str,
            max_order=max_order,
            domain=domain,
            num_points=num_points,
            color_scheme=color_scheme
        )

        # Calculate appropriate y bounds
        y_bounds = self.calculate_y_bounds(graph_data['datasets'])

        # Generate grid configuration
        grid_config = self.generate_grid_config(domain, y_bounds)

        # Combine everything
        result = {
            'datasets': graph_data['datasets'],
            'x_values': graph_data['x_values'],
            'grid': grid_config,
            'legend': graph_data['legend'],
            'metadata': graph_data['metadata'],
            'styles': graph_data['styles']
        }

        return result


if __name__ == "__main__":
    # Example usage
    print("=== Testing Graph Generator ===\n")

    generator = GraphGenerator()

    # Test with a cubic function
    function = "x**3 - 3*x**2 + 2*x + 1"
    print(f"Function: {function}\n")

    # Generate graph data
    graph_data = generator.generate_graph_data(
        function,
        max_order=3,
        domain=(-2, 4),
        num_points=100
    )

    print("Datasets generated:")
    for dataset in graph_data['datasets']:
        print(f"  {dataset['label']}: {dataset['expression']}")
        print(f"    Color: {dataset['style']['color']}")
        print(f"    Line Style: {dataset['style']['line_style']}")

    print(f"\nCritical points: {graph_data['metadata']['critical_points']}")
    print(f"Inflection points: {graph_data['metadata']['inflection_points']}")

    print("\n" + "="*50 + "\n")

    # Calculate y bounds
    y_bounds = generator.calculate_y_bounds(graph_data['datasets'])
    print(f"Y bounds: {y_bounds}")

    # Generate grid config
    grid_config = generator.generate_grid_config((-2, 4), y_bounds)
    print(f"\nGrid configuration:")
    print(f"  X-axis: {grid_config['x_axis']}")
    print(f"  Y-axis: {grid_config['y_axis']}")
