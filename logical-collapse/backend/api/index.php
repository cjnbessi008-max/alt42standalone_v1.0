<?php
/**
 * Logical Collapse API - Moodle Integration Backend
 * PHP 7.1.9 compatible
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/moodle.php';
require_once __DIR__ . '/../models/Problem.php';
require_once __DIR__ . '/../models/Student.php';

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/api/', '', $path);

// Router
try {
    switch ($path) {
        case 'connect':
            if ($method === 'POST') {
                handleConnect();
            }
            break;

        case 'problems/current':
            if ($method === 'GET') {
                handleGetCurrentProblem();
            }
            break;

        case 'problems/validate':
            if ($method === 'POST') {
                handleValidateStep();
            }
            break;

        case 'progress':
            if ($method === 'GET') {
                handleGetProgress();
            }
            break;

        default:
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

/**
 * Handle Moodle connection
 */
function handleConnect() {
    $data = json_decode(file_get_contents('php://input'), true);
    $token = $data['token'] ?? '';

    if (empty($token)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Token required']);
        return;
    }

    // Validate token with Moodle
    $moodleConfig = getMoodleConfig();
    $isValid = validateMoodleToken($token, $moodleConfig);

    if ($isValid) {
        echo json_encode(['success' => true, 'message' => 'Connected to Moodle']);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid token']);
    }
}

/**
 * Get current problem from Moodle
 */
function handleGetCurrentProblem() {
    $db = getDatabase();
    $problem = new Problem($db);

    // Get the most recent active problem
    $currentProblem = $problem->getCurrent();

    if ($currentProblem) {
        echo json_encode($currentProblem);
    } else {
        // Fetch from Moodle if no local problem
        $moodleProblem = fetchProblemFromMoodle();
        if ($moodleProblem) {
            echo json_encode($moodleProblem);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'No active problem found']);
        }
    }
}

/**
 * Validate reasoning step
 */
function handleValidateStep() {
    $data = json_decode(file_get_contents('php://input'), true);

    $problemId = $data['problem_id'] ?? 0;
    $stepIndex = $data['step_index'] ?? 0;
    $isCorrect = $data['is_correct'] ?? false;
    $studentId = $data['student_id'] ?? 0;

    $db = getDatabase();
    $problem = new Problem($db);

    // Save validation result
    $result = $problem->saveStepValidation(
        $problemId,
        $stepIndex,
        $isCorrect,
        $studentId
    );

    if ($result) {
        // Also sync to Moodle
        syncValidationToMoodle($problemId, $stepIndex, $isCorrect, $studentId);

        echo json_encode([
            'success' => true,
            'message' => 'Validation saved',
            'is_correct' => $isCorrect
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to save validation']);
    }
}

/**
 * Get student progress
 */
function handleGetProgress() {
    $studentId = $_GET['student_id'] ?? 0;

    if (!$studentId) {
        http_response_code(400);
        echo json_encode(['error' => 'Student ID required']);
        return;
    }

    $db = getDatabase();
    $student = new Student($db);

    $progress = $student->getProgress($studentId);

    echo json_encode($progress);
}

/**
 * Validate Moodle token
 */
function validateMoodleToken($token, $config) {
    $url = $config['url'] . '/webservice/rest/server.php';

    $params = [
        'wstoken' => $token,
        'wsfunction' => 'core_webservice_get_site_info',
        'moodlewsrestformat' => 'json'
    ];

    $response = file_get_contents($url . '?' . http_build_query($params));
    $data = json_decode($response, true);

    return !isset($data['exception']);
}

/**
 * Fetch problem from Moodle
 */
function fetchProblemFromMoodle() {
    $moodleConfig = getMoodleConfig();

    // Call Moodle web service to get current quiz/problem
    $url = $moodleConfig['url'] . '/webservice/rest/server.php';

    $params = [
        'wstoken' => $moodleConfig['token'],
        'wsfunction' => 'mod_quiz_get_quiz_by_courses',
        'moodlewsrestformat' => 'json'
    ];

    $response = file_get_contents($url . '?' . http_build_query($params));
    $data = json_decode($response, true);

    // Transform Moodle data to our format
    if (isset($data['quizzes']) && count($data['quizzes']) > 0) {
        $quiz = $data['quizzes'][0];

        return [
            'id' => $quiz['id'],
            'title' => $quiz['name'],
            'description' => $quiz['intro'],
            'reasoning_steps' => parseProblemSteps($quiz)
        ];
    }

    return null;
}

/**
 * Parse problem steps from Moodle quiz
 */
function parseProblemSteps($quiz) {
    // This would parse the quiz questions into reasoning steps
    // For now, return sample data
    return [
        [
            'type' => '전제',
            'text' => '모든 사람은 죽는다.',
            'formula' => '∀x (Person(x) → Mortal(x))',
            'explanation' => '보편적 진리에 대한 전제',
            'is_correct' => true,
            'requires_validation' => false,
            'collapsed' => false,
            'incorrect' => false
        ],
        [
            'type' => '전제',
            'text' => '소크라테스는 사람이다.',
            'formula' => 'Person(Socrates)',
            'explanation' => '특정 개체에 대한 전제',
            'is_correct' => true,
            'requires_validation' => false,
            'collapsed' => false,
            'incorrect' => false
        ],
        [
            'type' => '추론',
            'text' => '따라서 소크라테스는 죽는다.',
            'formula' => 'Mortal(Socrates)',
            'explanation' => 'Modus Ponens 적용',
            'is_correct' => true,
            'requires_validation' => true,
            'collapsed' => false,
            'incorrect' => false
        ]
    ];
}

/**
 * Sync validation result to Moodle
 */
function syncValidationToMoodle($problemId, $stepIndex, $isCorrect, $studentId) {
    $moodleConfig = getMoodleConfig();

    // Call Moodle web service to record the attempt
    $url = $moodleConfig['url'] . '/webservice/rest/server.php';

    $params = [
        'wstoken' => $moodleConfig['token'],
        'wsfunction' => 'mod_quiz_save_attempt',
        'moodlewsrestformat' => 'json',
        'attemptid' => $problemId,
        'data' => json_encode([
            'step' => $stepIndex,
            'correct' => $isCorrect,
            'student' => $studentId
        ])
    ];

    // Send async request to Moodle
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/x-www-form-urlencoded',
            'content' => http_build_query($params)
        ]
    ]);

    file_get_contents($url, false, $context);
}
