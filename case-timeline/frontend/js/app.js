/**
 * Main Application JavaScript
 * Initializes and manages the app
 */

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/**
 * Initialize the application
 */
async function initializeApp() {
    const caseId = getCaseId();
    const userId = getUserId();

    // Store user ID
    localStorage.setItem(CONFIG.STORAGE_KEYS.USER_ID, userId);

    // Initialize timeline
    timeline = new Timeline();
    await timeline.init(caseId, userId);
}

/**
 * Go back to case list or previous page
 */
function goBack() {
    if (confirm('Are you sure you want to leave this case?')) {
        // Go back to course or case list
        const courseId = getCourseId();
        window.location.href = `case-list.html?course_id=${courseId}`;
    }
}

/**
 * Close event modal
 */
function closeEventModal() {
    if (timeline) {
        timeline.closeEventModal();
    }
}

/**
 * Submit response to interactive event
 */
async function submitResponse() {
    if (timeline) {
        await timeline.submitResponse();
    }
}

/**
 * Continue to next event
 */
async function continueToNext() {
    if (timeline) {
        await timeline.continueToNext();
    }
}

/**
 * Restart/review case
 */
function restartCase() {
    // Hide completion screen
    document.getElementById('completion-screen').style.display = 'none';

    // Re-render timeline to allow review
    if (timeline) {
        timeline.renderTimeline();
    }
}

/**
 * Handle keyboard events
 */
document.addEventListener('keydown', function(event) {
    // ESC key to close modal
    if (event.key === 'Escape') {
        const modal = document.getElementById('event-modal');
        if (modal && modal.style.display === 'flex') {
            closeEventModal();
        }
    }

    // Enter key to submit response (when textarea is focused)
    if (event.key === 'Enter' && event.ctrlKey) {
        const responseInput = document.getElementById('user-response');
        if (responseInput && document.activeElement === responseInput) {
            submitResponse();
        }
    }
});

/**
 * Handle click outside modal to close
 */
document.addEventListener('click', function(event) {
    const modal = document.getElementById('event-modal');
    if (event.target === modal) {
        closeEventModal();
    }
});

/**
 * Prevent accidental page navigation
 */
window.addEventListener('beforeunload', function(event) {
    const progressData = timeline ? timeline.progressData : null;
    if (progressData && progressData.status === 'in_progress') {
        event.preventDefault();
        event.returnValue = '';
        return '';
    }
});

/**
 * Error handling for fetch requests
 */
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    // You can add custom error handling here
});

// Console welcome message
console.log('%c Case Timeline App ', 'background: #667eea; color: white; font-size: 20px; padding: 10px;');
console.log('%c Connected to LMS: Moodle 3.7 ', 'background: #764ba2; color: white; font-size: 12px; padding: 5px;');
console.log('%c PHP 7.1.9 | MySQL 5.7 ', 'background: #333; color: white; font-size: 10px; padding: 3px;');
