/**
 * Virtual Smartphone Display Controller
 * Manages the smartphone UI and interactions
 */

class SmartphoneDisplay {
    constructor(containerId = 'smartphone-app') {
        this.containerId = containerId;
        this.container = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.isMinimized = false;

        this.init();
    }

    init() {
        this.createSmartphone();
        this.updateTime();
        this.setupDragging();

        // Update time every minute
        setInterval(() => this.updateTime(), 60000);
    }

    /**
     * Create smartphone UI structure
     */
    createSmartphone() {
        const container = document.createElement('div');
        container.className = 'smartphone-container';
        container.id = this.containerId;

        container.innerHTML = `
            <div class="smartphone-frame">
                <div class="smartphone-notch"></div>
                <div class="smartphone-screen">
                    <div class="smartphone-status-bar">
                        <span class="status-time">--:--</span>
                        <div class="status-icons">
                            <svg class="status-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/>
                            </svg>
                            <svg class="status-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/>
                            </svg>
                        </div>
                    </div>
                    <div class="smartphone-content">
                        <div class="quiz-app">
                            <div class="loading">
                                <div class="loading-spinner"></div>
                                <div>Loading...</div>
                            </div>
                        </div>
                    </div>
                    <div class="smartphone-home-indicator"></div>
                </div>
            </div>
        `;

        document.body.appendChild(container);
        this.container = container;
    }

    /**
     * Update status bar time
     */
    updateTime() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const timeElement = this.container.querySelector('.status-time');
        if (timeElement) {
            timeElement.textContent = `${hours}:${minutes}`;
        }
    }

    /**
     * Setup drag functionality
     */
    setupDragging() {
        const frame = this.container.querySelector('.smartphone-frame');

        frame.addEventListener('mousedown', (e) => {
            // Only start dragging if clicking on the frame, not the content
            if (e.target === frame || e.target.closest('.smartphone-notch')) {
                this.startDragging(e);
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.drag(e);
            }
        });

        document.addEventListener('mouseup', () => {
            this.stopDragging();
        });

        // Double-click to minimize/maximize
        frame.addEventListener('dblclick', () => {
            this.toggleMinimize();
        });
    }

    startDragging(e) {
        this.isDragging = true;
        this.container.classList.add('dragging', 'draggable');

        const rect = this.container.getBoundingClientRect();
        this.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    drag(e) {
        if (!this.isDragging) return;

        const x = e.clientX - this.dragOffset.x;
        const y = e.clientY - this.dragOffset.y;

        // Keep within viewport bounds
        const maxX = window.innerWidth - this.container.offsetWidth;
        const maxY = window.innerHeight - this.container.offsetHeight;

        const boundedX = Math.max(0, Math.min(x, maxX));
        const boundedY = Math.max(0, Math.min(y, maxY));

        this.container.style.left = `${boundedX}px`;
        this.container.style.top = `${boundedY}px`;
        this.container.style.right = 'auto';
        this.container.style.bottom = 'auto';
    }

    stopDragging() {
        this.isDragging = false;
        this.container.classList.remove('dragging');
    }

    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        this.container.classList.toggle('minimized', this.isMinimized);
    }

    /**
     * Get content area element
     */
    getContentArea() {
        return this.container.querySelector('.smartphone-content');
    }

    /**
     * Set content HTML
     */
    setContent(html) {
        const contentArea = this.getContentArea();
        if (contentArea) {
            contentArea.innerHTML = html;
        }
    }

    /**
     * Show loading state
     */
    showLoading(message = 'Loading...') {
        this.setContent(`
            <div class="quiz-app">
                <div class="loading">
                    <div class="loading-spinner"></div>
                    <div>${message}</div>
                </div>
            </div>
        `);
    }

    /**
     * Hide smartphone
     */
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    /**
     * Show smartphone
     */
    show() {
        if (this.container) {
            this.container.style.display = 'block';
        }
    }

    /**
     * Get smartphone position for wave effects
     */
    getPosition() {
        const rect = this.container.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            rect: rect
        };
    }

    /**
     * Shake animation for incorrect answer
     */
    shake() {
        const screen = this.container.querySelector('.smartphone-screen');
        screen.style.animation = 'none';
        setTimeout(() => {
            screen.style.animation = 'shake 0.5s ease-in-out';
        }, 10);

        // Remove animation after it completes
        setTimeout(() => {
            screen.style.animation = '';
        }, 500);
    }

    /**
     * Success flash animation
     */
    flashSuccess() {
        const screen = this.container.querySelector('.smartphone-screen');
        const originalBg = screen.style.background;
        screen.style.background = 'rgba(76, 175, 80, 0.2)';

        setTimeout(() => {
            screen.style.background = originalBg;
        }, 300);
    }

    /**
     * Destroy smartphone display
     */
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

// Add shake animation to CSS dynamically if not present
if (!document.querySelector('#smartphone-shake-animation')) {
    const style = document.createElement('style');
    style.id = 'smartphone-shake-animation';
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(style);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartphoneDisplay;
}
