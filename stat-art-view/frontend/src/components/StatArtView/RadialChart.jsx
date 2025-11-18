import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import './StatArtView.css';

const RadialChart = ({ data }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // SVG 초기화
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 500;
    const height = 500;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 - 40;

    svg.attr('width', width).attr('height', height);

    // 그룹 생성
    const g = svg.append('g')
      .attr('transform', `translate(${centerX},${centerY})`);

    // 배경 원 그리기
    const circles = [0.25, 0.5, 0.75, 1];
    circles.forEach((ratio, i) => {
      g.append('circle')
        .attr('r', maxRadius * ratio)
        .attr('fill', 'none')
        .attr('stroke', '#e5e7eb')
        .attr('stroke-width', 1)
        .attr('opacity', 0.5);

      // 레이블
      g.append('text')
        .attr('y', -maxRadius * ratio)
        .attr('dy', -5)
        .attr('text-anchor', 'middle')
        .attr('font-size', 10)
        .attr('fill', '#6b7280')
        .text(`${ratio * 100}%`);
    });

    // 중앙 원
    g.append('circle')
      .attr('r', 15)
      .attr('fill', '#667eea')
      .attr('opacity', 0.8);

    // 데이터 포인트 그리기
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
        .attr('stroke-width', 1)
        .attr('opacity', 0.3);

      // 꽃잎 모양 (패스)
      const petalPath = g.append('path')
        .attr('d', () => {
          const startAngle = angle - 0.1;
          const endAngle = angle + 0.1;
          const path = d3.path();
          path.moveTo(0, 0);
          path.lineTo(
            Math.cos(startAngle - Math.PI / 2) * radius,
            Math.sin(startAngle - Math.PI / 2) * radius
          );
          path.arc(
            Math.cos(angle - Math.PI / 2) * radius,
            Math.sin(angle - Math.PI / 2) * radius,
            radius * 0.2,
            startAngle - Math.PI / 2,
            endAngle - Math.PI / 2
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
        .attr('stroke-width', 2);

      // 애니메이션
      petalPath
        .transition()
        .duration(800)
        .delay(i * 50)
        .attr('opacity', 0.8);

      // 데이터 포인트 (원)
      const circle = g.append('circle')
        .attr('cx', Math.cos(angle - Math.PI / 2) * radius)
        .attr('cy', Math.sin(angle - Math.PI / 2) * radius)
        .attr('r', 0)
        .attr('fill', d.color)
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer');

      circle
        .transition()
        .duration(600)
        .delay(i * 50)
        .attr('r', 6);

      // 툴팁
      const tooltip = g.append('g')
        .attr('class', 'tooltip')
        .attr('opacity', 0)
        .attr('transform', `translate(${Math.cos(angle - Math.PI / 2) * radius},${Math.sin(angle - Math.PI / 2) * radius})`);

      tooltip.append('rect')
        .attr('x', -50)
        .attr('y', -40)
        .attr('width', 100)
        .attr('height', 30)
        .attr('fill', 'white')
        .attr('rx', 5)
        .attr('stroke', d.color)
        .attr('stroke-width', 2);

      tooltip.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', -25)
        .attr('font-size', 12)
        .attr('font-weight', 'bold')
        .attr('fill', '#111827')
        .text(`${d.value.toFixed(1)}%`);

      // 호버 이벤트
      circle
        .on('mouseenter', function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 10);

          tooltip
            .transition()
            .duration(200)
            .attr('opacity', 1);
        })
        .on('mouseleave', function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 6);

          tooltip
            .transition()
            .duration(200)
            .attr('opacity', 0);
        });
    });

  }, [data]);

  return (
    <motion.div
      className="radial-chart-container"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      <svg ref={svgRef}></svg>
      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#10b981' }}></div>
          <span>쉬움 (≥80%)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#f59e0b' }}></div>
          <span>보통 (50-79%)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#ef4444' }}></div>
          <span>어려움 (&lt;50%)</span>
        </div>
      </div>
    </motion.div>
  );
};

export default RadialChart;
