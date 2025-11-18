/**
 * Moodle LMS Integration
 * Handles communication with Moodle 3.7 via Web Services
 */

class MoodleIntegration {
    constructor() {
        this.baseUrl = CONFIG.moodle.baseUrl;
        this.apiEndpoint = CONFIG.moodle.apiEndpoint;
        this.wstoken = null;
        this.userId = null;
        this.courseId = null;
        this.cmId = null; // Course Module ID

        this.init();
    }

    /**
     * Initialize Moodle integration
     */
    async init() {
        // Get session data from PHP
        await this.getSessionData();
    }

    /**
     * Get session data (token, user ID, course ID)
     */
    async getSessionData() {
        try {
            const response = await fetch('php/get-session.php');
            const data = await response.json();

            if (data.success) {
                this.wstoken = data.wstoken;
                this.userId = data.userId;
                this.courseId = data.courseId;
                this.cmId = data.cmId;
            } else {
                console.error('Failed to get session data:', data.error);
            }
        } catch (error) {
            console.error('Error getting session data:', error);
        }
    }

    /**
     * Call Moodle web service
     */
    async callMoodleWS(wsfunction, params = {}) {
        if (!this.wstoken) {
            console.error('No web service token available');
            return null;
        }

        const url = new URL(this.baseUrl + this.apiEndpoint);
        url.searchParams.append('wstoken', this.wstoken);
        url.searchParams.append('wsfunction', wsfunction);
        url.searchParams.append('moodlewsrestformat', 'json');

        // Add parameters
        Object.keys(params).forEach(key => {
            url.searchParams.append(key, params[key]);
        });

        try {
            const response = await fetch(url.toString());
            const data = await response.json();

            if (data.exception) {
                console.error('Moodle WS Error:', data.message);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Error calling Moodle WS:', error);
            return null;
        }
    }

    /**
     * Get user information
     */
    async getUserInfo() {
        return await this.callMoodleWS('core_user_get_users_by_field', {
            field: 'id',
            'values[0]': this.userId
        });
    }

    /**
     * Get course information
     */
    async getCourseInfo() {
        return await this.callMoodleWS('core_course_get_courses', {
            'options[ids][0]': this.courseId
        });
    }

    /**
     * Save grade to Moodle gradebook
     */
    async saveGrade(grade, maxGrade = 100) {
        if (!this.cmId) {
            console.warn('No course module ID available');
            return false;
        }

        try {
            // Use custom web service or direct database update via PHP
            const response = await fetch('php/save-grade.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: this.userId,
                    courseId: this.courseId,
                    cmId: this.cmId,
                    grade: grade,
                    maxGrade: maxGrade
                })
            });

            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Error saving grade:', error);
            return false;
        }
    }

    /**
     * Save activity completion status
     */
    async saveCompletion(completed = true) {
        if (!this.cmId) {
            console.warn('No course module ID available');
            return false;
        }

        try {
            const response = await fetch('php/save-completion.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: this.userId,
                    cmId: this.cmId,
                    completed: completed
                })
            });

            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Error saving completion:', error);
            return false;
        }
    }

    /**
     * Log activity event to Moodle
     */
    async logEvent(eventName, eventData = {}) {
        try {
            const response = await fetch('php/log-event.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: this.userId,
                    courseId: this.courseId,
                    cmId: this.cmId,
                    eventName: eventName,
                    eventData: eventData,
                    timestamp: new Date().toISOString()
                })
            });

            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Error logging event:', error);
            return false;
        }
    }

    /**
     * Get previous attempts/progress
     */
    async getPreviousProgress() {
        try {
            const response = await fetch(`php/get-progress.php?userId=${this.userId}&cmId=${this.cmId}`);
            const data = await response.json();

            return data.success ? data.progress : null;
        } catch (error) {
            console.error('Error getting previous progress:', error);
            return null;
        }
    }

    /**
     * Submit final results to Moodle
     */
    async submitResults(results) {
        const grade = this.calculateGrade(results.score, results.totalProblems);

        // Save grade
        await this.saveGrade(grade);

        // Mark as complete
        await this.saveCompletion(true);

        // Log completion event
        await this.logEvent('color_union_completed', {
            score: results.score,
            totalProblems: results.totalProblems,
            completedProblems: results.completedProblems,
            grade: grade
        });

        return true;
    }

    /**
     * Calculate grade (0-100)
     */
    calculateGrade(score, totalProblems) {
        const maxScore = totalProblems * CONFIG.scoring.correctAnswer;
        const percentage = (score / maxScore) * 100;
        return Math.max(0, Math.min(100, Math.round(percentage)));
    }
}

// Initialize Moodle integration
let moodleIntegration;
document.addEventListener('DOMContentLoaded', () => {
    moodleIntegration = new MoodleIntegration();
});
