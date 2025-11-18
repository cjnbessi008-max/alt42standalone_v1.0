<?php
/**
 * Prime Fireworks API - 답안 제출
 * POST /api/submit.php
 * Body: { user_id, problem_id, answer[], time_spent }
 *
 * @author Prime Fireworks Team
 * @version 1.0.0
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/PrimeFactorizer.php';
require_once __DIR__ . '/../moodle-integration/MoodleClient.php';

// 메서드 검증
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendErrorResponse('Method not allowed', 405);
}

// 데이터베이스 연결
$db = getDbConnection();
if (!$db) {
    sendErrorResponse('Database connection failed', 500);
}

// JSON 입력 파싱
$input = getJsonInput();
if (!$input) {
    sendErrorResponse('Invalid JSON input', 400);
}

// 필수 파라미터 검증
$requiredParams = ['user_id', 'problem_id', 'answer'];
if (!validateRequiredParams($input, $requiredParams)) {
    sendErrorResponse('Missing required parameters', 400);
}

$userId = intval($input['user_id']);
$problemId = intval($input['problem_id']);
$answer = $input['answer'];
$timeSpent = isset($input['time_spent']) ? intval($input['time_spent']) : 0;

// 답안이 배열인지 확인
if (!is_array($answer)) {
    sendErrorResponse('Answer must be an array of numbers', 400);
}

// 답안을 정수 배열로 변환
$answer = array_map('intval', $answer);

try {
    // 1. 문제 조회
    $stmt = $db->prepare("SELECT * FROM prime_problems WHERE id = ? AND is_active = TRUE");
    $stmt->bind_param('i', $problemId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        sendErrorResponse('Problem not found', 404);
    }

    $problem = $result->fetch_assoc();
    $number = intval($problem['number_to_factor']);
    $stmt->close();

    // 2. 답안 검증
    $validation = PrimeFactorizer::validateAnswer($number, $answer);

    // 3. 점수 계산
    $score = 0;
    if ($validation['is_correct']) {
        $score = 100; // 정답이면 100점

        // 시간 보너스 (빠르게 풀면 추가 점수)
        $timeLimit = intval($problem['time_limit_seconds']);
        if ($timeSpent < $timeLimit * 0.5) {
            $score += 10; // 시간의 절반 이내 완료 시 +10점
        }
    } else {
        // 부분 점수 계산
        $correctCount = count(array_intersect($answer, $validation['correct_answer']));
        $totalCount = count($validation['correct_answer']);
        $score = ($correctCount / $totalCount) * 50; // 최대 50점
    }

    // 4. 진도 저장
    $stmt = $db->prepare("
        INSERT INTO student_progress
        (moodle_user_id, problem_id, submitted_answer, is_correct, attempts, time_spent_seconds, score, fireworks_triggered)
        VALUES (?, ?, ?, ?, 1, ?, ?, ?)
    ");

    $submittedAnswerJson = json_encode($answer);
    $isCorrect = $validation['is_correct'] ? 1 : 0;
    $fireworksTriggered = $validation['is_correct'] ? 1 : 0;

    $stmt->bind_param(
        'iisiddi',
        $userId,
        $problemId,
        $submittedAnswerJson,
        $isCorrect,
        $timeSpent,
        $score,
        $fireworksTriggered
    );

    if (!$stmt->execute()) {
        throw new Exception('Failed to save progress: ' . $stmt->error);
    }

    $progressId = $stmt->insert_id;
    $stmt->close();

    // 5. 폭죽 데이터 생성 (정답인 경우)
    $fireworksData = null;
    if ($validation['is_correct']) {
        $fireworksData = PrimeFactorizer::generateFireworksData($number);

        // 폭죽 로그 저장
        $stmt = $db->prepare("
            INSERT INTO fireworks_log
            (progress_id, number, prime_factors, animation_data, duration_ms)
            VALUES (?, ?, ?, ?, ?)
        ");

        $primeFactorsJson = json_encode($validation['correct_answer']);
        $animationDataJson = json_encode($fireworksData);
        $durationMs = $fireworksData['total_duration_ms'];

        $stmt->bind_param(
            'iissi',
            $progressId,
            $number,
            $primeFactorsJson,
            $animationDataJson,
            $durationMs
        );

        $stmt->execute();
        $stmt->close();
    }

    // 6. 응답 데이터 구성
    $responseData = [
        'is_correct' => $validation['is_correct'],
        'score' => round($score, 2),
        'submitted_answer' => $answer,
        'correct_answer' => $validation['correct_answer'],
        'feedback' => $validation['feedback'],
        'fireworks_data' => $fireworksData,
        'time_spent' => $timeSpent
    ];

    // 7. Moodle에 결과 전송 (선택적)
    $moodleClient = MoodleHelper::createClient($db);
    if ($moodleClient && isset($problem['moodle_question_id'])) {
        // Moodle 퀴즈 시스템에 결과 기록
        $moodleClient->logUserActivity($userId, 'prime_fireworks_submit', [
            'problem_id' => $problemId,
            'is_correct' => $validation['is_correct'],
            'score' => $score
        ]);
    }

    // 8. 로그 기록
    $status = $validation['is_correct'] ? 'CORRECT' : 'INCORRECT';
    logMessage("User $userId submitted answer for problem $problemId: $status (Score: $score)", 'INFO');

    // 9. 성공 응답
    sendSuccessResponse($responseData);

} catch (Exception $e) {
    logMessage('Error in submit.php: ' . $e->getMessage(), 'ERROR');
    sendErrorResponse('An error occurred while submitting answer', 500);
}

$db->close();
