/**
 * Moodle Connector
 * Handles communication with Moodle LMS
 */

class MoodleConnector {
    constructor(token, moodleUrl) {
        this.token = token;
        this.moodleUrl = moodleUrl || window.APP_CONFIG?.moodleUrl;
    }

    /**
     * Call Moodle Web Service
     */
    async callWebService(functionName, params = {}) {
        const url = `${this.moodleUrl}/webservice/rest/server.php`;

        const formData = new URLSearchParams({
            wstoken: this.token,
            wsfunction: functionName,
            moodlewsrestformat: 'json',
            ...params
        });

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString()
            });

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
     * Get site info
     */
    async getSiteInfo() {
        return this.callWebService('core_webservice_get_site_info');
    }

    /**
     * Get user info
     */
    async getUserInfo(userId) {
        return this.callWebService('core_user_get_users_by_field', {
            field: 'id',
            'values[0]': userId
        });
    }

    /**
     * Log activity
     */
    async logActivity(userId, action, data) {
        return this.callWebService('local_integration_arms_log_activity', {
            userid: userId,
            action: action,
            data: JSON.stringify(data)
        });
    }

    /**
     * Sync grade
     */
    async syncGrade(userId, quizId, grade) {
        return this.callWebService('core_grades_update_grades', {
            source: 'mod/quiz',
            courseid: 0,
            component: 'mod_quiz',
            activityid: quizId,
            itemnumber: 0,
            'grades[0][studentid]': userId,
            'grades[0][grade]': grade
        });
    }
}
