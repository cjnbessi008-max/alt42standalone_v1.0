<?php
/**
 * Log Result API
 * Records student attempts and results to the database
 */

require_once 'config.php';

// Handle OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJSON([
        'success' => false,
        'error' => 'Only POST requests are allowed'
    ], 405);
}

try {
    // Get JSON input
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if (!$data) {
        sendJSON([
            'success' => false,
            'error' => 'Invalid JSON data'
        ], 400);
    }

    // Validate required fields
    $requiredFields = ['problem_id', 'student_id', 'critical_points'];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field])) {
            sendJSON([
                'success' => false,
                'error' => "Missing required field: $field"
            ], 400);
        }
    }

    $pdo = getDBConnection();

    // Start transaction
    $pdo->beginTransaction();

    try {
        // Insert or update session
        $sessionStmt = $pdo->prepare("
            INSERT INTO " . TABLE_CRITICAL_POINT_SESSIONS . "
            (student_id, problem_id, started_at, last_activity)
            VALUES (:student_id, :problem_id, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
                last_activity = NOW(),
                attempt_count = attempt_count + 1
        ");

        $sessionStmt->execute([
            'student_id' => $data['student_id'],
            'problem_id' => $data['problem_id']
        ]);

        $sessionId = $pdo->lastInsertId() ?: $pdo->query(
            "SELECT id FROM " . TABLE_CRITICAL_POINT_SESSIONS . "
             WHERE student_id = '{$data['student_id']}'
             AND problem_id = {$data['problem_id']}
             ORDER BY id DESC LIMIT 1"
        )->fetchColumn();

        // Insert attempt record
        $attemptStmt = $pdo->prepare("
            INSERT INTO " . TABLE_CRITICAL_POINT_ATTEMPTS . "
            (session_id, problem_id, student_id, critical_points_found,
             num_max_found, num_min_found, time_spent, attempted_at)
            VALUES (:session_id, :problem_id, :student_id, :critical_points,
                    :num_max, :num_min, :time_spent, NOW())
        ");

        // Count max and min points
        $numMax = 0;
        $numMin = 0;
        foreach ($data['critical_points'] as $point) {
            if (isset($point['type'])) {
                if ($point['type'] === 'maximum') {
                    $numMax++;
                } elseif ($point['type'] === 'minimum') {
                    $numMin++;
                }
            }
        }

        $attemptStmt->execute([
            'session_id' => $sessionId,
            'problem_id' => $data['problem_id'],
            'student_id' => $data['student_id'],
            'critical_points' => json_encode($data['critical_points'], JSON_UNESCAPED_UNICODE),
            'num_max' => $numMax,
            'num_min' => $numMin,
            'time_spent' => isset($data['time_spent']) ? (int)$data['time_spent'] : 0
        ]);

        $attemptId = $pdo->lastInsertId();

        // Commit transaction
        $pdo->commit();

        sendJSON([
            'success' => true,
            'message' => 'Result logged successfully',
            'attempt_id' => $attemptId,
            'session_id' => $sessionId,
            'summary' => [
                'total_critical_points' => count($data['critical_points']),
                'maximum_points' => $numMax,
                'minimum_points' => $numMin
            ]
        ]);

    } catch (Exception $e) {
        // Rollback on error
        $pdo->rollBack();
        throw $e;
    }

} catch (Exception $e) {
    logError('Error in logResult.php', $e);

    sendJSON([
        'success' => false,
        'error' => APP_DEBUG ? $e->getMessage() : 'Failed to log result'
    ], 500);
}
