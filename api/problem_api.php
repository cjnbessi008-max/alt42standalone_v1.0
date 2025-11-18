<?php
/**
 * Ratio Alive - REST API 엔드포인트
 * 문제 정보 조회 및 답안 제출
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/moodle_connector.php';

// 요청 메서드에 따라 처리
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGet();
        break;
    case 'POST':
        handlePost();
        break;
    case 'PUT':
        handlePut();
        break;
    case 'DELETE':
        handleDelete();
        break;
    default:
        jsonResponse([
            'success' => false,
            'message' => 'Method not allowed'
        ], 405);
}

/**
 * GET 요청 처리 - 문제 정보 조회
 */
function handleGet() {
    // 파라미터 가져오기
    $problemId = isset($_GET['id']) ? intval($_GET['id']) : 0;
    $sessionId = isset($_GET['session']) ? sanitizeInput($_GET['session']) : '';

    // 세션 검증
    if (!empty($sessionId) && !validateSession($sessionId)) {
        jsonResponse([
            'success' => false,
            'message' => 'Invalid session'
        ], 401);
    }

    // 문제 ID가 없으면 데모 문제 반환
    if ($problemId === 0) {
        jsonResponse([
            'success' => true,
            'problem' => getDemoProblem()
        ]);
    }

    // 데이터베이스에서 문제 조회
    $conn = getDBConnection();

    try {
        // Ratio Alive 문제 테이블에서 조회
        $sql = "SELECT * FROM ratio_alive_problems WHERE id = :problem_id";
        $stmt = $conn->prepare($sql);
        $stmt->execute(['problem_id' => $problemId]);
        $problem = $stmt->fetch();

        if ($problem) {
            // Moodle 연동 정보도 가져오기
            if ($problem['moodle_question_id']) {
                $moodle = new MoodleConnector();
                $moodleQuestion = $moodle->getQuestion($problem['moodle_question_id']);

                if ($moodleQuestion) {
                    $problem['moodle_info'] = $moodleQuestion;
                }
            }

            logActivity('get_problem', getUserIdFromSession($sessionId), [
                'problem_id' => $problemId
            ]);

            jsonResponse([
                'success' => true,
                'problem' => formatProblem($problem)
            ]);
        } else {
            jsonResponse([
                'success' => false,
                'message' => '문제를 찾을 수 없습니다.'
            ], 404);
        }
    } catch (PDOException $e) {
        logError("Failed to get problem: " . $e->getMessage(), [
            'problem_id' => $problemId
        ]);

        jsonResponse([
            'success' => false,
            'message' => '문제 조회 중 오류가 발생했습니다.'
        ], 500);
    }
}

/**
 * POST 요청 처리 - 답안 제출
 */
function handlePost() {
    // JSON 데이터 파싱
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data) {
        jsonResponse([
            'success' => false,
            'message' => 'Invalid JSON data'
        ], 400);
    }

    // 필수 파라미터 검증
    $requiredFields = ['problemId', 'answer'];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            jsonResponse([
                'success' => false,
                'message' => "Missing required field: {$field}"
            ], 400);
        }
    }

    $problemId = sanitizeInput($data['problemId']);
    $sessionId = isset($data['sessionId']) ? sanitizeInput($data['sessionId']) : 'demo';
    $answer = sanitizeInput($data['answer']);
    $currentRatio = isset($data['currentRatio']) ? sanitizeInput($data['currentRatio']) : '';
    $currentShape = isset($data['currentShape']) ? sanitizeInput($data['currentShape']) : '';

    // 세션 검증
    if ($sessionId !== 'demo' && !validateSession($sessionId)) {
        jsonResponse([
            'success' => false,
            'message' => 'Invalid session'
        ], 401);
    }

    $userId = getUserIdFromSession($sessionId);

    // 답안 저장
    $conn = getDBConnection();

    try {
        // 답안 데이터베이스에 저장
        $sql = "INSERT INTO ratio_alive_answers
                (problem_id, user_id, session_id, answer, current_ratio, current_shape, submitted_at)
                VALUES (:problem_id, :user_id, :session_id, :answer, :current_ratio, :current_shape, NOW())";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            'problem_id' => $problemId,
            'user_id' => $userId,
            'session_id' => $sessionId,
            'answer' => $answer,
            'current_ratio' => $currentRatio,
            'current_shape' => $currentShape
        ]);

        $answerId = $conn->lastInsertId();

        // 답안 평가 (간단한 키워드 기반)
        $evaluation = evaluateAnswer($answer, $currentRatio);

        // 평가 결과 업데이트
        if ($evaluation['score'] !== null) {
            $sql = "UPDATE ratio_alive_answers
                    SET score = :score, feedback = :feedback
                    WHERE id = :answer_id";

            $stmt = $conn->prepare($sql);
            $stmt->execute([
                'score' => $evaluation['score'],
                'feedback' => $evaluation['feedback'],
                'answer_id' => $answerId
            ]);
        }

        // Moodle 연동 (실제 구현 필요)
        if ($problemId !== 'demo') {
            $moodle = new MoodleConnector();
            // Moodle에 성적 저장 등의 작업
        }

        logActivity('submit_answer', $userId, [
            'problem_id' => $problemId,
            'answer_id' => $answerId,
            'score' => $evaluation['score']
        ]);

        jsonResponse([
            'success' => true,
            'message' => '답안이 제출되었습니다.',
            'answer_id' => $answerId,
            'score' => $evaluation['score'],
            'feedback' => $evaluation['feedback']
        ]);
    } catch (PDOException $e) {
        logError("Failed to submit answer: " . $e->getMessage(), [
            'problem_id' => $problemId,
            'user_id' => $userId
        ]);

        jsonResponse([
            'success' => false,
            'message' => '답안 제출 중 오류가 발생했습니다.'
        ], 500);
    }
}

/**
 * PUT 요청 처리 - 문제 수정 (관리자)
 */
function handlePut() {
    jsonResponse([
        'success' => false,
        'message' => 'Not implemented yet'
    ], 501);
}

/**
 * DELETE 요청 처리 - 문제 삭제 (관리자)
 */
function handleDelete() {
    jsonResponse([
        'success' => false,
        'message' => 'Not implemented yet'
    ], 501);
}

/**
 * 데모 문제 반환
 */
function getDemoProblem() {
    return [
        'id' => 'demo',
        'title' => '비율의 불변성 이해하기',
        'topic' => '비율과 비례',
        'description' => '도형의 크기가 변해도 각 부분의 비율은 일정하게 유지됩니다. 애니메이션을 관찰하고 비율의 특성을 이해해보세요.',
        'difficulty' => '중급',
        'instructions' => '1. 도형을 선택하세요.\n2. 비율을 조정해보세요.\n3. 재생 버튼을 눌러 애니메이션을 관찰하세요.\n4. 관찰한 내용을 작성하세요.',
        'initialShape' => 'triangle',
        'initialRatio' => '3:4',
        'maxGrade' => 10
    ];
}

/**
 * 문제 데이터 포맷팅
 */
function formatProblem($problem) {
    return [
        'id' => $problem['id'],
        'title' => $problem['title'],
        'topic' => $problem['topic'],
        'description' => $problem['description'],
        'difficulty' => $problem['difficulty'],
        'instructions' => $problem['instructions'],
        'initialShape' => $problem['initial_shape'],
        'initialRatio' => $problem['initial_ratio'],
        'moodleQuestionId' => $problem['moodle_question_id'],
        'createdAt' => $problem['created_at'],
        'updatedAt' => $problem['updated_at']
    ];
}

/**
 * 답안 자동 평가
 */
function evaluateAnswer($answer, $ratio) {
    $answer = strtolower($answer);
    $score = 0;
    $feedback = '';

    // 키워드 기반 간단한 평가
    $keywords = [
        '비율' => 2,
        '일정' => 2,
        '변하지 않는' => 2,
        '유지' => 1,
        '같' => 1,
        '동일' => 1,
        '크기' => 1,
        '관찰' => 1
    ];

    foreach ($keywords as $keyword => $points) {
        if (strpos($answer, $keyword) !== false) {
            $score += $points;
        }
    }

    // 최대 점수 10점
    $score = min($score, 10);

    // 피드백 생성
    if ($score >= 8) {
        $feedback = "훌륭합니다! 비율의 불변성을 정확히 이해하셨네요. 도형의 크기가 변해도 비율은 일정하게 유지됩니다.";
    } elseif ($score >= 5) {
        $feedback = "좋습니다! 비율에 대한 이해가 있습니다. 도형이 커지거나 작아져도 각 부분의 비율은 변하지 않는다는 점을 기억하세요.";
    } elseif ($score >= 3) {
        $feedback = "관찰하셨네요! 추가로, 비율이란 두 수량의 상대적 크기 관계를 나타내며, 전체 크기가 변해도 이 관계는 유지됩니다.";
    } else {
        $feedback = "답변 감사합니다. 애니메이션을 다시 관찰하고, 도형의 크기 변화와 비율의 관계를 생각해보세요. 비율은 크기에 상관없이 일정합니다.";
    }

    return [
        'score' => $score,
        'feedback' => $feedback
    ];
}

/**
 * 문제 목록 조회 (관리자용)
 */
function getProblems($page = 1, $limit = 20) {
    $conn = getDBConnection();
    $offset = ($page - 1) * $limit;

    try {
        $sql = "SELECT * FROM ratio_alive_problems
                ORDER BY created_at DESC
                LIMIT :limit OFFSET :offset";

        $stmt = $conn->prepare($sql);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $problems = $stmt->fetchAll();

        // 전체 개수 조회
        $sql = "SELECT COUNT(*) as total FROM ratio_alive_problems";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $total = $stmt->fetch()['total'];

        return [
            'success' => true,
            'problems' => array_map('formatProblem', $problems),
            'total' => $total,
            'page' => $page,
            'limit' => $limit
        ];
    } catch (PDOException $e) {
        logError("Failed to get problems: " . $e->getMessage());

        return [
            'success' => false,
            'message' => '문제 목록 조회 중 오류가 발생했습니다.'
        ];
    }
}
