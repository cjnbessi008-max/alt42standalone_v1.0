<?php
/**
 * Probability Grid API Endpoints
 * Provides REST API for frontend to communicate with backend
 */

require_once __DIR__ . '/../../moodle-plugin/config.php';

// Load configuration
$config = require __DIR__ . '/../../moodle-plugin/config.php';

// Enable error reporting in debug mode
if ($config['app']->debug_mode) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
}

// Set CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Database connection
try {
    $dsn = "mysql:host={$config['database']->host};" .
           "port={$config['database']->port};" .
           "dbname={$config['database']->dbname};" .
           "charset=utf8mb4";

    $pdo = new PDO(
        $dsn,
        $config['database']->username,
        $config['database']->password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

// Route handling
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Get the action from query string or path
$action = $_GET['action'] ?? ($pathParts[count($pathParts) - 1] ?? '');

switch ($action) {
    case 'get-problem':
        getProblem($pdo);
        break;

    case 'submit-answer':
        submitAnswer($pdo);
        break;

    case 'get-session':
        getSession($pdo);
        break;

    case 'save-progress':
        saveProgress($pdo);
        break;

    case 'get-problems':
        getProblems($pdo);
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
        break;
}

/**
 * Get problem data by ID or session
 */
function getProblem($pdo) {
    $problemId = $_GET['id'] ?? null;
    $sessionId = $_GET['session'] ?? null;

    if (!$problemId && !$sessionId) {
        http_response_code(400);
        echo json_encode(['error' => 'Problem ID or session ID required']);
        return;
    }

    try {
        // Get problem from session if session ID provided
        if ($sessionId) {
            $stmt = $pdo->prepare("
                SELECT session_data FROM lti_sessions
                WHERE session_id = ? AND expires_at > NOW()
            ");
            $stmt->execute([$sessionId]);
            $session = $stmt->fetch();

            if (!$session) {
                http_response_code(404);
                echo json_encode(['error' => 'Session not found or expired']);
                return;
            }

            // Get problem ID from session or use default
            $problemId = $_GET['problem'] ?? 1;
        }

        // Fetch problem data
        $stmt = $pdo->prepare("
            SELECT p.*, g.cell_colors, g.event_regions, g.probability_labels
            FROM problems p
            LEFT JOIN grid_configurations g ON p.id = g.problem_id
            WHERE p.id = ?
        ");
        $stmt->execute([$problemId]);
        $problem = $stmt->fetch();

        if (!$problem) {
            http_response_code(404);
            echo json_encode(['error' => 'Problem not found']);
            return;
        }

        // Parse JSON fields
        $problem['probability_data'] = json_decode($problem['probability_data'], true);
        $problem['color_scheme'] = json_decode($problem['color_scheme'], true);

        if (!empty($problem['cell_colors'])) {
            $problem['cell_colors'] = json_decode($problem['cell_colors'], true);
        }
        if (!empty($problem['event_regions'])) {
            $problem['event_regions'] = json_decode($problem['event_regions'], true);
        }
        if (!empty($problem['probability_labels'])) {
            $problem['probability_labels'] = json_decode($problem['probability_labels'], true);
        }

        echo json_encode([
            'success' => true,
            'problem' => $problem
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

/**
 * Submit student answer
 */
function submitAnswer($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);

    $problemId = $data['problem_id'] ?? null;
    $userId = $data['user_id'] ?? 1; // Default for testing
    $answer = $data['answer'] ?? null;
    $interactionData = $data['interaction_data'] ?? null;
    $timeSpent = $data['time_spent'] ?? 0;

    if (!$problemId || !$answer) {
        http_response_code(400);
        echo json_encode(['error' => 'Problem ID and answer required']);
        return;
    }

    try {
        // Get correct answer
        $stmt = $pdo->prepare("SELECT correct_answer FROM problems WHERE id = ?");
        $stmt->execute([$problemId]);
        $problem = $stmt->fetch();

        if (!$problem) {
            http_response_code(404);
            echo json_encode(['error' => 'Problem not found']);
            return;
        }

        // Check if answer is correct
        $isCorrect = ($answer == $problem['correct_answer']);

        // Get attempt number
        $stmt = $pdo->prepare("
            SELECT COALESCE(MAX(attempt_number), 0) + 1 as next_attempt
            FROM student_attempts
            WHERE problem_id = ? AND moodle_user_id = ?
        ");
        $stmt->execute([$problemId, $userId]);
        $attemptNumber = $stmt->fetch()['next_attempt'];

        // Save attempt
        $stmt = $pdo->prepare("
            INSERT INTO student_attempts
            (problem_id, moodle_user_id, student_answer, is_correct,
             grid_interaction_data, time_spent, attempt_number)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $problemId,
            $userId,
            $answer,
            $isCorrect ? 1 : 0,
            json_encode($interactionData),
            $timeSpent,
            $attemptNumber
        ]);

        echo json_encode([
            'success' => true,
            'is_correct' => $isCorrect,
            'correct_answer' => $problem['correct_answer'],
            'attempt_number' => $attemptNumber
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

/**
 * Get session information
 */
function getSession($pdo) {
    $sessionId = $_GET['session_id'] ?? null;

    if (!$sessionId) {
        http_response_code(400);
        echo json_encode(['error' => 'Session ID required']);
        return;
    }

    try {
        $stmt = $pdo->prepare("
            SELECT * FROM lti_sessions
            WHERE session_id = ? AND expires_at > NOW()
        ");
        $stmt->execute([$sessionId]);
        $session = $stmt->fetch();

        if (!$session) {
            http_response_code(404);
            echo json_encode(['error' => 'Session not found or expired']);
            return;
        }

        $session['session_data'] = json_decode($session['session_data'], true);

        echo json_encode([
            'success' => true,
            'session' => $session
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

/**
 * Save student progress
 */
function saveProgress($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);

    $sessionId = $data['session_id'] ?? null;
    $progressData = $data['progress'] ?? null;

    if (!$sessionId || !$progressData) {
        http_response_code(400);
        echo json_encode(['error' => 'Session ID and progress data required']);
        return;
    }

    try {
        // Update session data
        $stmt = $pdo->prepare("
            UPDATE lti_sessions
            SET session_data = JSON_SET(session_data, '$.progress', ?)
            WHERE session_id = ?
        ");

        $stmt->execute([
            json_encode($progressData),
            $sessionId
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Progress saved'
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

/**
 * Get list of problems for a course
 */
function getProblems($pdo) {
    $courseId = $_GET['course_id'] ?? null;

    try {
        $query = "SELECT id, title, description, grid_width, grid_height, created_at FROM problems";
        $params = [];

        if ($courseId) {
            $query .= " WHERE moodle_course_id = ?";
            $params[] = $courseId;
        }

        $query .= " ORDER BY created_at DESC";

        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $problems = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'problems' => $problems
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}
