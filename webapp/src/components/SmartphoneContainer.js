/**
 * SmartphoneContainer - Creates a virtual smartphone interface
 * Positioned in the bottom-right corner by default
 */
export class SmartphoneContainer {
    constructor(parentElement, position = 'bottom-right') {
        this.parentElement = parentElement;
        this.position = position;
        this.container = null;
        this.screen = null;
        this.isDragging = false;
        this.isMinimized = false;
        this.dragOffset = { x: 0, y: 0 };

        this.create();
    }

    /**
     * Create the smartphone UI structure
     */
    create() {
        // Main smartphone container
        this.container = document.createElement('div');
        this.container.className = `smartphone-container smartphone-${this.position}`;

        // Smartphone frame
        const frame = document.createElement('div');
        frame.className = 'smartphone-frame';

        // Top bar (notch area)
        const topBar = document.createElement('div');
        topBar.className = 'smartphone-topbar';

        // Notch
        const notch = document.createElement('div');
        notch.className = 'smartphone-notch';
        topBar.appendChild(notch);

        // Control buttons
        const controls = document.createElement('div');
        controls.className = 'smartphone-controls';

        const minimizeBtn = document.createElement('button');
        minimizeBtn.className = 'smartphone-btn minimize-btn';
        minimizeBtn.innerHTML = '−';
        minimizeBtn.title = 'Minimize';
        minimizeBtn.addEventListener('click', () => this.toggleMinimize());

        const closeBtn = document.createElement('button');
        closeBtn.className = 'smartphone-btn close-btn';
        closeBtn.innerHTML = '×';
        closeBtn.title = 'Close';
        closeBtn.addEventListener('click', () => this.hide());

        controls.appendChild(minimizeBtn);
        controls.appendChild(closeBtn);
        topBar.appendChild(controls);

        // Screen area
        this.screen = document.createElement('div');
        this.screen.className = 'smartphone-screen';

        // Status bar
        const statusBar = document.createElement('div');
        statusBar.className = 'smartphone-statusbar';
        statusBar.innerHTML = `
            <span class="time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span class="status-icons">
                <span class="signal">📶</span>
                <span class="wifi">📡</span>
                <span class="battery">🔋</span>
            </span>
        `;

        // Content area
        const contentArea = document.createElement('div');
        contentArea.className = 'smartphone-content';

        // App header
        const appHeader = document.createElement('div');
        appHeader.className = 'smartphone-app-header';
        appHeader.innerHTML = '<h3>3D Insight Mode</h3>';

        this.screen.appendChild(statusBar);
        this.screen.appendChild(appHeader);
        this.screen.appendChild(contentArea);

        // Home button
        const homeButton = document.createElement('div');
        homeButton.className = 'smartphone-home-button';

        // Assemble the smartphone
        frame.appendChild(topBar);
        frame.appendChild(this.screen);
        frame.appendChild(homeButton);
        this.container.appendChild(frame);

        // Add to parent
        this.parentElement.appendChild(this.container);

        // Enable dragging
        this.enableDragging();

        // Update time every minute
        setInterval(() => {
            const timeElement = statusBar.querySelector('.time');
            if (timeElement) {
                timeElement.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
        }, 60000);
    }

    /**
     * Enable dragging functionality
     */
    enableDragging() {
        const topBar = this.container.querySelector('.smartphone-topbar');

        topBar.addEventListener('mousedown', (e) => {
            if (e.target.closest('.smartphone-controls')) {
                return; // Don't drag when clicking controls
            }
            this.isDragging = true;
            const rect = this.container.getBoundingClientRect();
            this.dragOffset.x = e.clientX - rect.left;
            this.dragOffset.y = e.clientY - rect.top;
            this.container.classList.add('dragging');
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;

            const x = e.clientX - this.dragOffset.x;
            const y = e.clientY - this.dragOffset.y;

            this.container.style.left = `${x}px`;
            this.container.style.top = `${y}px`;
            this.container.style.right = 'auto';
            this.container.style.bottom = 'auto';
        });

        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.container.classList.remove('dragging');
            }
        });

        // Touch support for mobile
        topBar.addEventListener('touchstart', (e) => {
            if (e.target.closest('.smartphone-controls')) {
                return;
            }
            const touch = e.touches[0];
            const rect = this.container.getBoundingClientRect();
            this.isDragging = true;
            this.dragOffset.x = touch.clientX - rect.left;
            this.dragOffset.y = touch.clientY - rect.top;
        });

        document.addEventListener('touchmove', (e) => {
            if (!this.isDragging) return;
            e.preventDefault();

            const touch = e.touches[0];
            const x = touch.clientX - this.dragOffset.x;
            const y = touch.clientY - this.dragOffset.y;

            this.container.style.left = `${x}px`;
            this.container.style.top = `${y}px`;
            this.container.style.right = 'auto';
            this.container.style.bottom = 'auto';
        }, { passive: false });

        document.addEventListener('touchend', () => {
            this.isDragging = false;
        });
    }

    /**
     * Toggle minimize/maximize
     */
    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        this.container.classList.toggle('minimized', this.isMinimized);

        const btn = this.container.querySelector('.minimize-btn');
        btn.innerHTML = this.isMinimized ? '□' : '−';
    }

    /**
     * Hide the smartphone container
     */
    hide() {
        this.container.style.display = 'none';
    }

    /**
     * Show the smartphone container
     */
    show() {
        this.container.style.display = 'block';
    }

    /**
     * Get the content area where app content should be added
     * @returns {HTMLElement}
     */
    getContentArea() {
        return this.screen.querySelector('.smartphone-content');
    }

    /**
     * Clean up resources
     */
    dispose() {
        if (this.container && this.container.parentElement) {
            this.container.parentElement.removeChild(this.container);
        }
    }
}
