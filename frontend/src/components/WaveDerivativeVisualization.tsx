import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateWaveDerivative } from '../utils/derivative';

interface WaveDerivativeVisualizationProps {
  mathFunction: (x: number) => number;
  shakeIntensity: number;
  position: { x: number; y: number };
  isActive: boolean;
}

export const WaveDerivativeVisualization: React.FC<WaveDerivativeVisualizationProps> = ({
  mathFunction,
  shakeIntensity,
  position,
  isActive,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [waveData, setWaveData] = useState<Array<{ x: number; derivative: number }>>([]);
  const animationRef = useRef<number>();

  const width = 360;
  const height = 200;
  const margin = { top: 20, right: 20, bottom: 30, left: 50 };

  useEffect(() => {
    if (!isActive || shakeIntensity < 0.5) {
      setWaveData([]);
      return;
    }

    // Calculate wave derivative data centered at the shake position
    const wavePoints = calculateWaveDerivative(mathFunction, position.x, 3, 60);
    setWaveData(wavePoints.map(p => ({ x: p.x, derivative: p.derivative })));
  }, [mathFunction, position.x, shakeIntensity, isActive]);

  useEffect(() => {
    if (!svgRef.current || waveData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Create scales
    const xScale = d3
      .scaleLinear()
      .domain([waveData[0].x, waveData[waveData.length - 1].x])
      .range([margin.left, width - margin.right]);

    const maxDerivative = d3.max(waveData, d => Math.abs(d.derivative)) || 1;
    const yScale = d3
      .scaleLinear()
      .domain([-maxDerivative * 1.2, maxDerivative * 1.2])
      .range([height - margin.bottom, margin.top]);

    // Add gradient for wave
    const gradient = svg
      .append('defs')
      .append('linearGradient')
      .attr('id', 'wave-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#667eea')
      .attr('stop-opacity', 0.3);

    gradient.append('stop')
      .attr('offset', '50%')
      .attr('stop-color', '#764ba2')
      .attr('stop-opacity', 0.8);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#f093fb')
      .attr('stop-opacity', 0.3);

    // Create area generator for filled wave
    const area = d3
      .area<{ x: number; derivative: number }>()
      .x(d => xScale(d.x))
      .y0(yScale(0))
      .y1(d => yScale(d.derivative))
      .curve(d3.curveCatmullRom);

    // Create line generator for wave outline
    const line = d3
      .line<{ x: number; derivative: number }>()
      .x(d => xScale(d.x))
      .y(d => yScale(d.derivative))
      .curve(d3.curveCatmullRom);

    // Draw zero line
    svg
      .append('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', yScale(0))
      .attr('y2', yScale(0))
      .attr('stroke', '#999')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '5,5');

    // Draw filled area
    svg
      .append('path')
      .datum(waveData)
      .attr('class', 'wave-area')
      .attr('fill', 'url(#wave-gradient)')
      .attr('d', area);

    // Draw wave line
    svg
      .append('path')
      .datum(waveData)
      .attr('class', 'wave-line')
      .attr('fill', 'none')
      .attr('stroke', '#764ba2')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add axes
    const xAxis = d3.axisBottom(xScale).ticks(5);
    const yAxis = d3.axisLeft(yScale).ticks(5);

    svg
      .append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(xAxis)
      .style('font-size', '9px')
      .style('color', '#666');

    svg
      .append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(yAxis)
      .style('font-size', '9px')
      .style('color', '#666');

    // Add label
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', margin.top - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .style('fill', '#764ba2')
      .text("f'(x) - Rate of Change");

    // Animate the wave
    let phase = 0;
    const animate = () => {
      phase += 0.05 * shakeIntensity;

      svg.selectAll('.wave-line')
        .attr('transform', `translate(0, ${Math.sin(phase) * 2})`);

      svg.selectAll('.wave-area')
        .attr('transform', `translate(0, ${Math.sin(phase) * 2})`);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [waveData, shakeIntensity, width, height, margin]);

  return (
    <AnimatePresence>
      {isActive && waveData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="mt-4"
        >
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 border-2 border-purple-300">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-purple-700">
                Wave Derivative
              </h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-600">
                  Intensity: {shakeIntensity.toFixed(1)}
                </span>
              </div>
            </div>

            <svg
              ref={svgRef}
              width={width}
              height={height}
              className="bg-gradient-to-br from-purple-50 to-pink-50 rounded"
            />

            <div className="mt-2 text-xs text-gray-600 text-center">
              Showing the rate of change near x = {position.x.toFixed(2)}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
