/**
 * Smartphone Controller
 * Main application controller for Overlap Field
 */

class OverlapFieldApp {
    constructor() {
        this.renderer = null;
        this.currentProblem = null;
        this.isAnimating = false;

        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    /**
     * Setup the application
     */
    setup() {
        // Initialize renderer
        this.renderer = new OverlapFieldRenderer('overlapCanvas', {
            xMin: -5,
            xMax: 5,
            yMin: -5,
            yMax: 5,
            gridSize: 100,
            colorIntensity: 0.7
        });

        // Setup event listeners
        this.setupEventListeners();

        console.log('Overlap Field App initialized');
    }

    /**
     * Setup UI event listeners
     */
    setupEventListeners() {
        // Grid size control
        const gridSizeSlider = document.getElementById('gridSize');
        const gridSizeValue = document.getElementById('gridSizeValue');

        if (gridSizeSlider) {
            gridSizeSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                gridSizeValue.textContent = value;
                this.renderer.updateConfig({ gridSize: value });
            });
        }

        // Color intensity control
        const colorIntensitySlider = document.getElementById('colorIntensity');
        const colorIntensityValue = document.getElementById('colorIntensityValue');

        if (colorIntensitySlider) {
            colorIntensitySlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                colorIntensityValue.textContent = value.toFixed(1);
                this.renderer.updateConfig({ colorIntensity: value });
            });
        }

        // Reset button
        const resetBtn = document.getElementById('resetView');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.reset();
            });
        }

        // Animation toggle
        const animationBtn = document.getElementById('toggleAnimation');
        if (animationBtn) {
            animationBtn.addEventListener('click', () => {
                this.toggleAnimation();
            });
        }

        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    /**
     * Load a problem from Moodle
     * @param {Object} problemData - Problem data from Moodle
     */
    loadProblem(problemData) {
        console.log('Loading problem:', problemData);

        this.currentProblem = problemData;

        // Update problem title
        const titleElement = document.getElementById('problemTitle');
        if (titleElement && problemData.name) {
            titleElement.textContent = problemData.name;
        }

        // Display inequalities list
        this.displayInequalities(problemData.inequalities);

        // Load inequalities into renderer
        if (problemData.inequalities && problemData.inequalities.length > 0) {
            this.renderer.loadInequalities(problemData.inequalities);
        }

        // Apply custom configuration if provided
        if (problemData.config) {
            this.renderer.updateConfig(problemData.config);
        }

        // Update legend
        this.updateLegend();
    }

    /**
     * Display inequalities in the UI
     * @param {Array<string>} inequalities - Array of inequality strings
     */
    displayInequalities(inequalities) {
        const listElement = document.getElementById('inequalitiesList');

        if (!listElement) {
            return;
        }

        listElement.innerHTML = '';

        if (!inequalities || inequalities.length === 0) {
            listElement.innerHTML = '<p style="color: #999;">부등식이 없습니다</p>';
            return;
        }

        inequalities.forEach((ineq, index) => {
            const item = document.createElement('div');
            item.className = 'inequality-item fade-in';
            item.style.animationDelay = `${index * 0.1}s`;

            // Format the inequality with better display
            const formatted = this.formatInequality(ineq);
            item.innerHTML = `<strong>${index + 1}.</strong> ${formatted}`;

            // Add click handler to highlight
            item.addEventListener('click', () => {
                this.highlightInequality(index);
            });

            listElement.appendChild(item);
        });
    }

    /**
     * Format inequality for display
     * @param {string} inequality - Inequality string
     * @returns {string} Formatted string
     */
    formatInequality(inequality) {
        return inequality
            .replace(/\*/g, '·')
            .replace(/>=/, '≥')
            .replace(/<=/, '≤')
            .replace(/x/g, '<i>x</i>')
            .replace(/y/g, '<i>y</i>');
    }

    /**
     * Highlight a specific inequality
     * @param {number} index - Inequality index
     */
    highlightInequality(index) {
        const items = document.querySelectorAll('.inequality-item');

        items.forEach((item, i) => {
            if (i === index) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    /**
     * Update legend with color information
     */
    updateLegend() {
        const legendElement = document.getElementById('legendItems');

        if (!legendElement || !this.renderer.inequalities) {
            return;
        }

        legendElement.innerHTML = '';

        this.renderer.inequalities.forEach((ineq, index) => {
            const item = document.createElement('div');
            item.className = 'legend-item';

            const colorBox = document.createElement('div');
            colorBox.className = 'legend-color';
            colorBox.style.backgroundColor = `rgb(${ineq.color[0]}, ${ineq.color[1]}, ${ineq.color[2]})`;

            const label = document.createElement('span');
            label.textContent = `부등식 ${index + 1}`;

            item.appendChild(colorBox);
            item.appendChild(label);
            legendElement.appendChild(item);
        });

        // Add overlap indicator
        if (this.renderer.inequalities.length > 1) {
            const overlapItem = document.createElement('div');
            overlapItem.className = 'legend-item';
            overlapItem.style.marginTop = '8px';
            overlapItem.style.borderTop = '1px solid #ddd';
            overlapItem.style.paddingTop = '8px';

            const overlapLabel = document.createElement('span');
            overlapLabel.textContent = '진한 색 = 더 많은 교집합';
            overlapLabel.style.fontWeight = '600';
            overlapLabel.style.fontSize = '11px';

            overlapItem.appendChild(overlapLabel);
            legendElement.appendChild(overlapItem);
        }
    }

    /**
     * Toggle animation
     */
    toggleAnimation() {
        const btn = document.getElementById('toggleAnimation');
        this.isAnimating = this.renderer.toggleAnimation();

        if (btn) {
            if (this.isAnimating) {
                btn.classList.add('active');
                btn.textContent = '정지';
            } else {
                btn.classList.remove('active');
                btn.textContent = '애니메이션';
            }
        }
    }

    /**
     * Reset view to defaults
     */
    reset() {
        this.renderer.reset();

        // Reset UI controls
        const gridSizeSlider = document.getElementById('gridSize');
        const gridSizeValue = document.getElementById('gridSizeValue');
        const colorIntensitySlider = document.getElementById('colorIntensity');
        const colorIntensityValue = document.getElementById('colorIntensityValue');

        if (gridSizeSlider) {
            gridSizeSlider.value = 100;
            gridSizeValue.textContent = '100';
        }

        if (colorIntensitySlider) {
            colorIntensitySlider.value = 0.7;
            colorIntensityValue.textContent = '0.7';
        }

        // Stop animation
        if (this.isAnimating) {
            this.toggleAnimation();
        }

        // Clear highlights
        document.querySelectorAll('.inequality-item').forEach(item => {
            item.classList.remove('active');
        });
    }

    /**
     * Handle window resize
     */
    handleResize() {
        if (this.renderer) {
            this.renderer.setupCanvas();
            this.renderer.render();
        }
    }

    /**
     * Get current problem data
     * @returns {Object} Current problem data
     */
    getProblemData() {
        return this.currentProblem;
    }

    /**
     * Export visualization as image
     * @returns {string} Data URL
     */
    exportAsImage() {
        if (this.renderer && this.renderer.canvas) {
            return this.renderer.canvas.toDataURL('image/png');
        }
        return null;
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OverlapFieldApp;
}
