/**
 * Notification System
 * Shows toast notifications to the user
 */

class NotificationManager {
    constructor() {
        this.container = null;
        this.defaultDuration = 4000;
        this.notifications = [];
    }

    /**
     * Initialize notification container
     */
    init() {
        if (!this.container) {
            this.container = document.getElementById('notificationContainer');

            if (!this.container) {
                this.container = document.createElement('div');
                this.container.id = 'notificationContainer';
                this.container.className = 'notification-container';
                document.body.appendChild(this.container);
            }
        }
    }

    /**
     * Show a notification
     */
    show(message, type = 'info', duration = this.defaultDuration) {
        this.init();

        const notification = this.createNotification(message, type);
        this.container.appendChild(notification);
        this.notifications.push(notification);

        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Auto-dismiss
        if (duration > 0) {
            setTimeout(() => {
                this.dismiss(notification);
            }, duration);
        }

        return notification;
    }

    /**
     * Create notification element
     */
    createNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;

        const icon = this.getIcon(type);
        const iconEl = document.createElement('span');
        iconEl.className = 'notification-icon';
        iconEl.textContent = icon;

        const messageEl = document.createElement('span');
        messageEl.className = 'notification-message';
        messageEl.textContent = message;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = () => this.dismiss(notification);

        notification.appendChild(iconEl);
        notification.appendChild(messageEl);
        notification.appendChild(closeBtn);

        return notification;
    }

    /**
     * Get icon for notification type
     */
    getIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }

    /**
     * Dismiss a notification
     */
    dismiss(notification) {
        notification.classList.remove('show');
        notification.classList.add('hide');

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }

            const index = this.notifications.indexOf(notification);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        }, 300);
    }

    /**
     * Show success notification
     */
    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    /**
     * Show error notification
     */
    error(message, duration) {
        return this.show(message, 'error', duration);
    }

    /**
     * Show warning notification
     */
    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    /**
     * Show info notification
     */
    info(message, duration) {
        return this.show(message, 'info', duration);
    }

    /**
     * Clear all notifications
     */
    clearAll() {
        this.notifications.forEach(notification => {
            this.dismiss(notification);
        });
    }
}

// Create singleton instance
const notificationManager = new NotificationManager();

// Auto-initialize on DOM load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        notificationManager.init();
    });
}

// Add CSS styles dynamically
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1rem 1.25rem;
            background: white;
            border-radius: 0.5rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            min-width: 300px;
            max-width: 450px;
            transform: translateX(400px);
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            border-left: 4px solid;
        }

        .notification.show {
            transform: translateX(0);
            opacity: 1;
        }

        .notification.hide {
            transform: translateX(400px);
            opacity: 0;
        }

        .notification-success {
            border-left-color: #48bb78;
            background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%);
        }

        .notification-error {
            border-left-color: #f56565;
            background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
        }

        .notification-warning {
            border-left-color: #ed8936;
            background: linear-gradient(135deg, #fffaf0 0%, #feebc8 100%);
        }

        .notification-info {
            border-left-color: #4299e1;
            background: linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%);
        }

        .notification-icon {
            font-size: 1.25rem;
            font-weight: bold;
            flex-shrink: 0;
        }

        .notification-success .notification-icon {
            color: #38a169;
        }

        .notification-error .notification-icon {
            color: #e53e3e;
        }

        .notification-warning .notification-icon {
            color: #dd6b20;
        }

        .notification-info .notification-icon {
            color: #3182ce;
        }

        .notification-message {
            flex: 1;
            font-size: 0.875rem;
            font-weight: 500;
            color: #2d3748;
        }

        .notification-close {
            background: transparent;
            border: none;
            font-size: 1.5rem;
            color: #718096;
            cursor: pointer;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s ease;
            flex-shrink: 0;
        }

        .notification-close:hover {
            background: rgba(0, 0, 0, 0.05);
            color: #2d3748;
        }

        @media (max-width: 768px) {
            .notification {
                min-width: auto;
                max-width: calc(100vw - 2rem);
            }
        }
    `;
    document.head.appendChild(style);
}
