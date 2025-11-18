<?php
/**
 * Focus Light 웹앱 - 문제 API
 * 문제 목록 조회 및 상세 정보 제공
 */

require_once 'config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGet($pdo);
        break;
    case 'POST':
        handlePost($pdo);
        break;
    default:
        sendError('Method not allowed', 405);
}

/**
 * GET 요청 처리
 */
function handleGet($pdo) {
    // 특정 문제 조회
    if (isset($_GET['id'])) {
        $id = intval($_GET['id']);
        getProblemById($pdo, $id);
    }
    // 문제 목록 조회
    else {
        $subject = $_GET['subject'] ?? null;
        $grade = $_GET['grade'] ?? null;
        $difficulty = $_GET['difficulty'] ?? null;

        getProblems($pdo, $subject, $grade, $difficulty);
    }
}

/**
 * 문제 목록 조회
 */
function getProblems($pdo, $subject, $grade, $difficulty) {
    try {
        $sql = 'SELECT * FROM problems WHERE 1=1';
        $params = [];

        if ($subject) {
            $sql .= ' AND subject = :subject';
            $params[':subject'] = $subject;
        }
        if ($grade) {
            $sql .= ' AND grade_level = :grade';
            $params[':grade'] = $grade;
        }
        if ($difficulty) {
            $sql .= ' AND difficulty = :difficulty';
            $params[':difficulty'] = $difficulty;
        }

        $sql .= ' ORDER BY created_at DESC';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $problems = $stmt->fetchAll();

        sendResponse(true, $problems, 'Problems retrieved successfully');
    } catch (PDOException $e) {
        sendError('Failed to retrieve problems: ' . $e->getMessage(), 500);
    }
}

/**
 * 특정 문제 상세 조회 (도형 및 Focus 요소 포함)
 */
function getProblemById($pdo, $id) {
    try {
        // 문제 기본 정보
        $stmt = $pdo->prepare('SELECT * FROM problems WHERE id = :id');
        $stmt->execute([':id' => $id]);
        $problem = $stmt->fetch();

        if (!$problem) {
            sendError('Problem not found', 404);
        }

        // 도형 정보 조회
        $stmt = $pdo->prepare('SELECT * FROM shapes WHERE problem_id = :problem_id ORDER BY id');
        $stmt->execute([':problem_id' => $id]);
        $shapes = $stmt->fetchAll();

        // 각 도형에 대한 Focus 요소 조회
        foreach ($shapes as &$shape) {
            // JSON 속성 디코딩
            if ($shape['properties']) {
                $shape['properties'] = json_decode($shape['properties'], true);
            }

            // Focus 요소 조회
            $stmt = $pdo->prepare('
                SELECT * FROM focus_elements
                WHERE shape_id = :shape_id AND is_active = 1
                ORDER BY display_order
            ');
            $stmt->execute([':shape_id' => $shape['id']]);
            $shape['focus_elements'] = $stmt->fetchAll();
        }

        $problem['shapes'] = $shapes;

        sendResponse(true, $problem, 'Problem details retrieved successfully');
    } catch (PDOException $e) {
        sendError('Failed to retrieve problem details: ' . $e->getMessage(), 500);
    }
}

/**
 * POST 요청 처리 (새 문제 생성)
 */
function handlePost($pdo) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['title'])) {
            sendError('Title is required', 400);
        }

        $sql = 'INSERT INTO problems (title, description, subject, grade_level, difficulty)
                VALUES (:title, :description, :subject, :grade_level, :difficulty)';

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':title' => $data['title'],
            ':description' => $data['description'] ?? null,
            ':subject' => $data['subject'] ?? 'geometry',
            ':grade_level' => $data['grade_level'] ?? null,
            ':difficulty' => $data['difficulty'] ?? 'medium'
        ]);

        $problemId = $pdo->lastInsertId();

        sendResponse(true, ['id' => $problemId], 'Problem created successfully');
    } catch (PDOException $e) {
        sendError('Failed to create problem: ' . $e->getMessage(), 500);
    }
}
