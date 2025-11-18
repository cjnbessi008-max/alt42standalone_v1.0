<?php
/**
 * Students API Endpoint
 * GET    /students - Get all students
 * GET    /students/{id} - Get student by ID
 * POST   /students - Create new student
 * GET    /students/{id}/pattern - Get student's learning pattern
 * GET    /students/{id}/progress - Get student's progress
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../models/Student.php';
require_once __DIR__ . '/../services/LearningPatternAnalyzer.php';

$database = new Database();
$db = $database->getConnection();

$student = new Student($db);
$analyzer = new LearningPatternAnalyzer($db);

$method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];

// Parse request
$uri_parts = explode('/', trim($request_uri, '/'));

try {
    switch ($method) {
        case 'GET':
            if (isset($uri_parts[2]) && is_numeric($uri_parts[2])) {
                $student_id = $uri_parts[2];

                // Check for sub-resources
                if (isset($uri_parts[3])) {
                    if ($uri_parts[3] === 'pattern') {
                        // GET /students/{id}/pattern
                        $pattern = $analyzer->analyzePattern($student_id);
                        $performance = $analyzer->getPatternPerformance($student_id);

                        sendResponse(true, [
                            'pattern' => $pattern,
                            'performance_by_type' => $performance
                        ], 'Learning pattern retrieved successfully');

                    } elseif ($uri_parts[3] === 'progress') {
                        // GET /students/{id}/progress
                        $progress = $student->getProgress($student_id);
                        $recent_attempts = $student->getRecentAttempts($student_id, 10)->fetchAll();

                        sendResponse(true, [
                            'progress' => $progress,
                            'recent_attempts' => $recent_attempts
                        ], 'Student progress retrieved successfully');
                    }
                } else {
                    // GET /students/{id}
                    $data = $student->getById($student_id);

                    if (!$data) {
                        sendError('Student not found', 404);
                    }

                    sendResponse(true, $data, 'Student retrieved successfully');
                }
            } else {
                // GET /students - Get all students
                $stmt = $student->getAll();
                $students_arr = $stmt->fetchAll();

                sendResponse(true, [
                    'students' => $students_arr,
                    'count' => count($students_arr)
                ], 'Students retrieved successfully');
            }
            break;

        case 'POST':
            // POST /students - Create new student
            $data = json_decode(file_get_contents("php://input"), true);

            validateRequired($data, ['student_code', 'name', 'grade_level']);

            $student->student_code = sanitizeInput($data['student_code']);
            $student->name = sanitizeInput($data['name']);
            $student->grade_level = sanitizeInput($data['grade_level']);
            $student->moodle_user_id = sanitizeInput($data['moodle_user_id'] ?? null);

            if ($student->create()) {
                sendResponse(true, [
                    'id' => $student->id,
                    'student_code' => $student->student_code,
                    'name' => $student->name
                ], 'Student created successfully', 201);
            } else {
                sendError('Failed to create student', 500);
            }
            break;

        default:
            sendError('Method not allowed', 405);
    }

} catch (Exception $e) {
    sendError('Server error: ' . $e->getMessage(), 500);
}
