import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const MiniRadialChart = ({ data }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 280;
    const height = 280;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 - 20;

    svg.attr('width', width).attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${centerX},${centerY})`);

    // 배경 원
    const circles = [0.33, 0.67, 1];
    circles.forEach((ratio) => {
      g.append('circle')
        .attr('r', maxRadius * ratio)
        .attr('fill', 'none')
        .attr('stroke', '#e5e7eb')
        .attr('stroke-width', 1)
        .attr('opacity', 0.4);
    });

    // 중앙 원
    g.append('circle')
      .attr('r', 12)
      .attr('fill', '#667eea')
      .attr('opacity', 0.9);

    // 데이터 포인트
    data.forEach((d, i) => {
      const angle = (d.angle * Math.PI) / 180;
      const radius = (d.value / 100) * maxRadius;

      // 선
      g.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', Math.cos(angle - Math.PI / 2) * maxRadius)
        .attr('y2', Math.sin(angle - Math.PI / 2) * maxRadius)
        .attr('stroke', '#e5e7eb')
        .attr('stroke-width', 0.5)
        .attr('opacity', 0.3);

      // 꽃잎
      const petal = g.append('path')
        .attr('d', () => {
          const startAngle = angle - 0.15;
          const endAngle = angle + 0.15;
          const path = d3.path();
          path.moveTo(0, 0);
          path.lineTo(
            Math.cos(startAngle - Math.PI / 2) * radius,
            Math.sin(startAngle - Math.PI / 2) * radius
          );
          path.lineTo(
            Math.cos(endAngle - Math.PI / 2) * radius,
            Math.sin(endAngle - Math.PI / 2) * radius
          );
          path.closePath();
          return path.toString();
        })
        .attr('fill', d.color)
        .attr('opacity', 0)
        .attr('stroke', d.color)
        .attr('stroke-width', 1);

      petal
        .transition()
        .duration(500)
        .delay(i * 30)
        .attr('opacity', 0.8);

      // 데이터 포인트
      g.append('circle')
        .attr('cx', Math.cos(angle - Math.PI / 2) * radius)
        .attr('cy', Math.sin(angle - Math.PI / 2) * radius)
        .attr('r', 0)
        .attr('fill', d.color)
        .attr('stroke', 'white')
        .attr('stroke-width', 1.5)
        .transition()
        .duration(400)
        .delay(i * 30)
        .attr('r', 4);
    });

  }, [data]);

  return (
    <div className="mini-radial-chart">
      <svg ref={svgRef}></svg>
      <div className="mini-chart-label">
        <p>문제별 정답률 분포</p>
      </div>
    </div>
  );
};

export default MiniRadialChart;
