/**
 * API Communication Layer
 */

const API = {
    /**
     * Make HTTP request
     */
    async request(endpoint, options = {}) {
        const url = `${CONFIG.API_BASE_URL}/${endpoint}`;
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const config = { ...defaultOptions, ...options };

        try {
            Utils.log('API Request:', url, config);

            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'API request failed');
            }

            Utils.log('API Response:', data);
            return data;
        } catch (error) {
            Utils.error('API Error:', error);
            throw error;
        }
    },

    /**
     * Get all shapes
     */
    async getShapes() {
        return await this.request('shapes.php');
    },

    /**
     * Get specific shape with properties
     */
    async getShape(shapeId) {
        return await this.request(`shapes.php?id=${shapeId}`);
    },

    /**
     * Get all transformations
     */
    async getTransformations() {
        return await this.request('transformations.php');
    },

    /**
     * Track user interaction
     */
    async trackInteraction(interactionData) {
        return await this.request('interactions.php', {
            method: 'POST',
            body: JSON.stringify(interactionData)
        });
    },

    /**
     * Create learning session
     */
    async createSession(userId, moodleCourseId = null, moodleUserId = null) {
        return await this.request('sessions.php', {
            method: 'POST',
            body: JSON.stringify({
                user_id: userId,
                moodle_course_id: moodleCourseId,
                moodle_user_id: moodleUserId
            })
        });
    },

    /**
     * Get session data
     */
    async getSession(sessionId) {
        return await this.request(`sessions.php?session_id=${sessionId}`);
    },

    /**
     * Update session
     */
    async updateSession(sessionId, updateData) {
        return await this.request('sessions.php', {
            method: 'PUT',
            body: JSON.stringify({
                session_id: sessionId,
                ...updateData
            })
        });
    },

    /**
     * Authenticate with Moodle
     */
    async authenticateMoodle(moodleUserId, moodleCourseId) {
        return await this.request('moodle.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'authenticate',
                moodle_user_id: moodleUserId,
                moodle_course_id: moodleCourseId
            })
        });
    },

    /**
     * Sync progress to Moodle
     */
    async syncToMoodle(moodleUserId, moodleCourseId, grade, feedback = '') {
        return await this.request('moodle.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'sync_progress',
                moodle_user_id: moodleUserId,
                moodle_course_id: moodleCourseId,
                grade: grade,
                feedback: feedback
            })
        });
    }
};

// Session Manager
const SessionManager = {
    currentSession: null,
    userId: null,
    moodleUserId: null,
    moodleCourseId: null,

    /**
     * Initialize session
     */
    async init() {
        // Get user info from URL parameters (from Moodle)
        this.moodleUserId = Utils.getUrlParam('moodle_user_id');
        this.moodleCourseId = Utils.getUrlParam('moodle_course_id');
        this.userId = this.moodleUserId || 'guest_' + Utils.generateId();

        // Authenticate with Moodle if parameters exist
        if (this.moodleUserId && this.moodleCourseId) {
            try {
                const authResult = await API.authenticateMoodle(this.moodleUserId, this.moodleCourseId);
                if (authResult.success) {
                    Utils.log('Moodle authentication successful:', authResult.data);
                    this.updateUserInfo(authResult.data.fullname);
                }
            } catch (error) {
                Utils.error('Moodle authentication failed:', error);
            }
        }

        // Create learning session
        try {
            const sessionResult = await API.createSession(
                this.userId,
                this.moodleCourseId,
                this.moodleUserId
            );

            if (sessionResult.success) {
                this.currentSession = sessionResult.data.session_id;
                Utils.log('Session created:', this.currentSession);
            }
        } catch (error) {
            Utils.error('Failed to create session:', error);
        }

        // Auto-sync if enabled
        if (CONFIG.MOODLE.ENABLED && CONFIG.MOODLE.AUTO_SYNC) {
            this.startAutoSync();
        }
    },

    /**
     * Update user info display
     */
    updateUserInfo(userName) {
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = userName || '게스트';
        }
    },

    /**
     * Track interaction
     */
    async trackInteraction(interactionData) {
        if (!this.currentSession) return;

        try {
            await API.trackInteraction({
                user_id: this.userId,
                session_id: this.currentSession,
                ...interactionData
            });
        } catch (error) {
            Utils.error('Failed to track interaction:', error);
        }
    },

    /**
     * Update session progress
     */
    async updateProgress(completionPercentage, propertiesLearned = []) {
        if (!this.currentSession) return;

        try {
            await API.updateSession(this.currentSession, {
                completion_percentage: completionPercentage,
                properties_learned: propertiesLearned
            });
        } catch (error) {
            Utils.error('Failed to update progress:', error);
        }
    },

    /**
     * End session
     */
    async endSession() {
        if (!this.currentSession) return;

        try {
            await API.updateSession(this.currentSession, {
                end_session: true
            });
            Utils.log('Session ended');
        } catch (error) {
            Utils.error('Failed to end session:', error);
        }
    },

    /**
     * Start auto-sync to Moodle
     */
    startAutoSync() {
        setInterval(async () => {
            if (this.moodleUserId && this.moodleCourseId && this.currentSession) {
                try {
                    // Calculate grade based on session data
                    const sessionData = await API.getSession(this.currentSession);
                    if (sessionData.success) {
                        const grade = sessionData.data.completion_percentage || 0;
                        await API.syncToMoodle(
                            this.moodleUserId,
                            this.moodleCourseId,
                            grade,
                            '형상 변환기 학습 진행 중'
                        );
                        Utils.log('Auto-synced to Moodle, grade:', grade);
                    }
                } catch (error) {
                    Utils.error('Auto-sync failed:', error);
                }
            }
        }, CONFIG.MOODLE.SYNC_INTERVAL);
    }
};

// Handle page unload
window.addEventListener('beforeunload', () => {
    SessionManager.endSession();
});
