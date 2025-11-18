/**
 * Feature Spotlight - Smartphone Display Controller
 *
 * Manages the virtual smartphone display in the bottom-right corner
 */

class SmartphoneDisplay {
    constructor(options = {}) {
        this.containerId = options.containerId || 'smartphone-container';
        this.position = options.position || { bottom: '20px', right: '20px' };
        this.width = options.width || '375px'; // iPhone-like dimensions
        this.height = options.height || '667px';
        this.minimized = false;
        this.container = null;
        this.screen = null;

        this.init();
    }

    /**
     * Initialize the smartphone display
     */
    init() {
        // Create container
        this.container = document.createElement('div');
        this.container.id = this.containerId;
        this.container.className = 'smartphone-display';

        // Apply positioning
        this.container.style.position = 'fixed';
        this.container.style.bottom = this.position.bottom;
        this.container.style.right = this.position.right;
        this.container.style.width = this.width;
        this.container.style.height = this.height;
        this.container.style.zIndex = '9999';

        // Create smartphone structure
        this.container.innerHTML = `
            <div class="smartphone-frame">
                <div class="smartphone-notch"></div>
                <div class="smartphone-screen" id="smartphone-screen">
                    <div class="smartphone-content">
                        <!-- Content will be injected here -->
                    </div>
                </div>
                <div class="smartphone-home-button"></div>
            </div>
            <div class="smartphone-controls">
                <button class="control-btn minimize-btn" title="최소화 / Minimize">−</button>
                <button class="control-btn close-btn" title="닫기 / Close">×</button>
            </div>
        `;

        // Add to document body
        document.body.appendChild(this.container);

        // Get screen element
        this.screen = document.getElementById('smartphone-screen');

        // Setup event listeners
        this.setupEventListeners();

        console.log('Smartphone display initialized');
    }

    /**
     * Setup event listeners for controls
     */
    setupEventListeners() {
        const minimizeBtn = this.container.querySelector('.minimize-btn');
        const closeBtn = this.container.querySelector('.close-btn');

        minimizeBtn.addEventListener('click', () => this.toggleMinimize());
        closeBtn.addEventListener('click', () => this.close());

        // Make draggable
        this.makeDraggable();
    }

    /**
     * Make the smartphone display draggable
     */
    makeDraggable() {
        const frame = this.container.querySelector('.smartphone-frame');
        let isDragging = false;
        let startX, startY, startRight, startBottom;

        frame.addEventListener('mousedown', (e) => {
            // Only allow dragging from the top area (notch area)
            if (e.target.classList.contains('smartphone-notch')) {
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;

                const rect = this.container.getBoundingClientRect();
                startRight = window.innerWidth - rect.right;
                startBottom = window.innerHeight - rect.bottom;

                frame.style.cursor = 'grabbing';
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaX = startX - e.clientX;
                const deltaY = e.clientY - startY;

                this.container.style.right = (startRight + deltaX) + 'px';
                this.container.style.bottom = (startBottom - deltaY) + 'px';
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                frame.style.cursor = 'grab';
            }
        });
    }

    /**
     * Toggle minimize/maximize
     */
    toggleMinimize() {
        this.minimized = !this.minimized;

        if (this.minimized) {
            this.container.classList.add('minimized');
            this.container.querySelector('.minimize-btn').textContent = '+';
        } else {
            this.container.classList.remove('minimized');
            this.container.querySelector('.minimize-btn').textContent = '−';
        }
    }

    /**
     * Close (hide) the smartphone display
     */
    close() {
        this.container.style.display = 'none';
    }

    /**
     * Show the smartphone display
     */
    show() {
        this.container.style.display = 'block';
    }

    /**
     * Load content into the smartphone screen
     *
     * @param {string|HTMLElement} content - Content to display
     */
    loadContent(content) {
        const contentContainer = this.container.querySelector('.smartphone-content');

        if (typeof content === 'string') {
            contentContainer.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            contentContainer.innerHTML = '';
            contentContainer.appendChild(content);
        }
    }

    /**
     * Clear the screen content
     */
    clearContent() {
        const contentContainer = this.container.querySelector('.smartphone-content');
        contentContainer.innerHTML = '';
    }

    /**
     * Show loading state
     */
    showLoading(message = '로딩 중... / Loading...') {
        this.loadContent(`
            <div class="loading-state">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `);
    }

    /**
     * Show error message
     *
     * @param {string} message - Error message
     */
    showError(message) {
        this.loadContent(`
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <p>${message}</p>
            </div>
        `);
    }

    /**
     * Get the screen element for custom rendering
     *
     * @returns {HTMLElement} Screen element
     */
    getScreenElement() {
        return this.screen;
    }

    /**
     * Update screen size
     *
     * @param {string} width - New width
     * @param {string} height - New height
     */
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.container.style.width = width;
        this.container.style.height = height;
    }

    /**
     * Destroy the smartphone display
     */
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
        this.screen = null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartphoneDisplay;
}
