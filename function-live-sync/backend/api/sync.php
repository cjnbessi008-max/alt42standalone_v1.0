<?php
/**
 * Function Live Sync - Synchronization API
 * 실시간 동기화 및 세션 관리
 */

require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    errorResponse('Only POST method is allowed', 405);
}

$data = getPostData();
$action = $data['action'] ?? '';

switch ($action) {
    case 'start_session':
        startSession($data);
        break;

    case 'sync_function':
        syncFunction($data);
        break;

    case 'get_changes':
        getChanges($data);
        break;

    case 'submit_answer':
        submitAnswer($data);
        break;

    case 'end_session':
        endSession($data);
        break;

    default:
        errorResponse('Invalid action');
}

/**
 * 세션 시작
 */
function startSession($data) {
    $pdo = getDbConnection();

    // 필수 필드 검증
    if (empty($data['problem_id']) || empty($data['student_id'])) {
        errorResponse('problem_id and student_id are required');
    }

    $problemId = validateInput($data['problem_id'], 'int');
    $studentId = validateInput($data['student_id'], 'string', 255);
    $studentName = validateInput($data['student_name'] ?? 'Student', 'string', 255);

    // 문제 존재 확인
    $stmt = $pdo->prepare('SELECT initial_function FROM problems WHERE id = :id');
    $stmt->execute(['id' => $problemId]);
    $problem = $stmt->fetch();

    if (!$problem) {
        errorResponse('Problem not found', 404);
    }

    // 기존 활성 세션 확인
    $stmt = $pdo->prepare('
        SELECT id, session_token FROM student_sessions
        WHERE problem_id = :problem_id AND student_id = :student_id AND is_active = 1
        ORDER BY started_at DESC
        LIMIT 1
    ');
    $stmt->execute([
        'problem_id' => $problemId,
        'student_id' => $studentId
    ]);
    $existingSession = $stmt->fetch();

    if ($existingSession) {
        // 기존 세션 재사용
        successResponse([
            'session_id' => $existingSession['id'],
            'session_token' => $existingSession['session_token'],
            'is_new' => false
        ]);
        return;
    }

    // 새 세션 생성
    $sessionToken = generateSessionToken();

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare('
            INSERT INTO student_sessions (
                problem_id, student_id, student_name, session_token, current_function
            ) VALUES (
                :problem_id, :student_id, :student_name, :session_token, :current_function
            )
        ');

        $stmt->execute([
            'problem_id' => $problemId,
            'student_id' => $studentId,
            'student_name' => $studentName,
            'session_token' => $sessionToken,
            'current_function' => $problem['initial_function']
        ]);

        $sessionId = $pdo->lastInsertId();

        // 동기화 상태 초기화
        $stmt = $pdo->prepare('
            INSERT INTO sync_status (session_id, sync_version, client_connected)
            VALUES (:session_id, 0, 1)
        ');
        $stmt->execute(['session_id' => $sessionId]);

        $pdo->commit();

        logMessage("Session started: SessionID=$sessionId, StudentID=$studentId, ProblemID=$problemId");

        successResponse([
            'session_id' => $sessionId,
            'session_token' => $sessionToken,
            'is_new' => true,
            'initial_function' => $problem['initial_function']
        ]);
    } catch (PDOException $e) {
        $pdo->rollBack();
        logMessage("Error starting session: " . $e->getMessage(), 'ERROR');
        errorResponse('Failed to start session', 500);
    }
}

/**
 * 함수 동기화
 */
function syncFunction($data) {
    $pdo = getDbConnection();

    if (empty($data['session_token']) || empty($data['function_expression'])) {
        errorResponse('session_token and function_expression are required');
    }

    $sessionToken = validateInput($data['session_token'], 'string', 64);
    $functionExpression = validateInput($data['function_expression'], 'string', 500);
    $changeType = validateInput($data['change_type'] ?? 'edit', 'string');
    $parameters = $data['parameters'] ?? null;
    $graphData = $data['graph_data'] ?? null;

    // 세션 확인
    $stmt = $pdo->prepare('
        SELECT id, current_function FROM student_sessions
        WHERE session_token = :token AND is_active = 1
    ');
    $stmt->execute(['token' => $sessionToken]);
    $session = $stmt->fetch();

    if (!$session) {
        errorResponse('Invalid or expired session', 401);
    }

    $sessionId = $session['id'];

    // 변경사항이 없으면 무시
    if ($session['current_function'] === $functionExpression) {
        successResponse(['message' => 'No changes']);
        return;
    }

    try {
        $pdo->beginTransaction();

        // 현재 함수 업데이트
        $stmt = $pdo->prepare('
            UPDATE student_sessions
            SET current_function = :function, attempt_count = attempt_count + 1
            WHERE id = :id
        ');
        $stmt->execute([
            'function' => $functionExpression,
            'id' => $sessionId
        ]);

        // 변경 로그 기록
        $stmt = $pdo->prepare('
            INSERT INTO function_changes (
                session_id, function_expression, change_type, parameters, graph_data
            ) VALUES (
                :session_id, :function, :change_type, :parameters, :graph_data
            )
        ');

        $stmt->execute([
            'session_id' => $sessionId,
            'function' => $functionExpression,
            'change_type' => $changeType,
            'parameters' => $parameters ? json_encode($parameters) : null,
            'graph_data' => $graphData ? json_encode($graphData) : null
        ]);

        // 동기화 버전 업데이트
        $stmt = $pdo->prepare('
            UPDATE sync_status
            SET sync_version = sync_version + 1
            WHERE session_id = :session_id
        ');
        $stmt->execute(['session_id' => $sessionId]);

        $pdo->commit();

        successResponse([
            'message' => 'Function synchronized',
            'session_id' => $sessionId
        ]);
    } catch (PDOException $e) {
        $pdo->rollBack();
        logMessage("Error syncing function: " . $e->getMessage(), 'ERROR');
        errorResponse('Failed to sync function', 500);
    }
}

/**
 * 변경사항 가져오기 (Long Polling 대체)
 */
function getChanges($data) {
    $pdo = getDbConnection();

    if (empty($data['session_token'])) {
        errorResponse('session_token is required');
    }

    $sessionToken = validateInput($data['session_token'], 'string', 64);
    $lastVersion = validateInput($data['last_version'] ?? 0, 'int');

    // 세션 확인
    $stmt = $pdo->prepare('
        SELECT s.id, s.current_function, ss.sync_version
        FROM student_sessions s
        JOIN sync_status ss ON s.id = ss.session_id
        WHERE s.session_token = :token AND s.is_active = 1
    ');
    $stmt->execute(['token' => $sessionToken]);
    $session = $stmt->fetch();

    if (!$session) {
        errorResponse('Invalid or expired session', 401);
    }

    // 버전 비교
    if ($session['sync_version'] <= $lastVersion) {
        successResponse([
            'has_changes' => false,
            'current_version' => $session['sync_version']
        ]);
        return;
    }

    // 최근 변경사항 가져오기
    $stmt = $pdo->prepare('
        SELECT function_expression, change_type, parameters, graph_data, timestamp
        FROM function_changes
        WHERE session_id = :session_id
        ORDER BY id DESC
        LIMIT 1
    ');
    $stmt->execute(['session_id' => $session['id']]);
    $change = $stmt->fetch();

    successResponse([
        'has_changes' => true,
        'current_version' => $session['sync_version'],
        'current_function' => $session['current_function'],
        'change' => $change
    ]);
}

/**
 * 답안 제출
 */
function submitAnswer($data) {
    $pdo = getDbConnection();

    if (empty($data['session_token']) || empty($data['submitted_function'])) {
        errorResponse('session_token and submitted_function are required');
    }

    $sessionToken = validateInput($data['session_token'], 'string', 64);
    $submittedFunction = validateInput($data['submitted_function'], 'string', 500);

    // 세션 확인
    $stmt = $pdo->prepare('
        SELECT s.id, s.problem_id, p.initial_function
        FROM student_sessions s
        JOIN problems p ON s.problem_id = p.id
        WHERE s.session_token = :token AND s.is_active = 1
    ');
    $stmt->execute(['token' => $sessionToken]);
    $session = $stmt->fetch();

    if (!$session) {
        errorResponse('Invalid or expired session', 401);
    }

    // 정답 검증 (간단한 버전 - 실제로는 더 복잡한 로직 필요)
    $isCorrect = false;
    $correctnessScore = 0;
    $feedback = '';

    // TODO: 실제 정답 검증 로직 구현
    // 예: 샘플 포인트에서 함수값 비교, 그래프 형태 비교 등

    try {
        $stmt = $pdo->prepare('
            INSERT INTO student_answers (
                session_id, submitted_function, is_correct, correctness_score, feedback
            ) VALUES (
                :session_id, :submitted_function, :is_correct, :score, :feedback
            )
        ');

        $stmt->execute([
            'session_id' => $session['id'],
            'submitted_function' => $submittedFunction,
            'is_correct' => $isCorrect,
            'score' => $correctnessScore,
            'feedback' => $feedback
        ]);

        logMessage("Answer submitted: SessionID={$session['id']}, Correct=$isCorrect");

        successResponse([
            'is_correct' => $isCorrect,
            'correctness_score' => $correctnessScore,
            'feedback' => $feedback ?: '답안이 제출되었습니다.'
        ]);
    } catch (PDOException $e) {
        logMessage("Error submitting answer: " . $e->getMessage(), 'ERROR');
        errorResponse('Failed to submit answer', 500);
    }
}

/**
 * 세션 종료
 */
function endSession($data) {
    $pdo = getDbConnection();

    if (empty($data['session_token'])) {
        errorResponse('session_token is required');
    }

    $sessionToken = validateInput($data['session_token'], 'string', 64);

    try {
        $stmt = $pdo->prepare('
            UPDATE student_sessions
            SET is_active = 0, completed_at = NOW()
            WHERE session_token = :token
        ');

        $stmt->execute(['token' => $sessionToken]);

        if ($stmt->rowCount() === 0) {
            errorResponse('Session not found', 404);
        }

        logMessage("Session ended: Token=$sessionToken");

        successResponse(['message' => 'Session ended successfully']);
    } catch (PDOException $e) {
        logMessage("Error ending session: " . $e->getMessage(), 'ERROR');
        errorResponse('Failed to end session', 500);
    }
}
