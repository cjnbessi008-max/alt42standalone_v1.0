<?php
/**
 * Submit Student Answer
 * 학생의 극값 답안을 제출하고 채점하는 API
 */

require_once 'config.php';

// OPTIONS 요청 처리
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// POST 요청만 허용
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('지원하지 않는 메서드입니다.', 405);
}

// JSON 데이터 파싱
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    sendError('잘못된 요청 데이터입니다.');
}

// 필수 필드 검증
$requiredFields = ['problemId', 'userId', 'answers'];
foreach ($requiredFields as $field) {
    if (!isset($data[$field])) {
        sendError("필수 필드가 누락되었습니다: $field");
    }
}

$problemId = intval($data['problemId']);
$userId = intval($data['userId']);
$studentAnswers = $data['answers']; // [{x: ..., y: ..., type: ...}, ...]

if ($problemId <= 0 || $userId <= 0) {
    sendError('유효하지 않은 ID입니다.');
}

if (!is_array($studentAnswers)) {
    sendError('답안 형식이 올바르지 않습니다.');
}

// 데이터베이스 연결
$db = getDBConnection();
if (!$db) {
    sendError('데이터베이스 연결 실패', 500);
}

try {
    // 문제 정보 가져오기
    $stmt = $db->prepare("
        SELECT
            function_expression,
            x_min,
            x_max,
            correct_extrema
        FROM " . MOODLE_PREFIX . "math_extrema_problems
        WHERE id = :id AND active = 1
    ");

    $stmt->execute(['id' => $problemId]);
    $problem = $stmt->fetch();

    if (!$problem) {
        sendError('문제를 찾을 수 없습니다.', 404);
    }

    // 정답 극값 (JSON으로 저장되어 있다고 가정)
    $correctExtrema = json_decode($problem['correct_extrema'], true);

    // 답안 채점
    $score = gradeAnswer($studentAnswers, $correctExtrema);

    // 제출 기록 저장
    $stmt = $db->prepare("
        INSERT INTO " . MOODLE_PREFIX . "math_extrema_submissions
        (problem_id, user_id, student_answers, score, submitted_at)
        VALUES
        (:problem_id, :user_id, :answers, :score, NOW())
    ");

    $stmt->execute([
        'problem_id' => $problemId,
        'user_id' => $userId,
        'answers' => json_encode($studentAnswers),
        'score' => $score
    ]);

    // 결과 반환
    sendSuccess([
        'submissionId' => $db->lastInsertId(),
        'score' => $score,
        'maxScore' => 100,
        'correct' => $score >= 90,
        'feedback' => generateFeedback($score, $correctExtrema, $studentAnswers)
    ]);

} catch (PDOException $e) {
    error_log("답안 제출 오류: " . $e->getMessage());
    sendError('답안을 제출할 수 없습니다.', 500);
}

/**
 * 답안 채점 함수
 * @param array $studentAnswers - 학생 답안
 * @param array $correctAnswers - 정답
 * @return float - 점수 (0-100)
 */
function gradeAnswer($studentAnswers, $correctAnswers) {
    if (empty($correctAnswers)) {
        return 100; // 정답이 없으면 만점 (문제 설정 오류)
    }

    $tolerance = 0.1; // 허용 오차
    $correctCount = 0;
    $totalCorrect = count($correctAnswers);

    foreach ($correctAnswers as $correct) {
        foreach ($studentAnswers as $student) {
            // 좌표가 허용 오차 내에 있는지 확인
            $xMatch = abs($student['x'] - $correct['x']) < $tolerance;
            $yMatch = abs($student['y'] - $correct['y']) < $tolerance;
            $typeMatch = $student['type'] === $correct['type'];

            if ($xMatch && $yMatch && $typeMatch) {
                $correctCount++;
                break; // 다음 정답으로
            }
        }
    }

    // 점수 계산
    $score = ($correctCount / $totalCorrect) * 100;

    // 오답 페널티 (정답보다 많이 제출한 경우)
    $extraAnswers = count($studentAnswers) - $totalCorrect;
    if ($extraAnswers > 0) {
        $penalty = $extraAnswers * 5; // 오답 하나당 -5점
        $score = max(0, $score - $penalty);
    }

    return round($score, 2);
}

/**
 * 피드백 생성
 * @param float $score - 점수
 * @param array $correctAnswers - 정답
 * @param array $studentAnswers - 학생 답안
 * @return string - 피드백 메시지
 */
function generateFeedback($score, $correctAnswers, $studentAnswers) {
    $totalCorrect = count($correctAnswers);
    $totalStudent = count($studentAnswers);

    if ($score >= 95) {
        return "완벽합니다! 모든 극값을 정확하게 찾았습니다.";
    } elseif ($score >= 70) {
        return "잘했습니다! 대부분의 극값을 찾았습니다. 조금만 더 정확하게 계산해보세요.";
    } elseif ($score >= 40) {
        return "일부 극값을 찾았습니다. 도함수가 0이 되는 모든 점을 찾아보세요.";
    } else {
        return "극값을 찾는 방법을 다시 복습해보세요. f'(x) = 0인 점을 찾고, f''(x)로 극대/극소를 판별합니다.";
    }
}
?>
