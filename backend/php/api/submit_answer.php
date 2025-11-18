<?php
/**
 * Next Term Vision - 답안 제출 API
 * POST /api/submit_answer.php
 *
 * Request Body (JSON):
 * {
 *   "student_id": 123,
 *   "problem_id": 5,
 *   "answer": 12,
 *   "time_spent": 30
 * }
 */

require_once 'config.php';

try {
    // POST 데이터 받기
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        sendJsonResponse(false, null, 'Invalid JSON input', 400);
    }

    // 필수 파라미터 검증
    validateRequired($input, ['student_id', 'problem_id', 'answer']);

    $student_id = intval($input['student_id']);
    $problem_id = intval($input['problem_id']);
    $answer = intval($input['answer']);
    $time_spent = isset($input['time_spent']) ? intval($input['time_spent']) : null;

    $pdo = getDbConnection();

    // 문제 정보 조회
    $stmt = $pdo->prepare("
        SELECT id, correct_answer, difficulty_level, problem_type
        FROM nextterm_problems
        WHERE id = :problem_id AND is_active = 1
    ");
    $stmt->execute(['problem_id' => $problem_id]);
    $problem = $stmt->fetch();

    if (!$problem) {
        sendJsonResponse(false, null, 'Problem not found', 404);
    }

    // 정답 확인
    $is_correct = ($answer == $problem['correct_answer']);

    // 시도 횟수 계산
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as attempts
        FROM nextterm_responses
        WHERE student_id = :student_id AND problem_id = :problem_id
    ");
    $stmt->execute([
        'student_id' => $student_id,
        'problem_id' => $problem_id
    ]);
    $attempt_count = $stmt->fetch()['attempts'] + 1;

    // 답안 저장
    $stmt = $pdo->prepare("
        INSERT INTO nextterm_responses
        (problem_id, student_id, student_answer, is_correct, attempt_number, time_spent_seconds)
        VALUES (:problem_id, :student_id, :answer, :is_correct, :attempt_number, :time_spent)
    ");

    $stmt->execute([
        'problem_id' => $problem_id,
        'student_id' => $student_id,
        'answer' => $answer,
        'is_correct' => $is_correct ? 1 : 0,
        'attempt_number' => $attempt_count,
        'time_spent' => $time_spent
    ]);

    // 진행 상황 업데이트
    $stmt = $pdo->prepare("
        SELECT * FROM nextterm_progress WHERE student_id = :student_id
    ");
    $stmt->execute(['student_id' => $student_id]);
    $progress = $stmt->fetch();

    if ($progress) {
        $new_total = $progress['total_problems'] + 1;
        $new_correct = $progress['correct_answers'] + ($is_correct ? 1 : 0);
        $new_time = $progress['total_time_seconds'] + ($time_spent ?? 0);

        // 정확도에 따라 레벨 조정
        $accuracy = $new_total > 0 ? ($new_correct / $new_total) : 0;
        $current_level = $progress['current_level'];

        // 레벨업 조건: 정확도 80% 이상, 최소 5문제 이상
        if ($accuracy >= 0.8 && $new_total >= 5 && $current_level < 5) {
            $current_level++;
        }
        // 레벨다운 조건: 정확도 40% 미만, 최소 5문제 이상
        else if ($accuracy < 0.4 && $new_total >= 5 && $current_level > 1) {
            $current_level--;
        }

        $stmt = $pdo->prepare("
            UPDATE nextterm_progress
            SET total_problems = :total,
                correct_answers = :correct,
                total_time_seconds = :time,
                current_level = :level,
                updated_at = NOW()
            WHERE student_id = :student_id
        ");

        $stmt->execute([
            'total' => $new_total,
            'correct' => $new_correct,
            'time' => $new_time,
            'level' => $current_level,
            'student_id' => $student_id
        ]);
    }

    // 피드백 메시지 생성
    $feedback = [
        'is_correct' => $is_correct,
        'correct_answer' => $problem['correct_answer'],
        'student_answer' => $answer,
        'attempt_number' => $attempt_count
    ];

    if ($is_correct) {
        $feedback['message'] = '정답입니다! 🎉';
        if ($attempt_count === 1) {
            $feedback['message'] .= ' 한 번에 맞추셨네요!';
        }
    } else {
        $feedback['message'] = '아쉽게도 틀렸습니다. 다시 한번 생각해보세요!';
        if ($attempt_count < 3) {
            $feedback['message'] .= ' 힌트를 확인해보세요.';
        }
    }

    // 통계 정보
    $stmt = $pdo->prepare("
        SELECT * FROM nextterm_progress WHERE student_id = :student_id
    ");
    $stmt->execute(['student_id' => $student_id]);
    $updated_progress = $stmt->fetch();

    $stats = [
        'total_problems' => intval($updated_progress['total_problems']),
        'correct_answers' => intval($updated_progress['correct_answers']),
        'accuracy' => $updated_progress['total_problems'] > 0
            ? round(($updated_progress['correct_answers'] / $updated_progress['total_problems']) * 100, 2)
            : 0,
        'current_level' => intval($updated_progress['current_level']),
        'avg_time' => $updated_progress['total_problems'] > 0
            ? round($updated_progress['total_time_seconds'] / $updated_progress['total_problems'], 1)
            : 0
    ];

    sendJsonResponse(true, [
        'feedback' => $feedback,
        'stats' => $stats
    ], 'Answer submitted successfully');

} catch (Exception $e) {
    error_log("Error in submit_answer.php: " . $e->getMessage());
    sendJsonResponse(false, null, 'Internal server error', 500);
}
