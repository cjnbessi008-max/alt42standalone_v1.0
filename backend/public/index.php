<?php
/**
 * Deviation Breeze API Entry Point
 * Simple routing without Slim Framework for PHP 7.1 compatibility
 */

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', '1');

// Load environment variables
require_once __DIR__ . '/../vendor/autoload.php';

// Load .env file
$dotenv = new Dotenv\Dotenv(__DIR__ . '/../..');
$dotenv->load();

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Set timezone
date_default_timezone_set('Asia/Seoul');

use DeviationBreeze\Utils\ResponseHelper;

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/backend/public', '', $path); // Remove base path
$path = trim($path, '/');

// Parse path segments
$segments = explode('/', $path);
$api = array_shift($segments); // Should be 'api'
$version = array_shift($segments); // Should be 'v1'
$resource = array_shift($segments); // Resource name

// Get request body for POST/PUT
$input = null;
if (in_array($method, ['POST', 'PUT', 'PATCH'])) {
    $input = json_decode(file_get_contents('php://input'), true);
}

// Simple router
try {
    // Health check
    if ($path === 'health' || $path === '') {
        ResponseHelper::success([
            'status' => 'healthy',
            'app' => getenv('APP_NAME'),
            'version' => '1.0.0',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }

    // Test Moodle connection
    if ($path === 'api/v1/test/moodle') {
        $connector = new \DeviationBreeze\Services\MoodleConnector();
        $connected = $connector->testConnection();

        if ($connected) {
            $info = $connector->getSiteInfo();
            ResponseHelper::success($info, 'Moodle connection successful');
        } else {
            ResponseHelper::error('Failed to connect to Moodle', 500);
        }
    }

    // API routing
    if ($api === 'api' && $version === 'v1') {
        switch ($resource) {
            case 'courses':
                handleCourses($method, $segments, $input);
                break;

            case 'quizzes':
                handleQuizzes($method, $segments, $input);
                break;

            case 'students':
                handleStudents($method, $segments, $input);
                break;

            case 'deviation':
                handleDeviation($method, $segments, $input);
                break;

            case 'sync':
                handleSync($method, $segments, $input);
                break;

            default:
                ResponseHelper::notFound('API endpoint not found');
        }
    } else {
        ResponseHelper::notFound('Invalid API version');
    }

} catch (\Exception $e) {
    error_log("API Error: " . $e->getMessage());
    ResponseHelper::serverError($e->getMessage());
}

/**
 * Handle courses endpoints
 */
function handleCourses($method, $segments, $input)
{
    $connector = new \DeviationBreeze\Services\MoodleConnector();

    if ($method === 'GET') {
        if (empty($segments)) {
            // GET /api/v1/courses
            $courses = $connector->getCourses();
            ResponseHelper::success($courses);
        } else {
            // GET /api/v1/courses/{id}
            $courseId = intval($segments[0]);
            $course = $connector->getCourse($courseId);

            if ($course) {
                ResponseHelper::success($course);
            } else {
                ResponseHelper::notFound('Course not found');
            }
        }
    }
}

/**
 * Handle quizzes endpoints
 */
function handleQuizzes($method, $segments, $input)
{
    $db = \DeviationBreeze\Utils\Database::getInstance();

    if ($method === 'GET') {
        if (empty($segments)) {
            // GET /api/v1/quizzes
            $quizzes = $db->query("SELECT * FROM quizzes WHERE is_active = 1");
            ResponseHelper::success($quizzes);
        } else {
            $quizId = intval($segments[0]);

            if (isset($segments[1]) && $segments[1] === 'attempts') {
                // GET /api/v1/quizzes/{id}/attempts
                $attempts = $db->query(
                    "SELECT qa.*, s.full_name, s.username
                     FROM quiz_attempts qa
                     INNER JOIN students s ON qa.student_id = s.id
                     WHERE qa.quiz_id = ?
                     ORDER BY qa.attempt_date DESC",
                    [$quizId]
                );
                ResponseHelper::success($attempts);
            } else {
                // GET /api/v1/quizzes/{id}
                $quiz = $db->queryOne("SELECT * FROM quizzes WHERE id = ?", [$quizId]);

                if ($quiz) {
                    ResponseHelper::success($quiz);
                } else {
                    ResponseHelper::notFound('Quiz not found');
                }
            }
        }
    }
}

/**
 * Handle students endpoints
 */
function handleStudents($method, $segments, $input)
{
    $db = \DeviationBreeze\Utils\Database::getInstance();

    if ($method === 'GET') {
        if (empty($segments)) {
            // GET /api/v1/students
            $students = $db->query("SELECT * FROM students ORDER BY full_name");
            ResponseHelper::success($students);
        } else {
            // GET /api/v1/students/{id}
            $studentId = intval($segments[0]);
            $student = $db->queryOne("SELECT * FROM students WHERE id = ?", [$studentId]);

            if ($student) {
                ResponseHelper::success($student);
            } else {
                ResponseHelper::notFound('Student not found');
            }
        }
    }
}

/**
 * Handle deviation analytics endpoints
 */
function handleDeviation($method, $segments, $input)
{
    $calculator = new \DeviationBreeze\Services\DeviationCalculator();

    if ($method === 'GET') {
        if (isset($segments[0]) && $segments[0] === 'quiz' && isset($segments[1])) {
            // GET /api/v1/deviation/quiz/{id}
            $quizId = intval($segments[1]);

            if (isset($segments[2]) && $segments[2] === 'visualization') {
                // GET /api/v1/deviation/quiz/{id}/visualization
                $data = $calculator->getDeviationVisualizationData($quizId);
                ResponseHelper::success($data);
            } else {
                $deviation = $calculator->getQuizDeviation($quizId);
                ResponseHelper::success($deviation);
            }
        } elseif (isset($segments[0]) && $segments[0] === 'student' && isset($segments[1])) {
            // GET /api/v1/deviation/student/{id}
            $studentId = intval($segments[1]);
            $history = $calculator->getStudentDeviationHistory($studentId);
            ResponseHelper::success($history);
        } else {
            ResponseHelper::notFound('Invalid deviation endpoint');
        }
    } elseif ($method === 'POST' && isset($segments[0]) && $segments[0] === 'calculate') {
        // POST /api/v1/deviation/calculate
        $quizId = intval($input['quiz_id'] ?? 0);

        if ($quizId > 0) {
            $result = $calculator->calculateQuizDeviation($quizId);
            ResponseHelper::success($result, 'Deviation calculated successfully');
        } else {
            ResponseHelper::error('quiz_id is required', 400);
        }
    }
}

/**
 * Handle sync endpoints
 */
function handleSync($method, $segments, $input)
{
    if ($method === 'POST') {
        $connector = new \DeviationBreeze\Services\MoodleConnector();

        if (isset($segments[0]) && $segments[0] === 'course') {
            // POST /api/v1/sync/course
            $moodleCourseId = intval($input['course_id'] ?? 0);

            if ($moodleCourseId > 0) {
                $success = $connector->syncCourse($moodleCourseId);

                if ($success) {
                    ResponseHelper::success(null, 'Course synchronized successfully');
                } else {
                    ResponseHelper::error('Failed to sync course', 500);
                }
            } else {
                ResponseHelper::error('course_id is required', 400);
            }
        }
    }
}
