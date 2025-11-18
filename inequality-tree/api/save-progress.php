<?php
/**
 * Save Student Progress API
 * 학생 진행상황 저장 API
 */

require_once 'config.php';

// HTTP 메서드 확인
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed. Use POST.', 405);
}

try {
    $db = getDbConnection();
    $data = getPostData();

    // 필수 파라미터 검증
    $requiredFields = ['moodle_user_id', 'problem_id', 'user_answer'];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            errorResponse("Missing required field: {$field}", 400);
        }
    }

    $moodleUserId = (int)$data['moodle_user_id'];
    $problemId = (int)$data['problem_id'];
    $userAnswer = $data['user_answer'];
    $timeSpent = isset($data['time_spent_seconds']) ? (int)$data['time_spent_seconds'] : 0;
    $treeInteractions = isset($data['tree_interactions']) ? json_encode($data['tree_interactions']) : null;

    // 문제 정보 가져오기 (정답 확인용)
    $problemStmt = $db->prepare("
        SELECT id, correct_answer FROM inequality_problems WHERE id = :id
    ");
    $problemStmt->execute(['id' => $problemId]);
    $problem = $problemStmt->fetch();

    if (!$problem) {
        errorResponse('Problem not found', 404);
    }

    // 정답 체크
    $correctAnswer = trim($problem['correct_answer']);
    $userAnswerTrimmed = trim($userAnswer);
    $isCorrect = (strtolower($correctAnswer) === strtolower($userAnswerTrimmed));

    // 이전 시도 횟수 확인
    $attemptStmt = $db->prepare("
        SELECT COALESCE(MAX(attempt_number), 0) as max_attempt
        FROM student_progress
        WHERE moodle_user_id = :user_id AND problem_id = :problem_id
    ");
    $attemptStmt->execute([
        'user_id' => $moodleUserId,
        'problem_id' => $problemId
    ]);
    $attemptData = $attemptStmt->fetch();
    $attemptNumber = $attemptData['max_attempt'] + 1;

    // 진행상황 저장
    $insertStmt = $db->prepare("
        INSERT INTO student_progress
        (moodle_user_id, problem_id, attempt_number, user_answer, is_correct,
         time_spent_seconds, tree_interactions, completed_at)
        VALUES
        (:user_id, :problem_id, :attempt_number, :user_answer, :is_correct,
         :time_spent, :tree_interactions, :completed_at)
    ");

    $completedAt = $isCorrect ? date('Y-m-d H:i:s') : null;

    $insertStmt->execute([
        'user_id' => $moodleUserId,
        'problem_id' => $problemId,
        'attempt_number' => $attemptNumber,
        'user_answer' => $userAnswerTrimmed,
        'is_correct' => $isCorrect ? 1 : 0,
        'time_spent' => $timeSpent,
        'tree_interactions' => $treeInteractions,
        'completed_at' => $completedAt
    ]);

    $progressId = $db->lastInsertId();

    // 응답 데이터
    $response = [
        'progress_id' => (int)$progressId,
        'is_correct' => $isCorrect,
        'attempt_number' => $attemptNumber,
        'correct_answer' => $correctAnswer,
        'feedback' => $isCorrect ? '정답입니다!' : '다시 시도해보세요.'
    ];

    if (!$isCorrect) {
        $response['hint'] = '부등식의 각 단계를 천천히 확인해보세요.';
    }

    successResponse($response, 'Progress saved successfully');

} catch (PDOException $e) {
    errorResponse('Database error', 500, $e->getMessage());
} catch (Exception $e) {
    errorResponse('Server error', 500, $e->getMessage());
}
