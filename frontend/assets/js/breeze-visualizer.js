/**
 * Deviation Breeze Visualizer
 * D3.js-based visualization of learning deviation
 */

class BreezeVisualizer {
    constructor(svgId, containerId) {
        this.svg = d3.select(`#${svgId}`);
        this.container = document.getElementById(containerId);
        this.width = this.container.clientWidth;
        this.height = 500;
        this.data = null;
        this.simulation = null;

        this.init();
    }

    init() {
        // Setup SVG
        this.svg
            .attr('width', this.width)
            .attr('height', this.height);

        // Add zoom capability
        const zoom = d3.zoom()
            .scaleExtent([0.5, 3])
            .on('zoom', () => {
                this.g.attr('transform', d3.event.transform);
            });

        this.svg.call(zoom);

        // Main group
        this.g = this.svg.append('g');

        // Add defs for gradients and filters
        this.addDefs();

        // Resize handler
        window.addEventListener('resize', () => this.handleResize());
    }

    addDefs() {
        const defs = this.svg.append('defs');

        // Gradient for background
        const gradient = defs.append('linearGradient')
            .attr('id', 'bgGradient')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '100%')
            .attr('y2', '100%');

        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#667eea');

        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#764ba2');

        // Glow filter
        const filter = defs.append('filter')
            .attr('id', 'glow');

        filter.append('feGaussianBlur')
            .attr('stdDeviation', '3')
            .attr('result', 'coloredBlur');

        const feMerge = filter.append('feMerge');
        feMerge.append('feMergeNode').attr('in', 'coloredBlur');
        feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    }

    /**
     * Render deviation data
     */
    render(data) {
        this.data = data;

        // Clear previous visualization
        this.g.selectAll('*').remove();

        // Hide placeholder
        this.container.querySelector('.breeze-placeholder').style.display = 'none';
        this.svg.classed('active', true);

        // Draw visualization
        this.drawVisualization();
        this.addLegend();
        this.addStatsOverlay();
    }

    drawVisualization() {
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const students = this.data.students;

        // Calculate positions based on deviation
        const maxDeviation = Math.max(...students.map(s => Math.abs(s.deviation)));
        const scale = Math.min(this.width, this.height) / 3 / (maxDeviation + 1);

        students.forEach(student => {
            const angle = (student.breeze.direction * Math.PI) / 180;
            const distance = Math.abs(student.deviation) * scale;

            student.x = centerX + Math.cos(angle) * distance;
            student.y = centerY + Math.sin(angle) * distance;
        });

        // Draw connection lines from center
        this.g.selectAll('.connection-line')
            .data(students)
            .enter()
            .append('line')
            .attr('class', 'connection-line')
            .attr('x1', centerX)
            .attr('y1', centerY)
            .attr('x2', d => d.x)
            .attr('y2', d => d.y)
            .style('stroke-opacity', d => d.breeze.intensity / 200);

        // Draw center point (average)
        this.g.append('circle')
            .attr('class', 'center-point')
            .attr('cx', centerX)
            .attr('cy', centerY)
            .attr('r', 15);

        this.g.append('text')
            .attr('class', 'center-label')
            .attr('x', centerX)
            .attr('y', centerY + 5)
            .text('평균');

        // Draw student nodes
        const nodes = this.g.selectAll('.student-node')
            .data(students)
            .enter()
            .append('g')
            .attr('class', d => `student-node cluster-${d.cluster}`)
            .attr('transform', d => `translate(${d.x}, ${d.y})`)
            .on('mouseover', (d) => this.showTooltip(d))
            .on('mouseout', () => this.hideTooltip())
            .on('click', (d) => this.onStudentClick(d));

        // Student circles
        nodes.append('circle')
            .attr('r', 0)
            .transition()
            .duration(800)
            .attr('r', d => 8 + (d.breeze.intensity / 10));

        // Student labels (rank or name)
        nodes.append('text')
            .attr('class', 'node-label')
            .attr('y', 4)
            .text(d => d.rank)
            .style('opacity', 0)
            .transition()
            .delay(800)
            .duration(400)
            .style('opacity', 1);

        // Animate breeze effect
        this.animateBreezeEffect(students, centerX, centerY);

        // Start force simulation for collision detection
        this.startSimulation(students);
    }

    /**
     * Animate breeze effect (wind-like particles)
     */
    animateBreezeEffect(students, centerX, centerY) {
        const particleCount = 50;
        const particles = [];

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                angle: Math.random() * 360,
                distance: Math.random() * Math.min(this.width, this.height) / 2,
                speed: 0.5 + Math.random() * 2
            });
        }

        const particleGroup = this.g.append('g').attr('class', 'breeze-particles');

        const particleElements = particleGroup.selectAll('.breeze-particle')
            .data(particles)
            .enter()
            .append('circle')
            .attr('class', 'breeze-particle')
            .attr('r', 2)
            .attr('cx', centerX)
            .attr('cy', centerY);

        // Animate particles
        const animateParticles = () => {
            particleElements
                .transition()
                .duration(d => 2000 / d.speed)
                .ease(d3.easeLinear)
                .attr('cx', d => {
                    const angle = (d.angle * Math.PI) / 180;
                    return centerX + Math.cos(angle) * d.distance;
                })
                .attr('cy', d => {
                    const angle = (d.angle * Math.PI) / 180;
                    return centerY + Math.sin(angle) * d.distance;
                })
                .style('opacity', 0)
                .on('end', function(d) {
                    d.angle = Math.random() * 360;
                    d3.select(this)
                        .attr('cx', centerX)
                        .attr('cy', centerY)
                        .style('opacity', 0.6);

                    animateParticles();
                });
        };

        animateParticles();
    }

    /**
     * Start force simulation
     */
    startSimulation(students) {
        this.simulation = d3.forceSimulation(students)
            .force('collision', d3.forceCollide().radius(d => 12 + (d.breeze.intensity / 10)))
            .force('charge', d3.forceManyBody().strength(-30))
            .on('tick', () => {
                this.g.selectAll('.student-node')
                    .attr('transform', d => `translate(${d.x}, ${d.y})`);

                this.g.selectAll('.connection-line')
                    .attr('x2', d => d.x)
                    .attr('y2', d => d.y);
            });
    }

    /**
     * Show tooltip
     */
    showTooltip(student) {
        const tooltip = this.getOrCreateTooltip();

        tooltip.innerHTML = `
            <div class="tooltip-name">${student.name}</div>
            <div class="tooltip-row">
                <span class="tooltip-label">점수:</span>
                <span class="tooltip-value">${student.score.toFixed(2)}</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">순위:</span>
                <span class="tooltip-value">${student.rank}위</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">백분위:</span>
                <span class="tooltip-value">${student.percentile}%</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">편차:</span>
                <span class="tooltip-value">${student.deviation.toFixed(2)}</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">그룹:</span>
                <span class="tooltip-value">${this.getClusterLabel(student.cluster)}</span>
            </div>
        `;

        tooltip.classList.add('active');

        // Position tooltip
        const rect = this.container.getBoundingClientRect();
        tooltip.style.left = (d3.event.pageX - rect.left + 15) + 'px';
        tooltip.style.top = (d3.event.pageY - rect.top - 15) + 'px';
    }

    /**
     * Hide tooltip
     */
    hideTooltip() {
        const tooltip = this.getOrCreateTooltip();
        tooltip.classList.remove('active');
    }

    /**
     * Get or create tooltip element
     */
    getOrCreateTooltip() {
        let tooltip = this.container.querySelector('.breeze-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.className = 'breeze-tooltip';
            this.container.appendChild(tooltip);
        }
        return tooltip;
    }

    /**
     * Add legend
     */
    addLegend() {
        const legend = document.createElement('div');
        legend.className = 'breeze-legend';
        legend.innerHTML = `
            <h6><i class="fas fa-info-circle"></i> 범례</h6>
            <div class="legend-item">
                <div class="legend-color high"></div>
                <span>상위 (Z-score ≥ 1.0)</span>
            </div>
            <div class="legend-item">
                <div class="legend-color medium"></div>
                <span>중위 (-1.0 < Z < 1.0)</span>
            </div>
            <div class="legend-item">
                <div class="legend-color low"></div>
                <span>하위 (Z-score ≤ -1.0)</span>
            </div>
            <div class="legend-item">
                <div class="legend-color outlier"></div>
                <span>이상치 (|Z| > 2.5)</span>
            </div>
        `;

        this.container.appendChild(legend);
    }

    /**
     * Add stats overlay
     */
    addStatsOverlay() {
        const stats = this.data.statistics;
        const overlay = document.createElement('div');
        overlay.className = 'stats-overlay';
        overlay.innerHTML = `
            <h6><i class="fas fa-chart-bar"></i> 통계</h6>
            <div class="stat-item">
                <span class="stat-label">평균:</span>
                <span class="stat-value">${stats.avg_score.toFixed(2)}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">표준편차:</span>
                <span class="stat-value">${stats.std_deviation.toFixed(2)}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">학생 수:</span>
                <span class="stat-value">${stats.total_students}명</span>
            </div>
        `;

        this.container.appendChild(overlay);
    }

    /**
     * Handle student node click
     */
    onStudentClick(student) {
        console.log('Student clicked:', student);

        // Highlight selected student
        this.g.selectAll('.student-node').classed('highlighted', false);
        this.g.selectAll(`.student-node`).filter(d => d.id === student.id)
            .classed('highlighted', true);

        // Show in smartphone simulator
        if (window.smartphone) {
            smartphone.showLoading(`${student.name}의 정보를 불러오는 중...`);

            // Simulate loading student details
            setTimeout(() => {
                smartphone.screen.innerHTML = `
                    <div class="smartphone-content">
                        <div class="text-center">
                            <h5 class="mb-3">${student.name}</h5>
                            <div class="student-stats">
                                <div class="stat-box mb-3">
                                    <h3 class="text-primary">${student.score.toFixed(1)}</h3>
                                    <p class="text-muted">점수</p>
                                </div>
                                <div class="row">
                                    <div class="col-6">
                                        <div class="stat-box">
                                            <h5>${student.rank}</h5>
                                            <p class="text-muted small">순위</p>
                                        </div>
                                    </div>
                                    <div class="col-6">
                                        <div class="stat-box">
                                            <h5>${student.percentile}%</h5>
                                            <p class="text-muted small">백분위</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="stat-box mt-3">
                                    <h5>${student.deviation.toFixed(2)}</h5>
                                    <p class="text-muted">Z-score (편차)</p>
                                </div>
                                <div class="badge cluster-${student.cluster} mt-3">
                                    ${this.getClusterLabel(student.cluster)}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }, 500);
        }
    }

    /**
     * Get cluster label in Korean
     */
    getClusterLabel(cluster) {
        const labels = {
            'high': '상위권',
            'medium': '중위권',
            'low': '하위권',
            'outlier': '이상치'
        };
        return labels[cluster] || cluster;
    }

    /**
     * Handle window resize
     */
    handleResize() {
        this.width = this.container.clientWidth;
        this.svg.attr('width', this.width);

        if (this.data) {
            this.render(this.data);
        }
    }

    /**
     * Clear visualization
     */
    clear() {
        this.g.selectAll('*').remove();
        this.svg.classed('active', false);
        this.container.querySelector('.breeze-placeholder').style.display = 'flex';

        // Remove overlays
        const legend = this.container.querySelector('.breeze-legend');
        const stats = this.container.querySelector('.stats-overlay');
        if (legend) legend.remove();
        if (stats) stats.remove();
    }
}

// Export for use in other scripts
window.BreezeVisualizer = BreezeVisualizer;
