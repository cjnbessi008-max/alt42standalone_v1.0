/**
 * API Client for Log Network Map
 */

class ApiClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl || CONFIG.API_BASE_URL;
    }

    /**
     * Make HTTP request
     */
    async request(endpoint, options = {}) {
        const url = this.baseUrl + endpoint;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const config = { ...defaultOptions, ...options };

        try {
            debug('API Request:', url, config);
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            debug('API Response:', data);
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    /**
     * GET request
     */
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    /**
     * POST request
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PUT request
     */
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // ========== Network API ==========

    /**
     * Get network graph data
     */
    async getNetworkData(studentId = null) {
        const params = studentId ? { student_id: studentId } : {};
        return this.get(CONFIG.ENDPOINTS.NETWORK, params);
    }

    // ========== Concepts API ==========

    /**
     * Get all concepts
     */
    async getConcepts(category = null) {
        const params = category ? { category } : {};
        return this.get(CONFIG.ENDPOINTS.CONCEPTS, params);
    }

    /**
     * Create new concept
     */
    async createConcept(conceptData) {
        return this.post(CONFIG.ENDPOINTS.CONCEPTS, conceptData);
    }

    // ========== Logs API ==========

    /**
     * Get logs by student
     */
    async getLogsByStudent(studentId) {
        return this.get(CONFIG.ENDPOINTS.LOGS, { student_id: studentId });
    }

    /**
     * Get logs by concept
     */
    async getLogsByConcept(conceptId) {
        return this.get(CONFIG.ENDPOINTS.LOGS, { concept_id: conceptId });
    }

    /**
     * Create new log entry
     */
    async createLog(logData) {
        return this.post(CONFIG.ENDPOINTS.LOGS, logData);
    }

    // ========== Moodle API ==========

    /**
     * Get Moodle users
     */
    async getMoodleUsers() {
        return this.get(CONFIG.ENDPOINTS.MOODLE, { action: 'get_users' });
    }

    /**
     * Get Moodle courses
     */
    async getMoodleCourses() {
        return this.get(CONFIG.ENDPOINTS.MOODLE, { action: 'get_courses' });
    }

    /**
     * Get Moodle logs
     */
    async getMoodleLogs(courseId, userId = null) {
        const params = { action: 'get_logs', course_id: courseId };
        if (userId) params.user_id = userId;
        return this.get(CONFIG.ENDPOINTS.MOODLE, params);
    }

    /**
     * Sync Moodle users
     */
    async syncMoodleUsers() {
        return this.post(CONFIG.ENDPOINTS.MOODLE, { action: 'sync_users' });
    }

    /**
     * Import Moodle logs
     */
    async importMoodleLogs(courseId) {
        return this.post(CONFIG.ENDPOINTS.MOODLE, {
            action: 'import_logs',
            course_id: courseId
        });
    }
}

// Create global API client instance
const api = new ApiClient();

// ========== Helper Functions ==========

/**
 * Fetch network data for visualization
 */
async function fetchNetworkData(studentId = null) {
    try {
        const response = await api.getNetworkData(studentId);
        if (response.success) {
            return {
                nodes: response.data.nodes || [],
                edges: response.data.edges || [],
                statistics: response.data.statistics || {},
                learningPaths: response.data.learning_paths || []
            };
        } else {
            throw new Error(response.message || 'Failed to fetch network data');
        }
    } catch (error) {
        console.error('Error fetching network data:', error);
        showNotification('네트워크 데이터를 불러오는데 실패했습니다.', 'error');
        throw error;
    }
}

/**
 * Fetch students list
 */
async function fetchStudents() {
    try {
        // This would need a separate students endpoint
        // For now, we'll use Moodle sync if available
        const response = await api.getMoodleUsers();
        if (response.success) {
            return response.data.users || [];
        }
        return [];
    } catch (error) {
        debug('Could not fetch students:', error);
        return [];
    }
}

/**
 * Show notification to user
 */
function showNotification(message, type = 'info') {
    // Simple notification using Bootstrap alerts
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, 5000);
}
