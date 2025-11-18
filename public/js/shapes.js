/**
 * Shape Management Module
 * Handles shape loading and selection
 */

class ShapeManager {
    constructor() {
        this.shapes = [];
        this.currentDifficulty = 1;
    }

    /**
     * Load shapes from API
     */
    async loadShapes(difficulty = null) {
        try {
            UIHelpers.showLoading();

            const result = difficulty !== null ?
                await API.getShapesByDifficulty(difficulty) :
                await API.getShapes();

            this.shapes = result.shapes || [];
            UIHelpers.hideLoading();

            return this.shapes;
        } catch (error) {
            UIHelpers.hideLoading();
            UIHelpers.showToast('도형을 불러오는데 실패했습니다', 'error');
            console.error('Failed to load shapes:', error);
            return [];
        }
    }

    /**
     * Display shapes in grid
     */
    displayShapes(shapes, containerId = 'shapes-list') {
        const container = document.getElementById(containerId);

        if (!container) {
            console.error('Container not found:', containerId);
            return;
        }

        if (!shapes || shapes.length === 0) {
            container.innerHTML = '<div class="loading">사용 가능한 도형이 없습니다</div>';
            return;
        }

        container.innerHTML = '';

        shapes.forEach(shape => {
            const card = this.createShapeCard(shape);
            container.appendChild(card);
        });
    }

    /**
     * Create shape card element
     */
    createShapeCard(shape) {
        const card = document.createElement('div');
        card.className = 'shape-card';
        card.dataset.shapeId = shape.id;

        // Create SVG preview
        const svg = this.createShapeSVG(shape);

        card.innerHTML = `
            <div class="shape-preview">
                ${svg}
            </div>
            <div class="shape-name">${shape.shape_name}</div>
            <div class="shape-difficulty">난이도 ${shape.difficulty_level}</div>
        `;

        card.addEventListener('click', () => {
            this.selectShape(shape);
        });

        return card;
    }

    /**
     * Create SVG representation of shape
     */
    createShapeSVG(shape) {
        const vertices = shape.vertices;
        if (!vertices || vertices.length === 0) return '';

        // Calculate bounds
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        vertices.forEach(v => {
            minX = Math.min(minX, v.x);
            minY = Math.min(minY, v.y);
            maxX = Math.max(maxX, v.x);
            maxY = Math.max(maxY, v.y);
        });

        const width = maxX - minX;
        const height = maxY - minY;
        const padding = 10;

        // Create path
        const points = vertices.map(v => {
            const x = ((v.x - minX) / width) * (80 - padding * 2) + padding;
            const y = ((v.y - minY) / height) * (80 - padding * 2) + padding;
            return `${x},${y}`;
        }).join(' ');

        return `
            <svg width="80" height="80" viewBox="0 0 80 80">
                <polygon points="${points}" fill="${shape.color_code}" stroke="#2c3e50" stroke-width="2"/>
            </svg>
        `;
    }

    /**
     * Select a shape and start session
     */
    async selectShape(shape) {
        try {
            UIHelpers.showLoading();

            // Start new session
            const result = await API.startSession(shape.id);

            if (!result.session_id) {
                throw new Error('Failed to start session');
            }

            UIHelpers.hideLoading();

            // Show canvas screen
            UIHelpers.switchScreen('canvas-screen');

            // Load shape onto canvas
            if (window.canvasManager) {
                window.canvasManager.loadShape(shape, result.session_id);
            }

            // Show back button
            document.getElementById('back-btn').style.display = 'block';

            UIHelpers.showToast(`${shape.shape_name} 학습을 시작합니다!`, 'success');

        } catch (error) {
            UIHelpers.hideLoading();
            UIHelpers.showToast('세션 시작에 실패했습니다', 'error');
            console.error('Failed to select shape:', error);
        }
    }

    /**
     * Get shape by ID
     */
    async getShapeById(shapeId) {
        try {
            const result = await API.getShape(shapeId);
            return result.shape;
        } catch (error) {
            console.error('Failed to get shape:', error);
            return null;
        }
    }

    /**
     * Set difficulty and reload shapes
     */
    async setDifficulty(level) {
        this.currentDifficulty = level;
        const shapes = await this.loadShapes(level);
        this.displayShapes(shapes);
    }
}

/**
 * Difficulty Level Selector
 */
class DifficultySelector {
    constructor() {
        this.currentLevel = 1;
        this.initializeButtons();
    }

    initializeButtons() {
        const buttons = document.querySelectorAll('.difficulty-btn');

        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const level = parseInt(btn.dataset.level);
                this.setLevel(level);
            });
        });
    }

    setLevel(level) {
        this.currentLevel = level;

        // Update button states
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            const btnLevel = parseInt(btn.dataset.level);
            if (btnLevel === level) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Load shapes for this difficulty
        if (window.shapeManager) {
            window.shapeManager.setDifficulty(level);
        }
    }
}
