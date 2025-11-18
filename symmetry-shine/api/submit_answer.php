<?php
/**
 * 답안 제출 및 Moodle LMS에 결과 전송
 */

require_once 'config.php';

try {
    // POST 데이터 받기
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data) {
        errorResponse('잘못된 요청 데이터');
    }

    $problemId = $data['problem_id'] ?? null;
    $userAnswer = $data['answer'] ?? null;
    $isCorrect = $data['is_correct'] ?? false;
    $userId = $data['user_id'] ?? null;
    $courseId = $data['course_id'] ?? null;

    if (!$problemId || $userAnswer === null) {
        errorResponse('필수 데이터가 누락되었습니다');
    }

    $db = Database::getInstance()->getConnection();

    // 답안 저장
    $stmt = $db->prepare(
        "INSERT INTO user_answers
         (user_id, problem_id, course_id, answer, is_correct, submitted_at)
         VALUES (:user_id, :problem_id, :course_id, :answer, :is_correct, NOW())"
    );

    $stmt->execute([
        'user_id' => $userId,
        'problem_id' => $problemId,
        'course_id' => $courseId,
        'answer' => $userAnswer,
        'is_correct' => $isCorrect ? 1 : 0
    ]);

    $answerId = $db->lastInsertId();

    // 사용자 활동 업데이트
    if ($userId && $problemId) {
        $updateStmt = $db->prepare(
            "UPDATE user_problem_attempts
             SET completed_at = NOW(),
                 status = :status,
                 is_correct = :is_correct
             WHERE user_id = :user_id
             AND problem_id = :problem_id
             AND status = 'started'
             ORDER BY started_at DESC
             LIMIT 1"
        );

        $updateStmt->execute([
            'status' => $isCorrect ? 'completed' : 'failed',
            'is_correct' => $isCorrect ? 1 : 0,
            'user_id' => $userId,
            'problem_id' => $problemId
        ]);
    }

    // Moodle 성적 업데이트 (선택사항)
    if ($userId && $courseId && MOODLE_TOKEN !== 'your_moodle_webservice_token') {
        try {
            $moodle = new MoodleAPI();

            // Moodle 성적 업데이트 API 호출
            $gradeResult = $moodle->call('core_grades_update_grades', [
                'source' => 'symmetry_shine',
                'courseid' => $courseId,
                'component' => 'mod_quiz',
                'activityid' => $problemId,
                'itemnumber' => 0,
                'grades' => [
                    [
                        'studentid' => $userId,
                        'grade' => $isCorrect ? 100 : 0
                    ]
                ]
            ]);
        } catch (Exception $e) {
            // Moodle 연동 실패는 무시 (로그만 기록)
            error_log("Moodle grade update failed: " . $e->getMessage());
        }
    }

    // 통계 업데이트
    $statsStmt = $db->prepare(
        "INSERT INTO problem_statistics (problem_id, total_attempts, correct_attempts)
         VALUES (:problem_id, 1, :correct)
         ON DUPLICATE KEY UPDATE
         total_attempts = total_attempts + 1,
         correct_attempts = correct_attempts + :correct"
    );

    $statsStmt->execute([
        'problem_id' => $problemId,
        'correct' => $isCorrect ? 1 : 0
    ]);

    // 로그 기록
    logActivity('submit_answer', [
        'answer_id' => $answerId,
        'problem_id' => $problemId,
        'user_id' => $userId,
        'is_correct' => $isCorrect
    ]);

    // 응답
    jsonResponse([
        'success' => true,
        'answer_id' => $answerId,
        'is_correct' => $isCorrect,
        'message' => $isCorrect ? '정답입니다!' : '다시 시도해보세요.',
        'timestamp' => date('Y-m-d H:i:s')
    ]);

} catch (Exception $e) {
    error_log("Error in submit_answer.php: " . $e->getMessage());
    errorResponse($e->getMessage(), 500);
}
?>
