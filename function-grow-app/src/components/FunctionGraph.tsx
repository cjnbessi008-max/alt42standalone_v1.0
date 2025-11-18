import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';

export interface Term {
  coefficient: number;
  power: number;
}

interface FunctionGraphProps {
  terms: Term[];
  showAnimation?: boolean;
}

const FunctionGraph: React.FC<FunctionGraphProps> = ({ terms, showAnimation = true }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions] = useState({ width: 260, height: 400 });
  const [currentEquation, setCurrentEquation] = useState<string>('');

  useEffect(() => {
    if (!svgRef.current || terms.length === 0) return;

    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([-5, 5])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([-10, 10])
      .range([height, 0]);

    // Add axes
    const xAxis = d3.axisBottom(xScale).ticks(5);
    const yAxis = d3.axisLeft(yScale).ticks(5);

    svg.append('g')
      .attr('transform', `translate(0,${height / 2})`)
      .call(xAxis)
      .attr('class', 'axis')
      .selectAll('text')
      .style('font-size', '10px')
      .style('fill', '#666');

    svg.append('g')
      .attr('transform', `translate(${width / 2},0)`)
      .call(yAxis)
      .attr('class', 'axis')
      .selectAll('text')
      .style('font-size', '10px')
      .style('fill', '#666');

    // Style axis lines
    svg.selectAll('.axis path, .axis line')
      .style('stroke', '#ddd')
      .style('stroke-width', '1px');

    // Add grid lines
    svg.append('g')
      .attr('class', 'grid')
      .selectAll('line.horizontal')
      .data(yScale.ticks(10))
      .enter()
      .append('line')
      .attr('class', 'horizontal')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .style('stroke', '#f0f0f0')
      .style('stroke-width', '1px');

    svg.append('g')
      .attr('class', 'grid')
      .selectAll('line.vertical')
      .data(xScale.ticks(10))
      .enter()
      .append('line')
      .attr('class', 'vertical')
      .attr('x1', d => xScale(d))
      .attr('x2', d => xScale(d))
      .attr('y1', 0)
      .attr('y2', height)
      .style('stroke', '#f0f0f0')
      .style('stroke-width', '1px');

    // Calculate function value
    const calculateY = (x: number): number => {
      return terms.reduce((sum, term) => {
        return sum + term.coefficient * Math.pow(x, term.power);
      }, 0);
    };

    // Generate data points
    const data: [number, number][] = [];
    for (let x = -5; x <= 5; x += 0.1) {
      const y = calculateY(x);
      if (Math.abs(y) <= 10) { // Only include points within bounds
        data.push([x, y]);
      }
    }

    // Create line generator
    const line = d3.line<[number, number]>()
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]))
      .curve(d3.curveMonotoneX);

    // Add the function line with animation
    const path = svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Animate path drawing
    if (showAnimation) {
      const totalLength = path.node()?.getTotalLength() || 0;
      path
        .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(1500)
        .ease(d3.easeQuadInOut)
        .attr('stroke-dashoffset', 0);
    }

    // Add points along the curve
    if (data.length > 0) {
      svg.selectAll('.dot')
        .data(data.filter((_, i) => i % 5 === 0))
        .enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('cx', d => xScale(d[0]))
        .attr('cy', d => yScale(d[1]))
        .attr('r', 0)
        .attr('fill', '#3b82f6')
        .attr('opacity', 0.6)
        .transition()
        .delay((_, i) => i * 50)
        .duration(300)
        .attr('r', 2.5);
    }

    // Update equation display
    const equation = terms
      .sort((a, b) => b.power - a.power)
      .map(term => {
        const coef = term.coefficient;
        const pow = term.power;

        if (pow === 0) return `${coef > 0 ? '+' : ''}${coef}`;
        if (pow === 1) return `${coef > 0 ? '+' : ''}${coef}x`;
        return `${coef > 0 ? '+' : ''}${coef}x^${pow}`;
      })
      .join(' ')
      .replace(/^\+/, ''); // Remove leading +

    setCurrentEquation(`f(x) = ${equation || '0'}`);

  }, [terms, dimensions, showAnimation]);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <AnimatePresence>
        {currentEquation && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 px-4 py-2 bg-white rounded-lg shadow-md"
          >
            <p className="text-sm font-mono text-gray-800 font-semibold">
              {currentEquation}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-lg shadow-lg p-2">
        <svg ref={svgRef}></svg>
      </div>

      {terms.length === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-sm text-gray-500 text-center"
        >
          항을 추가하여 함수를 만들어보세요
        </motion.p>
      )}
    </div>
  );
};

export default FunctionGraph;
