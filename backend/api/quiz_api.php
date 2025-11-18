<?php
/**
 * Quiz API Endpoints
 * RESTful API for Chaos Harmony frontend
 */

require_once 'config.php';
require_once 'moodle_api.php';

setCORSHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Simple routing
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'sync':
        handleSync();
        break;

    case 'questions':
        handleGetQuestions();
        break;

    case 'attempts':
        handleGetAttempts();
        break;

    case 'patterns':
        handleGetPatterns();
        break;

    case 'visualization':
        handleGetVisualization();
        break;

    case 'submit_attempt':
        handleSubmitAttempt();
        break;

    default:
        sendJSON([
            'message' => 'Chaos Harmony API',
            'version' => '1.0',
            'endpoints' => [
                'sync' => 'Sync quiz data from Moodle',
                'questions' => 'Get quiz questions',
                'attempts' => 'Get student attempts',
                'patterns' => 'Get chaos harmony patterns',
                'visualization' => 'Get current visualization state',
                'submit_attempt' => 'Submit a student attempt'
            ]
        ]);
}

/**
 * Sync quiz data from Moodle
 */
function handleSync() {
    global $method;

    if ($method !== 'POST') {
        sendError('Method not allowed', 405);
    }

    $body = getRequestBody();
    $quizId = $body['quiz_id'] ?? null;

    if (!$quizId) {
        sendError('quiz_id is required');
    }

    $result = syncQuizQuestions($quizId);
    sendJSON($result);
}

/**
 * Get quiz questions
 */
function handleGetQuestions() {
    $pdo = getDBConnection();
    $quizId = $_GET['quiz_id'] ?? null;

    if (!$quizId) {
        sendError('quiz_id parameter is required');
    }

    $stmt = $pdo->prepare("
        SELECT id, moodle_question_id, question_text, question_type,
               difficulty_level, category, created_at, updated_at
        FROM quiz_questions
        WHERE quiz_id = ?
        ORDER BY id
    ");

    $stmt->execute([$quizId]);
    $questions = $stmt->fetchAll();

    sendJSON([
        'quiz_id' => $quizId,
        'count' => count($questions),
        'questions' => $questions
    ]);
}

/**
 * Get student attempts
 */
function handleGetAttempts() {
    $pdo = getDBConnection();
    $studentId = $_GET['student_id'] ?? null;
    $quizId = $_GET['quiz_id'] ?? null;

    $query = "
        SELECT sa.*, qq.question_text, qq.question_type
        FROM student_attempts sa
        LEFT JOIN quiz_questions qq ON sa.question_id = qq.id
        WHERE 1=1
    ";

    $params = [];

    if ($studentId) {
        $query .= " AND sa.moodle_user_id = ?";
        $params[] = $studentId;
    }

    if ($quizId) {
        $query .= " AND sa.quiz_id = ?";
        $params[] = $quizId;
    }

    $query .= " ORDER BY sa.attempt_date DESC LIMIT 100";

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $attempts = $stmt->fetchAll();

    sendJSON([
        'count' => count($attempts),
        'attempts' => $attempts
    ]);
}

/**
 * Get Chaos Harmony patterns for a student
 */
function handleGetPatterns() {
    $pdo = getDBConnection();
    $studentId = $_GET['student_id'] ?? null;

    if (!$studentId) {
        sendError('student_id parameter is required');
    }

    // Analyze student attempts to generate patterns
    $patterns = generateChaosPatterns($studentId);

    sendJSON([
        'student_id' => $studentId,
        'patterns' => $patterns
    ]);
}

/**
 * Get current visualization state
 */
function handleGetVisualization() {
    $pdo = getDBConnection();
    $studentId = $_GET['student_id'] ?? null;

    if (!$studentId) {
        sendError('student_id parameter is required');
    }

    $stmt = $pdo->prepare("
        SELECT * FROM visualization_state WHERE student_id = ?
    ");
    $stmt->execute([$studentId]);
    $state = $stmt->fetch();

    if (!$state) {
        // Generate initial visualization state
        $state = initializeVisualizationState($studentId);
    }

    sendJSON($state);
}

/**
 * Submit a student attempt
 */
function handleSubmitAttempt() {
    global $method;

    if ($method !== 'POST') {
        sendError('Method not allowed', 405);
    }

    $pdo = getDBConnection();
    $body = getRequestBody();

    $required = ['moodle_user_id', 'moodle_attempt_id', 'quiz_id', 'question_id'];
    foreach ($required as $field) {
        if (!isset($body[$field])) {
            sendError("$field is required");
        }
    }

    try {
        $stmt = $pdo->prepare("
            INSERT INTO student_attempts
            (moodle_user_id, moodle_attempt_id, quiz_id, question_id, answer_text, is_correct, response_time)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $body['moodle_user_id'],
            $body['moodle_attempt_id'],
            $body['quiz_id'],
            $body['question_id'],
            $body['answer_text'] ?? null,
            $body['is_correct'] ?? null,
            $body['response_time'] ?? null
        ]);

        $attemptId = $pdo->lastInsertId();

        // Update patterns based on new attempt
        updateChaosPatterns($body['moodle_user_id'], $attemptId);

        sendJSON([
            'success' => true,
            'attempt_id' => $attemptId
        ], 201);
    } catch (PDOException $e) {
        sendError('Failed to save attempt: ' . $e->getMessage(), 500);
    }
}

/**
 * Generate Chaos Harmony patterns based on student performance
 */
function generateChaosPatterns($studentId) {
    $pdo = getDBConnection();

    // Get recent attempts
    $stmt = $pdo->prepare("
        SELECT *
        FROM student_attempts
        WHERE moodle_user_id = ?
        ORDER BY attempt_date DESC
        LIMIT 50
    ");
    $stmt->execute([$studentId]);
    $attempts = $stmt->fetchAll();

    if (empty($attempts)) {
        return [];
    }

    // Analyze patterns
    $patterns = [];

    // Pattern 1: Success rhythm (streaks of correct answers)
    $successStreak = 0;
    $maxStreak = 0;
    foreach ($attempts as $attempt) {
        if ($attempt['is_correct']) {
            $successStreak++;
            $maxStreak = max($maxStreak, $successStreak);
        } else {
            $successStreak = 0;
        }
    }

    if ($maxStreak > 0) {
        $patterns[] = [
            'type' => 'success_rhythm',
            'intensity' => min(1.0, $maxStreak / 10),
            'frequency' => $maxStreak / count($attempts),
            'metadata' => ['max_streak' => $maxStreak]
        ];
    }

    // Pattern 2: Struggle wave (alternating performance)
    $alternations = 0;
    for ($i = 1; $i < count($attempts); $i++) {
        if ($attempts[$i]['is_correct'] !== $attempts[$i-1]['is_correct']) {
            $alternations++;
        }
    }

    if ($alternations > 0) {
        $patterns[] = [
            'type' => 'struggle_wave',
            'intensity' => min(1.0, $alternations / count($attempts)),
            'frequency' => $alternations / (count($attempts) - 1),
            'metadata' => ['alternations' => $alternations]
        ];
    }

    // Pattern 3: Speed pattern (response time variance)
    $responseTimes = array_filter(array_column($attempts, 'response_time'));
    if (count($responseTimes) > 1) {
        $avgTime = array_sum($responseTimes) / count($responseTimes);
        $variance = 0;
        foreach ($responseTimes as $time) {
            $variance += pow($time - $avgTime, 2);
        }
        $variance /= count($responseTimes);
        $stdDev = sqrt($variance);

        $patterns[] = [
            'type' => 'speed_pattern',
            'intensity' => min(1.0, $stdDev / $avgTime),
            'frequency' => 1.0,
            'metadata' => [
                'avg_time' => round($avgTime, 2),
                'std_dev' => round($stdDev, 2)
            ]
        ];
    }

    // Save patterns to database
    foreach ($patterns as $pattern) {
        $stmt = $pdo->prepare("
            INSERT INTO chaos_patterns
            (student_id, pattern_type, intensity, frequency, metadata)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $studentId,
            $pattern['type'],
            $pattern['intensity'],
            $pattern['frequency'],
            json_encode($pattern['metadata'])
        ]);
    }

    return $patterns;
}

/**
 * Initialize visualization state for a student
 */
function initializeVisualizationState($studentId) {
    $pdo = getDBConnection();

    $state = [
        'student_id' => $studentId,
        'current_emotion' => 'neutral',
        'color_palette' => json_encode([
            'primary' => '#667eea',
            'secondary' => '#764ba2',
            'accent' => '#f093fb'
        ]),
        'animation_speed' => 1.0
    ];

    $stmt = $pdo->prepare("
        INSERT INTO visualization_state
        (student_id, current_emotion, color_palette, animation_speed)
        VALUES (?, ?, ?, ?)
    ");
    $stmt->execute([
        $state['student_id'],
        $state['current_emotion'],
        $state['color_palette'],
        $state['animation_speed']
    ]);

    return $state;
}

/**
 * Update chaos patterns after new attempt
 */
function updateChaosPatterns($studentId, $attemptId) {
    // Regenerate patterns
    generateChaosPatterns($studentId);

    // Update visualization state based on latest patterns
    $pdo = getDBConnection();

    $stmt = $pdo->prepare("
        SELECT pattern_type, intensity, frequency
        FROM chaos_patterns
        WHERE student_id = ?
        ORDER BY timestamp DESC
        LIMIT 10
    ");
    $stmt->execute([$studentId]);
    $recentPatterns = $stmt->fetchAll();

    // Determine emotion based on patterns
    $emotion = 'neutral';
    $totalIntensity = 0;

    foreach ($recentPatterns as $pattern) {
        $totalIntensity += $pattern['intensity'];
        if ($pattern['pattern_type'] === 'success_rhythm' && $pattern['intensity'] > 0.7) {
            $emotion = 'flow';
        } elseif ($pattern['pattern_type'] === 'struggle_wave' && $pattern['intensity'] > 0.6) {
            $emotion = 'struggle';
        }
    }

    // Update visualization state
    $stmt = $pdo->prepare("
        UPDATE visualization_state
        SET current_emotion = ?,
            animation_speed = ?,
            last_updated = CURRENT_TIMESTAMP
        WHERE student_id = ?
    ");

    $animationSpeed = 0.5 + ($totalIntensity / count($recentPatterns));

    $stmt->execute([$emotion, $animationSpeed, $studentId]);
}
