/**
 * Cognitive Pause Heatmap Component
 * Visualizes pause frequency and duration as a heatmap
 *
 * @package    AI Education System
 * @copyright  2024
 * @license    MIT
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import './PauseHeatmap.css';

const PauseHeatmap = ({ data, width = 800, height = 600 }) => {
    const svgRef = useRef(null);
    const tooltipRef = useRef(null);
    const [selectedCell, setSelectedCell] = useState(null);

    useEffect(() => {
        if (!data || data.length === 0) return;

        // Clear previous chart
        d3.select(svgRef.current).selectAll('*').remove();

        // Process data
        const processedData = processHeatmapData(data);

        // Create heatmap
        createHeatmap(processedData);

    }, [data, width, height]);

    /**
     * Process raw pause data into heatmap format
     */
    const processHeatmapData = (rawData) => {
        // Group by question and time period
        const grouped = {};

        rawData.forEach(pause => {
            const questionId = pause.question_id || 'unknown';
            const hour = new Date(pause.pause_start_time).getHours();

            if (!grouped[questionId]) {
                grouped[questionId] = {};
            }

            if (!grouped[questionId][hour]) {
                grouped[questionId][hour] = {
                    count: 0,
                    totalDuration: 0,
                    pauses: []
                };
            }

            grouped[questionId][hour].count++;
            grouped[questionId][hour].totalDuration += pause.pause_duration_ms;
            grouped[questionId][hour].pauses.push(pause);
        });

        // Convert to array format
        const result = [];
        Object.keys(grouped).forEach(questionId => {
            Object.keys(grouped[questionId]).forEach(hour => {
                const cell = grouped[questionId][hour];
                result.push({
                    questionId,
                    hour: parseInt(hour),
                    count: cell.count,
                    avgDuration: cell.totalDuration / cell.count,
                    totalDuration: cell.totalDuration,
                    pauses: cell.pauses
                });
            });
        });

        return result;
    };

    /**
     * Create D3 heatmap visualization
     */
    const createHeatmap = (processedData) => {
        const svg = d3.select(svgRef.current);
        const margin = { top: 60, right: 100, bottom: 60, left: 120 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        // Create main group
        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Get unique questions and hours
        const questions = [...new Set(processedData.map(d => d.questionId))];
        const hours = d3.range(0, 24);

        // Create scales
        const xScale = d3.scaleBand()
            .domain(hours)
            .range([0, chartWidth])
            .padding(0.05);

        const yScale = d3.scaleBand()
            .domain(questions)
            .range([0, chartHeight])
            .padding(0.05);

        // Color scale based on pause intensity (count * avgDuration)
        const maxIntensity = d3.max(processedData, d => d.count * d.avgDuration);
        const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
            .domain([0, maxIntensity]);

        // Create tooltip
        const tooltip = d3.select(tooltipRef.current);

        // Draw heatmap cells
        g.selectAll('.heatmap-cell')
            .data(processedData)
            .enter()
            .append('rect')
            .attr('class', 'heatmap-cell')
            .attr('x', d => xScale(d.hour))
            .attr('y', d => yScale(d.questionId))
            .attr('width', xScale.bandwidth())
            .attr('height', yScale.bandwidth())
            .attr('fill', d => colorScale(d.count * d.avgDuration))
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .on('mouseover', function(event, d) {
                // Highlight cell
                d3.select(this)
                    .attr('stroke', '#000')
                    .attr('stroke-width', 2);

                // Show tooltip
                tooltip.style('display', 'block')
                    .style('left', `${event.pageX + 10}px`)
                    .style('top', `${event.pageY - 10}px`)
                    .html(`
                        <strong>Question ${d.questionId}</strong><br/>
                        Time: ${d.hour}:00 - ${d.hour + 1}:00<br/>
                        Pauses: ${d.count}<br/>
                        Avg Duration: ${(d.avgDuration / 1000).toFixed(1)}s<br/>
                        Total Duration: ${(d.totalDuration / 1000).toFixed(1)}s
                    `);

                setSelectedCell(d);
            })
            .on('mouseout', function() {
                d3.select(this)
                    .attr('stroke', '#fff')
                    .attr('stroke-width', 1);

                tooltip.style('display', 'none');
            })
            .on('click', (event, d) => {
                setSelectedCell(d);
            });

        // Add X axis (hours)
        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${chartHeight})`)
            .call(d3.axisBottom(xScale).tickFormat(d => `${d}:00`))
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end');

        // Add Y axis (questions)
        g.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(yScale).tickFormat(d => `Q${d}`));

        // Add X axis label
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height - 10)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .text('Time of Day');

        // Add Y axis label
        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .text('Question ID');

        // Add title
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 30)
            .attr('text-anchor', 'middle')
            .style('font-size', '18px')
            .style('font-weight', 'bold')
            .text('Cognitive Pause Heatmap');

        // Add color legend
        const legendWidth = 20;
        const legendHeight = chartHeight;
        const legendX = chartWidth + margin.left + 20;
        const legendY = margin.top;

        const legendScale = d3.scaleLinear()
            .domain([0, maxIntensity])
            .range([legendHeight, 0]);

        const legendAxis = d3.axisRight(legendScale)
            .ticks(5)
            .tickFormat(d => (d / 1000).toFixed(0) + 'k');

        // Create gradient for legend
        const defs = svg.append('defs');
        const gradient = defs.append('linearGradient')
            .attr('id', 'legend-gradient')
            .attr('x1', '0%')
            .attr('y1', '100%')
            .attr('x2', '0%')
            .attr('y2', '0%');

        gradient.selectAll('stop')
            .data(d3.range(0, 1.1, 0.1))
            .enter()
            .append('stop')
            .attr('offset', d => `${d * 100}%`)
            .attr('stop-color', d => colorScale(d * maxIntensity));

        svg.append('rect')
            .attr('x', legendX)
            .attr('y', legendY)
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .style('fill', 'url(#legend-gradient)');

        svg.append('g')
            .attr('class', 'legend-axis')
            .attr('transform', `translate(${legendX + legendWidth},${legendY})`)
            .call(legendAxis);

        svg.append('text')
            .attr('x', legendX + legendWidth / 2)
            .attr('y', legendY - 10)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .text('Intensity');
    };

    return (
        <div className="pause-heatmap-container">
            <svg
                ref={svgRef}
                width={width}
                height={height}
                className="pause-heatmap"
            />
            <div ref={tooltipRef} className="heatmap-tooltip" />

            {selectedCell && (
                <div className="selected-cell-details">
                    <h3>Selected Cell Details</h3>
                    <p><strong>Question:</strong> {selectedCell.questionId}</p>
                    <p><strong>Time:</strong> {selectedCell.hour}:00 - {selectedCell.hour + 1}:00</p>
                    <p><strong>Total Pauses:</strong> {selectedCell.count}</p>
                    <p><strong>Average Duration:</strong> {(selectedCell.avgDuration / 1000).toFixed(2)}s</p>

                    <h4>Pause Distribution:</h4>
                    <ul>
                        {selectedCell.pauses.map((pause, idx) => (
                            <li key={idx}>
                                {pause.pause_type}: {(pause.pause_duration_ms / 1000).toFixed(1)}s
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default PauseHeatmap;
