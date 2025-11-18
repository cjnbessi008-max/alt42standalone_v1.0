/**
 * Angle Live - API Client
 */

const API = {
    /**
     * Make API request
     */
    request: async function(endpoint, method = 'GET', data = null) {
        const url = CONFIG.API_BASE_URL + endpoint;

        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        try {
            Utils.log('API Request', { url, method, data });

            const response = await fetch(url, options);
            const result = await response.json();

            Utils.log('API Response', result);

            return result;
        } catch (error) {
            Utils.error('API Request failed', error);
            throw error;
        }
    },

    /**
     * Get current angle for session
     */
    getAngle: async function(sessionId) {
        return await this.request('?action=get_angle&session_id=' + sessionId, 'GET');
    },

    /**
     * Update angle value
     */
    updateAngle: async function(userId, sessionId, angleValue) {
        return await this.request('?action=update_angle', 'POST', {
            user_id: userId,
            session_id: sessionId,
            angle_value: angleValue
        });
    },

    /**
     * Get all angle thresholds
     */
    getThresholds: async function() {
        return await this.request('?action=get_thresholds', 'GET');
    },

    /**
     * Get user progress
     */
    getProgress: async function(userId) {
        return await this.request('?action=get_progress&user_id=' + userId, 'GET');
    },

    /**
     * Sync with Moodle
     */
    syncMoodle: async function(userId, moodleUserId, moodleCourseId) {
        return await this.request('?action=sync_moodle', 'POST', {
            user_id: userId,
            moodle_user_id: moodleUserId,
            moodle_course_id: moodleCourseId
        });
    },

    /**
     * Get API status
     */
    getStatus: async function() {
        return await this.request('?action=get_status', 'GET');
    }
};

/**
 * Data Manager - Handles local caching and sync
 */
const DataManager = {
    thresholds: [],
    currentAngle: 0,
    currentStatus: null,
    userProgress: null,

    /**
     * Initialize data
     */
    init: async function() {
        try {
            Utils.showLoading();

            // Load thresholds
            const thresholdsResponse = await API.getThresholds();
            if (thresholdsResponse.success) {
                this.thresholds = thresholdsResponse.data;
                Utils.log('Thresholds loaded', this.thresholds);
            }

            // Load user progress
            const progressResponse = await API.getProgress(CONFIG.USER_ID);
            if (progressResponse.success) {
                this.userProgress = progressResponse.data;
                Utils.log('User progress loaded', this.userProgress);
            }

            Utils.hideLoading();
            return true;
        } catch (error) {
            Utils.error('Failed to initialize data', error);
            Utils.hideLoading();
            return false;
        }
    },

    /**
     * Update angle
     */
    updateAngle: async function(angle) {
        this.currentAngle = angle;

        // Find matching threshold
        const status = this.findAngleStatus(angle);
        this.currentStatus = status;

        // Send to server if auto-save is enabled
        if (CONFIG.AUTO_SAVE) {
            try {
                const response = await API.updateAngle(
                    CONFIG.USER_ID,
                    CONFIG.SESSION_ID,
                    angle
                );

                if (response.success) {
                    Utils.log('Angle updated on server', response);
                    return response.status;
                }
            } catch (error) {
                Utils.error('Failed to update angle on server', error);
            }
        }

        return status;
    },

    /**
     * Find angle status from thresholds
     */
    findAngleStatus: function(angle) {
        for (let threshold of this.thresholds) {
            const min = parseFloat(threshold.angle_min);
            const max = parseFloat(threshold.angle_max);

            if (angle >= min && angle <= max) {
                return {
                    name: threshold.status_name,
                    description: threshold.status_description,
                    visual: threshold.visual_feedback,
                    audio: threshold.audio_feedback
                };
            }
        }

        return {
            name: 'Unknown',
            description: '알 수 없는 각도입니다.',
            visual: 'color-default',
            audio: null
        };
    },

    /**
     * Refresh user progress
     */
    refreshProgress: async function() {
        try {
            const response = await API.getProgress(CONFIG.USER_ID);
            if (response.success) {
                this.userProgress = response.data;
                return this.userProgress;
            }
        } catch (error) {
            Utils.error('Failed to refresh progress', error);
        }
        return null;
    },

    /**
     * Sync with Moodle
     */
    syncWithMoodle: async function() {
        if (!CONFIG.MOODLE_USER_ID || !CONFIG.MOODLE_COURSE_ID) {
            Utils.log('Moodle parameters not set, skipping sync');
            return;
        }

        try {
            const response = await API.syncMoodle(
                CONFIG.USER_ID,
                CONFIG.MOODLE_USER_ID,
                CONFIG.MOODLE_COURSE_ID
            );

            if (response.success) {
                Utils.log('Synced with Moodle', response);
                return true;
            }
        } catch (error) {
            Utils.error('Failed to sync with Moodle', error);
        }
        return false;
    }
};
