/**
 * API Client for Eye Tracking Attention Detection System
 *
 * Handles all communication with the backend API
 */

class APIClient {
    constructor(config = {}) {
        this.baseURL = config.baseURL || '/backend/api';
        this.sessionID = config.sessionID || null;
        this.userID = config.userID || null;
        this.courseID = config.courseID || null;
        this.apiKey = config.apiKey || null;
    }

    /**
     * Make HTTP request
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}/${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.apiKey) {
            headers['X-API-Key'] = this.apiKey;
        }

        if (this.sessionID && !options.body?.session_id) {
            headers['X-Session-ID'] = this.sessionID;
        }

        const config = {
            method: options.method || 'GET',
            headers,
            ...options
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            return data;

        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    /**
     * Start new tracking session
     */
    async startSession(params = {}) {
        const data = await this.request('sessions.php', {
            method: 'POST',
            body: {
                user_id: this.userID,
                course_id: this.courseID,
                activity_id: params.activityID || null,
                activity_type: params.activityType || null,
                screen_width: window.screen.width,
                screen_height: window.screen.height
            }
        });

        if (data.success && data.data.session_id) {
            this.sessionID = data.data.session_id;
        }

        return data;
    }

    /**
     * End tracking session
     */
    async endSession(sessionID = null) {
        const sid = sessionID || this.sessionID;

        if (!sid) {
            throw new Error('No session ID provided');
        }

        return await this.request(`sessions.php?session_id=${sid}`, {
            method: 'DELETE'
        });
    }

    /**
     * Get session details
     */
    async getSession(sessionID = null) {
        const sid = sessionID || this.sessionID;

        if (!sid) {
            throw new Error('No session ID provided');
        }

        return await this.request(`sessions.php?session_id=${sid}`);
    }

    /**
     * Update session
     */
    async updateSession(updates) {
        if (!this.sessionID) {
            throw new Error('No active session');
        }

        return await this.request(`sessions.php?session_id=${this.sessionID}`, {
            method: 'PUT',
            body: updates
        });
    }

    /**
     * Submit eye tracking events (batch)
     */
    async submitTrackingData(events) {
        if (!this.sessionID) {
            throw new Error('No active session');
        }

        if (!Array.isArray(events) || events.length === 0) {
            throw new Error('Events must be a non-empty array');
        }

        return await this.request('tracking.php', {
            method: 'POST',
            body: {
                session_id: this.sessionID,
                events: events
            }
        });
    }

    /**
     * Get tracking data for session
     */
    async getTrackingData(sessionID = null, params = {}) {
        const sid = sessionID || this.sessionID;

        if (!sid) {
            throw new Error('No session ID provided');
        }

        const queryParams = new URLSearchParams({
            session_id: sid,
            limit: params.limit || 100,
            offset: params.offset || 0
        });

        return await this.request(`tracking.php?${queryParams}`);
    }

    /**
     * Get attention analysis for session
     */
    async getAttentionAnalysis(sessionID = null) {
        const sid = sessionID || this.sessionID;

        if (!sid) {
            throw new Error('No session ID provided');
        }

        return await this.request(`attention.php?session_id=${sid}`);
    }

    /**
     * Get alerts for session
     */
    async getAlerts(params = {}) {
        const queryParams = new URLSearchParams({
            action: 'alerts',
            session_id: params.sessionID || this.sessionID || '',
            severity: params.severity || '',
            acknowledged: params.acknowledged !== undefined ? params.acknowledged : ''
        });

        // Remove empty parameters
        for (let [key, value] of queryParams.entries()) {
            if (!value) {
                queryParams.delete(key);
            }
        }

        return await this.request(`attention.php?${queryParams}`);
    }

    /**
     * Get daily summary
     */
    async getDailySummary(userID = null, date = null, courseID = null) {
        const uid = userID || this.userID;

        if (!uid) {
            throw new Error('No user ID provided');
        }

        const queryParams = new URLSearchParams({
            action: 'summary',
            user_id: uid,
            date: date || new Date().toISOString().split('T')[0],
            course_id: courseID || this.courseID || ''
        });

        // Remove empty parameters
        for (let [key, value] of queryParams.entries()) {
            if (!value) {
                queryParams.delete(key);
            }
        }

        return await this.request(`attention.php?${queryParams}`);
    }

    /**
     * Get user statistics
     */
    async getUserStatistics(userID = null, params = {}) {
        const uid = userID || this.userID;

        if (!uid) {
            throw new Error('No user ID provided');
        }

        const queryParams = new URLSearchParams({
            action: 'statistics',
            user_id: uid,
            course_id: params.courseID || this.courseID || '',
            days: params.days || 7
        });

        // Remove empty parameters
        for (let [key, value] of queryParams.entries()) {
            if (!value) {
                queryParams.delete(key);
            }
        }

        return await this.request(`attention.php?${queryParams}`);
    }

    /**
     * Acknowledge alert
     */
    async acknowledgeAlert(alertID) {
        // This would need a backend endpoint to mark alerts as acknowledged
        // For now, this is a placeholder
        console.warn('acknowledgeAlert not yet implemented in backend');
        return { success: true };
    }

    /**
     * Batch event sender with automatic flushing
     */
    createBatchSender(options = {}) {
        const batchSize = options.batchSize || 50;
        const flushInterval = options.flushInterval || 5000; // 5 seconds
        const maxRetries = options.maxRetries || 3;

        let eventBuffer = [];
        let flushTimer = null;
        let isSending = false;

        const flush = async () => {
            if (eventBuffer.length === 0 || isSending) {
                return;
            }

            isSending = true;
            const eventsToSend = [...eventBuffer];
            eventBuffer = [];

            let retries = 0;
            let success = false;

            while (retries < maxRetries && !success) {
                try {
                    await this.submitTrackingData(eventsToSend);
                    success = true;
                } catch (error) {
                    retries++;
                    console.error(`Failed to send batch (attempt ${retries}/${maxRetries}):`, error);

                    if (retries < maxRetries) {
                        // Exponential backoff
                        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
                    }
                }
            }

            if (!success) {
                console.error('Failed to send batch after max retries. Events lost:', eventsToSend.length);
            }

            isSending = false;
        };

        const add = (event) => {
            eventBuffer.push(event);

            // Flush if batch size reached
            if (eventBuffer.length >= batchSize) {
                clearTimeout(flushTimer);
                flush();
            } else {
                // Reset flush timer
                clearTimeout(flushTimer);
                flushTimer = setTimeout(flush, flushInterval);
            }
        };

        const forceFlush = async () => {
            clearTimeout(flushTimer);
            await flush();
        };

        const getBufferSize = () => eventBuffer.length;

        return {
            add,
            flush: forceFlush,
            getBufferSize
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIClient;
}
