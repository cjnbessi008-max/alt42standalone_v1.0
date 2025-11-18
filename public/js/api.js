/**
 * API Communication Module
 * Handles all API requests to the PHP backend
 */

const API = {
    /**
     * Generic fetch request
     */
    async request(endpoint, method = 'GET', data = null) {
        const url = `${CONFIG.API_BASE_URL}/${endpoint}`;

        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        } else if (data && method === 'GET') {
            const params = new URLSearchParams(data);
            return fetch(`${url}?${params}`, options)
                .then(response => response.json());
        }

        try {
            const response = await fetch(url, options);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'API request failed');
            }

            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    /**
     * Get all shapes
     */
    async getShapes() {
        return this.request('shapes', 'GET');
    },

    /**
     * Get shape by ID
     */
    async getShape(shapeId) {
        return this.request('shapes', 'GET', { id: shapeId });
    },

    /**
     * Get shapes by difficulty
     */
    async getShapesByDifficulty(level) {
        return this.request('shapes', 'GET', { difficulty: level });
    },

    /**
     * Start a new session
     */
    async startSession(shapeId) {
        const context = getMoodleContext();
        return this.request('session', 'POST', {
            user_id: context.user_id,
            course_id: context.course_id,
            shape_id: shapeId
        });
    },

    /**
     * Get session info
     */
    async getSession(sessionId) {
        return this.request('session', 'GET', { session_id: sessionId });
    },

    /**
     * Update session
     */
    async updateSession(sessionId, sessionData) {
        return this.request('session', 'PUT', {
            session_id: sessionId,
            session_data: sessionData
        });
    },

    /**
     * Log manipulation action
     */
    async logManipulation(sessionId, actionType, actionData, calculatedArea = null) {
        return this.request('manipulation', 'POST', {
            session_id: sessionId,
            action_type: actionType,
            action_data: actionData,
            calculated_area: calculatedArea
        });
    },

    /**
     * Validate area conservation
     */
    async validateArea(sessionId, pieces) {
        return this.request('validate', 'POST', {
            session_id: sessionId,
            pieces: pieces
        });
    },

    /**
     * Get student progress
     */
    async getProgress() {
        const context = getMoodleContext();
        return this.request('progress', 'GET', {
            user_id: context.user_id,
            course_id: context.course_id
        });
    },

    /**
     * Get shape statistics
     */
    async getShapeStatistics(shapeId) {
        return this.request('statistics', 'GET', { shape_id: shapeId });
    },

    /**
     * Get user statistics
     */
    async getUserStatistics() {
        const context = getMoodleContext();
        return this.request('statistics', 'GET', {
            user_id: context.user_id,
            course_id: context.course_id
        });
    }
};

/**
 * UI Helper Functions
 */
const UIHelpers = {
    /**
     * Show loading overlay
     */
    showLoading() {
        document.getElementById('loading-overlay').classList.remove('hidden');
    },

    /**
     * Hide loading overlay
     */
    hideLoading() {
        document.getElementById('loading-overlay').classList.add('hidden');
    },

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                container.removeChild(toast);
            }, 300);
        }, 3000);
    },

    /**
     * Switch to a different screen
     */
    switchScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
    },

    /**
     * Update progress display
     */
    async updateProgressDisplay() {
        try {
            const result = await API.getProgress();
            const progress = result.progress;

            document.getElementById('completed-shapes').textContent = progress.total_shapes_completed || 0;
            document.getElementById('average-score').textContent = Math.round(progress.average_score || 0);
            document.getElementById('max-difficulty').textContent = progress.highest_difficulty_level || 0;

            // Display achievements
            const achievementsList = document.getElementById('achievements-list');
            achievementsList.innerHTML = '';

            if (progress.achievements && progress.achievements.length > 0) {
                progress.achievements.forEach(achievementKey => {
                    const achievement = CONFIG.ACHIEVEMENTS[achievementKey];
                    if (achievement) {
                        const badge = document.createElement('div');
                        badge.className = 'achievement-badge';
                        badge.innerHTML = `
                            <span>${achievement.icon}</span>
                            <span>${achievement.name}</span>
                        `;
                        badge.title = achievement.description;
                        achievementsList.appendChild(badge);
                    }
                });
            } else {
                achievementsList.innerHTML = '<p class="loading">아직 획득한 배지가 없습니다</p>';
            }
        } catch (error) {
            console.error('Failed to update progress:', error);
        }
    },

    /**
     * Format time duration
     */
    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
};

// Add slideOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
