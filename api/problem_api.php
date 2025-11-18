<?php
/**
 * Problem API - Get problem data from Moodle
 * Compatible with Moodle 3.7 and PHP 7.1.9
 */

require_once 'config.php';

/**
 * Fetch problem from Moodle via Web Services
 * @param int $problemId Problem ID
 * @return array Problem data
 */
function fetchProblemFromMoodle($problemId) {
    $url = MOODLE_URL . '/webservice/rest/server.php';

    $params = array(
        'wstoken' => MOODLE_TOKEN,
        'wsfunction' => 'local_touchmath_get_problem',
        'moodlewsrestformat' => 'json',
        'problemid' => $problemId
    );

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) {
        logError("Moodle API call failed: HTTP $httpCode");
        return null;
    }

    $data = json_decode($response, true);

    if (isset($data['exception'])) {
        logError("Moodle API error: " . $data['message']);
        return null;
    }

    return $data;
}

/**
 * Get problem from database
 * @param int $problemId Problem ID
 * @return array|null Problem data
 */
function getProblemFromDatabase($problemId) {
    $conn = getDbConnection();
    $stmt = $conn->prepare(
        "SELECT id, title, description, function_expr, difficulty, created_at
         FROM problems
         WHERE id = ? AND status = 'active'"
    );

    $stmt->bind_param('i', $problemId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        return null;
    }

    $problem = $result->fetch_assoc();
    $stmt->close();

    return $problem;
}

/**
 * Get demo problem for testing
 * @return array Demo problem data
 */
function getDemoProblem() {
    return array(
        'id' => 1,
        'title' => 'Quadratic Function and Derivative',
        'description' => 'Plot f(x) = x² and observe how its derivative f\'(x) = 2x represents the slope at each point.',
        'function' => 'x^2',
        'difficulty' => 'easy',
        'hints' => array(
            'The derivative of x² is 2x',
            'Notice how the derivative is positive when x > 0 and negative when x < 0',
            'At x = 0, the derivative is 0 (the turning point)'
        )
    );
}

// Main API logic
try {
    $problemId = isset($_GET['problemid']) ? intval($_GET['problemid']) : 1;
    $userId = isset($_GET['userid']) ? sanitizeInput($_GET['userid']) : 'demo';

    // Try to fetch from Moodle first
    $problem = fetchProblemFromMoodle($problemId);

    // Fallback to local database
    if (!$problem) {
        $problem = getProblemFromDatabase($problemId);
    }

    // Fallback to demo problem
    if (!$problem) {
        logError("Problem $problemId not found, using demo");
        $problem = getDemoProblem();
    }

    // Log access
    $conn = getDbConnection();
    $stmt = $conn->prepare(
        "INSERT INTO problem_access (problem_id, user_id, accessed_at)
         VALUES (?, ?, NOW())"
    );
    $stmt->bind_param('is', $problemId, $userId);
    $stmt->execute();
    $stmt->close();

    sendJsonResponse(array(
        'success' => true,
        'problem' => array(
            'id' => $problem['id'],
            'title' => $problem['title'],
            'description' => $problem['description'],
            'function' => $problem['function'] ?? $problem['function_expr'] ?? 'x^2',
            'difficulty' => $problem['difficulty'] ?? 'medium',
            'hints' => $problem['hints'] ?? array()
        )
    ));

} catch (Exception $e) {
    logError("Problem API error: " . $e->getMessage());
    sendJsonResponse(array(
        'success' => false,
        'message' => 'Failed to load problem',
        'error' => APP_DEBUG ? $e->getMessage() : null
    ));
}
