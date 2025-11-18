<?php
/**
 * Session Manager API Endpoint
 *
 * 학습 세션 생성 및 관리
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// OPTIONS 요청 처리 (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/db.php';

try {
    $db = Database::getInstance();
    $requestMethod = $_SERVER['REQUEST_METHOD'];

    // POST: 새 세션 생성
    if ($requestMethod === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);

        $studentId = $input['student_id'] ?? null;
        $problemId = $input['problem_id'] ?? null;

        if (!$studentId || !$problemId) {
            throw new Exception('Missing required parameters: student_id, problem_id');
        }

        // 학생 존재 확인
        $student = $db->querySingle("SELECT id FROM students WHERE id = ?", [$studentId]);
        if (!$student) {
            throw new Exception('Student not found', 404);
        }

        // 문제 존재 확인
        $problem = $db->querySingle("SELECT id FROM problems WHERE id = ?", [$problemId]);
        if (!$problem) {
            throw new Exception('Problem not found', 404);
        }

        // 진행 중인 세션이 있는지 확인
        $existingSession = $db->querySingle(
            "SELECT id, session_token FROM sessions WHERE student_id = ? AND problem_id = ? AND status = 'in_progress'",
            [$studentId, $problemId]
        );

        if ($existingSession) {
            // 기존 세션 반환
            echo json_encode([
                'success' => true,
                'data' => [
                    'session_id' => $existingSession['id'],
                    'session_token' => $existingSession['session_token'],
                    'is_new' => false
                ]
            ]);
            exit;
        }

        // 새 세션 생성
        $sessionToken = bin2hex(random_bytes(32));

        $insertSql = "INSERT INTO sessions (student_id, problem_id, session_token, status, started_at)
                      VALUES (?, ?, ?, 'in_progress', NOW())";

        $sessionId = $db->insert($insertSql, [$studentId, $problemId, $sessionToken]);

        echo json_encode([
            'success' => true,
            'data' => [
                'session_id' => $sessionId,
                'session_token' => $sessionToken,
                'is_new' => true
            ]
        ]);
        exit;
    }

    // GET: 세션 정보 조회
    if ($requestMethod === 'GET') {
        $sessionId = $_GET['id'] ?? null;
        $sessionToken = $_GET['token'] ?? null;

        if (!$sessionId && !$sessionToken) {
            throw new Exception('Missing required parameter: id or token');
        }

        if ($sessionId) {
            $sql = "SELECT s.*, p.title, p.description, p.difficulty_level, p.max_attempts, p.time_limit_seconds,
                           st.username, st.full_name,
                           (SELECT COUNT(*) FROM attempts WHERE session_id = s.id) as attempt_count
                    FROM sessions s
                    JOIN problems p ON s.problem_id = p.id
                    JOIN students st ON s.student_id = st.id
                    WHERE s.id = ?";
            $session = $db->querySingle($sql, [$sessionId]);
        } else {
            $sql = "SELECT s.*, p.title, p.description, p.difficulty_level, p.max_attempts, p.time_limit_seconds,
                           st.username, st.full_name,
                           (SELECT COUNT(*) FROM attempts WHERE session_id = s.id) as attempt_count
                    FROM sessions s
                    JOIN problems p ON s.problem_id = p.id
                    JOIN students st ON s.student_id = st.id
                    WHERE s.session_token = ?";
            $session = $db->querySingle($sql, [$sessionToken]);
        }

        if (!$session) {
            throw new Exception('Session not found', 404);
        }

        // 시도 내역 조회
        $attempts = $db->query(
            "SELECT id, attempt_number, is_correct, score, feedback, time_taken_seconds, submitted_at
             FROM attempts
             WHERE session_id = ?
             ORDER BY attempt_number ASC",
            [$session['id']]
        );

        $session['attempts'] = $attempts;

        echo json_encode([
            'success' => true,
            'data' => $session
        ]);
        exit;
    }

    // PUT: 세션 상태 업데이트
    if ($requestMethod === 'PUT') {
        $input = json_decode(file_get_contents('php://input'), true);

        $sessionId = $input['session_id'] ?? null;
        $status = $input['status'] ?? null;

        if (!$sessionId || !$status) {
            throw new Exception('Missing required parameters: session_id, status');
        }

        if (!in_array($status, ['in_progress', 'completed', 'abandoned'])) {
            throw new Exception('Invalid status value');
        }

        $updateSql = "UPDATE sessions SET status = ?";
        $params = [$status];

        if ($status === 'completed' || $status === 'abandoned') {
            $updateSql .= ", completed_at = NOW()";
        }

        $updateSql .= " WHERE id = ?";
        $params[] = $sessionId;

        $db->execute($updateSql, $params);

        echo json_encode([
            'success' => true,
            'message' => 'Session updated successfully'
        ]);
        exit;
    }

    throw new Exception('Invalid request method');

} catch (Exception $e) {
    $statusCode = $e->getCode() ?: 500;
    http_response_code($statusCode);

    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
