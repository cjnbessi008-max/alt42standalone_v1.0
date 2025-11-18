/**
 * Question Difficulty Chart Component
 * Visualizes question difficulty based on pause patterns
 *
 * @package    AI Education System
 * @copyright  2024
 * @license    MIT
 */

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './QuestionDifficultyChart.css';

const QuestionDifficultyChart = ({ data, width = 700, height = 400 }) => {
    const svgRef = useRef(null);

    useEffect(() => {
        if (!data || data.length === 0) return;

        createChart();
    }, [data, width, height]);

    const createChart = () => {
        // Clear previous chart
        d3.select(svgRef.current).selectAll('*').remove();

        const svg = d3.select(svgRef.current);
        const margin = { top: 40, right: 30, bottom: 60, left: 60 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Prepare data
        const chartData = data.map(d => ({
            questionId: d.question_id,
            difficulty: d.pause_difficulty_score,
            avgPauses: d.avg_pauses_per_attempt,
            totalStudents: d.total_students,
            needsRevision: d.needs_revision
        })).sort((a, b) => b.difficulty - a.difficulty);

        // Scales
        const xScale = d3.scaleBand()
            .domain(chartData.map(d => `Q${d.questionId}`))
            .range([0, chartWidth])
            .padding(0.2);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(chartData, d => d.difficulty)])
            .range([chartHeight, 0])
            .nice();

        // Color scale
        const colorScale = d3.scaleThreshold()
            .domain([30, 50, 75])
            .range(['#4CAF50', '#FFEB3B', '#FF9800', '#F44336']);

        // Tooltip
        const tooltip = d3.select('body').append('div')
            .attr('class', 'question-tooltip')
            .style('position', 'absolute')
            .style('display', 'none')
            .style('background', 'rgba(0,0,0,0.8)')
            .style('color', '#fff')
            .style('padding', '8px')
            .style('border-radius', '4px')
            .style('font-size', '12px')
            .style('pointer-events', 'none')
            .style('z-index', '9999');

        // Draw bars
        g.selectAll('.difficulty-bar')
            .data(chartData)
            .enter()
            .append('rect')
            .attr('class', 'difficulty-bar')
            .attr('x', d => xScale(`Q${d.questionId}`))
            .attr('y', d => yScale(d.difficulty))
            .attr('width', xScale.bandwidth())
            .attr('height', d => chartHeight - yScale(d.difficulty))
            .attr('fill', d => colorScale(d.difficulty))
            .attr('stroke', d => d.needsRevision ? '#000' : 'none')
            .attr('stroke-width', d => d.needsRevision ? 3 : 0)
            .attr('stroke-dasharray', d => d.needsRevision ? '5,5' : '0')
            .on('mouseover', function(event, d) {
                d3.select(this).attr('opacity', 0.7);

                tooltip.style('display', 'block')
                    .html(`
                        <strong>Question ${d.questionId}</strong><br/>
                        Difficulty: ${d.difficulty.toFixed(1)}<br/>
                        Avg Pauses: ${d.avgPauses.toFixed(1)}<br/>
                        Students: ${d.totalStudents}<br/>
                        ${d.needsRevision ? '<span style="color:#F44336">⚠️ Needs Revision</span>' : ''}
                    `)
                    .style('left', `${event.pageX + 10}px`)
                    .style('top', `${event.pageY - 10}px`);
            })
            .on('mouseout', function() {
                d3.select(this).attr('opacity', 1);
                tooltip.style('display', 'none');
            });

        // Add difficulty threshold lines
        const thresholds = [
            { value: 75, label: 'Very Difficult', color: '#F44336' },
            { value: 50, label: 'Moderate', color: '#FF9800' },
            { value: 30, label: 'Easy', color: '#FFEB3B' }
        ];

        thresholds.forEach(threshold => {
            g.append('line')
                .attr('x1', 0)
                .attr('x2', chartWidth)
                .attr('y1', yScale(threshold.value))
                .attr('y2', yScale(threshold.value))
                .attr('stroke', threshold.color)
                .attr('stroke-width', 1)
                .attr('stroke-dasharray', '3,3')
                .attr('opacity', 0.5);

            g.append('text')
                .attr('x', chartWidth - 5)
                .attr('y', yScale(threshold.value) - 5)
                .attr('text-anchor', 'end')
                .style('font-size', '10px')
                .style('fill', threshold.color)
                .text(threshold.label);
        });

        // Axes
        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${chartHeight})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end');

        g.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(yScale));

        // Axis labels
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height - 5)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .text('Question ID');

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', 15)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .text('Difficulty Score');

        // Title
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .text('Question Difficulty Analysis');

        // Legend
        const legend = svg.append('g')
            .attr('transform', `translate(${margin.left + 10},${margin.top + 10})`);

        legend.append('text')
            .attr('x', 0)
            .attr('y', 0)
            .style('font-size', '11px')
            .style('font-weight', 'bold')
            .text('Legend:');

        legend.append('rect')
            .attr('x', 0)
            .attr('y', 10)
            .attr('width', 20)
            .attr('height', 10)
            .attr('stroke', '#000')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,5')
            .attr('fill', 'none');

        legend.append('text')
            .attr('x', 25)
            .attr('y', 19)
            .style('font-size', '10px')
            .text('= Needs Revision');
    };

    return (
        <div className="question-difficulty-chart">
            <svg
                ref={svgRef}
                width={width}
                height={height}
            />
        </div>
    );
};

export default QuestionDifficultyChart;
