/**
 * Smartphone UI Controller
 * Manages smartphone frame interactions and animations
 */

class SmartphoneController {
    constructor() {
        this.container = document.querySelector('.smartphone-container');
        this.navButtons = document.querySelectorAll('.nav-btn');
        this.currentView = 'graph';

        this.setupEventListeners();
        this.updateTime();
    }

    setupEventListeners() {
        // Navigation buttons
        this.navButtons.forEach((btn, index) => {
            btn.addEventListener('click', () => this.handleNavClick(index));
        });

        // Make smartphone draggable (optional feature)
        this.makeDraggable();
    }

    handleNavClick(index) {
        // Remove active class from all buttons
        this.navButtons.forEach(btn => btn.classList.remove('active'));

        // Add active class to clicked button
        this.navButtons[index].classList.add('active');

        // Handle view switching
        const views = ['graph', 'analytics', 'settings'];
        this.currentView = views[index] || 'graph';

        this.switchView(this.currentView);
    }

    switchView(view) {
        console.log('Switching to view:', view);

        // Emit custom event for view change
        const event = new CustomEvent('smartphone-view-change', {
            detail: { view }
        });
        document.dispatchEvent(event);
    }

    updateTime() {
        const timeElement = document.querySelector('.time');
        if (timeElement) {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            timeElement.textContent = `${hours}:${minutes}`;
        }

        // Update every minute
        setTimeout(() => this.updateTime(), 60000);
    }

    makeDraggable() {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;

        const frame = this.container.querySelector('.smartphone-frame');

        frame.addEventListener('mousedown', (e) => {
            // Only allow dragging from header area
            if (e.target.closest('.screen-header')) {
                isDragging = true;
                initialX = e.clientX - this.container.offsetLeft;
                initialY = e.clientY - this.container.offsetTop;
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                this.container.style.left = currentX + 'px';
                this.container.style.top = currentY + 'px';
                this.container.style.bottom = 'auto';
                this.container.style.right = 'auto';
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    showNotification(message, duration = 3000) {
        const notification = document.createElement('div');
        notification.className = 'smartphone-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: absolute;
            top: 50px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 12px;
            z-index: 1000;
            animation: slideDown 0.3s ease-out;
        `;

        const screen = this.container.querySelector('.smartphone-screen');
        screen.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    vibrate() {
        // Trigger haptic feedback if available
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }

        // Visual vibration effect
        this.container.style.animation = 'none';
        setTimeout(() => {
            this.container.style.animation = 'vibrate 0.3s ease-in-out';
        }, 10);
    }
}

// Add vibration animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(-20px);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }

    @keyframes slideUp {
        from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        to {
            transform: translateX(-50%) translateY(-20px);
            opacity: 0;
        }
    }

    @keyframes vibrate {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px) rotate(-1deg); }
        75% { transform: translateX(5px) rotate(1deg); }
    }
`;
document.head.appendChild(style);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartphoneController;
}
