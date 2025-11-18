<?php
/**
 * REST API Endpoints
 * Handles all API requests for the prerequisite checker
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../src/services/MoodleService.php';
require_once __DIR__ . '/../src/services/PrerequisiteService.php';
require_once __DIR__ . '/../src/services/AssessmentEngine.php';

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['PATH_INFO'] ?? '/';
$path = trim($path, '/');
$segments = explode('/', $path);

// Initialize services
$moodleService = new MoodleService();
$prereqService = new PrerequisiteService();
$assessmentEngine = new AssessmentEngine();

try {
    // Route handling
    $response = null;

    // GET /api.php/test - Test API
    if ($method === 'GET' && $segments[0] === 'test') {
        $response = [
            'status' => 'ok',
            'message' => 'Prerequisite Checker API is running',
            'version' => '1.0.0',
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }

    // GET /api.php/moodle/test - Test Moodle connection
    elseif ($method === 'GET' && $segments[0] === 'moodle' && $segments[1] === 'test') {
        $connected = $moodleService->testConnection();
        $response = [
            'connected' => $connected,
            'message' => $connected ? 'Moodle connection successful' : 'Moodle connection failed'
        ];
    }

    // GET /api.php/moodle/siteinfo - Get Moodle site info
    elseif ($method === 'GET' && $segments[0] === 'moodle' && $segments[1] === 'siteinfo') {
        $response = $moodleService->getSiteInfo();
    }

    // GET /api.php/moodle/courses - Get all courses
    elseif ($method === 'GET' && $segments[0] === 'moodle' && $segments[1] === 'courses') {
        $response = $moodleService->getCourses();
    }

    // GET /api.php/moodle/course/{id} - Get specific course
    elseif ($method === 'GET' && $segments[0] === 'moodle' && $segments[1] === 'course' && isset($segments[2])) {
        $courseId = intval($segments[2]);
        $response = $moodleService->getCourse($courseId);
    }

    // GET /api.php/moodle/course/{id}/users - Get enrolled users
    elseif ($method === 'GET' && $segments[0] === 'moodle' && $segments[1] === 'course' && isset($segments[2]) && $segments[3] === 'users') {
        $courseId = intval($segments[2]);
        $response = $moodleService->getEnrolledUsers($courseId);
    }

    // GET /api.php/concepts - Get all concepts
    elseif ($method === 'GET' && $segments[0] === 'concepts') {
        $subject = $_GET['subject'] ?? null;
        $gradeLevel = $_GET['grade_level'] ?? null;
        $response = $prereqService->getAllConcepts($subject, $gradeLevel);
    }

    // GET /api.php/concept/{id} - Get specific concept
    elseif ($method === 'GET' && $segments[0] === 'concept' && isset($segments[1])) {
        $conceptId = intval($segments[1]);
        $concept = $prereqService->getConcept($conceptId);

        if ($concept) {
            $concept['prerequisites'] = $prereqService->getPrerequisites($conceptId);
            $concept['dependent_concepts'] = $prereqService->getDependentConcepts($conceptId);
            $response = $concept;
        } else {
            http_response_code(404);
            $response = ['error' => 'Concept not found'];
        }
    }

    // GET /api.php/concept/{id}/tree - Get prerequisite tree
    elseif ($method === 'GET' && $segments[0] === 'concept' && isset($segments[1]) && $segments[2] === 'tree') {
        $conceptId = intval($segments[1]);
        $visited = [];
        $response = [
            'concept_id' => $conceptId,
            'concept' => $prereqService->getConcept($conceptId),
            'prerequisite_tree' => $prereqService->getPrerequisiteTree($conceptId, $visited)
        ];
    }

    // GET /api.php/student/{user_id}/knowledge - Get student knowledge
    elseif ($method === 'GET' && $segments[0] === 'student' && isset($segments[1]) && $segments[2] === 'knowledge') {
        $userId = intval($segments[1]);
        $minMastery = isset($_GET['min_mastery']) ? floatval($_GET['min_mastery']) : null;
        $response = $prereqService->getStudentKnowledge($userId, $minMastery);
    }

    // GET /api.php/student/{user_id}/concept/{concept_id}/check - Check prerequisites
    elseif ($method === 'GET' && $segments[0] === 'student' && isset($segments[1]) && $segments[2] === 'concept' && isset($segments[3]) && $segments[4] === 'check') {
        $userId = intval($segments[1]);
        $conceptId = intval($segments[3]);
        $response = $prereqService->checkPrerequisites($userId, $conceptId);
    }

    // GET /api.php/student/{user_id}/concept/{concept_id}/path - Get learning path
    elseif ($method === 'GET' && $segments[0] === 'student' && isset($segments[1]) && $segments[2] === 'concept' && isset($segments[3]) && $segments[4] === 'path') {
        $userId = intval($segments[1]);
        $conceptId = intval($segments[3]);
        $response = $prereqService->getLearningPath($userId, $conceptId);
    }

    // POST /api.php/assess/student - Assess student
    elseif ($method === 'POST' && $segments[0] === 'assess' && $segments[1] === 'student') {
        $data = json_decode(file_get_contents('php://input'), true);
        $userId = $data['user_id'] ?? null;
        $courseId = $data['course_id'] ?? null;

        if (!$userId || !$courseId) {
            http_response_code(400);
            $response = ['error' => 'Missing user_id or course_id'];
        } else {
            $response = $assessmentEngine->assessStudent($userId, $courseId);
        }
    }

    // POST /api.php/assess/course - Assess entire course
    elseif ($method === 'POST' && $segments[0] === 'assess' && $segments[1] === 'course') {
        $data = json_decode(file_get_contents('php://input'), true);
        $courseId = $data['course_id'] ?? null;

        if (!$courseId) {
            http_response_code(400);
            $response = ['error' => 'Missing course_id'];
        } else {
            $response = $assessmentEngine->assessCourse($courseId);
        }
    }

    // GET /api.php/recommendations/{user_id}/{module_id} - Get recommendations
    elseif ($method === 'GET' && $segments[0] === 'recommendations' && isset($segments[1]) && isset($segments[2])) {
        $userId = intval($segments[1]);
        $moduleId = intval($segments[2]);
        $response = $assessmentEngine->generateRecommendations($userId, $moduleId);
    }

    // Not found
    else {
        http_response_code(404);
        $response = [
            'error' => 'Endpoint not found',
            'path' => $path,
            'method' => $method
        ];
    }

    // Output response
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT);
}
