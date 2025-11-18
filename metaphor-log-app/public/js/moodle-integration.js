/**
 * Moodle LMS Integration
 * Handles communication with Moodle 3.7
 */

const MoodleIntegration = (function() {
    'use strict';

    // Moodle configuration
    const MOODLE_CONFIG = {
        url: window.MOODLE_URL || 'http://localhost/moodle',
        token: window.MOODLE_TOKEN || '',
        wsFunction: 'core_question_get_question_data'
    };

    /**
     * Initialize Moodle integration
     */
    function init() {
        console.log('Initializing Moodle integration...');

        // Check if running inside Moodle iframe
        if (isInMoodle()) {
            console.log('Running inside Moodle');
            setupMoodleListeners();
        } else {
            console.log('Running standalone mode');
        }

        // Check for URL parameters (Moodle passes these)
        const urlParams = new URLSearchParams(window.location.search);
        const moodleUserId = urlParams.get('userid');
        const questionId = urlParams.get('questionid');

        if (moodleUserId) {
            setMoodleUserId(moodleUserId);
        }

        if (questionId) {
            setMoodleQuestionId(questionId);
            loadMoodleQuestion(questionId);
        }
    }

    /**
     * Check if app is running inside Moodle
     */
    function isInMoodle() {
        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
    }

    /**
     * Setup listeners for Moodle parent window
     */
    function setupMoodleListeners() {
        window.addEventListener('message', function(event) {
            // Security: verify origin
            if (!event.origin.includes('localhost')) {
                // In production, check against actual Moodle domain
                console.warn('Untrusted origin:', event.origin);
                return;
            }

            const data = event.data;

            if (data.type === 'moodle_question') {
                handleMoodleQuestion(data.payload);
            } else if (data.type === 'moodle_user') {
                setMoodleUserId(data.userId);
            }
        });

        // Notify Moodle that we're ready
        notifyMoodleReady();
    }

    /**
     * Notify Moodle parent window that app is ready
     */
    function notifyMoodleReady() {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({
                type: 'metaphor_log_ready',
                timestamp: Date.now()
            }, '*');
        }
    }

    /**
     * Send message to Moodle parent window
     */
    function sendToMoodle(type, payload) {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({
                type: type,
                payload: payload,
                timestamp: Date.now()
            }, '*');
        }
    }

    /**
     * Load question from Moodle
     */
    async function loadMoodleQuestion(questionId) {
        if (!MOODLE_CONFIG.token) {
            console.warn('Moodle token not configured');
            return;
        }

        try {
            const url = `${MOODLE_CONFIG.url}/webservice/rest/server.php`;
            const params = new URLSearchParams({
                wstoken: MOODLE_CONFIG.token,
                wsfunction: MOODLE_CONFIG.wsFunction,
                moodlewsrestformat: 'json',
                questionid: questionId
            });

            const response = await fetch(`${url}?${params}`);
            const data = await response.json();

            if (data.exception) {
                throw new Error(data.message);
            }

            handleMoodleQuestion(data);
        } catch (error) {
            console.error('Error loading Moodle question:', error);
        }
    }

    /**
     * Handle Moodle question data
     */
    function handleMoodleQuestion(questionData) {
        console.log('Received Moodle question:', questionData);

        // Parse question data and map to our problem format
        // This depends on how Moodle question is structured
        // For now, we'll use our existing problem loading

        // Extract parameters if available
        if (questionData.base && questionData.result) {
            // If Moodle provides these, we could create a custom problem
            console.log('Custom Moodle question parameters:', questionData);
        }

        // Store question ID for progress tracking
        if (questionData.id) {
            setMoodleQuestionId(questionData.id);
        }
    }

    /**
     * Set Moodle user ID in data attribute
     */
    function setMoodleUserId(userId) {
        const moodleData = document.getElementById('moodleData');
        if (moodleData) {
            moodleData.dataset.userId = userId;
            console.log('Moodle user ID set:', userId);
        }
    }

    /**
     * Set Moodle question ID in data attribute
     */
    function setMoodleQuestionId(questionId) {
        const moodleData = document.getElementById('moodleData');
        if (moodleData) {
            moodleData.dataset.questionId = questionId;
            console.log('Moodle question ID set:', questionId);
        }
    }

    /**
     * Send score to Moodle
     */
    function sendScoreToMoodle(score, maxScore) {
        sendToMoodle('score_update', {
            score: score,
            maxScore: maxScore,
            percentage: (score / maxScore) * 100
        });
    }

    /**
     * Send completion status to Moodle
     */
    function sendCompletionToMoodle(isComplete) {
        sendToMoodle('completion_update', {
            complete: isComplete,
            timestamp: Date.now()
        });
    }

    /**
     * Fetch user preferences from Moodle
     */
    async function fetchUserPreferences(userId) {
        if (!MOODLE_CONFIG.token) {
            return null;
        }

        try {
            const url = `${MOODLE_CONFIG.url}/webservice/rest/server.php`;
            const params = new URLSearchParams({
                wstoken: MOODLE_CONFIG.token,
                wsfunction: 'core_user_get_user_preferences',
                moodlewsrestformat: 'json',
                userid: userId
            });

            const response = await fetch(`${url}?${params}`);
            const data = await response.json();

            return data;
        } catch (error) {
            console.error('Error fetching user preferences:', error);
            return null;
        }
    }

    /**
     * Save user preference to Moodle
     */
    async function saveUserPreference(userId, name, value) {
        if (!MOODLE_CONFIG.token) {
            return false;
        }

        try {
            const url = `${MOODLE_CONFIG.url}/webservice/rest/server.php`;
            const params = new URLSearchParams({
                wstoken: MOODLE_CONFIG.token,
                wsfunction: 'core_user_set_user_preferences',
                moodlewsrestformat: 'json',
                'preferences[0][type]': name,
                'preferences[0][value]': value
            });

            const response = await fetch(url, {
                method: 'POST',
                body: params
            });

            const data = await response.json();
            return !data.exception;
        } catch (error) {
            console.error('Error saving user preference:', error);
            return false;
        }
    }

    /**
     * Create embeddable HTML for Moodle
     */
    function generateMoodleEmbedCode(questionId, userId) {
        const baseUrl = window.location.origin + window.location.pathname;
        const embedUrl = `${baseUrl}?questionid=${questionId}&userid=${userId}`;

        return `<iframe src="${embedUrl}" width="100%" height="750" frameborder="0" style="max-width: 400px; margin: 0 auto; display: block;"></iframe>`;
    }

    // Public API
    return {
        init: init,
        isInMoodle: isInMoodle,
        loadMoodleQuestion: loadMoodleQuestion,
        sendScoreToMoodle: sendScoreToMoodle,
        sendCompletionToMoodle: sendCompletionToMoodle,
        fetchUserPreferences: fetchUserPreferences,
        saveUserPreference: saveUserPreference,
        generateMoodleEmbedCode: generateMoodleEmbedCode
    };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', MoodleIntegration.init);
} else {
    MoodleIntegration.init();
}
