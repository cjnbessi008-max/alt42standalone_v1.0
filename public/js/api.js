/**
 * API Communication Layer
 * Math Concept Game System
 */

const API = {
    baseURL: '/api',

    /**
     * Generic API request handler
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies for session
        };

        const config = { ...defaultOptions, ...options };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'API request failed');
            }

            return data.data;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    },

    /**
     * Authentication APIs
     */
    auth: {
        async login(username, password) {
            return await API.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });
        },

        async logout() {
            return await API.request('/auth/logout', {
                method: 'POST'
            });
        },

        async me() {
            return await API.request('/auth/me');
        },

        async register(username, fullName, gradeLevel, email) {
            return await API.request('/auth/register', {
                method: 'POST',
                body: JSON.stringify({
                    username,
                    full_name: fullName,
                    grade_level: gradeLevel,
                    email
                })
            });
        }
    },

    /**
     * Game APIs
     */
    games: {
        async list() {
            return await API.request('/games');
        },

        async launch(conceptName, stage = null) {
            return await API.request('/games/launch', {
                method: 'POST',
                body: JSON.stringify({
                    concept_name: conceptName,
                    stage
                })
            });
        },

        async getSession(sessionId) {
            return await API.request(`/games/session/${sessionId}`);
        },

        async updateSession(sessionId, sessionData) {
            return await API.request(`/games/session/${sessionId}`, {
                method: 'PUT',
                body: JSON.stringify({ session_data: sessionData })
            });
        },

        async completeStage(sessionId, stage, score, timeSpent) {
            return await API.request('/games/complete', {
                method: 'POST',
                body: JSON.stringify({
                    session_id: sessionId,
                    stage,
                    score,
                    time_spent: timeSpent
                })
            });
        }
    },

    /**
     * Card APIs
     */
    cards: {
        async getCollection() {
            return await API.request('/cards/collection');
        },

        async getDetail(cardId) {
            return await API.request(`/cards/detail/${cardId}`);
        },

        async toggleFavorite(cardId, favorite) {
            return await API.request('/cards/favorite', {
                method: 'POST',
                body: JSON.stringify({ card_id: cardId, favorite })
            });
        }
    },

    /**
     * Progress APIs
     */
    progress: {
        async getSummary() {
            return await API.request('/progress/summary');
        },

        async getGameProgress(cardId) {
            return await API.request(`/progress/game/${cardId}`);
        }
    },

    /**
     * Points APIs
     */
    points: {
        async getHistory(limit = 50) {
            return await API.request(`/points/history?limit=${limit}`);
        },

        async getSummary() {
            return await API.request('/points/summary');
        }
    },

    /**
     * Moodle APIs
     */
    moodle: {
        async trigger(moodleUserId, problemType, problemId, problemUrl) {
            return await API.request('/moodle/trigger', {
                method: 'POST',
                body: JSON.stringify({
                    moodle_user_id: moodleUserId,
                    problem_type: problemType,
                    problem_id: problemId,
                    problem_url: problemUrl
                })
            });
        },

        async complete(syncId, sessionId, score, completionStatus) {
            return await API.request('/moodle/complete', {
                method: 'POST',
                body: JSON.stringify({
                    sync_id: syncId,
                    session_id: sessionId,
                    score,
                    completion_status: completionStatus
                })
            });
        },

        async getStatus(syncId) {
            return await API.request(`/moodle/status/${syncId}`);
        }
    }
};

// Export for use in other scripts
window.API = API;
