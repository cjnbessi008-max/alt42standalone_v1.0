<?php
/**
 * Get Problem API
 * Retrieves a mathematical function problem from the database
 */

require_once 'config.php';

// Handle OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $pdo = getDBConnection();

    // Get problem type from query parameter
    $type = isset($_GET['type']) ? (int)$_GET['type'] : null;
    $problemId = isset($_GET['id']) ? (int)$_GET['id'] : null;

    // Build query
    if ($problemId) {
        // Get specific problem by ID
        $stmt = $pdo->prepare("
            SELECT id, name, equation, description, function_type, difficulty,
                   x_min, x_max, created_at
            FROM " . TABLE_CRITICAL_POINT_PROBLEMS . "
            WHERE id = :id AND active = 1
        ");
        $stmt->execute(['id' => $problemId]);
        $problem = $stmt->fetch();
    } elseif ($type) {
        // Get random problem of specific type
        $stmt = $pdo->prepare("
            SELECT id, name, equation, description, function_type, difficulty,
                   x_min, x_max, created_at
            FROM " . TABLE_CRITICAL_POINT_PROBLEMS . "
            WHERE function_type = :type AND active = 1
            ORDER BY RAND()
            LIMIT 1
        ");
        $stmt->execute(['type' => $type]);
        $problem = $stmt->fetch();
    } else {
        // Get any random problem
        $stmt = $pdo->query("
            SELECT id, name, equation, description, function_type, difficulty,
                   x_min, x_max, created_at
            FROM " . TABLE_CRITICAL_POINT_PROBLEMS . "
            WHERE active = 1
            ORDER BY RAND()
            LIMIT 1
        ");
        $problem = $stmt->fetch();
    }

    if (!$problem) {
        // Return sample problem if database is empty
        $sampleProblems = getSampleProblems();
        $index = $type ? (($type - 1) % count($sampleProblems)) : 0;
        $problem = $sampleProblems[$index];
    }

    sendJSON([
        'success' => true,
        'problem' => $problem
    ]);

} catch (Exception $e) {
    logError('Error in getProblem.php', $e);

    sendJSON([
        'success' => false,
        'error' => APP_DEBUG ? $e->getMessage() : 'Failed to retrieve problem'
    ], 500);
}

/**
 * Get sample problems (fallback when database is empty)
 * @return array Sample problems
 */
function getSampleProblems() {
    return [
        [
            'id' => 1,
            'name' => '이차 함수',
            'equation' => 'f(x) = -x² + 4x + 1',
            'description' => '기본적인 이차 함수입니다. 극댓값을 찾아보세요!',
            'function_type' => 1,
            'difficulty' => 1,
            'x_min' => -5,
            'x_max' => 5
        ],
        [
            'id' => 2,
            'name' => '삼차 함수',
            'equation' => 'f(x) = x³ - 6x² + 9x + 1',
            'description' => '삼차 함수는 극댓값과 극솟값을 모두 가질 수 있습니다!',
            'function_type' => 2,
            'difficulty' => 2,
            'x_min' => -5,
            'x_max' => 5
        ],
        [
            'id' => 3,
            'name' => '사차 함수',
            'equation' => 'f(x) = 0.1x⁴ - x² + 2',
            'description' => '사차 함수에서 극값들을 찾아보세요!',
            'function_type' => 3,
            'difficulty' => 3,
            'x_min' => -5,
            'x_max' => 5
        ],
        [
            'id' => 4,
            'name' => '삼각 함수',
            'equation' => 'f(x) = 2sin(x) + cos(2x)',
            'description' => '삼각 함수는 주기적으로 극값이 나타납니다!',
            'function_type' => 4,
            'difficulty' => 3,
            'x_min' => -5,
            'x_max' => 5
        ],
        [
            'id' => 5,
            'name' => '복합 함수',
            'equation' => 'f(x) = x³ - 3x² - 9x + 5',
            'description' => '조금 더 복잡한 삼차 함수입니다. 극값이 2개 있어요!',
            'function_type' => 5,
            'difficulty' => 2,
            'x_min' => -5,
            'x_max' => 5
        ]
    ];
}
