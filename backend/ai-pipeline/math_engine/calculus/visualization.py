"""
Line Style Manager for Higher Derivative Lines
Defines different visual styles for each derivative order
"""

from typing import Dict, List, Tuple, Any
from enum import Enum


class LineStyle(Enum):
    """Enumeration of available line styles"""
    SOLID = "solid"
    DASHED = "dashed"
    DOTTED = "dotted"
    DASHDOT = "dashdot"
    LONGDASH = "longdash"
    DASHDOTDOT = "dashdotdot"


class LineStyleManager:
    """
    Manages visual styling for different derivative orders
    Each derivative order gets a unique line style and color
    """

    def __init__(self):
        # Define line styles for each derivative order
        self.derivative_styles = {
            0: {  # Original function f(x)
                'line_style': LineStyle.SOLID.value,
                'line_width': 3,
                'color': '#2C3E50',  # Dark blue-gray
                'dash_pattern': None,
                'label': 'f(x)',
                'symbol': 'f(x)'
            },
            1: {  # First derivative f'(x)
                'line_style': LineStyle.DASHED.value,
                'line_width': 2.5,
                'color': '#E74C3C',  # Red
                'dash_pattern': [10, 5],  # 10px dash, 5px gap
                'label': "f'(x)",
                'symbol': "f'(x)"
            },
            2: {  # Second derivative f''(x)
                'line_style': LineStyle.DOTTED.value,
                'line_width': 2.5,
                'color': '#3498DB',  # Blue
                'dash_pattern': [2, 3],  # 2px dot, 3px gap
                'label': "f''(x)",
                'symbol': "f''(x)"
            },
            3: {  # Third derivative f'''(x)
                'line_style': LineStyle.DASHDOT.value,
                'line_width': 2,
                'color': '#2ECC71',  # Green
                'dash_pattern': [10, 5, 2, 5],  # dash-dot pattern
                'label': "f'''(x)",
                'symbol': "f'''(x)"
            },
            4: {  # Fourth derivative f''''(x)
                'line_style': LineStyle.DASHDOTDOT.value,
                'line_width': 2,
                'color': '#9B59B6',  # Purple
                'dash_pattern': [10, 5, 2, 5, 2, 5],  # dash-dot-dot pattern
                'label': "f''''(x)",
                'symbol': "f⁽⁴⁾(x)"
            },
            5: {  # Fifth derivative and beyond
                'line_style': LineStyle.LONGDASH.value,
                'line_width': 2,
                'color': '#F39C12',  # Orange
                'dash_pattern': [15, 5],  # long dash pattern
                'label': "f⁽⁵⁾(x)",
                'symbol': "f⁽⁵⁾(x)"
            }
        }

        # Alternative color schemes
        self.color_schemes = {
            'vibrant': ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'],
            'pastel': ['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#FFDFBA', '#E0BBE4'],
            'professional': ['#2C3E50', '#E74C3C', '#3498DB', '#2ECC71', '#9B59B6', '#F39C12'],
            'monochrome': ['#000000', '#404040', '#808080', '#A0A0A0', '#C0C0C0', '#E0E0E0'],
            'colorblind_friendly': ['#000000', '#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2']
        }

    def get_style(self, derivative_order: int, color_scheme: str = 'professional') -> Dict[str, Any]:
        """
        Get the visual style for a specific derivative order

        Args:
            derivative_order: The order of the derivative (0 for original function)
            color_scheme: Color scheme to use ('vibrant', 'pastel', 'professional', etc.)

        Returns:
            Dictionary containing style properties

        Examples:
            >>> manager = LineStyleManager()
            >>> style = manager.get_style(1)  # First derivative
            >>> print(style['line_style'])  # 'dashed'
            >>> print(style['color'])  # '#E74C3C'
        """
        # Use the defined style if available, otherwise use a default
        if derivative_order in self.derivative_styles:
            style = self.derivative_styles[derivative_order].copy()
        else:
            # For higher orders, cycle through available styles
            base_order = derivative_order % 6
            style = self.derivative_styles.get(base_order, self.derivative_styles[5]).copy()
            style['label'] = f"f⁽{derivative_order}⁾(x)"
            style['symbol'] = f"f⁽{derivative_order}⁾(x)"

        # Apply color scheme
        if color_scheme in self.color_schemes:
            colors = self.color_schemes[color_scheme]
            color_index = derivative_order % len(colors)
            style['color'] = colors[color_index]

        return style

    def get_all_styles(
        self,
        max_order: int = 4,
        color_scheme: str = 'professional'
    ) -> Dict[int, Dict[str, Any]]:
        """
        Get styles for all derivative orders up to max_order

        Args:
            max_order: Maximum derivative order
            color_scheme: Color scheme to use

        Returns:
            Dictionary mapping derivative order to style configuration

        Examples:
            >>> manager = LineStyleManager()
            >>> styles = manager.get_all_styles(max_order=3)
            >>> for order, style in styles.items():
            ...     print(f"{style['label']}: {style['line_style']}")
        """
        return {
            order: self.get_style(order, color_scheme)
            for order in range(max_order + 1)
        }

    def get_legend_config(self, derivative_orders: List[int]) -> List[Dict[str, str]]:
        """
        Get legend configuration for specified derivative orders

        Args:
            derivative_orders: List of derivative orders to include in legend

        Returns:
            List of legend entries with label, color, and line style

        Examples:
            >>> manager = LineStyleManager()
            >>> legend = manager.get_legend_config([0, 1, 2])
            >>> print(legend)
            [
                {'label': 'f(x)', 'color': '#2C3E50', 'line_style': 'solid'},
                {'label': "f'(x)", 'color': '#E74C3C', 'line_style': 'dashed'},
                ...
            ]
        """
        legend_entries = []

        for order in sorted(derivative_orders):
            style = self.get_style(order)
            legend_entries.append({
                'label': style['label'],
                'symbol': style['symbol'],
                'color': style['color'],
                'line_style': style['line_style'],
                'line_width': style['line_width']
            })

        return legend_entries

    def get_svg_stroke_dasharray(self, derivative_order: int) -> str:
        """
        Get SVG-compatible stroke-dasharray value for a derivative order

        Args:
            derivative_order: The order of the derivative

        Returns:
            SVG stroke-dasharray string (e.g., "10,5" for dashed line)

        Examples:
            >>> manager = LineStyleManager()
            >>> dasharray = manager.get_svg_stroke_dasharray(1)  # First derivative
            >>> print(dasharray)  # "10,5"
        """
        style = self.get_style(derivative_order)
        dash_pattern = style.get('dash_pattern')

        if dash_pattern is None or style['line_style'] == LineStyle.SOLID.value:
            return "none"

        return ",".join(str(d) for d in dash_pattern)

    def get_css_border_style(self, derivative_order: int) -> str:
        """
        Get CSS border-style value for a derivative order

        Args:
            derivative_order: The order of the derivative

        Returns:
            CSS border-style string

        Examples:
            >>> manager = LineStyleManager()
            >>> css_style = manager.get_css_border_style(2)
            >>> print(css_style)  # "dotted"
        """
        style = self.get_style(derivative_order)
        return style['line_style']

    def export_config(self, max_order: int = 4) -> Dict[str, Any]:
        """
        Export complete configuration for frontend consumption

        Args:
            max_order: Maximum derivative order to include

        Returns:
            Complete configuration dictionary ready for JSON serialization

        Examples:
            >>> manager = LineStyleManager()
            >>> config = manager.export_config(max_order=3)
            >>> import json
            >>> json_config = json.dumps(config, indent=2)
        """
        return {
            'styles': self.get_all_styles(max_order),
            'color_schemes': self.color_schemes,
            'line_styles': {style.name: style.value for style in LineStyle},
            'metadata': {
                'max_order': max_order,
                'default_color_scheme': 'professional'
            }
        }


if __name__ == "__main__":
    # Example usage
    print("=== Testing Line Style Manager ===\n")

    manager = LineStyleManager()

    # Get style for each derivative order
    print("Derivative Styles:")
    for order in range(5):
        style = manager.get_style(order)
        print(f"\n{style['label']}:")
        print(f"  Line Style: {style['line_style']}")
        print(f"  Color: {style['color']}")
        print(f"  Width: {style['line_width']}")
        print(f"  SVG Dash: {manager.get_svg_stroke_dasharray(order)}")

    print("\n" + "="*50 + "\n")

    # Get legend configuration
    legend = manager.get_legend_config([0, 1, 2, 3])
    print("Legend Configuration:")
    for entry in legend:
        print(f"  {entry['symbol']}: {entry['color']} ({entry['line_style']})")

    print("\n" + "="*50 + "\n")

    # Export complete configuration
    config = manager.export_config(max_order=4)
    print(f"Available color schemes: {list(config['color_schemes'].keys())}")
    print(f"Available line styles: {list(config['line_styles'].keys())}")
