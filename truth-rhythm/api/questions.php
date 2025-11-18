<?php
/**
 * Truth Rhythm - Questions API
 * RESTful API for question management
 */

require_once 'config.php';
require_once 'moodle-connector.php';

setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$requestData = getRequestData();
$pdo = getDbConnection();

/**
 * GET - 문제 조회
 */
if ($method === 'GET') {
    // 특정 문제 조회
    if (isset($_GET['id'])) {
        $questionId = (int)$_GET['id'];

        $stmt = $pdo->prepare("
            SELECT * FROM questions
            WHERE id = ? AND is_active = 1
        ");
        $stmt->execute([$questionId]);
        $question = $stmt->fetch();

        if ($question) {
            // 불리언 값 변환
            $question['correct_answer'] = (bool)$question['correct_answer'];
            $question['is_active'] = (bool)$question['is_active'];
            successResponse($question);
        } else {
            errorResponse('Question not found', 404);
        }
    }
    // 랜덤 문제 조회
    elseif (isset($_GET['random'])) {
        $difficulty = $_GET['difficulty'] ?? null;
        $category = $_GET['category'] ?? null;

        $sql = "SELECT * FROM questions WHERE is_active = 1";
        $params = [];

        if ($difficulty) {
            $sql .= " AND difficulty_level = ?";
            $params[] = $difficulty;
        }

        if ($category) {
            $sql .= " AND category = ?";
            $params[] = $category;
        }

        $sql .= " ORDER BY RAND() LIMIT 1";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $question = $stmt->fetch();

        if ($question) {
            $question['correct_answer'] = (bool)$question['correct_answer'];
            $question['is_active'] = (bool)$question['is_active'];
            successResponse($question);
        } else {
            errorResponse('No questions available', 404);
        }
    }
    // 문제 목록 조회
    else {
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $offset = ($page - 1) * $limit;

        $difficulty = $_GET['difficulty'] ?? null;
        $category = $_GET['category'] ?? null;

        $sql = "SELECT * FROM questions WHERE is_active = 1";
        $countSql = "SELECT COUNT(*) as total FROM questions WHERE is_active = 1";
        $params = [];

        if ($difficulty) {
            $sql .= " AND difficulty_level = ?";
            $countSql .= " AND difficulty_level = ?";
            $params[] = $difficulty;
        }

        if ($category) {
            $sql .= " AND category = ?";
            $countSql .= " AND category = ?";
            $params[] = $category;
        }

        $sql .= " ORDER BY created_at DESC LIMIT ? OFFSET ?";

        // Get total count
        $stmt = $pdo->prepare($countSql);
        $stmt->execute($params);
        $total = $stmt->fetch()['total'];

        // Get questions
        $params[] = $limit;
        $params[] = $offset;
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $questions = $stmt->fetchAll();

        // Convert boolean values
        foreach ($questions as &$question) {
            $question['correct_answer'] = (bool)$question['correct_answer'];
            $question['is_active'] = (bool)$question['is_active'];
        }

        successResponse([
            'questions' => $questions,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'pages' => ceil($total / $limit)
            ]
        ]);
    }
}

/**
 * POST - 답안 제출
 */
elseif ($method === 'POST') {
    requireLogin();

    validateParams($requestData, ['question_id', 'user_answer']);

    $questionId = (int)$requestData['question_id'];
    $userAnswer = (bool)$requestData['user_answer'];
    $responseTime = isset($requestData['response_time']) ? (int)$requestData['response_time'] : null;
    $sessionId = isset($requestData['session_id']) ? (int)$requestData['session_id'] : null;
    $userId = getCurrentUserId();

    // 문제 조회
    $stmt = $pdo->prepare("SELECT * FROM questions WHERE id = ? AND is_active = 1");
    $stmt->execute([$questionId]);
    $question = $stmt->fetch();

    if (!$question) {
        errorResponse('Question not found', 404);
    }

    $correctAnswer = (bool)$question['correct_answer'];
    $isCorrect = ($userAnswer === $correctAnswer);

    // 세션 생성 또는 가져오기
    if (!$sessionId) {
        $stmt = $pdo->prepare("
            INSERT INTO learning_sessions (user_id, total_questions, correct_answers)
            VALUES (?, 0, 0)
        ");
        $stmt->execute([$userId]);
        $sessionId = $pdo->lastInsertId();
    }

    // 사운드 파일 결정
    $soundPlayed = $isCorrect ? $question['sound_true'] : $question['sound_false'];

    // 답안 기록 저장
    $stmt = $pdo->prepare("
        INSERT INTO answer_records (
            session_id, user_id, question_id, user_answer,
            is_correct, response_time_ms, sound_played
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $sessionId,
        $userId,
        $questionId,
        $userAnswer,
        $isCorrect,
        $responseTime,
        $soundPlayed
    ]);

    // 세션 업데이트
    $stmt = $pdo->prepare("
        UPDATE learning_sessions
        SET total_questions = total_questions + 1,
            correct_answers = correct_answers + ?
        WHERE id = ?
    ");
    $stmt->execute([$isCorrect ? 1 : 0, $sessionId]);

    // 사용자 진도 업데이트 (저장 프로시저 사용)
    $stmt = $pdo->prepare("CALL update_user_progress(?, ?)");
    $stmt->execute([$userId, $isCorrect]);

    successResponse([
        'is_correct' => $isCorrect,
        'correct_answer' => $correctAnswer,
        'explanation' => $question['explanation'],
        'sound_file' => $soundPlayed,
        'session_id' => $sessionId
    ], $isCorrect ? '정답입니다!' : '다시 생각해보세요!');
}

/**
 * PUT - 문제 업데이트 (관리자용)
 */
elseif ($method === 'PUT') {
    requireLogin();

    validateParams($requestData, ['id']);

    $questionId = (int)$requestData['id'];

    $updateFields = [];
    $params = [];

    $allowedFields = [
        'question_text',
        'correct_answer',
        'difficulty_level',
        'category',
        'explanation',
        'sound_true',
        'sound_false',
        'is_active'
    ];

    foreach ($allowedFields as $field) {
        if (isset($requestData[$field])) {
            $updateFields[] = "{$field} = ?";
            $params[] = $requestData[$field];
        }
    }

    if (empty($updateFields)) {
        errorResponse('No fields to update', 400);
    }

    $params[] = $questionId;

    $sql = "UPDATE questions SET " . implode(', ', $updateFields) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    if ($stmt->rowCount() > 0) {
        successResponse(['id' => $questionId], 'Question updated successfully');
    } else {
        errorResponse('Question not found or no changes made', 404);
    }
}

/**
 * DELETE - 문제 삭제 (비활성화)
 */
elseif ($method === 'DELETE') {
    requireLogin();

    $questionId = isset($_GET['id']) ? (int)$_GET['id'] : null;

    if (!$questionId) {
        errorResponse('Question ID required', 400);
    }

    // 실제 삭제 대신 비활성화
    $stmt = $pdo->prepare("UPDATE questions SET is_active = 0 WHERE id = ?");
    $stmt->execute([$questionId]);

    if ($stmt->rowCount() > 0) {
        successResponse(['id' => $questionId], 'Question deleted successfully');
    } else {
        errorResponse('Question not found', 404);
    }
}

/**
 * Unsupported method
 */
else {
    errorResponse('Method not allowed', 405);
}
