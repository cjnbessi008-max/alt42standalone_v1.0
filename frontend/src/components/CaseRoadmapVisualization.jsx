import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Box, Paper, Typography } from '@mui/material';

const CaseRoadmapVisualization = ({ roadmapData }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!roadmapData || !svgRef.current) return;

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll('*').remove();

    const width = 1000;
    const height = 600;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    // Define stage positions
    const stageWidth = 140;
    const stageHeight = 80;
    const spacing = 40;
    const startX = margin.left;
    const startY = margin.top;

    // Calculate positions for 3x2 grid layout
    const positions = roadmapData.stages.map((stage, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      return {
        ...stage,
        x: startX + col * (stageWidth + spacing),
        y: startY + row * (stageHeight + spacing * 2)
      };
    });

    // Draw connections (arrows)
    const defs = svg.append('defs');

    // Define arrow marker
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 8)
      .attr('refY', 5)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 z')
      .attr('fill', '#666');

    // Draw connections between stages
    roadmapData.dependencies.forEach(dep => {
      const fromStage = positions.find(s => s.name === dep.from);
      const toStage = positions.find(s => s.name === dep.to);

      if (fromStage && toStage) {
        const fromX = fromStage.x + stageWidth;
        const fromY = fromStage.y + stageHeight / 2;
        const toX = toStage.x;
        const toY = toStage.y + stageHeight / 2;

        // Draw curved path
        const midX = (fromX + toX) / 2;

        svg.append('path')
          .attr('d', `M ${fromX} ${fromY} Q ${midX} ${fromY}, ${midX} ${toY} T ${toX} ${toY}`)
          .attr('fill', 'none')
          .attr('stroke', '#ccc')
          .attr('stroke-width', 2)
          .attr('marker-end', 'url(#arrowhead)');
      }
    });

    // Draw stage boxes
    const stageGroups = svg
      .selectAll('.stage-group')
      .data(positions)
      .enter()
      .append('g')
      .attr('class', 'stage-group')
      .attr('transform', d => `translate(${d.x}, ${d.y})`);

    // Add rectangles for stages
    stageGroups
      .append('rect')
      .attr('width', stageWidth)
      .attr('height', stageHeight)
      .attr('rx', 8)
      .attr('ry', 8)
      .attr('fill', d => getStatusColor(d.status))
      .attr('stroke', '#333')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function() {
        d3.select(this).attr('stroke-width', 3);
      })
      .on('mouseout', function() {
        d3.select(this).attr('stroke-width', 2);
      });

    // Add stage names (Korean)
    stageGroups
      .append('text')
      .attr('x', stageWidth / 2)
      .attr('y', stageHeight / 2 - 10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('fill', '#000')
      .text(d => d.displayName);

    // Add status text
    stageGroups
      .append('text')
      .attr('x', stageWidth / 2)
      .attr('y', stageHeight / 2 + 15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#333')
      .text(d => getStatusText(d.status));

    // Add duration if completed
    stageGroups
      .filter(d => d.durationSeconds)
      .append('text')
      .attr('x', stageWidth / 2)
      .attr('y', stageHeight / 2 + 30)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .text(d => `${Math.round(d.durationSeconds)}s`);

    // Add title
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('font-size', '20px')
      .attr('font-weight', 'bold')
      .attr('fill', '#333')
      .text(roadmapData.moduleName || 'Case Roadmap');

  }, [roadmapData]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#4caf50';
      case 'in_progress':
        return '#2196f3';
      case 'failed':
        return '#f44336';
      case 'pending':
      default:
        return '#e0e0e0';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return '완료';
      case 'in_progress':
        return '진행중';
      case 'failed':
        return '실패';
      case 'pending':
      default:
        return '대기';
    }
  };

  if (!roadmapData) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography>로딩중...</Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <svg ref={svgRef} style={{ maxWidth: '100%', height: 'auto' }} />
    </Box>
  );
};

export default CaseRoadmapVisualization;
