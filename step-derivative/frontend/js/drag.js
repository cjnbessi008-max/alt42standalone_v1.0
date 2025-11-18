/**
 * Drag and Drop Module
 * Makes the virtual smartphone draggable
 */

const DragModule = {
    dragHandle: null,
    smartphone: null,
    isDragging: false,
    currentX: 0,
    currentY: 0,
    initialX: 0,
    initialY: 0,
    xOffset: 0,
    yOffset: 0,

    /**
     * Initialize drag functionality
     */
    init() {
        this.smartphone = document.getElementById('smartphone-container');
        this.dragHandle = document.getElementById('drag-handle');

        if (!this.smartphone || !this.dragHandle) {
            console.warn('Drag elements not found');
            return;
        }

        // Make entire smartphone frame draggable
        this.smartphone.addEventListener('mousedown', this.dragStart.bind(this));
        this.smartphone.addEventListener('touchstart', this.dragStart.bind(this));

        document.addEventListener('mousemove', this.drag.bind(this));
        document.addEventListener('touchmove', this.drag.bind(this));

        document.addEventListener('mouseup', this.dragEnd.bind(this));
        document.addEventListener('touchend', this.dragEnd.bind(this));

        // Double-click to toggle maximize
        this.smartphone.addEventListener('dblclick', this.toggleMaximize.bind(this));

        // Set initial position (bottom-right)
        this.setInitialPosition();
    },

    /**
     * Set initial position
     */
    setInitialPosition() {
        const rect = this.smartphone.getBoundingClientRect();
        this.xOffset = window.innerWidth - rect.width - 20;
        this.yOffset = window.innerHeight - rect.height - 20;
        this.setTranslate(this.xOffset, this.yOffset);
    },

    /**
     * Start dragging
     */
    dragStart(e) {
        // Only allow dragging from the top part (drag handle area)
        const rect = this.smartphone.getBoundingClientRect();
        const clickY = (e.type === 'touchstart' ? e.touches[0].clientY : e.clientY) - rect.top;

        // Only allow dragging if clicking on top 60px (header area)
        if (clickY > 60) {
            return;
        }

        if (e.type === 'touchstart') {
            this.initialX = e.touches[0].clientX - this.xOffset;
            this.initialY = e.touches[0].clientY - this.yOffset;
        } else {
            this.initialX = e.clientX - this.xOffset;
            this.initialY = e.clientY - this.yOffset;
        }

        if (e.target === this.smartphone || e.target === this.dragHandle ||
            e.target.closest('.phone-header')) {
            this.isDragging = true;
            this.smartphone.style.cursor = 'grabbing';
        }
    },

    /**
     * Drag movement
     */
    drag(e) {
        if (!this.isDragging) return;

        e.preventDefault();

        if (e.type === 'touchmove') {
            this.currentX = e.touches[0].clientX - this.initialX;
            this.currentY = e.touches[0].clientY - this.initialY;
        } else {
            this.currentX = e.clientX - this.initialX;
            this.currentY = e.clientY - this.initialY;
        }

        this.xOffset = this.currentX;
        this.yOffset = this.currentY;

        this.setTranslate(this.currentX, this.currentY);
    },

    /**
     * End dragging
     */
    dragEnd(e) {
        if (!this.isDragging) return;

        this.isDragging = false;
        this.smartphone.style.cursor = 'move';

        // Snap to edges if close
        this.snapToEdge();
    },

    /**
     * Set transform translate
     */
    setTranslate(xPos, yPos) {
        // Constrain to viewport
        const rect = this.smartphone.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - rect.height;

        xPos = Math.max(0, Math.min(xPos, maxX));
        yPos = Math.max(0, Math.min(yPos, maxY));

        this.smartphone.style.transform = `translate(${xPos}px, ${yPos}px)`;
    },

    /**
     * Snap to nearest edge
     */
    snapToEdge() {
        const rect = this.smartphone.getBoundingClientRect();
        const threshold = 50;

        let newX = this.xOffset;
        let newY = this.yOffset;

        // Snap to left edge
        if (rect.left < threshold) {
            newX = 0;
        }

        // Snap to right edge
        if (window.innerWidth - rect.right < threshold) {
            newX = window.innerWidth - rect.width;
        }

        // Snap to top edge
        if (rect.top < threshold) {
            newY = 0;
        }

        // Snap to bottom edge
        if (window.innerHeight - rect.bottom < threshold) {
            newY = window.innerHeight - rect.height;
        }

        // Animate to snap position
        this.smartphone.style.transition = 'transform 0.3s ease';
        this.setTranslate(newX, newY);
        this.xOffset = newX;
        this.yOffset = newY;

        setTimeout(() => {
            this.smartphone.style.transition = '';
        }, 300);
    },

    /**
     * Toggle maximize/minimize
     */
    toggleMaximize() {
        this.smartphone.classList.toggle('maximized');

        if (this.smartphone.classList.contains('maximized')) {
            // Center on screen
            this.smartphone.style.transition = 'all 0.3s ease';
            this.smartphone.style.transform = 'translate(0, 0)';
            this.smartphone.style.top = '20px';
            this.smartphone.style.left = '20px';
            this.smartphone.style.right = '20px';
            this.smartphone.style.bottom = '20px';
        } else {
            // Return to draggable position
            setTimeout(() => {
                this.smartphone.style.transition = '';
                this.smartphone.style.top = '';
                this.smartphone.style.left = '';
                this.smartphone.style.right = '';
                this.smartphone.style.bottom = '';
                this.setTranslate(this.xOffset, this.yOffset);
            }, 300);
        }
    },

    /**
     * Handle window resize
     */
    handleResize() {
        if (!this.smartphone.classList.contains('maximized')) {
            // Reposition if out of bounds
            const rect = this.smartphone.getBoundingClientRect();

            if (rect.right > window.innerWidth || rect.bottom > window.innerHeight) {
                this.setInitialPosition();
            }
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    DragModule.init();

    // Handle window resize
    window.addEventListener('resize', () => {
        DragModule.handleResize();
    });
});

// Export for debugging
window.DragModule = DragModule;
