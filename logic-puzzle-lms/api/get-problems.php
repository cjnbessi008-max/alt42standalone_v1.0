<?php
/**
 * Get Problems API Endpoint
 *
 * 문제 목록 또는 특정 문제 정보를 반환
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// OPTIONS 요청 처리 (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/moodle-connector.php';

try {
    $db = Database::getInstance();
    $requestMethod = $_SERVER['REQUEST_METHOD'];

    if ($requestMethod !== 'GET') {
        throw new Exception('Invalid request method. Use GET.');
    }

    // 요청 파라미터
    $problemId = isset($_GET['id']) ? intval($_GET['id']) : null;
    $moodleQuestionId = isset($_GET['moodle_id']) ? intval($_GET['moodle_id']) : null;
    $difficulty = isset($_GET['difficulty']) ? $_GET['difficulty'] : null;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
    $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;

    // 특정 문제 ID로 조회
    if ($problemId) {
        $sql = "SELECT * FROM problems WHERE id = ?";
        $problem = $db->querySingle($sql, [$problemId]);

        if (!$problem) {
            throw new Exception('Problem not found', 404);
        }

        // JSON 필드 파싱
        $problem['correct_formula'] = json_decode($problem['correct_formula'], true);
        $problem['available_blocks'] = json_decode($problem['available_blocks'], true);

        echo json_encode([
            'success' => true,
            'data' => $problem
        ]);
        exit;
    }

    // Moodle Question ID로 조회
    if ($moodleQuestionId) {
        $sql = "SELECT * FROM problems WHERE moodle_question_id = ?";
        $problem = $db->querySingle($sql, [$moodleQuestionId]);

        if (!$problem) {
            // Moodle에서 문제 가져와서 동기화
            $moodleConnector = new MoodleConnector();
            $moodleQuestion = $moodleConnector->getQuestion($moodleQuestionId);

            if ($moodleQuestion) {
                // 로컬 DB에 저장
                $insertSql = "INSERT INTO problems (moodle_question_id, title, description, difficulty_level, correct_formula, available_blocks)
                              VALUES (?, ?, ?, ?, ?, ?)";

                $problemId = $db->insert($insertSql, [
                    $moodleQuestionId,
                    $moodleQuestion['name'] ?? 'Untitled',
                    $moodleQuestion['questiontext'] ?? '',
                    'medium',
                    json_encode($moodleQuestion['correct_formula'] ?? []),
                    json_encode($moodleQuestion['available_blocks'] ?? [])
                ]);

                $problem = $db->querySingle("SELECT * FROM problems WHERE id = ?", [$problemId]);
            } else {
                throw new Exception('Problem not found in Moodle', 404);
            }
        }

        // JSON 필드 파싱
        $problem['correct_formula'] = json_decode($problem['correct_formula'], true);
        $problem['available_blocks'] = json_decode($problem['available_blocks'], true);

        echo json_encode([
            'success' => true,
            'data' => $problem
        ]);
        exit;
    }

    // 문제 목록 조회
    $conditions = [];
    $params = [];

    if ($difficulty) {
        $conditions[] = "difficulty_level = ?";
        $params[] = $difficulty;
    }

    $whereClause = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';

    $sql = "SELECT * FROM problems $whereClause ORDER BY created_at DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;

    $problems = $db->query($sql, $params);

    // JSON 필드 파싱
    foreach ($problems as &$problem) {
        $problem['correct_formula'] = json_decode($problem['correct_formula'], true);
        $problem['available_blocks'] = json_decode($problem['available_blocks'], true);
    }

    // 전체 개수 조회
    $countSql = "SELECT COUNT(*) as total FROM problems $whereClause";
    $countParams = array_slice($params, 0, count($params) - 2); // limit, offset 제외
    $countResult = $db->querySingle($countSql, $countParams);
    $total = $countResult['total'];

    echo json_encode([
        'success' => true,
        'data' => $problems,
        'pagination' => [
            'total' => intval($total),
            'limit' => $limit,
            'offset' => $offset,
            'has_more' => ($offset + $limit) < $total
        ]
    ]);

} catch (Exception $e) {
    $statusCode = $e->getCode() ?: 500;
    http_response_code($statusCode);

    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
