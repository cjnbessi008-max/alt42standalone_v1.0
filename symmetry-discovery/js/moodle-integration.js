/**
 * Moodle Integration Module
 * Handles communication with Moodle LMS via PHP backend
 */

class MoodleIntegration {
    constructor(apiBaseUrl = 'php/api.php') {
        this.apiBaseUrl = apiBaseUrl;
        this.userId = null;
        this.sessionId = null;
        this.courseId = null;
        this.activityId = null;
        this.initialized = false;
    }

    /**
     * Initialize Moodle connection
     * Extract parameters from URL or Moodle session
     */
    async init() {
        try {
            // Try to get parameters from URL
            const urlParams = new URLSearchParams(window.location.search);
            this.userId = urlParams.get('userid') || this.getCookie('moodle_user_id');
            this.sessionId = urlParams.get('session') || this.getCookie('moodle_session');
            this.courseId = urlParams.get('courseid');
            this.activityId = urlParams.get('activityid');

            // Verify session with backend
            if (this.sessionId) {
                const response = await this.verifySession();
                this.initialized = response.success;
                return response;
            } else {
                // Standalone mode without Moodle
                console.log('Running in standalone mode (no Moodle session)');
                this.initialized = true;
                return { success: true, mode: 'standalone' };
            }
        } catch (error) {
            console.error('Moodle initialization error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Verify session with backend
     */
    async verifySession() {
        try {
            const response = await fetch(this.apiBaseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'verify_session',
                    session_id: this.sessionId,
                    user_id: this.userId
                })
            });

            return await response.json();
        } catch (error) {
            throw new Error('Failed to verify session: ' + error.message);
        }
    }

    /**
     * Save student progress
     */
    async saveProgress(data) {
        if (!this.initialized) {
            console.warn('Moodle not initialized, saving to local storage');
            this.saveToLocalStorage(data);
            return { success: true, mode: 'local' };
        }

        try {
            const response = await fetch(this.apiBaseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'save_progress',
                    session_id: this.sessionId,
                    user_id: this.userId,
                    course_id: this.courseId,
                    activity_id: this.activityId,
                    data: data
                })
            });

            const result = await response.json();

            // Also save to local storage as backup
            this.saveToLocalStorage(data);

            return result;
        } catch (error) {
            console.error('Failed to save progress:', error);
            // Fallback to local storage
            this.saveToLocalStorage(data);
            return { success: false, error: error.message, fallback: 'local' };
        }
    }

    /**
     * Load student progress
     */
    async loadProgress() {
        if (!this.initialized) {
            console.warn('Moodle not initialized, loading from local storage');
            return this.loadFromLocalStorage();
        }

        try {
            const response = await fetch(this.apiBaseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'load_progress',
                    session_id: this.sessionId,
                    user_id: this.userId,
                    course_id: this.courseId,
                    activity_id: this.activityId
                })
            });

            const result = await response.json();

            if (result.success) {
                return result.data;
            } else {
                // Fallback to local storage
                return this.loadFromLocalStorage();
            }
        } catch (error) {
            console.error('Failed to load progress:', error);
            return this.loadFromLocalStorage();
        }
    }

    /**
     * Submit final score and completion
     */
    async submitScore(score, completed = true) {
        if (!this.initialized) {
            console.warn('Moodle not initialized, saving to local storage');
            this.saveToLocalStorage({ score, completed, timestamp: Date.now() });
            return { success: true, mode: 'local' };
        }

        try {
            const response = await fetch(this.apiBaseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'submit_score',
                    session_id: this.sessionId,
                    user_id: this.userId,
                    course_id: this.courseId,
                    activity_id: this.activityId,
                    score: score,
                    completed: completed,
                    timestamp: Date.now()
                })
            });

            return await response.json();
        } catch (error) {
            console.error('Failed to submit score:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get leaderboard data
     */
    async getLeaderboard(limit = 10) {
        try {
            const response = await fetch(this.apiBaseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'get_leaderboard',
                    course_id: this.courseId,
                    activity_id: this.activityId,
                    limit: limit
                })
            });

            return await response.json();
        } catch (error) {
            console.error('Failed to get leaderboard:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Log activity event
     */
    async logEvent(eventType, eventData) {
        if (!this.initialized) return;

        try {
            await fetch(this.apiBaseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'log_event',
                    session_id: this.sessionId,
                    user_id: this.userId,
                    course_id: this.courseId,
                    activity_id: this.activityId,
                    event_type: eventType,
                    event_data: eventData,
                    timestamp: Date.now()
                })
            });
        } catch (error) {
            console.error('Failed to log event:', error);
        }
    }

    /**
     * Save to local storage (fallback)
     */
    saveToLocalStorage(data) {
        try {
            const storageKey = `symmetry_discovery_${this.userId || 'guest'}`;
            const existingData = JSON.parse(localStorage.getItem(storageKey) || '{}');
            const mergedData = { ...existingData, ...data, lastUpdated: Date.now() };
            localStorage.setItem(storageKey, JSON.stringify(mergedData));
        } catch (error) {
            console.error('Failed to save to local storage:', error);
        }
    }

    /**
     * Load from local storage (fallback)
     */
    loadFromLocalStorage() {
        try {
            const storageKey = `symmetry_discovery_${this.userId || 'guest'}`;
            const data = localStorage.getItem(storageKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to load from local storage:', error);
            return null;
        }
    }

    /**
     * Get cookie value
     */
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    /**
     * Check if running in Moodle context
     */
    isInMoodleContext() {
        return this.initialized && this.sessionId !== null;
    }
}
