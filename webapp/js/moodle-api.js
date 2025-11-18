/**
 * Moodle API Integration Module
 * Handles communication with Moodle LMS (PHP 7.1.9, MySQL 5.7, Moodle 3.7)
 */

class MoodleAPI {
    constructor(baseUrl, token) {
        this.baseUrl = baseUrl || window.location.origin;
        this.token = token || this.getTokenFromSession();
        this.wsEndpoint = `${this.baseUrl}/webservice/rest/server.php`;
    }

    /**
     * Get token from session or URL
     */
    getTokenFromSession() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('token') || sessionStorage.getItem('moodle_token');
    }

    /**
     * Make API call to Moodle Web Services
     */
    async call(wsfunction, params = {}) {
        const formData = new FormData();
        formData.append('wstoken', this.token);
        formData.append('wsfunction', wsfunction);
        formData.append('moodlewsrestformat', 'json');

        for (const [key, value] of Object.entries(params)) {
            formData.append(key, value);
        }

        try {
            const response = await fetch(this.wsEndpoint, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.exception) {
                throw new Error(data.message || 'Moodle API error');
            }

            return data;
        } catch (error) {
            console.error('Moodle API call failed:', error);
            throw error;
        }
    }

    /**
     * Get 3D Line Seq activity data
     */
    async getSequenceData(activityId) {
        try {
            const data = await this.call('mod_3dlineseq_get_sequence', {
                '3dlineseqid': activityId
            });
            return data;
        } catch (error) {
            console.error('Failed to load sequence data:', error);
            return null;
        }
    }

    /**
     * Submit student attempt
     */
    async submitAttempt(activityId, answer, score = null) {
        try {
            const data = await this.call('mod_3dlineseq_submit_attempt', {
                '3dlineseqid': activityId,
                'answer': JSON.stringify(answer),
                'score': score
            });
            return data;
        } catch (error) {
            console.error('Failed to submit attempt:', error);
            return null;
        }
    }

    /**
     * Get user attempts
     */
    async getUserAttempts(activityId) {
        try {
            const data = await this.call('mod_3dlineseq_get_attempts', {
                '3dlineseqid': activityId
            });
            return data;
        } catch (error) {
            console.error('Failed to load attempts:', error);
            return null;
        }
    }
}

/**
 * Load sequence data from Moodle
 */
async function loadFromMoodle(activityId) {
    const api = new MoodleAPI();
    const data = await api.getSequenceData(activityId);

    if (data) {
        // Update UI with sequence info
        document.getElementById('seq-type').textContent = data.type;
        document.getElementById('seq-values').textContent = data.values.join(', ');

        // Initialize 3D visualization
        init3DLineSeq(data);
    } else {
        // Show error message
        document.getElementById('loading-indicator').innerHTML = `
            <p style="color: #ff6b6b;">데이터를 불러오는데 실패했습니다.</p>
            <p style="font-size: 0.9em; margin-top: 10px;">Moodle 연동을 확인해주세요.</p>
        `;
    }
}

/**
 * Direct API for use within Moodle pages (when embedded)
 */
function getSequenceDataDirect(activityId) {
    // When running inside Moodle, use direct database access via PHP
    return fetch(`${window.location.origin}/mod/3dlineseq/api.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'get_sequence',
            id: activityId
        })
    })
    .then(response => response.json())
    .catch(error => {
        console.error('Direct API call failed:', error);
        return null;
    });
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MoodleAPI, loadFromMoodle, getSequenceDataDirect };
}
