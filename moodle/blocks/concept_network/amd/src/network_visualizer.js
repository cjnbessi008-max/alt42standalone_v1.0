// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Concept Network Visualizer using D3.js
 *
 * @module     block_concept_network/network_visualizer
 * @package    block_concept_network
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['jquery', 'core/ajax', 'core/notification'], function($, ajax, notification) {

    var NetworkVisualizer = function(courseid, studentid, blockid) {
        this.courseid = courseid;
        this.studentid = studentid;
        this.blockid = blockid;
        this.canvasId = 'network-canvas-' + blockid;
        this.network = null;
        this.simulation = null;
    };

    /**
     * Initialize the visualizer
     */
    NetworkVisualizer.prototype.init = function() {
        var self = this;

        // Load D3.js from CDN (or local if available)
        this.loadD3(function() {
            self.fetchNetwork();
        });

        // Setup regenerate button handler
        $('#regenerate-network-btn').on('click', function(e) {
            e.preventDefault();
            self.regenerateNetwork();
        });
    };

    /**
     * Load D3.js library
     */
    NetworkVisualizer.prototype.loadD3 = function(callback) {
        if (typeof d3 !== 'undefined') {
            callback();
            return;
        }

        // Load D3.js from CDN
        var script = document.createElement('script');
        script.src = 'https://d3js.org/d3.v7.min.js';
        script.onload = callback;
        document.head.appendChild(script);
    };

    /**
     * Fetch network data from server
     */
    NetworkVisualizer.prototype.fetchNetwork = function() {
        var self = this;

        ajax.call([{
            methodname: 'block_concept_network_get_network',
            args: {
                courseid: this.courseid,
                studentid: this.studentid
            },
            done: function(data) {
                self.network = typeof data === 'string' ? JSON.parse(data) : data;
                self.renderNetwork();
            },
            fail: function(error) {
                notification.exception(error);
                // Fallback to direct AJAX if web service not available
                self.fetchNetworkFallback();
            }
        }]);
    };

    /**
     * Fallback method using direct AJAX
     */
    NetworkVisualizer.prototype.fetchNetworkFallback = function() {
        var self = this;

        $.ajax({
            url: M.cfg.wwwroot + '/blocks/concept_network/ajax.php',
            method: 'GET',
            data: {
                action: 'get_network',
                courseid: this.courseid,
                studentid: this.studentid,
                sesskey: M.cfg.sesskey
            },
            success: function(data) {
                self.network = typeof data === 'string' ? JSON.parse(data) : data;
                self.renderNetwork();
            },
            error: function(xhr, status, error) {
                notification.alert('Error', 'Failed to load concept network: ' + error);
            }
        });
    };

    /**
     * Regenerate network
     */
    NetworkVisualizer.prototype.regenerateNetwork = function() {
        var self = this;

        // Show loading indicator
        $('#' + this.canvasId).html('<div class="text-center"><i class="fa fa-spinner fa-spin fa-3x"></i></div>');

        $.ajax({
            url: M.cfg.wwwroot + '/blocks/concept_network/ajax.php',
            method: 'POST',
            data: {
                action: 'regenerate_network',
                courseid: this.courseid,
                studentid: this.studentid,
                sesskey: M.cfg.sesskey
            },
            success: function(response) {
                if (response.success) {
                    self.network = response.network;
                    self.renderNetwork();
                    notification.alert('Success', 'Network regenerated successfully');
                } else {
                    notification.alert('Error', response.error);
                }
            },
            error: function(xhr, status, error) {
                notification.alert('Error', 'Failed to regenerate network: ' + error);
            }
        });
    };

    /**
     * Render network visualization
     */
    NetworkVisualizer.prototype.renderNetwork = function() {
        if (!this.network || !this.network.nodes || this.network.nodes.length === 0) {
            $('#' + this.canvasId).html('<p class="text-center">No concept network data available.</p>');
            return;
        }

        var canvas = document.getElementById(this.canvasId);
        var width = canvas.offsetWidth;
        var height = canvas.offsetHeight;

        // Clear existing SVG
        d3.select('#' + this.canvasId).selectAll('*').remove();

        // Create SVG
        var svg = d3.select('#' + this.canvasId)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        // Create zoom behavior
        var zoom = d3.zoom()
            .scaleExtent([0.5, 3])
            .on('zoom', function(event) {
                g.attr('transform', event.transform);
            });

        svg.call(zoom);

        var g = svg.append('g');

        // Define arrow markers for directed edges
        svg.append('defs').selectAll('marker')
            .data(['prerequisite'])
            .enter().append('marker')
            .attr('id', function(d) { return 'arrow-' + d; })
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 20)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#999');

        // Color scale for mastery level
        var colorScale = d3.scaleLinear()
            .domain([0, 50, 100])
            .range(['#ff4444', '#ffbb33', '#00C851']);

        // Create force simulation
        this.simulation = d3.forceSimulation(this.network.nodes)
            .force('link', d3.forceLink(this.network.edges)
                .id(function(d) { return d.id; })
                .distance(function(d) { return 100 - (d.strength * 50); }))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(function(d) {
                return 10 + (d.mastery_level / 5);
            }));

        // Create edges
        var link = g.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(this.network.edges)
            .enter().append('line')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', function(d) { return 1 + (d.strength * 3); })
            .attr('marker-end', function(d) {
                return d.type === 'prerequisite' ? 'url(#arrow-prerequisite)' : '';
            });

        // Create nodes
        var node = g.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(this.network.nodes)
            .enter().append('g')
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended));

        var self = this;

        // Add circles for nodes
        node.append('circle')
            .attr('r', function(d) { return 10 + (d.mastery_level / 5); })
            .attr('fill', function(d) { return colorScale(d.mastery_level); })
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);

        // Add labels
        node.append('text')
            .attr('dx', 12)
            .attr('dy', '.35em')
            .text(function(d) { return d.name; })
            .style('font-size', '12px')
            .style('font-family', 'Arial, sans-serif');

        // Add tooltips
        node.append('title')
            .text(function(d) {
                return d.name + '\n' +
                    'Mastery: ' + d.mastery_level.toFixed(1) + '%\n' +
                    'Attempts: ' + d.total_attempts + '\n' +
                    'Avg Score: ' + d.avg_score.toFixed(1) + '%';
            });

        // Update positions on simulation tick
        this.simulation.on('tick', function() {
            link
                .attr('x1', function(d) { return d.source.x; })
                .attr('y1', function(d) { return d.source.y; })
                .attr('x2', function(d) { return d.target.x; })
                .attr('y2', function(d) { return d.target.y; });

            node
                .attr('transform', function(d) {
                    return 'translate(' + d.x + ',' + d.y + ')';
                });
        });

        // Drag functions
        function dragstarted(event, d) {
            if (!event.active) self.simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) self.simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        // Add legend
        this.addLegend(svg, width, height, colorScale);
    };

    /**
     * Add legend to visualization
     */
    NetworkVisualizer.prototype.addLegend = function(svg, width, height, colorScale) {
        var legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', 'translate(' + (width - 150) + ', 20)');

        // Mastery level legend
        legend.append('text')
            .attr('x', 0)
            .attr('y', 0)
            .text('Mastery Level')
            .style('font-weight', 'bold')
            .style('font-size', '12px');

        var legendData = [
            { level: 0, label: 'Low (0%)' },
            { level: 50, label: 'Medium (50%)' },
            { level: 100, label: 'High (100%)' }
        ];

        var legendItems = legend.selectAll('.legend-item')
            .data(legendData)
            .enter().append('g')
            .attr('class', 'legend-item')
            .attr('transform', function(d, i) { return 'translate(0,' + (20 + i * 20) + ')'; });

        legendItems.append('circle')
            .attr('r', 6)
            .attr('fill', function(d) { return colorScale(d.level); });

        legendItems.append('text')
            .attr('x', 15)
            .attr('y', 4)
            .text(function(d) { return d.label; })
            .style('font-size', '11px');

        // Relationship types legend
        var relLegend = svg.append('g')
            .attr('class', 'rel-legend')
            .attr('transform', 'translate(20, 20)');

        relLegend.append('text')
            .attr('x', 0)
            .attr('y', 0)
            .text('Relationships')
            .style('font-weight', 'bold')
            .style('font-size', '12px');

        var relTypes = [
            { type: 'prerequisite', label: 'Prerequisite →' },
            { type: 'similar', label: 'Similar' },
            { type: 'temporal', label: 'Temporal' }
        ];

        var relItems = relLegend.selectAll('.rel-item')
            .data(relTypes)
            .enter().append('g')
            .attr('class', 'rel-item')
            .attr('transform', function(d, i) { return 'translate(0,' + (20 + i * 20) + ')'; });

        relItems.append('line')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', 30)
            .attr('y2', 0)
            .attr('stroke', '#999')
            .attr('stroke-width', 2)
            .attr('marker-end', function(d) {
                return d.type === 'prerequisite' ? 'url(#arrow-prerequisite)' : '';
            });

        relItems.append('text')
            .attr('x', 35)
            .attr('y', 4)
            .text(function(d) { return d.label; })
            .style('font-size', '11px');
    };

    return {
        /**
         * Initialize module
         */
        init: function(params) {
            var visualizer = new NetworkVisualizer(
                params.courseid,
                params.studentid,
                params.blockid
            );
            visualizer.init();
        }
    };
});
