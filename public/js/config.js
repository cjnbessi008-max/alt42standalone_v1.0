/**
 * Application Configuration
 */

const CONFIG = {
    API_BASE_URL: window.location.origin + '/api',
    DEFAULT_STUDENT_ID: 1, // Change this based on Moodle user ID
    MOODLE_COURSE_ID: null,
    MOODLE_ACTIVITY_ID: null,

    // Get from URL parameters if available
    getStudentId() {
        const params = new URLSearchParams(window.location.search);
        return parseInt(params.get('student_id')) || this.DEFAULT_STUDENT_ID;
    },

    getMoodleCourseId() {
        const params = new URLSearchParams(window.location.search);
        return parseInt(params.get('course_id')) || this.MOODLE_COURSE_ID;
    },

    getMoodleActivityId() {
        const params = new URLSearchParams(window.location.search);
        return parseInt(params.get('activity_id')) || this.MOODLE_ACTIVITY_ID;
    }
};
