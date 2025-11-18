import math
import random
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)


class VisualizationGenerator:
    """
    Generate visualization data for keyword bubbles
    """

    # Color scheme for keyword types
    COLORS = {
        'concept': '#4A90E2',      # Blue
        'operation': '#7ED321',    # Green
        'entity': '#F5A623',       # Orange
        'attribute': '#BD10E0',    # Purple
    }

    def __init__(self, width: int = 1200, height: int = 800):
        self.width = width
        self.height = height

    def generate(
        self,
        keywords: List[Dict],
        relationships: List[Dict],
    ) -> Dict:
        """
        Generate bubble visualization data

        Args:
            keywords: List of keyword dictionaries
            relationships: List of relationship dictionaries

        Returns:
            Dictionary with nodes and links for D3.js visualization
        """
        if not keywords:
            return {'nodes': [], 'links': []}

        # Generate bubble nodes
        nodes = self._generate_nodes(keywords)

        # Generate links
        links = self._generate_links(relationships, keywords)

        return {
            'nodes': nodes,
            'links': links,
        }

    def _generate_nodes(self, keywords: List[Dict]) -> List[Dict]:
        """Generate bubble nodes with positions and sizes"""
        nodes = []

        # Calculate radius based on importance score
        # Min radius: 20, Max radius: 80
        min_radius = 20
        max_radius = 80

        # Find min/max importance for normalization
        if keywords:
            min_importance = min(kw['importance_score'] for kw in keywords)
            max_importance = max(kw['importance_score'] for kw in keywords)
            importance_range = max_importance - min_importance or 1
        else:
            min_importance = 0
            max_importance = 1
            importance_range = 1

        for kw in keywords:
            # Normalize importance to radius
            normalized = (kw['importance_score'] - min_importance) / importance_range
            radius = min_radius + (normalized * (max_radius - min_radius))

            # Get color based on type
            color = self.COLORS.get(kw['keyword_type'], '#9013FE')

            # Initial position (will be adjusted by D3 force simulation)
            # Start with a circular arrangement
            angle = random.uniform(0, 2 * math.pi)
            distance = random.uniform(100, 300)
            x = self.width / 2 + distance * math.cos(angle)
            y = self.height / 2 + distance * math.sin(angle)

            nodes.append({
                **kw,  # Include all keyword properties
                'x': x,
                'y': y,
                'radius': round(radius, 2),
                'color': color,
            })

        return nodes

    def _generate_links(
        self,
        relationships: List[Dict],
        keywords: List[Dict],
    ) -> List[Dict]:
        """Generate links between nodes"""
        if not relationships:
            return []

        # Create a map of keyword IDs for quick lookup
        keyword_ids = {kw['id'] for kw in keywords}

        links = []
        for rel in relationships:
            # Only include links where both nodes exist
            if (rel['source_keyword_id'] in keyword_ids and
                rel['target_keyword_id'] in keyword_ids):

                links.append({
                    'source': rel['source_keyword_id'],
                    'target': rel['target_keyword_id'],
                    'strength': rel['strength'],
                    'relationship_type': rel['relationship_type'],
                })

        return links

    def calculate_layout(
        self,
        nodes: List[Dict],
        links: List[Dict],
        algorithm: str = 'force',
    ) -> List[Dict]:
        """
        Calculate optimal layout for nodes

        Args:
            nodes: List of node dictionaries
            links: List of link dictionaries
            algorithm: Layout algorithm ('force', 'circular', 'hierarchical')

        Returns:
            Updated nodes with new positions
        """
        if algorithm == 'circular':
            return self._circular_layout(nodes)
        elif algorithm == 'hierarchical':
            return self._hierarchical_layout(nodes, links)
        else:
            # Force-directed layout is handled by D3.js on frontend
            return nodes

    def _circular_layout(self, nodes: List[Dict]) -> List[Dict]:
        """Arrange nodes in a circle"""
        n = len(nodes)
        if n == 0:
            return nodes

        radius = min(self.width, self.height) / 3
        center_x = self.width / 2
        center_y = self.height / 2

        for i, node in enumerate(nodes):
            angle = (2 * math.pi * i) / n
            node['x'] = center_x + radius * math.cos(angle)
            node['y'] = center_y + radius * math.sin(angle)

        return nodes

    def _hierarchical_layout(self, nodes: List[Dict], links: List[Dict]) -> List[Dict]:
        """Arrange nodes in a hierarchy based on importance"""
        # Sort nodes by importance
        sorted_nodes = sorted(nodes, key=lambda n: n['importance_score'], reverse=True)

        # Assign levels based on importance
        levels = 3  # Number of hierarchical levels
        nodes_per_level = [[] for _ in range(levels)]

        for i, node in enumerate(sorted_nodes):
            level = min(i * levels // len(sorted_nodes), levels - 1)
            nodes_per_level[level].append(node)

        # Position nodes
        level_height = self.height / (levels + 1)

        for level, level_nodes in enumerate(nodes_per_level):
            y = level_height * (level + 1)
            n = len(level_nodes)

            for i, node in enumerate(level_nodes):
                x = self.width * (i + 1) / (n + 1)
                node['x'] = x
                node['y'] = y

        return sorted_nodes
