<?php
/**
 * Moodle Integration API Endpoints
 */

require_once __DIR__ . '/../core/Moodle/MoodleClient.php';
require_once __DIR__ . '/../core/Moodle/MoodleSyncService.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $params[0] ?? '';

switch ($action) {
    case 'test':
        // GET /api/moodle/test
        if ($method !== 'GET') {
            sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
        }

        $moodle = new MoodleClient();
        $result = $moodle->testConnection();

        sendResponse($result);
        break;

    case 'sync':
        // POST /api/moodle/sync
        // Body: { "type": "questions|users|full", "category_id": 123 }
        if ($method !== 'POST') {
            sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
        }

        $body = getRequestBody();
        $syncType = $body['type'] ?? 'questions';
        $categoryId = $body['category_id'] ?? null;

        $syncService = new MoodleSyncService();

        switch ($syncType) {
            case 'questions':
                $result = $syncService->syncQuestions($categoryId);
                break;

            case 'users':
                $result = $syncService->syncUsers();
                break;

            case 'full':
                $result = $syncService->fullSync();
                break;

            default:
                sendResponse(['success' => false, 'error' => 'Invalid sync type'], 400);
                break;
        }

        sendResponse($result);
        break;

    case 'courses':
        // GET /api/moodle/courses
        if ($method !== 'GET') {
            sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
        }

        $moodle = new MoodleClient();
        $courses = $moodle->getCourses();

        sendResponse([
            'success' => true,
            'courses' => $courses
        ]);
        break;

    case 'categories':
        // GET /api/moodle/categories
        if ($method !== 'GET') {
            sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
        }

        $moodle = new MoodleClient();
        $categories = $moodle->getQuestionCategories();

        sendResponse([
            'success' => true,
            'categories' => $categories
        ]);
        break;

    case 'sync-log':
        // GET /api/moodle/sync-log?limit=10
        if ($method !== 'GET') {
            sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
        }

        $limit = $_GET['limit'] ?? 10;

        require_once __DIR__ . '/../utils/Database.php';
        $db = Database::getInstance();

        $logs = $db->fetchAll(
            "SELECT * FROM moodle_sync_log
            ORDER BY started_at DESC
            LIMIT ?",
            [$limit]
        );

        sendResponse([
            'success' => true,
            'logs' => $logs
        ]);
        break;

    default:
        sendResponse(['success' => false, 'error' => 'Unknown action'], 404);
        break;
}
