<?php
/**
 * Problems API Endpoint
 * 문제 관련 API
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';
require_once '../config/moodle.php';

// OPTIONS 요청 처리 (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$db = Database::getInstance()->getConnection();

try {
    switch ($method) {
        case 'GET':
            handleGet($db);
            break;

        case 'POST':
            handlePost($db);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

/**
 * GET: 문제 조회
 */
function handleGet($db) {
    $problemId = $_GET['id'] ?? null;
    $moodleQuestionId = $_GET['moodle_question_id'] ?? null;

    if ($problemId) {
        // 특정 문제 조회
        $stmt = $db->prepare("SELECT * FROM problems WHERE id = ?");
        $stmt->execute([$problemId]);
        $problem = $stmt->fetch();

        if ($problem) {
            echo json_encode(['success' => true, 'data' => $problem]);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Problem not found']);
        }
    } elseif ($moodleQuestionId) {
        // Moodle 문제 ID로 조회
        $stmt = $db->prepare("SELECT * FROM problems WHERE moodle_question_id = ?");
        $stmt->execute([$moodleQuestionId]);
        $problem = $stmt->fetch();

        if (!$problem) {
            // Moodle에서 문제 정보 가져와서 생성
            $moodleAPI = new MoodleAPI();
            $questionData = $moodleAPI->getQuestion($moodleQuestionId);

            if (isset($questionData['error'])) {
                http_response_code(404);
                echo json_encode(['error' => 'Question not found in Moodle']);
                return;
            }

            // 새 문제 생성 (간단한 예시)
            $stmt = $db->prepare("
                INSERT INTO problems (moodle_question_id, title, equation, difficulty)
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([
                $moodleQuestionId,
                $questionData['name'] ?? 'Untitled',
                $questionData['questiontext'] ?? '',
                'medium'
            ]);

            $problem = [
                'id' => $db->lastInsertId(),
                'moodle_question_id' => $moodleQuestionId,
                'title' => $questionData['name'] ?? 'Untitled',
                'equation' => $questionData['questiontext'] ?? '',
                'difficulty' => 'medium'
            ];
        }

        echo json_encode(['success' => true, 'data' => $problem]);
    } else {
        // 모든 문제 조회
        $stmt = $db->query("SELECT * FROM problems ORDER BY created_at DESC");
        $problems = $stmt->fetchAll();
        echo json_encode(['success' => true, 'data' => $problems]);
    }
}

/**
 * POST: 새 문제 생성
 */
function handlePost($db) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['equation'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Equation is required']);
        return;
    }

    $stmt = $db->prepare("
        INSERT INTO problems (moodle_question_id, title, equation, difficulty)
        VALUES (?, ?, ?, ?)
    ");

    $stmt->execute([
        $input['moodle_question_id'] ?? 0,
        $input['title'] ?? 'Untitled',
        $input['equation'],
        $input['difficulty'] ?? 'medium'
    ]);

    $problemId = $db->lastInsertId();

    echo json_encode([
        'success' => true,
        'data' => [
            'id' => $problemId,
            'message' => 'Problem created successfully'
        ]
    ]);
}
