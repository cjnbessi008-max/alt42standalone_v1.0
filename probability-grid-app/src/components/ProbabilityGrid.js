/**
 * Probability Grid Component
 * Displays probability space as a colored grid
 *
 * Features:
 * - Dynamic grid sizing based on problem data
 * - Interactive cell highlighting
 * - Event probability visualization
 * - Touch and mouse support
 */

class ProbabilityGrid {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container ${containerId} not found`);
        }

        // Default options
        this.options = {
            width: options.width || 10,
            height: options.height || 10,
            cellSize: options.cellSize || 40,
            cellGap: options.cellGap || 2,
            showProbability: options.showProbability !== false,
            interactive: options.interactive !== false,
            colorScheme: options.colorScheme || {
                background: '#FFFFFF',
                border: '#000000',
                text: '#000000'
            },
            events: options.events || [],
            onCellClick: options.onCellClick || null,
            onCellHover: options.onCellHover || null
        };

        this.selectedCells = new Set();
        this.hoveredCell = null;

        this.init();
    }

    init() {
        this.createCanvas();
        this.render();
        this.attachEventListeners();
    }

    createCanvas() {
        // Create SVG element for the grid
        const totalWidth = this.options.width * (this.options.cellSize + this.options.cellGap);
        const totalHeight = this.options.height * (this.options.cellSize + this.options.cellGap);

        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('width', totalWidth);
        this.svg.setAttribute('height', totalHeight);
        this.svg.setAttribute('viewBox', `0 0 ${totalWidth} ${totalHeight}`);
        this.svg.style.backgroundColor = this.options.colorScheme.background;
        this.svg.classList.add('probability-grid');

        this.container.innerHTML = '';
        this.container.appendChild(this.svg);
    }

    render() {
        // Clear existing cells
        this.svg.innerHTML = '';

        // Create grid cells
        const totalCells = this.options.width * this.options.height;
        const cellEventMap = this.buildCellEventMap();

        for (let i = 0; i < totalCells; i++) {
            const row = Math.floor(i / this.options.width);
            const col = i % this.options.width;
            const event = cellEventMap[i];

            this.createCell(row, col, i, event);
        }

        // Add legend if events exist
        if (this.options.events.length > 0) {
            this.createLegend();
        }
    }

    buildCellEventMap() {
        const map = {};

        // Map each cell to its event
        this.options.events.forEach(event => {
            if (event.cells && Array.isArray(event.cells)) {
                event.cells.forEach(cellIndex => {
                    map[cellIndex] = event;
                });
            }
        });

        return map;
    }

    createCell(row, col, index, event) {
        const x = col * (this.options.cellSize + this.options.cellGap);
        const y = row * (this.options.cellSize + this.options.cellGap);
        const size = this.options.cellSize;

        // Create cell group
        const cellGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        cellGroup.setAttribute('data-cell-index', index);
        cellGroup.classList.add('grid-cell');

        if (this.options.interactive) {
            cellGroup.style.cursor = 'pointer';
        }

        // Create rectangle
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', size);
        rect.setAttribute('height', size);
        rect.setAttribute('fill', event ? event.color : '#E0E0E0');
        rect.setAttribute('stroke', this.options.colorScheme.border);
        rect.setAttribute('stroke-width', '2');
        rect.setAttribute('rx', '4'); // Rounded corners
        rect.classList.add('cell-rect');

        cellGroup.appendChild(rect);

        // Add probability label if enabled and event exists
        if (this.options.showProbability && event) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x + size / 2);
            text.setAttribute('y', y + size / 2);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('fill', this.options.colorScheme.text);
            text.setAttribute('font-size', '12');
            text.setAttribute('font-weight', 'bold');
            text.classList.add('cell-label');

            // Format probability as percentage or fraction
            const probText = this.formatProbability(event.probability);
            text.textContent = probText;

            cellGroup.appendChild(text);
        }

        this.svg.appendChild(cellGroup);
    }

    formatProbability(prob) {
        // Convert to percentage
        const percent = Math.round(prob * 100);
        return `${percent}%`;
    }

    createLegend() {
        // Create legend container below the grid
        const legendDiv = document.createElement('div');
        legendDiv.classList.add('probability-legend');
        legendDiv.style.marginTop = '20px';
        legendDiv.style.padding = '10px';
        legendDiv.style.backgroundColor = '#F5F5F5';
        legendDiv.style.borderRadius = '8px';

        const title = document.createElement('div');
        title.textContent = '확률 범례 (Probability Legend)';
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '10px';
        title.style.fontSize = '14px';
        legendDiv.appendChild(title);

        this.options.events.forEach(event => {
            const item = document.createElement('div');
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.marginBottom = '5px';

            const colorBox = document.createElement('div');
            colorBox.style.width = '20px';
            colorBox.style.height = '20px';
            colorBox.style.backgroundColor = event.color;
            colorBox.style.border = '1px solid #000';
            colorBox.style.borderRadius = '3px';
            colorBox.style.marginRight = '10px';

            const label = document.createElement('span');
            label.textContent = `${event.name}: ${this.formatProbability(event.probability)}`;
            label.style.fontSize = '12px';

            item.appendChild(colorBox);
            item.appendChild(label);
            legendDiv.appendChild(item);
        });

        this.container.appendChild(legendDiv);
    }

    attachEventListeners() {
        if (!this.options.interactive) {
            return;
        }

        // Click handler
        this.svg.addEventListener('click', (e) => {
            const cellGroup = e.target.closest('.grid-cell');
            if (cellGroup) {
                const cellIndex = parseInt(cellGroup.getAttribute('data-cell-index'));
                this.handleCellClick(cellIndex, cellGroup);
            }
        });

        // Hover handler
        this.svg.addEventListener('mouseover', (e) => {
            const cellGroup = e.target.closest('.grid-cell');
            if (cellGroup) {
                const cellIndex = parseInt(cellGroup.getAttribute('data-cell-index'));
                this.handleCellHover(cellIndex, cellGroup);
            }
        });

        this.svg.addEventListener('mouseout', (e) => {
            const cellGroup = e.target.closest('.grid-cell');
            if (cellGroup) {
                this.handleCellUnhover(cellGroup);
            }
        });

        // Touch support for mobile
        this.svg.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            const cellGroup = element.closest('.grid-cell');

            if (cellGroup) {
                const cellIndex = parseInt(cellGroup.getAttribute('data-cell-index'));
                this.handleCellClick(cellIndex, cellGroup);
            }
        });
    }

    handleCellClick(cellIndex, cellGroup) {
        // Toggle selection
        if (this.selectedCells.has(cellIndex)) {
            this.selectedCells.delete(cellIndex);
            cellGroup.classList.remove('selected');
        } else {
            this.selectedCells.add(cellIndex);
            cellGroup.classList.add('selected');
        }

        // Update visual feedback
        const rect = cellGroup.querySelector('.cell-rect');
        if (this.selectedCells.has(cellIndex)) {
            rect.setAttribute('stroke-width', '4');
            rect.setAttribute('stroke', '#FFD700'); // Gold border
        } else {
            rect.setAttribute('stroke-width', '2');
            rect.setAttribute('stroke', this.options.colorScheme.border);
        }

        // Callback
        if (this.options.onCellClick) {
            this.options.onCellClick(cellIndex, this.selectedCells);
        }
    }

    handleCellHover(cellIndex, cellGroup) {
        this.hoveredCell = cellIndex;
        cellGroup.classList.add('hovered');

        const rect = cellGroup.querySelector('.cell-rect');
        rect.style.opacity = '0.8';

        if (this.options.onCellHover) {
            this.options.onCellHover(cellIndex);
        }
    }

    handleCellUnhover(cellGroup) {
        cellGroup.classList.remove('hovered');

        const rect = cellGroup.querySelector('.cell-rect');
        rect.style.opacity = '1';

        this.hoveredCell = null;
    }

    // Public methods
    getSelectedCells() {
        return Array.from(this.selectedCells);
    }

    clearSelection() {
        this.selectedCells.clear();
        this.svg.querySelectorAll('.grid-cell').forEach(cell => {
            cell.classList.remove('selected');
            const rect = cell.querySelector('.cell-rect');
            rect.setAttribute('stroke-width', '2');
            rect.setAttribute('stroke', this.options.colorScheme.border);
        });
    }

    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
        this.render();
    }

    destroy() {
        this.container.innerHTML = '';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProbabilityGrid;
}
