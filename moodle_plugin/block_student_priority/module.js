/**
 * JavaScript module for Student Priority Selection block.
 *
 * @package    block_student_priority
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

var studentPriorityConfig = {
    userid: 0,
    courseid: 0,
    sesskey: ''
};

/**
 * Initialize the student priority module
 *
 * @param {number} userid - User ID
 * @param {number} courseid - Course ID
 * @param {string} sesskey - Session key
 */
function init_student_priority(userid, courseid, sesskey) {
    studentPriorityConfig.userid = userid;
    studentPriorityConfig.courseid = courseid;
    studentPriorityConfig.sesskey = sesskey;

    // Add event listeners to all priority cards
    var cards = document.querySelectorAll('.priority-card');
    cards.forEach(function(card) {
        card.addEventListener('click', function() {
            var stepId = parseInt(this.getAttribute('data-step-id'));
            selectPriorityStep(stepId);
        });

        // Add keyboard support
        card.setAttribute('tabindex', '0');
        card.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                var stepId = parseInt(this.getAttribute('data-step-id'));
                selectPriorityStep(stepId);
            }
        });
    });
}

/**
 * Handle priority step selection
 *
 * @param {number} stepId - Selected step ID
 */
function selectPriorityStep(stepId) {
    // Remove previous selection
    var cards = document.querySelectorAll('.priority-card');
    cards.forEach(function(card) {
        card.classList.remove('selected', 'selecting');
    });

    // Mark new selection
    var selectedCard = document.querySelector('.priority-card[data-step-id="' + stepId + '"]');
    if (selectedCard) {
        selectedCard.classList.add('selecting');
    }

    // Get step name
    var stepName = '';
    if (selectedCard) {
        var stepNameElement = selectedCard.querySelector('.step-name');
        if (stepNameElement) {
            stepName = stepNameElement.textContent;
        }
    }

    // Show loading message
    showStatusMessage('Saving your selection...', 'info');

    // Send AJAX request
    savePrioritySelection(stepId, stepName);
}

/**
 * Save priority selection via AJAX
 *
 * @param {number} stepId - Selected step ID
 * @param {string} stepName - Step name
 */
function savePrioritySelection(stepId, stepName) {
    var xhr = new XMLHttpRequest();
    var url = M.cfg.wwwroot + '/blocks/student_priority/save_priority.php';

    var params = 'userid=' + encodeURIComponent(studentPriorityConfig.userid) +
                 '&courseid=' + encodeURIComponent(studentPriorityConfig.courseid) +
                 '&priority_step=' + encodeURIComponent(stepId) +
                 '&step_name=' + encodeURIComponent(stepName) +
                 '&sesskey=' + encodeURIComponent(studentPriorityConfig.sesskey);

    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    var response = JSON.parse(xhr.responseText);
                    handleSaveResponse(response, stepId);
                } catch (e) {
                    showStatusMessage('Error: Invalid response from server', 'error');
                    resetSelection();
                }
            } else {
                showStatusMessage('Error: Failed to save selection', 'error');
                resetSelection();
            }
        }
    };

    xhr.send(params);
}

/**
 * Handle save response
 *
 * @param {Object} response - Server response
 * @param {number} stepId - Selected step ID
 */
function handleSaveResponse(response, stepId) {
    if (response.success) {
        // Update UI to show successful selection
        var selectedCard = document.querySelector('.priority-card[data-step-id="' + stepId + '"]');
        if (selectedCard) {
            selectedCard.classList.remove('selecting');
            selectedCard.classList.add('selected');

            // Add or update selected badge
            var badge = selectedCard.querySelector('.selected-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'selected-badge';
                selectedCard.appendChild(badge);
            }
            badge.textContent = '✓ Selected';
        }

        // Update current selection display
        updateCurrentSelectionDisplay(response.step_name);

        // Show success message
        showStatusMessage(response.message, 'success');
    } else {
        showStatusMessage(response.message || 'Error saving selection', 'error');
        resetSelection();
    }
}

/**
 * Update the current selection display
 *
 * @param {string} stepName - Name of selected step
 */
function updateCurrentSelectionDisplay(stepName) {
    var currentSelection = document.querySelector('.current-selection');

    if (currentSelection) {
        currentSelection.innerHTML = '<strong>Your current priority: </strong>' + stepName;
    } else {
        // Create new current selection display
        var container = document.querySelector('.student-priority-container');
        if (container) {
            var div = document.createElement('div');
            div.className = 'current-selection alert alert-info';
            div.innerHTML = '<strong>Your current priority: </strong>' + stepName;

            var header = container.querySelector('h3');
            if (header && header.nextSibling) {
                container.insertBefore(div, header.nextSibling.nextSibling);
            }
        }
    }
}

/**
 * Show status message to user
 *
 * @param {string} message - Message to display
 * @param {string} type - Message type (success, error, info)
 */
function showStatusMessage(message, type) {
    var statusDiv = document.getElementById('priority-status');
    if (!statusDiv) {
        return;
    }

    statusDiv.className = 'priority-status-message alert alert-' +
                         (type === 'success' ? 'success' :
                          type === 'error' ? 'danger' : 'info');
    statusDiv.textContent = message;
    statusDiv.style.display = 'block';

    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(function() {
            statusDiv.style.display = 'none';
        }, 5000);
    }
}

/**
 * Reset selection UI on error
 */
function resetSelection() {
    var cards = document.querySelectorAll('.priority-card');
    cards.forEach(function(card) {
        card.classList.remove('selecting');
    });
}
