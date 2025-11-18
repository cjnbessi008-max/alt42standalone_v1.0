/**
 * Component Lego - Drag and Drop Interface
 * Vanilla JavaScript (ES6) compatible with modern browsers
 */

class ComponentLego {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            apiEndpoint: options.apiEndpoint || '/api/v1',
            onSubmit: options.onSubmit || null,
            autoSave: options.autoSave !== false,
            autoSaveInterval: options.autoSaveInterval || 30000,
            snapToGrid: options.snapToGrid !== false,
            gridSize: options.gridSize || 50
        };

        this.currentQuestion = null;
        this.components = [];
        this.placedComponents = [];
        this.sessionId = this.generateSessionId();
        this.draggedElement = null;
        this.autoSaveTimer = null;

        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.render();
        this.attachEventListeners();

        if (this.options.autoSave) {
            this.startAutoSave();
        }
    }

    /**
     * Render the smartphone interface
     */
    render() {
        this.container.innerHTML = `
            <div class="smartphone-container" id="smartphone">
                <button class="smartphone-toggle" onclick="componentLego.toggleMinimize()">
                    Component Lego
                </button>
                <div class="smartphone-screen">
                    <div class="status-bar">
                        <span class="status-time">${this.getCurrentTime()}</span>
                        <div class="status-icons">
                            <span>📶</span>
                            <span>🔋</span>
                        </div>
                    </div>

                    <div class="app-header">
                        <span>🧱 Component Lego</span>
                    </div>

                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%" id="progressFill"></div>
                    </div>

                    <div class="app-content" id="appContent">
                        <div class="question-display" id="questionDisplay">
                            <div class="question-text">문제를 불러오는 중...</div>
                        </div>

                        <div class="component-palette" id="componentPalette">
                            <div class="palette-title">📦 Components</div>
                            <div class="palette-items" id="paletteItems"></div>
                        </div>

                        <div class="assembly-canvas" id="assemblyCanvas">
                            <div class="canvas-title">🔧 Assembly Area</div>
                            <div class="canvas-grid" id="canvasGrid">
                                <div class="canvas-placeholder">
                                    <div class="canvas-placeholder-icon">🧩</div>
                                    <div class="canvas-placeholder-text">
                                        드래그하여 컴포넌트를 조립하세요
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="hint-panel" id="hintPanel"></div>
                    </div>

                    <div class="action-buttons">
                        <button class="btn btn-secondary" onclick="componentLego.clearCanvas()">
                            ♻️ Clear
                        </button>
                        <button class="btn btn-secondary" onclick="componentLego.showHint()">
                            💡 Hint
                        </button>
                        <button class="btn btn-primary" onclick="componentLego.submit()">
                            ✓ Submit
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        const canvas = document.getElementById('assemblyCanvas');

        // Drag over canvas
        canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            canvas.classList.add('drag-over');
        });

        // Drag leave canvas
        canvas.addEventListener('dragleave', (e) => {
            if (e.target === canvas) {
                canvas.classList.remove('drag-over');
            }
        });

        // Drop on canvas
        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            canvas.classList.remove('drag-over');
            this.handleDrop(e);
        });
    }

    /**
     * Load question from API
     */
    async loadQuestion(questionId) {
        try {
            const response = await fetch(`${this.options.apiEndpoint}/questions/${questionId}`);
            const data = await response.json();

            if (data.success) {
                this.currentQuestion = data.question;
                this.components = data.components;
                this.renderQuestion();
                this.renderComponents();
            } else {
                this.showError('Failed to load question');
            }
        } catch (error) {
            console.error('Load question error:', error);
            this.showError('Network error');
        }
    }

    /**
     * Render question display
     */
    renderQuestion() {
        const display = document.getElementById('questionDisplay');
        const q = this.currentQuestion;

        display.innerHTML = `
            <div class="question-text">${q.question_text}</div>
            <div class="question-meta">
                <span class="meta-badge type-${q.question_type}">${q.question_type}</span>
                <span class="meta-badge difficulty">Level ${q.difficulty_level}</span>
            </div>
        `;
    }

    /**
     * Render component palette
     */
    renderComponents() {
        const paletteItems = document.getElementById('paletteItems');
        paletteItems.innerHTML = '';

        this.components.forEach((component, index) => {
            const block = this.createComponentBlock(component, index);
            paletteItems.appendChild(block);
        });
    }

    /**
     * Create a component block element
     */
    createComponentBlock(component, index) {
        const block = document.createElement('div');
        block.className = `component-block color-${component.symbol.toLowerCase()}`;
        block.draggable = true;
        block.dataset.componentId = index;
        block.dataset.componentType = component.component_type;

        const visual = JSON.parse(component.visual_config || '{}');
        if (component.color) {
            block.style.background = component.color;
        }

        block.innerHTML = `
            <div class="component-symbol">${component.symbol}</div>
            ${component.quantity > 1 ? `<div class="component-quantity">${component.quantity}</div>` : ''}
        `;

        // Drag start
        block.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('componentId', index);
            this.draggedElement = block;
        });

        // Drag end
        block.addEventListener('dragend', () => {
            this.draggedElement = null;
        });

        return block;
    }

    /**
     * Handle drop on canvas
     */
    handleDrop(e) {
        const canvasGrid = document.getElementById('canvasGrid');
        const rect = canvasGrid.getBoundingClientRect();

        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;

        // Snap to grid
        if (this.options.snapToGrid) {
            x = Math.round(x / this.options.gridSize) * this.options.gridSize;
            y = Math.round(y / this.options.gridSize) * this.options.gridSize;
        }

        const componentId = e.dataTransfer.getData('componentId');
        if (componentId !== '') {
            this.placeComponent(parseInt(componentId), x, y);
        }
    }

    /**
     * Place a component on the canvas
     */
    placeComponent(componentId, x, y) {
        const component = this.components[componentId];
        const canvasGrid = document.getElementById('canvasGrid');

        // Hide placeholder
        const placeholder = canvasGrid.querySelector('.canvas-placeholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }

        const placed = document.createElement('div');
        placed.className = 'placed-component';
        placed.style.left = x + 'px';
        placed.style.top = y + 'px';
        placed.draggable = true;

        // Clone the component block
        const block = this.createComponentBlock(component, componentId);
        block.draggable = false;
        placed.appendChild(block);

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.onclick = () => this.removeComponent(placed);
        placed.appendChild(deleteBtn);

        // Make movable
        placed.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('placedComponent', 'true');
            placed.classList.add('dragging');
            this.draggedElement = placed;
        });

        placed.addEventListener('dragend', () => {
            placed.classList.remove('dragging');
            this.draggedElement = null;
        });

        canvasGrid.appendChild(placed);

        // Store placed component
        this.placedComponents.push({
            id: Date.now(),
            componentId: componentId,
            component: component,
            position: { x, y },
            element: placed
        });

        this.updateProgress();
        this.logInteraction('drop', componentId, { x, y });
    }

    /**
     * Remove a component from canvas
     */
    removeComponent(element) {
        const index = this.placedComponents.findIndex(p => p.element === element);
        if (index !== -1) {
            this.placedComponents.splice(index, 1);
            element.remove();
            this.updateProgress();

            // Show placeholder if empty
            if (this.placedComponents.length === 0) {
                const placeholder = document.querySelector('.canvas-placeholder');
                if (placeholder) {
                    placeholder.style.display = 'block';
                }
            }
        }
    }

    /**
     * Clear all placed components
     */
    clearCanvas() {
        if (confirm('모든 컴포넌트를 제거하시겠습니까?')) {
            this.placedComponents.forEach(p => p.element.remove());
            this.placedComponents = [];

            const placeholder = document.querySelector('.canvas-placeholder');
            if (placeholder) {
                placeholder.style.display = 'block';
            }

            this.updateProgress();
        }
    }

    /**
     * Submit assembly for validation
     */
    async submit() {
        if (this.placedComponents.length === 0) {
            alert('컴포넌트를 먼저 조립해주세요.');
            return;
        }

        const assembly = this.serializeAssembly();

        try {
            const response = await fetch(`${this.options.apiEndpoint}/assembly/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question_id: this.currentQuestion.question_id,
                    session_id: this.sessionId,
                    assembly: assembly
                })
            });

            const result = await response.json();
            this.showFeedback(result);

            if (this.options.onSubmit) {
                this.options.onSubmit(result);
            }
        } catch (error) {
            console.error('Submit error:', error);
            this.showError('제출에 실패했습니다.');
        }
    }

    /**
     * Serialize current assembly to JSON
     */
    serializeAssembly() {
        return {
            components: this.placedComponents.map(p => ({
                id: p.id,
                type: p.component.component_type,
                symbol: p.component.symbol,
                position: p.position
            })),
            connections: this.detectConnections()
        };
    }

    /**
     * Detect connections between components
     */
    detectConnections() {
        const connections = [];
        const threshold = this.options.gridSize * 1.5;

        for (let i = 0; i < this.placedComponents.length; i++) {
            for (let j = i + 1; j < this.placedComponents.length; j++) {
                const p1 = this.placedComponents[i].position;
                const p2 = this.placedComponents[j].position;
                const distance = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

                if (distance < threshold) {
                    connections.push({
                        from: this.placedComponents[i].id,
                        to: this.placedComponents[j].id,
                        distance: distance
                    });
                }
            }
        }

        return connections;
    }

    /**
     * Show feedback modal
     */
    showFeedback(result) {
        const modal = document.createElement('div');
        modal.className = `feedback-modal ${result.is_correct ? 'correct' : 'incorrect'}`;
        modal.innerHTML = `
            <div class="feedback-icon">${result.is_correct ? '✅' : '❌'}</div>
            <div class="feedback-message">${result.is_correct ? '정답입니다!' : '다시 시도해보세요'}</div>
            <div class="feedback-detail">${result.message || ''}</div>
            <button class="btn btn-primary" onclick="this.parentElement.remove()">확인</button>
        `;

        document.getElementById('appContent').appendChild(modal);

        if (result.is_correct) {
            this.updateProgress(100);
        }
    }

    /**
     * Show hint
     */
    showHint() {
        const hintPanel = document.getElementById('hintPanel');
        hintPanel.innerHTML = '💡 힌트: 성분들을 올바른 순서로 배열해보세요. 유사한 성분끼리 가까이 배치하면 자동으로 연결됩니다.';
        hintPanel.classList.add('show');

        setTimeout(() => {
            hintPanel.classList.remove('show');
        }, 5000);
    }

    /**
     * Update progress bar
     */
    updateProgress(percentage = null) {
        const fill = document.getElementById('progressFill');

        if (percentage !== null) {
            fill.style.width = percentage + '%';
        } else {
            // Calculate based on placed components
            const expected = this.components.reduce((sum, c) => sum + c.quantity, 0);
            const current = this.placedComponents.length;
            const progress = Math.min(100, (current / expected) * 100);
            fill.style.width = progress + '%';
        }
    }

    /**
     * Auto-save functionality
     */
    startAutoSave() {
        this.autoSaveTimer = setInterval(() => {
            this.autoSave();
        }, this.options.autoSaveInterval);
    }

    async autoSave() {
        if (this.placedComponents.length === 0) return;

        const assembly = this.serializeAssembly();
        try {
            await fetch(`${this.options.apiEndpoint}/assembly/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question_id: this.currentQuestion.question_id,
                    session_id: this.sessionId,
                    assembly: assembly
                })
            });
        } catch (error) {
            console.error('Auto-save error:', error);
        }
    }

    /**
     * Log user interaction
     */
    async logInteraction(actionType, componentId, position) {
        try {
            await fetch(`${this.options.apiEndpoint}/interactions/log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: this.sessionId,
                    question_id: this.currentQuestion?.question_id,
                    action_type: actionType,
                    component_id: componentId,
                    position: position,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (error) {
            // Silent fail for analytics
        }
    }

    /**
     * Toggle minimize smartphone
     */
    toggleMinimize() {
        const smartphone = document.getElementById('smartphone');
        smartphone.classList.toggle('minimized');
    }

    /**
     * Show error message
     */
    showError(message) {
        alert(message);
    }

    /**
     * Get current time for status bar
     */
    getCurrentTime() {
        const now = new Date();
        return now.getHours().toString().padStart(2, '0') + ':' +
               now.getMinutes().toString().padStart(2, '0');
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
    }
}

// Global instance
let componentLego = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('componentLegoApp')) {
        componentLego = new ComponentLego('componentLegoApp', {
            apiEndpoint: '/api/v1'
        });

        // Example: Load a question
        // componentLego.loadQuestion(1);
    }
});
