<?php
/**
 * Problem Handler API
 * Handles derivative problems from Moodle LMS
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/moodle.php';
require_once __DIR__ . '/../lib/derivative_engine.php';
require_once __DIR__ . '/../lib/recommendation_engine.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/**
 * Send JSON response
 */
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * Send error response
 */
function sendError($message, $statusCode = 400) {
    sendResponse(['error' => $message, 'status' => 'error'], $statusCode);
}

try {
    $pdo = getDatabaseConnection();

    $method = $_SERVER['REQUEST_METHOD'];
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $pathParts = explode('/', trim($path, '/'));
    $action = end($pathParts);

    // Parse request body for POST/PUT
    $requestBody = null;
    if (in_array($method, ['POST', 'PUT'])) {
        $requestBody = json_decode(file_get_contents('php://input'), true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            sendError('Invalid JSON in request body');
        }
    }

    // Route handling
    switch ($action) {
        case 'create_problem':
            if ($method !== 'POST') {
                sendError('Method not allowed', 405);
            }
            handleCreateProblem($pdo, $requestBody);
            break;

        case 'get_problem':
            if ($method !== 'GET') {
                sendError('Method not allowed', 405);
            }
            handleGetProblem($pdo, $_GET);
            break;

        case 'get_solution':
            if ($method !== 'GET') {
                sendError('Method not allowed', 405);
            }
            handleGetSolution($pdo, $_GET);
            break;

        case 'start_attempt':
            if ($method !== 'POST') {
                sendError('Method not allowed', 405);
            }
            handleStartAttempt($pdo, $requestBody);
            break;

        case 'update_attempt':
            if ($method !== 'POST') {
                sendError('Method not allowed', 405);
            }
            handleUpdateAttempt($pdo, $requestBody);
            break;

        case 'sync_from_moodle':
            if ($method !== 'POST') {
                sendError('Method not allowed', 405);
            }
            handleSyncFromMoodle($pdo, $requestBody);
            break;

        default:
            sendError('Unknown endpoint', 404);
    }

} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    sendError('Database error occurred', 500);
} catch (Exception $e) {
    error_log("Error: " . $e->getMessage());
    sendError($e->getMessage(), 500);
}

/**
 * Create a new derivative problem
 */
function handleCreateProblem($pdo, $data) {
    $required = ['expression', 'moodle_course_id', 'moodle_quiz_id', 'moodle_question_id'];
    foreach ($required as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            sendError("Missing required field: $field");
        }
    }

    $expression = trim($data['expression']);
    $difficulty = $data['difficulty_level'] ?? 'basic';

    // Generate solution steps using derivative engine
    $engine = new DerivativeEngine();
    $steps = $engine->solve($expression);

    // Begin transaction
    $pdo->beginTransaction();

    try {
        // Insert problem
        $stmt = $pdo->prepare(
            "INSERT INTO problems (moodle_course_id, moodle_quiz_id, moodle_question_id, expression, difficulty_level)
             VALUES (:course_id, :quiz_id, :question_id, :expression, :difficulty)"
        );
        $stmt->execute([
            ':course_id' => $data['moodle_course_id'],
            ':quiz_id' => $data['moodle_quiz_id'],
            ':question_id' => $data['moodle_question_id'],
            ':expression' => $expression,
            ':difficulty' => $difficulty
        ]);

        $problemId = $pdo->lastInsertId();

        // Insert solution steps
        $stmt = $pdo->prepare(
            "INSERT INTO solution_steps (problem_id, step_number, step_type, expression_before, expression_after, explanation, rule_applied)
             VALUES (:problem_id, :step_number, :step_type, :expr_before, :expr_after, :explanation, :rule)"
        );

        foreach ($steps as $index => $step) {
            $stmt->execute([
                ':problem_id' => $problemId,
                ':step_number' => $index + 1,
                ':step_type' => $step['type'],
                ':expr_before' => $step['before'],
                ':expr_after' => $step['after'],
                ':explanation' => $step['explanation'],
                ':rule' => $step['rule']
            ]);
        }

        $pdo->commit();

        sendResponse([
            'status' => 'success',
            'problem_id' => $problemId,
            'steps_count' => count($steps),
            'message' => 'Problem created successfully'
        ]);

    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

/**
 * Get problem details
 */
function handleGetProblem($pdo, $params) {
    if (!isset($params['problem_id'])) {
        sendError('Missing problem_id parameter');
    }

    $stmt = $pdo->prepare("SELECT * FROM problems WHERE id = :id");
    $stmt->execute([':id' => $params['problem_id']]);
    $problem = $stmt->fetch();

    if (!$problem) {
        sendError('Problem not found', 404);
    }

    sendResponse([
        'status' => 'success',
        'problem' => $problem
    ]);
}

/**
 * Get solution steps for a problem
 */
function handleGetSolution($pdo, $params) {
    if (!isset($params['problem_id'])) {
        sendError('Missing problem_id parameter');
    }

    $stmt = $pdo->prepare("SELECT * FROM solution_steps WHERE problem_id = :id ORDER BY step_number ASC");
    $stmt->execute([':id' => $params['problem_id']]);
    $steps = $stmt->fetchAll();

    if (empty($steps)) {
        sendError('No solution found', 404);
    }

    sendResponse([
        'status' => 'success',
        'steps' => $steps,
        'total_steps' => count($steps)
    ]);
}

/**
 * Start a new student attempt
 */
function handleStartAttempt($pdo, $data) {
    $required = ['moodle_user_id', 'problem_id'];
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            sendError("Missing required field: $field");
        }
    }

    // Get attempt number
    $stmt = $pdo->prepare(
        "SELECT COALESCE(MAX(attempt_number), 0) + 1 as next_attempt
         FROM student_attempts
         WHERE moodle_user_id = :user_id AND problem_id = :problem_id"
    );
    $stmt->execute([
        ':user_id' => $data['moodle_user_id'],
        ':problem_id' => $data['problem_id']
    ]);
    $result = $stmt->fetch();
    $attemptNumber = $result['next_attempt'];

    // Create new attempt
    $stmt = $pdo->prepare(
        "INSERT INTO student_attempts (moodle_user_id, problem_id, attempt_number, current_step)
         VALUES (:user_id, :problem_id, :attempt_number, 1)"
    );
    $stmt->execute([
        ':user_id' => $data['moodle_user_id'],
        ':problem_id' => $data['problem_id'],
        ':attempt_number' => $attemptNumber
    ]);

    $attemptId = $pdo->lastInsertId();

    // Create session token
    $sessionToken = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+2 hours'));

    $stmt = $pdo->prepare(
        "INSERT INTO active_sessions (session_token, moodle_user_id, problem_id, attempt_id, expires_at)
         VALUES (:token, :user_id, :problem_id, :attempt_id, :expires_at)"
    );
    $stmt->execute([
        ':token' => $sessionToken,
        ':user_id' => $data['moodle_user_id'],
        ':problem_id' => $data['problem_id'],
        ':attempt_id' => $attemptId,
        ':expires_at' => $expiresAt
    ]);

    sendResponse([
        'status' => 'success',
        'attempt_id' => $attemptId,
        'attempt_number' => $attemptNumber,
        'session_token' => $sessionToken,
        'expires_at' => $expiresAt
    ]);
}

/**
 * Update student attempt progress
 */
function handleUpdateAttempt($pdo, $data) {
    $required = ['attempt_id', 'current_step'];
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            sendError("Missing required field: $field");
        }
    }

    $completed = $data['completed'] ?? false;
    $timeSpent = $data['time_spent'] ?? null;

    $stmt = $pdo->prepare(
        "UPDATE student_attempts
         SET current_step = :current_step,
             completed = :completed,
             time_spent = COALESCE(:time_spent, time_spent),
             completed_at = CASE WHEN :completed THEN NOW() ELSE completed_at END
         WHERE id = :attempt_id"
    );

    $stmt->execute([
        ':attempt_id' => $data['attempt_id'],
        ':current_step' => $data['current_step'],
        ':completed' => $completed ? 1 : 0,
        ':time_spent' => $timeSpent
    ]);

    // Log analytics event
    $stmt = $pdo->prepare(
        "INSERT INTO analytics (event_type, moodle_user_id, problem_id, step_number, metadata)
         SELECT 'step_viewed', moodle_user_id, problem_id, :step_number, :metadata
         FROM student_attempts WHERE id = :attempt_id"
    );
    $stmt->execute([
        ':attempt_id' => $data['attempt_id'],
        ':step_number' => $data['current_step'],
        ':metadata' => json_encode(['time_spent' => $timeSpent])
    ]);

    // Update skill levels if attempt is completed
    $updatedSkills = null;
    if ($completed) {
        try {
            $recommendationEngine = new RecommendationEngine($pdo);

            // Get user ID from attempt
            $stmt = $pdo->prepare("SELECT moodle_user_id FROM student_attempts WHERE id = :id");
            $stmt->execute([':id' => $data['attempt_id']]);
            $attempt = $stmt->fetch();

            if ($attempt) {
                $updatedSkills = $recommendationEngine->updateSkillLevels(
                    $attempt['moodle_user_id'],
                    $data['attempt_id']
                );
            }
        } catch (Exception $e) {
            error_log("Failed to update skills: " . $e->getMessage());
            // Don't fail the whole request if skill update fails
        }
    }

    sendResponse([
        'status' => 'success',
        'message' => 'Attempt updated successfully',
        'updated_skills' => $updatedSkills
    ]);
}

/**
 * Sync problem from Moodle
 */
function handleSyncFromMoodle($pdo, $data) {
    if (!isset($data['question_id'])) {
        sendError('Missing question_id parameter');
    }

    // Get question from Moodle
    $question = getMoodleQuestion($data['question_id']);

    if (!$question) {
        sendError('Question not found in Moodle', 404);
    }

    // Extract derivative expression from question text
    // This assumes the question text contains the expression in a specific format
    $expression = extractExpressionFromQuestion($question);

    // Create problem in our database
    $createData = [
        'expression' => $expression,
        'moodle_course_id' => $data['course_id'] ?? 0,
        'moodle_quiz_id' => $data['quiz_id'] ?? 0,
        'moodle_question_id' => $data['question_id'],
        'difficulty_level' => $data['difficulty_level'] ?? 'basic'
    ];

    handleCreateProblem($pdo, $createData);
}

/**
 * Extract derivative expression from Moodle question text
 */
function extractExpressionFromQuestion($question) {
    // Simple extraction - customize based on your question format
    $text = $question['questiontext'] ?? '';

    // Look for expression between tags like [DERIVATIVE] and [/DERIVATIVE]
    if (preg_match('/\[DERIVATIVE\](.*?)\[\/DERIVATIVE\]/s', $text, $matches)) {
        return trim($matches[1]);
    }

    // Fallback: return the question text itself
    return strip_tags($text);
}
