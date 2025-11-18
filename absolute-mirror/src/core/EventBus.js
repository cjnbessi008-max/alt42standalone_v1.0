/**
 * EventBus - 이벤트 기반 통신 시스템
 * Provides pub/sub pattern for loose coupling between components
 */

export class EventBus {
    constructor() {
        this.events = new Map();
        this.eventHistory = [];
        this.debug = false;
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @param {Object} options - Options (once, priority)
     * @returns {Function} Unsubscribe function
     */
    on(event, callback, options = {}) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }

        const listener = {
            callback,
            once: options.once || false,
            priority: options.priority || 0
        };

        const listeners = this.events.get(event);
        listeners.push(listener);

        // Sort by priority (higher first)
        listeners.sort((a, b) => b.priority - a.priority);

        if (this.debug) {
            console.log(`[EventBus] Subscribed to "${event}"`, { once: listener.once, priority: listener.priority });
        }

        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    /**
     * Subscribe to event once (auto-unsubscribes after first call)
     */
    once(event, callback, priority = 0) {
        return this.on(event, callback, { once: true, priority });
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {*} data - Event data
     * @returns {Promise} Resolves when all handlers complete
     */
    async emit(event, data) {
        if (!this.events.has(event)) {
            if (this.debug) {
                console.warn(`[EventBus] No listeners for event "${event}"`);
            }
            return;
        }

        const listeners = this.events.get(event);
        const toRemove = [];

        if (this.debug) {
            console.log(`[EventBus] Emitting "${event}"`, data);
        }

        // Record event in history
        this.eventHistory.push({
            event,
            data,
            timestamp: Date.now()
        });

        // Keep only last 100 events
        if (this.eventHistory.length > 100) {
            this.eventHistory.shift();
        }

        // Call all listeners
        const promises = listeners.map(async (listener, index) => {
            try {
                await listener.callback(data, event);

                // Mark for removal if 'once'
                if (listener.once) {
                    toRemove.push(index);
                }
            } catch (error) {
                console.error(`[EventBus] Error in listener for "${event}":`, error);
                this.emit('error', { event, error, data });
            }
        });

        await Promise.all(promises);

        // Remove 'once' listeners (in reverse order to maintain indices)
        toRemove.reverse().forEach(index => {
            listeners.splice(index, 1);
        });
    }

    /**
     * Emit event synchronously
     */
    emitSync(event, data) {
        if (!this.events.has(event)) return;

        const listeners = this.events.get(event);
        const toRemove = [];

        listeners.forEach((listener, index) => {
            try {
                listener.callback(data, event);

                if (listener.once) {
                    toRemove.push(index);
                }
            } catch (error) {
                console.error(`[EventBus] Error in listener for "${event}":`, error);
            }
        });

        toRemove.reverse().forEach(index => {
            listeners.splice(index, 1);
        });
    }

    /**
     * Unsubscribe from an event
     */
    off(event, callback) {
        if (!this.events.has(event)) return;

        const listeners = this.events.get(event);
        const index = listeners.findIndex(l => l.callback === callback);

        if (index > -1) {
            listeners.splice(index, 1);

            if (this.debug) {
                console.log(`[EventBus] Unsubscribed from "${event}"`);
            }
        }

        // Clean up empty event arrays
        if (listeners.length === 0) {
            this.events.delete(event);
        }
    }

    /**
     * Remove all listeners for an event
     */
    clear(event) {
        if (event) {
            this.events.delete(event);
            if (this.debug) {
                console.log(`[EventBus] Cleared all listeners for "${event}"`);
            }
        } else {
            this.events.clear();
            if (this.debug) {
                console.log('[EventBus] Cleared all listeners');
            }
        }
    }

    /**
     * Get all registered events
     */
    getEvents() {
        return Array.from(this.events.keys());
    }

    /**
     * Get listener count for an event
     */
    listenerCount(event) {
        return this.events.has(event) ? this.events.get(event).length : 0;
    }

    /**
     * Get event history
     */
    getHistory(limit = 10) {
        return this.eventHistory.slice(-limit);
    }

    /**
     * Enable/disable debug mode
     */
    setDebug(enabled) {
        this.debug = enabled;
    }
}

// Create singleton instance
export const eventBus = new EventBus();

// Export event constants
export const EVENTS = {
    // Application lifecycle
    APP_INIT: 'app:init',
    APP_READY: 'app:ready',
    APP_ERROR: 'app:error',

    // Problem events
    PROBLEM_LOADED: 'problem:loaded',
    PROBLEM_CHANGED: 'problem:changed',
    PROBLEM_SOLVED: 'problem:solved',

    // Visualization events
    VIZ_READY: 'viz:ready',
    VIZ_UPDATE: 'viz:update',
    VIZ_X_CHANGED: 'viz:x_changed',
    VIZ_RESET: 'viz:reset',

    // User interaction
    USER_INPUT: 'user:input',
    USER_SUBMIT: 'user:submit',
    USER_HINT_REQUEST: 'user:hint_request',

    // Progress events
    PROGRESS_UPDATE: 'progress:update',
    ACHIEVEMENT_UNLOCKED: 'achievement:unlocked',

    // API events
    API_REQUEST: 'api:request',
    API_RESPONSE: 'api:response',
    API_ERROR: 'api:error',

    // UI events
    UI_SHOW_SOLUTION: 'ui:show_solution',
    UI_HIDE_SOLUTION: 'ui:hide_solution',
    UI_TOAST: 'ui:toast',
    UI_MODAL: 'ui:modal'
};
