<?php
/**
 * Students API Endpoints
 */

require_once __DIR__ . '/../utils/Database.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $params[0] ?? '';

$db = Database::getInstance();

switch ($action) {
    case 'list':
        // GET /api/students/list
        if ($method !== 'GET') {
            sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
        }

        $students = $db->fetchAll("SELECT * FROM students ORDER BY full_name");

        sendResponse([
            'success' => true,
            'students' => $students
        ]);
        break;

    case 'progress':
        // GET /api/students/progress/123
        if ($method !== 'GET') {
            sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
        }

        $studentId = $params[1] ?? null;
        if (!$studentId) {
            sendResponse(['success' => false, 'error' => 'Student ID required'], 400);
        }

        $progress = $db->fetchAll(
            "SELECT * FROM student_progress WHERE student_id = ?",
            [$studentId]
        );

        sendResponse([
            'success' => true,
            'progress' => $progress
        ]);
        break;

    default:
        sendResponse(['success' => false, 'error' => 'Unknown action'], 404);
        break;
}
