<?php
/**
 * Problems API Endpoints
 */

require_once __DIR__ . '/../utils/Database.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $params[0] ?? '';

$db = Database::getInstance();

switch ($action) {
    case 'list':
        // GET /api/problems/list?limit=10&offset=0
        if ($method !== 'GET') {
            sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
        }

        $limit = $_GET['limit'] ?? 10;
        $offset = $_GET['offset'] ?? 0;

        $problems = $db->fetchAll(
            "SELECT * FROM problems
            WHERE is_active = TRUE
            ORDER BY id DESC
            LIMIT ? OFFSET ?",
            [$limit, $offset]
        );

        $total = $db->fetchOne("SELECT COUNT(*) as count FROM problems WHERE is_active = TRUE");

        sendResponse([
            'success' => true,
            'problems' => $problems,
            'total' => (int)$total['count'],
            'limit' => (int)$limit,
            'offset' => (int)$offset
        ]);
        break;

    case 'get':
        // GET /api/problems/get/123
        if ($method !== 'GET') {
            sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
        }

        $problemId = $params[1] ?? null;
        if (!$problemId) {
            sendResponse(['success' => false, 'error' => 'Problem ID required'], 400);
        }

        $problem = $db->fetchOne(
            "SELECT * FROM problems WHERE id = ? AND is_active = TRUE",
            [$problemId]
        );

        if (!$problem) {
            sendResponse(['success' => false, 'error' => 'Problem not found'], 404);
        }

        // Get filters for this problem
        $filters = $db->fetchAll(
            "SELECT filter_key, filter_value FROM problem_filters WHERE problem_id = ?",
            [$problemId]
        );

        $problem['filters'] = $filters;

        sendResponse([
            'success' => true,
            'problem' => $problem
        ]);
        break;

    case 'submit':
        // POST /api/problems/submit
        // Body: { "student_id": 1, "problem_id": 123, "answer": "...", "session_id": 456 }
        if ($method !== 'POST') {
            sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
        }

        $body = getRequestBody();
        $studentId = $body['student_id'] ?? null;
        $problemId = $body['problem_id'] ?? null;
        $answer = $body['answer'] ?? null;
        $sessionId = $body['session_id'] ?? null;
        $timeSpent = $body['time_spent'] ?? null;

        if (!$studentId || !$problemId) {
            sendResponse(['success' => false, 'error' => 'Missing required fields'], 400);
        }

        // Check if correct (simplified - real implementation would validate properly)
        // For demo purposes, just store the attempt
        $isCorrect = false; // TODO: Implement answer checking

        $attemptId = $db->insert(
            "INSERT INTO student_attempts
            (student_id, problem_id, session_id, answer_text, is_correct, time_spent, submitted_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())",
            [$studentId, $problemId, $sessionId, $answer, $isCorrect, $timeSpent]
        );

        sendResponse([
            'success' => true,
            'attempt_id' => $attemptId,
            'is_correct' => $isCorrect
        ]);
        break;

    case 'search':
        // GET /api/problems/search?q=fraction
        if ($method !== 'GET') {
            sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
        }

        $query = $_GET['q'] ?? '';
        $limit = $_GET['limit'] ?? 10;

        if (empty($query)) {
            sendResponse(['success' => false, 'error' => 'Search query required'], 400);
        }

        $problems = $db->fetchAll(
            "SELECT * FROM problems
            WHERE is_active = TRUE
            AND (title LIKE ? OR question_text LIKE ?)
            ORDER BY id DESC
            LIMIT ?",
            ["%$query%", "%$query%", $limit]
        );

        sendResponse([
            'success' => true,
            'problems' => $problems,
            'query' => $query
        ]);
        break;

    default:
        sendResponse(['success' => false, 'error' => 'Unknown action'], 404);
        break;
}
