/**
 * Thinking Tempo Map Visualization
 *
 * Interactive visualization of student thinking patterns using D3.js
 *
 * @package    local_thinking_tempo
 * @copyright  2025 KAIST Touch Math Academy
 * @license    MIT
 */

class ThinkingTempoMap {
    /**
     * Constructor
     * @param {string} containerId - DOM element ID for visualization
     * @param {Object} options - Configuration options
     */
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container ${containerId} not found`);
        }

        // Default options
        this.options = {
            width: options.width || 1200,
            height: options.height || 400,
            margin: options.margin || { top: 40, right: 120, bottom: 60, left: 80 },
            colors: options.colors || {
                fast: '#00ff00',      // Green - fast tempo
                normal: '#ffff00',    // Yellow - normal tempo
                deep: '#ff9900',      // Orange - deep thinking
                stuck: '#ff0000'      // Red - stuck
            },
            bucketWidthMs: options.bucketWidthMs || 100  // Time bucket size
        };

        this.data = null;
        this.svg = null;
        this.tooltip = null;
    }

    /**
     * Initialize the visualization
     * @param {Array} mapData - Tempo map data from analyzer
     */
    init(mapData) {
        this.data = mapData;
        this._createSVG();
        this._createTooltip();
        this._render();
    }

    /**
     * Create SVG container
     */
    _createSVG() {
        // Clear existing content
        this.container.innerHTML = '';

        // Create SVG
        this.svg = d3.select(this.container)
            .append('svg')
            .attr('width', this.options.width)
            .attr('height', this.options.height)
            .attr('class', 'thinking-tempo-map');

        // Create chart group
        this.chartGroup = this.svg.append('g')
            .attr('transform',
                `translate(${this.options.margin.left}, ${this.options.margin.top})`);

        this.chartWidth = this.options.width - this.options.margin.left - this.options.margin.right;
        this.chartHeight = this.options.height - this.options.margin.top - this.options.margin.bottom;
    }

    /**
     * Create tooltip element
     */
    _createTooltip() {
        this.tooltip = d3.select(this.container)
            .append('div')
            .attr('class', 'tempo-tooltip')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('background-color', 'white')
            .style('border', '1px solid #ddd')
            .style('border-radius', '4px')
            .style('padding', '10px')
            .style('pointer-events', 'none')
            .style('font-size', '12px')
            .style('box-shadow', '0 2px 4px rgba(0,0,0,0.1)');
    }

    /**
     * Render the visualization
     */
    _render() {
        // Prepare scales
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(this.data, d => d.bucket_end / 1000)])  // Convert to ms
            .range([0, this.chartWidth]);

        const yScale = d3.scaleLinear()
            .domain([0, 100])  // Tempo score 0-100
            .range([this.chartHeight, 0]);

        const colorScale = d3.scaleLinear()
            .domain([0, 25, 50, 75, 100])
            .range([
                this.options.colors.stuck,
                this.options.colors.deep,
                this.options.colors.normal,
                this.options.colors.fast,
                this.options.colors.fast
            ]);

        // Create axes
        const xAxis = d3.axisBottom(xScale)
            .tickFormat(d => `${(d / 1000).toFixed(1)}s`);

        const yAxis = d3.axisLeft(yScale)
            .tickFormat(d => `${d}%`);

        // Add X axis
        this.chartGroup.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${this.chartHeight})`)
            .call(xAxis)
            .append('text')
            .attr('x', this.chartWidth / 2)
            .attr('y', 40)
            .attr('fill', 'black')
            .attr('text-anchor', 'middle')
            .text('Time (seconds)');

        // Add Y axis
        this.chartGroup.append('g')
            .attr('class', 'y-axis')
            .call(yAxis)
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -this.chartHeight / 2)
            .attr('y', -60)
            .attr('fill', 'black')
            .attr('text-anchor', 'middle')
            .text('Thinking Tempo Score');

        // Create tempo bars
        const barWidth = this.chartWidth / this.data.length;

        this.chartGroup.selectAll('.tempo-bar')
            .data(this.data)
            .enter()
            .append('rect')
            .attr('class', 'tempo-bar')
            .attr('x', d => xScale(d.bucket_start / 1000))
            .attr('y', d => yScale(d.tempo_score))
            .attr('width', barWidth - 1)
            .attr('height', d => this.chartHeight - yScale(d.tempo_score))
            .attr('fill', d => colorScale(d.tempo_score))
            .attr('opacity', 0.7)
            .on('mouseover', (event, d) => this._showTooltip(event, d))
            .on('mouseout', () => this._hideTooltip())
            .on('mousemove', (event) => this._moveTooltip(event));

        // Add activity level overlay (as line)
        const activityScale = d3.scaleLinear()
            .domain([0, d3.max(this.data, d => d.activity_level)])
            .range([this.chartHeight, 0]);

        const line = d3.line()
            .x(d => xScale(d.bucket_start / 1000) + barWidth / 2)
            .y(d => activityScale(d.activity_level))
            .curve(d3.curveMonotoneX);

        this.chartGroup.append('path')
            .datum(this.data)
            .attr('class', 'activity-line')
            .attr('d', line)
            .attr('fill', 'none')
            .attr('stroke', '#333')
            .attr('stroke-width', 2)
            .attr('opacity', 0.5);

        // Add legend
        this._addLegend();

        // Add title
        this.svg.append('text')
            .attr('x', this.options.width / 2)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .attr('font-size', '16px')
            .attr('font-weight', 'bold')
            .text('Thinking Tempo Map - Cognitive Activity Over Time');
    }

    /**
     * Add legend
     */
    _addLegend() {
        const legend = this.svg.append('g')
            .attr('class', 'legend')
            .attr('transform',
                `translate(${this.options.width - this.options.margin.right + 20}, ${this.options.margin.top})`);

        const legendData = [
            { label: 'Fast Tempo', color: this.options.colors.fast },
            { label: 'Normal Tempo', color: this.options.colors.normal },
            { label: 'Deep Thinking', color: this.options.colors.deep },
            { label: 'Stuck', color: this.options.colors.stuck }
        ];

        const legendItems = legend.selectAll('.legend-item')
            .data(legendData)
            .enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * 25})`);

        legendItems.append('rect')
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', d => d.color);

        legendItems.append('text')
            .attr('x', 20)
            .attr('y', 12)
            .attr('font-size', '12px')
            .text(d => d.label);

        // Activity line legend
        legend.append('line')
            .attr('x1', 0)
            .attr('y1', 110)
            .attr('x2', 15)
            .attr('y2', 110)
            .attr('stroke', '#333')
            .attr('stroke-width', 2);

        legend.append('text')
            .attr('x', 20)
            .attr('y', 114)
            .attr('font-size', '12px')
            .text('Activity Level');
    }

    /**
     * Show tooltip
     */
    _showTooltip(event, data) {
        const tempoCategory = this._getTempoCategory(data.tempo_score);

        const html = `
            <div>
                <strong>Time:</strong> ${(data.bucket_start / 1000000).toFixed(2)}s - ${(data.bucket_end / 1000000).toFixed(2)}s<br>
                <strong>Tempo:</strong> ${tempoCategory} (${data.tempo_score.toFixed(1)})<br>
                <strong>Events:</strong> ${data.event_count}<br>
                <strong>Activity:</strong> ${data.activity_level}<br>
                ${data.dominant_event_type ? `<strong>Main Action:</strong> ${data.dominant_event_type}` : ''}
            </div>
        `;

        this.tooltip
            .html(html)
            .style('opacity', 1);
    }

    /**
     * Hide tooltip
     */
    _hideTooltip() {
        this.tooltip.style('opacity', 0);
    }

    /**
     * Move tooltip with mouse
     */
    _moveTooltip(event) {
        const rect = this.container.getBoundingClientRect();
        this.tooltip
            .style('left', (event.clientX - rect.left + 10) + 'px')
            .style('top', (event.clientY - rect.top - 10) + 'px');
    }

    /**
     * Get tempo category from score
     */
    _getTempoCategory(score) {
        if (score >= 75) return 'Fast';
        if (score >= 50) return 'Normal';
        if (score >= 25) return 'Deep Thinking';
        return 'Stuck';
    }

    /**
     * Update visualization with new data
     */
    update(newData) {
        this.data = newData;
        this.chartGroup.remove();
        this._render();
    }

    /**
     * Export as PNG
     */
    exportPNG(filename = 'tempo-map.png') {
        const svgElement = this.svg.node();
        const svgString = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = this.options.width;
            canvas.height = this.options.height;
            ctx.drawImage(img, 0, 0);

            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);
            });
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
    }
}

/**
 * Heatmap visualization for multiple sessions comparison
 */
class ThinkingTempoHeatmap {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            width: options.width || 800,
            height: options.height || 600,
            margin: options.margin || { top: 60, right: 120, bottom: 100, left: 150 }
        };
    }

    /**
     * Render heatmap
     * @param {Array} sessions - Array of session data
     */
    render(sessions) {
        // Clear container
        this.container.innerHTML = '';

        // Create SVG
        const svg = d3.select(this.container)
            .append('svg')
            .attr('width', this.options.width)
            .attr('height', this.options.height);

        const chartWidth = this.options.width - this.options.margin.left - this.options.margin.right;
        const chartHeight = this.options.height - this.options.margin.top - this.options.margin.bottom;

        const g = svg.append('g')
            .attr('transform', `translate(${this.options.margin.left}, ${this.options.margin.top})`);

        // Prepare data
        const questions = [...new Set(sessions.map(s => s.question_id))];
        const students = [...new Set(sessions.map(s => s.userid))];

        // Create scales
        const xScale = d3.scaleBand()
            .domain(questions)
            .range([0, chartWidth])
            .padding(0.05);

        const yScale = d3.scaleBand()
            .domain(students)
            .range([0, chartHeight])
            .padding(0.05);

        const colorScale = d3.scaleSequential()
            .domain([0, 100])
            .interpolator(d3.interpolateRdYlGn);

        // Create cells
        g.selectAll('rect')
            .data(sessions)
            .enter()
            .append('rect')
            .attr('x', d => xScale(d.question_id))
            .attr('y', d => yScale(d.userid))
            .attr('width', xScale.bandwidth())
            .attr('height', yScale.bandwidth())
            .attr('fill', d => colorScale(d.avg_tempo_score || 50))
            .attr('stroke', 'white')
            .attr('stroke-width', 1);

        // Add axes
        g.append('g')
            .attr('transform', `translate(0, ${chartHeight})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end');

        g.append('g')
            .call(d3.axisLeft(yScale));

        // Add labels
        svg.append('text')
            .attr('x', this.options.width / 2)
            .attr('y', 30)
            .attr('text-anchor', 'middle')
            .attr('font-size', '16px')
            .attr('font-weight', 'bold')
            .text('Student Thinking Tempo Heatmap');

        svg.append('text')
            .attr('x', this.options.width / 2)
            .attr('y', this.options.height - 10)
            .attr('text-anchor', 'middle')
            .text('Questions');

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -this.options.height / 2)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .text('Students');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ThinkingTempoMap, ThinkingTempoHeatmap };
}
