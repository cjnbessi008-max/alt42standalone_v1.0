<?php
/**
 * Recommendation API Handler
 * Provides personalized learning recommendations
 */

require_once __DIR__ . '/../config/database.php';
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
    $engine = new RecommendationEngine($pdo);

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
        case 'get_recommendations':
            if ($method !== 'GET') {
                sendError('Method not allowed', 405);
            }
            handleGetRecommendations($engine, $_GET);
            break;

        case 'get_next_problem':
            if ($method !== 'GET') {
                sendError('Method not allowed', 405);
            }
            handleGetNextProblem($engine, $_GET);
            break;

        case 'get_performance_summary':
            if ($method !== 'GET') {
                sendError('Method not allowed', 405);
            }
            handleGetPerformanceSummary($engine, $_GET);
            break;

        case 'get_skill_analysis':
            if ($method !== 'GET') {
                sendError('Method not allowed', 405);
            }
            handleGetSkillAnalysis($pdo, $_GET);
            break;

        case 'update_skills':
            if ($method !== 'POST') {
                sendError('Method not allowed', 405);
            }
            handleUpdateSkills($engine, $requestBody);
            break;

        case 'create_learning_path':
            if ($method !== 'POST') {
                sendError('Method not allowed', 405);
            }
            handleCreateLearningPath($engine, $requestBody);
            break;

        case 'get_learning_path':
            if ($method !== 'GET') {
                sendError('Method not allowed', 405);
            }
            handleGetLearningPath($pdo, $_GET);
            break;

        case 'get_recommended_difficulty':
            if ($method !== 'GET') {
                sendError('Method not allowed', 405);
            }
            handleGetRecommendedDifficulty($engine, $_GET);
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
 * Get comprehensive recommendations for a user
 */
function handleGetRecommendations($engine, $params) {
    if (!isset($params['user_id'])) {
        sendError('Missing user_id parameter');
    }

    $userId = (int)$params['user_id'];
    $limit = isset($params['limit']) ? (int)$params['limit'] : 5;

    $summary = $engine->getPerformanceSummary($userId);
    $nextProblem = $engine->recommendNextProblem($userId);
    $recommendedDifficulty = $engine->getRecommendedDifficulty($userId);

    $recommendations = [
        'user_id' => $userId,
        'summary' => $summary,
        'next_problem' => $nextProblem,
        'recommended_difficulty' => $recommendedDifficulty,
        'suggestions' => []
    ];

    // Add specific suggestions based on performance
    if ($summary) {
        $weakSkills = json_decode($summary['weak_skills'], true) ?? [];

        if (!empty($weakSkills)) {
            $recommendations['suggestions'][] = [
                'type' => 'remedial_practice',
                'priority' => 'high',
                'title' => '약점 보강 학습',
                'message' => count($weakSkills) . '개의 미분 규칙에서 어려움을 겪고 있습니다.',
                'weak_skills' => $weakSkills,
                'action' => '보강 학습 시작'
            ];
        }

        // Check for difficulty adjustment
        if ($summary['current_difficulty'] !== $summary['recommended_difficulty']) {
            $recommendations['suggestions'][] = [
                'type' => 'difficulty_adjustment',
                'priority' => 'medium',
                'title' => '난이도 조정 제안',
                'message' => "'{$summary['recommended_difficulty']}' 난이도로 변경을 권장합니다.",
                'from_difficulty' => $summary['current_difficulty'],
                'to_difficulty' => $summary['recommended_difficulty'],
                'action' => '난이도 변경'
            ];
        }

        // Check completion rate
        if ($summary['average_completion_rate'] < 50 && $summary['total_attempts'] >= 5) {
            $recommendations['suggestions'][] = [
                'type' => 'lower_difficulty',
                'priority' => 'high',
                'title' => '학습 속도 조절',
                'message' => '현재 난이도가 너무 높을 수 있습니다. 기초부터 다시 학습해보세요.',
                'completion_rate' => $summary['average_completion_rate'],
                'action' => '기초 학습 시작'
            ];
        }

        // Check for inactive user
        if ($summary['last_activity']) {
            $lastActivity = strtotime($summary['last_activity']);
            $daysSince = (time() - $lastActivity) / 86400;

            if ($daysSince > 7) {
                $recommendations['suggestions'][] = [
                    'type' => 'engagement',
                    'priority' => 'low',
                    'title' => '학습 재개',
                    'message' => round($daysSince) . '일 동안 학습하지 않았습니다. 복습을 시작해보세요!',
                    'days_since_last_activity' => round($daysSince),
                    'action' => '복습 시작'
                ];
            }
        }
    }

    sendResponse([
        'status' => 'success',
        'recommendations' => $recommendations
    ]);
}

/**
 * Get next recommended problem
 */
function handleGetNextProblem($engine, $params) {
    if (!isset($params['user_id'])) {
        sendError('Missing user_id parameter');
    }

    $userId = (int)$params['user_id'];
    $problem = $engine->recommendNextProblem($userId);

    if (!$problem) {
        sendError('No suitable problem found', 404);
    }

    sendResponse([
        'status' => 'success',
        'problem' => $problem,
        'recommendation_reason' => determineRecommendationReason($engine, $userId, $problem)
    ]);
}

/**
 * Determine why this problem was recommended
 */
function determineRecommendationReason($engine, $userId, $problem) {
    $summary = $engine->getPerformanceSummary($userId);

    if (!$summary) {
        return '초보자를 위한 기초 문제입니다.';
    }

    $weakSkills = json_decode($summary['weak_skills'], true) ?? [];

    if (!empty($weakSkills)) {
        return "'{$weakSkills[0]}' 규칙을 보강하기 위한 문제입니다.";
    }

    return "현재 수준 ('{$problem['difficulty_level']}')에 맞는 문제입니다.";
}

/**
 * Get performance summary
 */
function handleGetPerformanceSummary($engine, $params) {
    if (!isset($params['user_id'])) {
        sendError('Missing user_id parameter');
    }

    $userId = (int)$params['user_id'];
    $summary = $engine->getPerformanceSummary($userId);

    if (!$summary) {
        sendResponse([
            'status' => 'success',
            'summary' => null,
            'message' => 'No performance data yet'
        ]);
    }

    sendResponse([
        'status' => 'success',
        'summary' => $summary
    ]);
}

/**
 * Get detailed skill analysis
 */
function handleGetSkillAnalysis($pdo, $params) {
    if (!isset($params['user_id'])) {
        sendError('Missing user_id parameter');
    }

    $userId = (int)$params['user_id'];

    // Get all skills with levels
    $stmt = $pdo->prepare(
        "SELECT skill_name, skill_level, attempts_count, success_count,
                average_time_seconds, last_practiced
         FROM student_skill_levels
         WHERE moodle_user_id = :user_id
         ORDER BY skill_level ASC"
    );
    $stmt->execute([':user_id' => $userId]);
    $skills = $stmt->fetchAll();

    // Categorize skills
    $categorized = [
        'weak' => [],
        'developing' => [],
        'proficient' => [],
        'mastered' => []
    ];

    foreach ($skills as $skill) {
        $level = $skill['skill_level'];
        $successRate = $skill['attempts_count'] > 0 ?
            ($skill['success_count'] / $skill['attempts_count']) * 100 : 0;

        $skillData = array_merge($skill, ['success_rate' => $successRate]);

        if ($level < 0.5) {
            $categorized['weak'][] = $skillData;
        } elseif ($level < 0.7) {
            $categorized['developing'][] = $skillData;
        } elseif ($level < 0.9) {
            $categorized['proficient'][] = $skillData;
        } else {
            $categorized['mastered'][] = $skillData;
        }
    }

    sendResponse([
        'status' => 'success',
        'user_id' => $userId,
        'skills' => $skills,
        'categorized' => $categorized,
        'total_skills' => count($skills)
    ]);
}

/**
 * Update skills after completing an attempt
 */
function handleUpdateSkills($engine, $data) {
    $required = ['user_id', 'attempt_id'];
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            sendError("Missing required field: $field");
        }
    }

    $userId = (int)$data['user_id'];
    $attemptId = (int)$data['attempt_id'];

    $updatedSkills = $engine->updateSkillLevels($userId, $attemptId);

    if (isset($updatedSkills['error'])) {
        sendError($updatedSkills['error']);
    }

    sendResponse([
        'status' => 'success',
        'user_id' => $userId,
        'updated_skills' => $updatedSkills,
        'message' => 'Skills updated successfully'
    ]);
}

/**
 * Create personalized learning path
 */
function handleCreateLearningPath($engine, $data) {
    if (!isset($data['user_id'])) {
        sendError('Missing user_id parameter');
    }

    $userId = (int)$data['user_id'];
    $targetSkills = $data['target_skills'] ?? null;
    $pathName = $data['path_name'] ?? null;

    // If no target skills specified, use weak skills
    if (!$targetSkills) {
        $summary = $engine->getPerformanceSummary($userId);
        if ($summary) {
            $targetSkills = json_decode($summary['weak_skills'], true) ?? [];
        }

        if (empty($targetSkills)) {
            // Default to all basic skills
            $targetSkills = [
                'constant_rule',
                'power_rule',
                'constant_multiple',
                'sum_rule'
            ];
        }
    }

    $pathId = $engine->createLearningPath($userId, $targetSkills, $pathName);

    sendResponse([
        'status' => 'success',
        'path_id' => $pathId,
        'target_skills' => $targetSkills,
        'message' => 'Learning path created successfully'
    ]);
}

/**
 * Get learning path details
 */
function handleGetLearningPath($pdo, $params) {
    if (!isset($params['user_id'])) {
        sendError('Missing user_id parameter');
    }

    $userId = (int)$params['user_id'];
    $pathId = isset($params['path_id']) ? (int)$params['path_id'] : null;

    // Get active learning path
    $query = "SELECT * FROM learning_paths WHERE moodle_user_id = :user_id";
    $queryParams = [':user_id' => $userId];

    if ($pathId) {
        $query .= " AND id = :path_id";
        $queryParams[':path_id'] = $pathId;
    } else {
        $query .= " AND is_active = 1";
    }

    $query .= " ORDER BY created_at DESC LIMIT 1";

    $stmt = $pdo->prepare($query);
    $stmt->execute($queryParams);
    $path = $stmt->fetch();

    if (!$path) {
        sendResponse([
            'status' => 'success',
            'path' => null,
            'message' => 'No active learning path found'
        ]);
    }

    // Get steps
    $stmt = $pdo->prepare(
        "SELECT lps.*, p.expression, p.difficulty_level
         FROM learning_path_steps lps
         LEFT JOIN problems p ON lps.problem_id = p.id
         WHERE lps.path_id = :path_id
         ORDER BY lps.step_number ASC"
    );
    $stmt->execute([':path_id' => $path['id']]);
    $steps = $stmt->fetchAll();

    // Calculate progress
    $completedSteps = array_filter($steps, function($step) {
        return $step['is_completed'];
    });

    $progress = count($steps) > 0 ? (count($completedSteps) / count($steps)) * 100 : 0;

    sendResponse([
        'status' => 'success',
        'path' => $path,
        'steps' => $steps,
        'progress' => $progress,
        'completed_steps' => count($completedSteps),
        'total_steps' => count($steps)
    ]);
}

/**
 * Get recommended difficulty
 */
function handleGetRecommendedDifficulty($engine, $params) {
    if (!isset($params['user_id'])) {
        sendError('Missing user_id parameter');
    }

    $userId = (int)$params['user_id'];
    $difficulty = $engine->getRecommendedDifficulty($userId);

    sendResponse([
        'status' => 'success',
        'user_id' => $userId,
        'recommended_difficulty' => $difficulty
    ]);
}
