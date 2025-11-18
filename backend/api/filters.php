<?php
/**
 * Filter Shrink API Endpoints
 */

require_once __DIR__ . '/../core/FilterShrink/FilterEngine.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $params[0] ?? '';

switch ($action) {
    case 'available':
        // GET /api/filters/available
        if ($method !== 'GET') {
            sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
        }

        $engine = new FilterEngine();
        $filters = $engine->getAvailableFilters();

        sendResponse([
            'success' => true,
            'filters' => $filters
        ]);
        break;

    case 'start':
        // POST /api/filters/start
        // Body: { "student_id": 123 }
        if ($method !== 'POST') {
            sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
        }

        $body = getRequestBody();
        $studentId = $body['student_id'] ?? null;

        if (!$studentId) {
            sendResponse(['success' => false, 'error' => 'student_id required'], 400);
        }

        $engine = new FilterEngine();
        $session = $engine->startSession($studentId);

        sendResponse([
            'success' => true,
            'session' => $session
        ]);
        break;

    case 'apply':
        // POST /api/filters/apply
        // Body: { "session_token": "...", "filter_key": "grade_level", "filter_value": "3" }
        if ($method !== 'POST') {
            sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
        }

        $body = getRequestBody();
        $sessionToken = $body['session_token'] ?? null;
        $filterKey = $body['filter_key'] ?? null;
        $filterValue = $body['filter_value'] ?? null;

        if (!$sessionToken || !$filterKey || !$filterValue) {
            sendResponse(['success' => false, 'error' => 'Missing required fields'], 400);
        }

        $engine = new FilterEngine();
        $engine->loadSession($sessionToken);
        $result = $engine->applyFilter($filterKey, $filterValue);

        sendResponse($result);
        break;

    case 'remove':
        // POST /api/filters/remove
        // Body: { "session_token": "..." }
        if ($method !== 'POST') {
            sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
        }

        $body = getRequestBody();
        $sessionToken = $body['session_token'] ?? null;

        if (!$sessionToken) {
            sendResponse(['success' => false, 'error' => 'session_token required'], 400);
        }

        $engine = new FilterEngine();
        $engine->loadSession($sessionToken);
        $result = $engine->removeLastFilter();

        sendResponse($result);
        break;

    case 'reset':
        // POST /api/filters/reset
        // Body: { "session_token": "..." }
        if ($method !== 'POST') {
            sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
        }

        $body = getRequestBody();
        $sessionToken = $body['session_token'] ?? null;

        if (!$sessionToken) {
            sendResponse(['success' => false, 'error' => 'session_token required'], 400);
        }

        $engine = new FilterEngine();
        $engine->loadSession($sessionToken);
        $result = $engine->resetSession();

        sendResponse([
            'success' => true,
            'session' => $result
        ]);
        break;

    case 'state':
        // GET /api/filters/state?session_token=...
        if ($method !== 'GET') {
            sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
        }

        $sessionToken = $_GET['session_token'] ?? null;

        if (!$sessionToken) {
            sendResponse(['success' => false, 'error' => 'session_token required'], 400);
        }

        $engine = new FilterEngine();
        $state = $engine->loadSession($sessionToken);

        sendResponse([
            'success' => true,
            'state' => $state
        ]);
        break;

    case 'select':
        // POST /api/filters/select
        // Body: { "session_token": "...", "count": 1 }
        if ($method !== 'POST') {
            sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
        }

        $body = getRequestBody();
        $sessionToken = $body['session_token'] ?? null;
        $count = $body['count'] ?? 1;

        if (!$sessionToken) {
            sendResponse(['success' => false, 'error' => 'session_token required'], 400);
        }

        $engine = new FilterEngine();
        $engine->loadSession($sessionToken);
        $result = $engine->selectProblems($count);

        sendResponse($result);
        break;

    default:
        sendResponse(['success' => false, 'error' => 'Unknown action'], 404);
        break;
}
