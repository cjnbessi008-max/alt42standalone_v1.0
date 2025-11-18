import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';

interface GraphVisualizationProps {
  mathFunction: (x: number) => number;
  onShake: (intensity: number, position: { x: number; y: number }) => void;
}

export const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  mathFunction,
  onShake,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const lastPositionRef = useRef({ x: 0, y: 0, time: 0 });

  const width = 360;
  const height = 300;
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Create scales
    const xScale = d3
      .scaleLinear()
      .domain([-10, 10])
      .range([margin.left, width - margin.right]);

    const yScale = d3
      .scaleLinear()
      .domain([-5, 5])
      .range([height - margin.bottom, margin.top]);

    // Create axes
    const xAxis = d3.axisBottom(xScale).ticks(10);
    const yAxis = d3.axisLeft(yScale).ticks(8);

    // Add grid lines
    svg
      .append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(xAxis.tickSize(-height + margin.top + margin.bottom).tickFormat(() => ''))
      .style('stroke', '#e0e0e0')
      .style('stroke-opacity', 0.3);

    svg
      .append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(${margin.left},0)`)
      .call(yAxis.tickSize(-width + margin.left + margin.right).tickFormat(() => ''))
      .style('stroke', '#e0e0e0')
      .style('stroke-opacity', 0.3);

    // Add axes
    svg
      .append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(xAxis)
      .style('font-size', '10px');

    svg
      .append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(yAxis)
      .style('font-size', '10px');

    // Generate line data
    const lineData: [number, number][] = [];
    for (let x = -10; x <= 10; x += 0.1) {
      const y = mathFunction(x);
      if (!isNaN(y) && isFinite(y)) {
        lineData.push([x, y]);
      }
    }

    // Create line generator
    const line = d3
      .line<[number, number]>()
      .x((d) => xScale(d[0]))
      .y((d) => yScale(d[1]))
      .curve(d3.curveMonotoneX);

    // Draw the function
    svg
      .append('path')
      .datum(lineData)
      .attr('class', 'function-line')
      .attr('fill', 'none')
      .attr('stroke', '#667eea')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Add interactive overlay
    svg
      .append('rect')
      .attr('class', 'overlay')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'transparent')
      .style('cursor', 'grab')
      .on('mousedown', function () {
        d3.select(this).style('cursor', 'grabbing');
      })
      .on('mouseup', function () {
        d3.select(this).style('cursor', 'grab');
      });
  }, [mathFunction, width, height, margin]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastPositionRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const currentTime = Date.now();
    const deltaTime = currentTime - lastPositionRef.current.time;
    const deltaX = e.clientX - lastPositionRef.current.x;
    const deltaY = e.clientY - lastPositionRef.current.y;

    // Calculate shake intensity based on movement speed
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / (deltaTime || 1);
    const intensity = Math.min(velocity / 5, 10); // Normalize to 0-10

    if (intensity > 0.5) {
      setShakeIntensity(intensity);

      // Get relative position in the graph
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        const relativeX = ((e.clientX - rect.left) / rect.width) * 20 - 10; // Map to -10 to 10
        const relativeY = 5 - ((e.clientY - rect.top) / rect.height) * 10; // Map to -5 to 5

        onShake(intensity, { x: relativeX, y: relativeY });
      }
    }

    lastPositionRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: currentTime,
    };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setShakeIntensity(0);
  };

  return (
    <div className="relative">
      <motion.div
        animate={{
          x: isDragging ? Math.sin(Date.now() / 50) * shakeIntensity : 0,
          y: isDragging ? Math.cos(Date.now() / 50) * shakeIntensity : 0,
        }}
        transition={{ duration: 0.1 }}
      >
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="bg-white rounded-lg shadow-md"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </motion.div>

      {isDragging && shakeIntensity > 0.5 && (
        <div className="absolute top-2 right-2 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
          Shake: {shakeIntensity.toFixed(1)}
        </div>
      )}
    </div>
  );
};
