/**
 * Cognitive Pause Timeline Component
 * Visualizes pause events over time for a single student/question
 *
 * @package    AI Education System
 * @copyright  2024
 * @license    MIT
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import './PauseTimeline.css';

const PauseTimeline = ({ data, width = 1000, height = 400 }) => {
    const svgRef = useRef(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [selectedPause, setSelectedPause] = useState(null);

    useEffect(() => {
        if (!data || data.length === 0) return;

        createTimeline(data);

    }, [data, width, height, zoomLevel]);

    /**
     * Create D3 timeline visualization
     */
    const createTimeline = (pauseData) => {
        // Clear previous chart
        d3.select(svgRef.current).selectAll('*').remove();

        const svg = d3.select(svgRef.current);
        const margin = { top: 40, right: 30, bottom: 80, left: 60 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Parse dates and sort data
        const sortedData = pauseData
            .map(d => ({
                ...d,
                startTime: new Date(d.pause_start_time),
                endTime: new Date(d.pause_end_time),
                duration: d.pause_duration_ms
            }))
            .sort((a, b) => a.startTime - b.startTime);

        // Create scales
        const xScale = d3.scaleTime()
            .domain(d3.extent(sortedData, d => d.startTime))
            .range([0, chartWidth]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(sortedData, d => d.duration)])
            .range([chartHeight, 0])
            .nice();

        // Color scale for pause types
        const colorScale = d3.scaleOrdinal()
            .domain(['thinking', 'confusion', 'distraction', 're_reading', 'unknown'])
            .range(['#4CAF50', '#FF9800', '#F44336', '#2196F3', '#9E9E9E']);

        // Add X axis
        const xAxis = d3.axisBottom(xScale)
            .ticks(10)
            .tickFormat(d3.timeFormat('%H:%M:%S'));

        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${chartHeight})`)
            .call(xAxis)
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end');

        // Add Y axis
        const yAxis = d3.axisLeft(yScale)
            .tickFormat(d => `${(d / 1000).toFixed(0)}s`);

        g.append('g')
            .attr('class', 'y-axis')
            .call(yAxis);

        // Add grid lines
        g.append('g')
            .attr('class', 'grid')
            .attr('opacity', 0.1)
            .call(d3.axisLeft(yScale)
                .tickSize(-chartWidth)
                .tickFormat('')
            );

        // Draw pause bars
        g.selectAll('.pause-bar')
            .data(sortedData)
            .enter()
            .append('rect')
            .attr('class', 'pause-bar')
            .attr('x', d => xScale(d.startTime))
            .attr('y', d => yScale(d.duration))
            .attr('width', d => {
                const barWidth = xScale(d.endTime) - xScale(d.startTime);
                return Math.max(barWidth, 3); // Minimum width of 3px
            })
            .attr('height', d => chartHeight - yScale(d.duration))
            .attr('fill', d => colorScale(d.pause_type))
            .attr('opacity', 0.7)
            .attr('stroke', '#333')
            .attr('stroke-width', 0.5)
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .attr('opacity', 1)
                    .attr('stroke-width', 2);

                showTooltip(event, d);
            })
            .on('mouseout', function() {
                d3.select(this)
                    .attr('opacity', 0.7)
                    .attr('stroke-width', 0.5);

                hideTooltip();
            })
            .on('click', (event, d) => {
                setSelectedPause(d);
            });

        // Add timeline markers for events
        g.selectAll('.pause-marker')
            .data(sortedData)
            .enter()
            .append('circle')
            .attr('class', 'pause-marker')
            .attr('cx', d => xScale(d.startTime))
            .attr('cy', chartHeight + 20)
            .attr('r', 4)
            .attr('fill', d => colorScale(d.pause_type))
            .attr('stroke', '#fff')
            .attr('stroke-width', 1);

        // Add X axis label
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height - 10)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .text('Time');

        // Add Y axis label
        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', 15)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .text('Pause Duration (seconds)');

        // Add title
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .style('font-size', '18px')
            .style('font-weight', 'bold')
            .text('Cognitive Pause Timeline');

        // Add legend
        const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${width - 150}, 40)`);

        const pauseTypes = ['thinking', 'confusion', 'distraction', 're_reading', 'unknown'];
        const legendItems = legend.selectAll('.legend-item')
            .data(pauseTypes)
            .enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * 25})`);

        legendItems.append('rect')
            .attr('width', 18)
            .attr('height', 18)
            .attr('fill', d => colorScale(d));

        legendItems.append('text')
            .attr('x', 24)
            .attr('y', 9)
            .attr('dy', '.35em')
            .style('font-size', '12px')
            .text(d => d.replace('_', ' ').toUpperCase());

        // Add zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([1, 10])
            .translateExtent([[0, 0], [chartWidth, chartHeight]])
            .on('zoom', (event) => {
                const newXScale = event.transform.rescaleX(xScale);

                // Update axis
                g.select('.x-axis').call(
                    d3.axisBottom(newXScale)
                        .ticks(10)
                        .tickFormat(d3.timeFormat('%H:%M:%S'))
                );

                // Update bars
                g.selectAll('.pause-bar')
                    .attr('x', d => newXScale(d.startTime))
                    .attr('width', d => {
                        const barWidth = newXScale(d.endTime) - newXScale(d.startTime);
                        return Math.max(barWidth, 3);
                    });

                // Update markers
                g.selectAll('.pause-marker')
                    .attr('cx', d => newXScale(d.startTime));
            });

        svg.call(zoom);
    };

    const showTooltip = (event, data) => {
        const tooltip = d3.select('.timeline-tooltip');
        if (tooltip.empty()) {
            d3.select('body').append('div')
                .attr('class', 'timeline-tooltip')
                .style('position', 'absolute')
                .style('background', 'rgba(0, 0, 0, 0.8)')
                .style('color', '#fff')
                .style('padding', '8px')
                .style('border-radius', '4px')
                .style('font-size', '12px')
                .style('pointer-events', 'none')
                .style('z-index', '9999');
        }

        d3.select('.timeline-tooltip')
            .style('display', 'block')
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 10}px`)
            .html(`
                <strong>${data.pause_type.toUpperCase()}</strong><br/>
                Start: ${d3.timeFormat('%H:%M:%S')(data.startTime)}<br/>
                Duration: ${(data.duration / 1000).toFixed(2)}s<br/>
                Confidence: ${(data.confidence_score * 100).toFixed(0)}%
            `);
    };

    const hideTooltip = () => {
        d3.select('.timeline-tooltip').style('display', 'none');
    };

    return (
        <div className="pause-timeline-container">
            <svg
                ref={svgRef}
                width={width}
                height={height}
                className="pause-timeline"
            />

            {selectedPause && (
                <div className="selected-pause-details">
                    <h3>Pause Details</h3>
                    <button onClick={() => setSelectedPause(null)}>Close</button>

                    <div className="details-content">
                        <p><strong>Type:</strong> {selectedPause.pause_type}</p>
                        <p><strong>Start Time:</strong> {selectedPause.startTime.toLocaleTimeString()}</p>
                        <p><strong>End Time:</strong> {selectedPause.endTime.toLocaleTimeString()}</p>
                        <p><strong>Duration:</strong> {(selectedPause.duration / 1000).toFixed(2)} seconds</p>
                        <p><strong>Confidence:</strong> {(selectedPause.confidence_score * 100).toFixed(0)}%</p>

                        {selectedPause.input_field_id && (
                            <p><strong>Input Field:</strong> {selectedPause.input_field_id}</p>
                        )}

                        {selectedPause.tab_switches > 0 && (
                            <p><strong>Tab Switches:</strong> {selectedPause.tab_switches}</p>
                        )}

                        <p><strong>Question Progress:</strong> {selectedPause.question_progress || 0}%</p>
                    </div>
                </div>
            )}

            <div className="timeline-controls">
                <button onClick={() => setZoomLevel(1)}>Reset Zoom</button>
                <button onClick={() => setZoomLevel(zoomLevel * 1.5)}>Zoom In</button>
                <button onClick={() => setZoomLevel(zoomLevel / 1.5)}>Zoom Out</button>
            </div>
        </div>
    );
};

export default PauseTimeline;
