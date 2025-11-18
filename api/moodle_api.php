<?php
/**
 * Moodle Integration API
 * Log student activities and sync with Moodle LMS
 */

require_once 'config.php';

/**
 * Log activity to Moodle
 * @param array $activity Activity data
 * @return bool Success status
 */
function logToMoodle($activity) {
    $url = MOODLE_URL . '/webservice/rest/server.php';

    $params = array(
        'wstoken' => MOODLE_TOKEN,
        'wsfunction' => 'local_touchmath_log_activity',
        'moodlewsrestformat' => 'json',
        'userid' => $activity['userid'],
        'problemid' => $activity['problemid'],
        'action' => $activity['action'],
        'details' => $activity['details'],
        'timestamp' => $activity['timestamp']
    );

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200 && $response) {
        $data = json_decode($response, true);
        return !isset($data['exception']);
    }

    return false;
}

/**
 * Save activity to local database
 * @param array $activity Activity data
 * @return bool Success status
 */
function saveActivityToDatabase($activity) {
    $conn = getDbConnection();

    $stmt = $conn->prepare(
        "INSERT INTO student_activities
         (user_id, problem_id, action, details, created_at)
         VALUES (?, ?, ?, ?, ?)"
    );

    $stmt->bind_param(
        'sisss',
        $activity['userid'],
        $activity['problemid'],
        $activity['action'],
        $activity['details'],
        $activity['timestamp']
    );

    $success = $stmt->execute();
    $stmt->close();

    return $success;
}

/**
 * Update student progress
 * @param string $userId User ID
 * @param int $problemId Problem ID
 * @param string $action Action type
 */
function updateStudentProgress($userId, $problemId, $action) {
    $conn = getDbConnection();

    // Check if progress record exists
    $stmt = $conn->prepare(
        "SELECT id, actions_count, last_action
         FROM student_progress
         WHERE user_id = ? AND problem_id = ?"
    );
    $stmt->bind_param('si', $userId, $problemId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        // Update existing record
        $stmt = $conn->prepare(
            "UPDATE student_progress
             SET actions_count = actions_count + 1,
                 last_action = ?,
                 updated_at = NOW()
             WHERE user_id = ? AND problem_id = ?"
        );
        $stmt->bind_param('ssi', $action, $userId, $problemId);
    } else {
        // Insert new record
        $stmt = $conn->prepare(
            "INSERT INTO student_progress
             (user_id, problem_id, actions_count, last_action, created_at, updated_at)
             VALUES (?, ?, 1, ?, NOW(), NOW())"
        );
        $stmt->bind_param('sis', $userId, $problemId, $action);
    }

    $stmt->execute();
    $stmt->close();

    // Mark as completed if derivative was shown
    if ($action === 'show_derivative') {
        markProblemCompleted($userId, $problemId);
    }
}

/**
 * Mark problem as completed
 * @param string $userId User ID
 * @param int $problemId Problem ID
 */
function markProblemCompleted($userId, $problemId) {
    $conn = getDbConnection();

    $stmt = $conn->prepare(
        "UPDATE student_progress
         SET completed = 1,
             completed_at = NOW()
         WHERE user_id = ? AND problem_id = ? AND completed = 0"
    );

    $stmt->bind_param('si', $userId, $problemId);
    $stmt->execute();
    $stmt->close();
}

// Main API logic
try {
    // Get JSON input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data) {
        throw new Exception('Invalid JSON input');
    }

    // Validate required fields
    $requiredFields = array('userid', 'problemid', 'action', 'timestamp');
    foreach ($requiredFields as $field) {
        if (!isset($data[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }

    $activity = array(
        'userid' => sanitizeInput($data['userid']),
        'problemid' => intval($data['problemid']),
        'action' => sanitizeInput($data['action']),
        'details' => isset($data['details']) ? sanitizeInput($data['details']) : '',
        'timestamp' => sanitizeInput($data['timestamp'])
    );

    // Save to local database
    $dbSuccess = saveActivityToDatabase($activity);

    // Update student progress
    if ($dbSuccess) {
        updateStudentProgress($activity['userid'], $activity['problemid'], $activity['action']);
    }

    // Try to sync with Moodle (non-blocking)
    $moodleSuccess = logToMoodle($activity);

    if (!$moodleSuccess) {
        logError("Failed to sync activity to Moodle for user: " . $activity['userid']);
    }

    sendJsonResponse(array(
        'success' => $dbSuccess,
        'message' => 'Activity logged successfully',
        'synced_to_moodle' => $moodleSuccess
    ));

} catch (Exception $e) {
    logError("Activity logging error: " . $e->getMessage());
    sendJsonResponse(array(
        'success' => false,
        'message' => 'Failed to log activity',
        'error' => APP_DEBUG ? $e->getMessage() : null
    ));
}
