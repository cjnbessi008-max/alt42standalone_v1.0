import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { DistributionPoint } from '../types';

interface DistributionChartProps {
  data: DistributionPoint[];
  width?: number;
  height?: number;
  color?: string;
  title?: string;
}

/**
 * D3.js를 사용한 확률분포 시각화 컴포넌트
 */
export const DistributionChart: React.FC<DistributionChartProps> = ({
  data,
  width = 320,
  height = 400,
  color = '#3b82f6',
  title = '확률 분포',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 40, right: 20, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create scales
    const xExtent = d3.extent(data, (d) => d.x) as [number, number];
    const yExtent = d3.extent(data, (d) => d.y) as [number, number];

    const xScale = d3
      .scaleLinear()
      .domain(xExtent)
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, yExtent[1] * 1.1])
      .range([innerHeight, 0]);

    // Create main group
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add title
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .attr('fill', '#1f2937')
      .text(title);

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      );

    // Create area generator
    const area = d3
      .area<DistributionPoint>()
      .x((d) => xScale(d.x))
      .y0(innerHeight)
      .y1((d) => yScale(d.y))
      .curve(d3.curveBasis);

    // Create line generator
    const line = d3
      .line<DistributionPoint>()
      .x((d) => xScale(d.x))
      .y((d) => yScale(d.y))
      .curve(d3.curveBasis);

    // Add gradient
    const gradient = svg
      .append('defs')
      .append('linearGradient')
      .attr('id', 'area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', color)
      .attr('stop-opacity', 0.6);

    gradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', color)
      .attr('stop-opacity', 0.1);

    // Draw area with animation
    const areaPath = g
      .append('path')
      .datum(data)
      .attr('fill', 'url(#area-gradient)')
      .attr('d', area);

    const areaLength = areaPath.node()?.getTotalLength() || 0;

    areaPath
      .attr('stroke-dasharray', `${areaLength} ${areaLength}`)
      .attr('stroke-dashoffset', areaLength)
      .transition()
      .duration(1000)
      .ease(d3.easeQuadInOut)
      .attr('stroke-dashoffset', 0);

    // Draw line with animation
    const linePath = g
      .append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2.5)
      .attr('d', line);

    const lineLength = linePath.node()?.getTotalLength() || 0;

    linePath
      .attr('stroke-dasharray', `${lineLength} ${lineLength}`)
      .attr('stroke-dashoffset', lineLength)
      .transition()
      .duration(1000)
      .ease(d3.easeQuadInOut)
      .attr('stroke-dashoffset', 0);

    // Add axes
    const xAxis = d3.axisBottom(xScale).ticks(6);
    const yAxis = d3.axisLeft(yScale).ticks(5);

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .attr('color', '#6b7280');

    g.append('g').call(yAxis).attr('color', '#6b7280');

    // Add axis labels
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 35)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#6b7280')
      .text('값 (x)');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -35)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#6b7280')
      .text('확률 밀도');
  }, [data, width, height, color, title]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="mx-auto"
    />
  );
};
