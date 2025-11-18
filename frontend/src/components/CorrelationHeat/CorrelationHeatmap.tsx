import React, { useEffect, useRef } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import * as d3 from 'd3';
import { CorrelationData } from '../../types';
import './CorrelationHeatmap.css';

interface CorrelationHeatmapProps {
  data: CorrelationData;
}

const CorrelationHeatmap: React.FC<CorrelationHeatmapProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.matrix.length) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Dimensions
    const margin = { top: 50, right: 20, bottom: 50, left: 50 };
    const cellSize = 30;
    const width = data.matrix.length * cellSize + margin.left + margin.right;
    const height = data.matrix.length * cellSize + margin.top + margin.bottom;

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Color scale - Temperature colors
    const colorScale = d3
      .scaleLinear<string>()
      .domain([-1, -0.5, 0, 0.5, 1])
      .range(['#2166ac', '#67a9cf', '#f7f7f7', '#ef8a62', '#b2182b']);

    // Create cells
    const cells = g
      .selectAll('rect')
      .data(
        data.matrix.flatMap((row, i) =>
          row.map((value, j) => ({ i, j, value }))
        )
      )
      .enter()
      .append('rect')
      .attr('x', (d) => d.j * cellSize)
      .attr('y', (d) => d.i * cellSize)
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('fill', (d) => colorScale(d.value))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('class', 'heatmap-cell')
      .style('opacity', 0)
      .transition()
      .duration(500)
      .delay((d, i) => i * 2)
      .style('opacity', 1);

    // Add text values
    g.selectAll('text.cell-value')
      .data(
        data.matrix.flatMap((row, i) =>
          row.map((value, j) => ({ i, j, value }))
        )
      )
      .enter()
      .append('text')
      .attr('class', 'cell-value')
      .attr('x', (d) => d.j * cellSize + cellSize / 2)
      .attr('y', (d) => d.i * cellSize + cellSize / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', (d) => (Math.abs(d.value) > 0.5 ? '#fff' : '#333'))
      .text((d) => d.value.toFixed(2))
      .style('opacity', 0)
      .transition()
      .duration(500)
      .delay((d, i) => i * 2 + 200)
      .style('opacity', 1);

    // Add row labels
    g.selectAll('text.row-label')
      .data(data.labels)
      .enter()
      .append('text')
      .attr('class', 'row-label')
      .attr('x', -5)
      .attr('y', (d, i) => i * cellSize + cellSize / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text((d) => d);

    // Add column labels
    g.selectAll('text.col-label')
      .data(data.labels)
      .enter()
      .append('text')
      .attr('class', 'col-label')
      .attr('x', (d, i) => i * cellSize + cellSize / 2)
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'baseline')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text((d) => d);

    // Add title
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('Question Correlation Matrix');

    // Add legend
    const legendWidth = 200;
    const legendHeight = 15;
    const legendX = width - legendWidth - margin.right;
    const legendY = margin.top - 35;

    const legendScale = d3.scaleLinear().domain([-1, 1]).range([0, legendWidth]);

    const legendAxis = d3
      .axisBottom(legendScale)
      .ticks(5)
      .tickFormat((d) => d.toFixed(1));

    const legendGradient = svg
      .append('defs')
      .append('linearGradient')
      .attr('id', 'legend-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%');

    legendGradient
      .selectAll('stop')
      .data([
        { offset: '0%', color: '#2166ac' },
        { offset: '25%', color: '#67a9cf' },
        { offset: '50%', color: '#f7f7f7' },
        { offset: '75%', color: '#ef8a62' },
        { offset: '100%', color: '#b2182b' }
      ])
      .enter()
      .append('stop')
      .attr('offset', (d) => d.offset)
      .attr('stop-color', (d) => d.color);

    svg
      .append('rect')
      .attr('x', legendX)
      .attr('y', legendY)
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#legend-gradient)');

    svg
      .append('g')
      .attr('transform', `translate(${legendX},${legendY + legendHeight})`)
      .call(legendAxis)
      .selectAll('text')
      .attr('font-size', '10px');

  }, [data]);

  if (!data.matrix.length) {
    return (
      <Box className="correlation-heatmap-empty">
        <Typography variant="body2" color="text.secondary">
          No correlation data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="correlation-heatmap-container">
      <Paper elevation={2} sx={{ p: 2, overflow: 'auto' }}>
        <svg ref={svgRef} />
      </Paper>
    </Box>
  );
};

export default CorrelationHeatmap;
