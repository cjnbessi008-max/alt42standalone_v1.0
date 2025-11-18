<?php
/**
 * Moodle Connector API
 * Moodle LMS와 Ratio Spring 앱을 연결하는 API
 */

require_once 'config.php';

// CORS 헤더 설정
setCORSHeaders();

// 요청 메서드 가져오기
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

/**
 * GET 요청 처리
 */
if ($method === 'GET') {
    switch ($action) {
        case 'get_problem':
            getProblem();
            break;

        case 'get_problems':
            getProblems();
            break;

        case 'health':
            sendJSON(['status' => 'ok', 'timestamp' => time()]);
            break;

        default:
            sendError('Invalid action', 400);
    }
}

/**
 * POST 요청 처리
 */
elseif ($method === 'POST') {
    switch ($action) {
        case 'submit_answer':
            submitAnswer();
            break;

        case 'create_problem':
            createProblem();
            break;

        default:
            sendError('Invalid action', 400);
    }
}

/**
 * 지원하지 않는 메서드
 */
else {
    sendError('Method not allowed', 405);
}

/**
 * 단일 문제 가져오기
 */
function getProblem() {
    $problemId = $_GET['id'] ?? null;

    if (!$problemId) {
        sendError('Problem ID is required');
    }

    try {
        $pdo = getDBConnection();
        $stmt = $pdo->prepare("
            SELECT * FROM ratio_problems
            WHERE id = :id AND is_active = 1
        ");
        $stmt->execute(['id' => $problemId]);
        $problem = $stmt->fetch();

        if (!$problem) {
            sendError('Problem not found', 404);
        }

        // JSON 필드 파싱
        if (!empty($problem['hints'])) {
            $problem['hints'] = json_decode($problem['hints'], true);
        }
        if (!empty($problem['metadata'])) {
            $problem['metadata'] = json_decode($problem['metadata'], true);
        }

        sendJSON($problem);
    } catch (Exception $e) {
        error_log("Error in getProblem: " . $e->getMessage());
        sendError('Failed to fetch problem', 500);
    }
}

/**
 * 문제 목록 가져오기
 */
function getProblems() {
    $activityId = $_GET['activity_id'] ?? null;
    $limit = intval($_GET['limit'] ?? 10);
    $offset = intval($_GET['offset'] ?? 0);

    try {
        $pdo = getDBConnection();

        $sql = "
            SELECT * FROM ratio_problems
            WHERE is_active = 1
        ";

        $params = [];

        if ($activityId) {
            $sql .= " AND activity_id = :activity_id";
            $params['activity_id'] = $activityId;
        }

        $sql .= " ORDER BY created_at DESC LIMIT :limit OFFSET :offset";

        $stmt = $pdo->prepare($sql);

        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue('offset', $offset, PDO::PARAM_INT);

        $stmt->execute();
        $problems = $stmt->fetchAll();

        // JSON 필드 파싱
        foreach ($problems as &$problem) {
            if (!empty($problem['hints'])) {
                $problem['hints'] = json_decode($problem['hints'], true);
            }
            if (!empty($problem['metadata'])) {
                $problem['metadata'] = json_decode($problem['metadata'], true);
            }
        }

        sendJSON(['problems' => $problems, 'count' => count($problems)]);
    } catch (Exception $e) {
        error_log("Error in getProblems: " . $e->getMessage());
        sendError('Failed to fetch problems', 500);
    }
}

/**
 * 학생 답변 제출
 */
function submitAnswer() {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        sendError('Invalid JSON input');
    }

    // 입력 검증
    $errors = validateInput($input, [
        'problem_id' => ['required' => true, 'type' => 'int'],
        'answer' => ['required' => true]
    ]);

    if (!empty($errors)) {
        sendError(implode(', ', $errors));
    }

    try {
        $pdo = getDBConnection();

        // 문제 정보 가져오기
        $stmt = $pdo->prepare("SELECT * FROM ratio_problems WHERE id = :id");
        $stmt->execute(['id' => $input['problem_id']]);
        $problem = $stmt->fetch();

        if (!$problem) {
            sendError('Problem not found', 404);
        }

        // 답변 검증 (간단한 예시)
        $isCorrect = checkAnswer($input['answer'], $problem);

        // 답변 저장
        $stmt = $pdo->prepare("
            INSERT INTO student_answers
            (problem_id, user_id, answer, is_correct, submitted_at)
            VALUES (:problem_id, :user_id, :answer, :is_correct, NOW())
        ");

        $stmt->execute([
            'problem_id' => $input['problem_id'],
            'user_id' => $input['user_id'] ?? 0, // 실제로는 세션에서 가져와야 함
            'answer' => json_encode($input['answer']),
            'is_correct' => $isCorrect
        ]);

        sendSuccess('Answer submitted', [
            'is_correct' => $isCorrect,
            'answer_id' => $pdo->lastInsertId()
        ]);
    } catch (Exception $e) {
        error_log("Error in submitAnswer: " . $e->getMessage());
        sendError('Failed to submit answer', 500);
    }
}

/**
 * 새 문제 생성 (관리자용)
 */
function createProblem() {
    // 토큰 검증
    $token = getAuthToken();
    if (!validateToken($token)) {
        sendError('Unauthorized', 401);
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        sendError('Invalid JSON input');
    }

    // 입력 검증
    $errors = validateInput($input, [
        'ratio_a' => ['required' => true, 'type' => 'int', 'min' => 1, 'max' => 10],
        'ratio_b' => ['required' => true, 'type' => 'int', 'min' => 1, 'max' => 10],
        'question' => ['required' => true, 'type' => 'string']
    ]);

    if (!empty($errors)) {
        sendError(implode(', ', $errors));
    }

    try {
        $pdo = getDBConnection();

        $stmt = $pdo->prepare("
            INSERT INTO ratio_problems
            (ratio_a, ratio_b, question, description, difficulty, hints, metadata, created_at)
            VALUES
            (:ratio_a, :ratio_b, :question, :description, :difficulty, :hints, :metadata, NOW())
        ");

        $stmt->execute([
            'ratio_a' => $input['ratio_a'],
            'ratio_b' => $input['ratio_b'],
            'question' => $input['question'],
            'description' => $input['description'] ?? '',
            'difficulty' => $input['difficulty'] ?? 'medium',
            'hints' => json_encode($input['hints'] ?? []),
            'metadata' => json_encode($input['metadata'] ?? [])
        ]);

        $problemId = $pdo->lastInsertId();

        sendSuccess('Problem created', ['id' => $problemId]);
    } catch (Exception $e) {
        error_log("Error in createProblem: " . $e->getMessage());
        sendError('Failed to create problem', 500);
    }
}

/**
 * 답변 정확도 검증
 */
function checkAnswer($answer, $problem) {
    // 간단한 검증 로직
    // 실제로는 더 정교한 검증이 필요할 수 있음

    if (is_array($answer)) {
        $answerA = $answer['a'] ?? 0;
        $answerB = $answer['b'] ?? 0;

        // 비율이 동일한지 확인
        return ($answerA == $problem['ratio_a'] && $answerB == $problem['ratio_b']);
    }

    return false;
}

/**
 * Moodle Web Service 호출 (선택사항)
 */
function callMoodleWebService($function, $params) {
    $url = MOODLE_URL . '/webservice/rest/server.php';

    $params['wstoken'] = MOODLE_TOKEN;
    $params['wsfunction'] = $function;
    $params['moodlewsrestformat'] = 'json';

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    curl_close($ch);

    if ($httpCode === 200) {
        return json_decode($response, true);
    }

    return null;
}
