/**
 * API Communication Module
 * Handles all communication with Moodle backend
 */

class SlopeHeatmapAPI {
    constructor() {
        // Get parameters from URL
        const params = new URLSearchParams(window.location.search);
        this.cmid = params.get('cmid') || 1;
        this.userid = params.get('userid') || 1;
        this.sesskey = params.get('sesskey') || '';

        // API endpoint (adjust based on Moodle installation)
        this.baseUrl = '../mod/slopeheatmap/api_endpoint.php';
    }

    /**
     * Make API request
     */
    async request(action, data = {}) {
        try {
            const formData = new FormData();
            formData.append('action', action);
            formData.append('sesskey', this.sesskey);

            // Add all data parameters
            for (const [key, value] of Object.entries(data)) {
                if (typeof value === 'object') {
                    formData.append(key, JSON.stringify(value));
                } else {
                    formData.append(key, value);
                }
            }

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Unknown error');
            }

            return result;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    /**
     * Get problems for this activity
     */
    async getProblems() {
        return await this.request('get_problems', {
            cmid: this.cmid
        });
    }

    /**
     * Start a new session
     */
    async startSession(problemId) {
        return await this.request('start_session', {
            cmid: this.cmid,
            problemid: problemId
        });
    }

    /**
     * Save sensor data
     */
    async saveSensorData(sessionId, sensorData) {
        return await this.request('save_sensor_data', {
            sessionid: sessionId,
            data: sensorData
        });
    }

    /**
     * Complete session
     */
    async completeSession(sessionId, score) {
        return await this.request('complete_session', {
            sessionid: sessionId,
            score: score
        });
    }

    /**
     * Get heatmap data for a session
     */
    async getHeatmapData(sessionId) {
        return await this.request('get_heatmap', {
            sessionid: sessionId
        });
    }
}

// Create global API instance
window.slopeAPI = new SlopeHeatmapAPI();
