<?php
/**
 * Submit Answer API Endpoint
 *
 * 학생의 답안을 제출하고 검증
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// OPTIONS 요청 처리 (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/moodle-connector.php';

try {
    $db = Database::getInstance();
    $requestMethod = $_SERVER['REQUEST_METHOD'];

    if ($requestMethod !== 'POST') {
        throw new Exception('Invalid request method. Use POST.');
    }

    // POST 데이터 파싱
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        throw new Exception('Invalid JSON input');
    }

    // 필수 파라미터 검증
    $sessionId = $input['session_id'] ?? null;
    $submittedFormula = $input['formula'] ?? null;
    $timeTaken = $input['time_taken'] ?? 0;

    if (!$sessionId || !$submittedFormula) {
        throw new Exception('Missing required parameters: session_id, formula');
    }

    // 세션 정보 조회
    $session = $db->querySingle(
        "SELECT s.*, p.correct_formula, p.max_attempts, p.moodle_question_id
         FROM sessions s
         JOIN problems p ON s.problem_id = p.id
         WHERE s.id = ? AND s.status = 'in_progress'",
        [$sessionId]
    );

    if (!$session) {
        throw new Exception('Session not found or already completed', 404);
    }

    // 이미 시도한 횟수 확인
    $attemptCount = $db->querySingle(
        "SELECT COUNT(*) as count FROM attempts WHERE session_id = ?",
        [$sessionId]
    );

    $currentAttempt = intval($attemptCount['count']) + 1;

    if ($currentAttempt > $session['max_attempts']) {
        throw new Exception('Maximum attempts exceeded', 403);
    }

    // 정답 검증
    $correctFormula = json_decode($session['correct_formula'], true);
    $isCorrect = compareFormulas($submittedFormula, $correctFormula);

    // 점수 계산
    $score = 0;
    $feedback = '';

    if ($isCorrect) {
        // 시도 횟수에 따라 점수 차등 부여
        $score = max(100 - (($currentAttempt - 1) * 10), 50);
        $feedback = '정답입니다! 🎉';
    } else {
        // 부분 점수 계산 (구조 유사도)
        $score = calculatePartialScore($submittedFormula, $correctFormula);
        $feedback = generateFeedback($submittedFormula, $correctFormula);
    }

    // 답안 제출 기록 저장
    $db->beginTransaction();

    try {
        $insertSql = "INSERT INTO attempts (session_id, attempt_number, submitted_formula, is_correct, score, feedback, time_taken_seconds)
                      VALUES (?, ?, ?, ?, ?, ?, ?)";

        $attemptId = $db->insert($insertSql, [
            $sessionId,
            $currentAttempt,
            json_encode($submittedFormula),
            $isCorrect ? 1 : 0,
            $score,
            $feedback,
            $timeTaken
        ]);

        // 정답이면 세션 완료 처리
        if ($isCorrect) {
            $updateSql = "UPDATE sessions SET status = 'completed', completed_at = NOW() WHERE id = ?";
            $db->execute($updateSql, [$sessionId]);

            // Moodle에 성적 전송
            $moodle = new MoodleConnector();
            $moodle->submitGrade(
                $session['student_id'],
                $session['moodle_question_id'],
                $score,
                $feedback
            );

            // 학생 진도 업데이트
            $db->execute("CALL update_student_progress(?)", [$session['student_id']]);
        }

        $db->commit();

        // 응답 반환
        echo json_encode([
            'success' => true,
            'data' => [
                'attempt_id' => $attemptId,
                'attempt_number' => $currentAttempt,
                'is_correct' => $isCorrect,
                'score' => $score,
                'feedback' => $feedback,
                'max_attempts' => intval($session['max_attempts']),
                'remaining_attempts' => intval($session['max_attempts']) - $currentAttempt,
                'session_completed' => $isCorrect
            ]
        ]);

    } catch (Exception $e) {
        $db->rollback();
        throw $e;
    }

} catch (Exception $e) {
    $statusCode = $e->getCode() ?: 500;
    http_response_code($statusCode);

    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

/**
 * 두 논리식 구조를 비교
 *
 * @param array $submitted 제출된 논리식
 * @param array $correct 정답 논리식
 * @return bool 일치 여부
 */
function compareFormulas($submitted, $correct) {
    // 재귀적으로 구조 비교
    if ($submitted['type'] !== $correct['type']) {
        return false;
    }

    // 변수인 경우 값 비교
    if ($submitted['type'] === 'variable') {
        return $submitted['value'] === $correct['value'];
    }

    // 연산자인 경우 입력 재귀 비교
    if (isset($submitted['inputs']) && isset($correct['inputs'])) {
        if (count($submitted['inputs']) !== count($correct['inputs'])) {
            return false;
        }

        // 교환 법칙 고려 (AND, OR의 경우)
        if (in_array($submitted['type'], ['and', 'or'])) {
            // 순서 무관 비교
            return areInputsEquivalent($submitted['inputs'], $correct['inputs']);
        } else {
            // 순서 중요한 비교 (implies, not 등)
            for ($i = 0; $i < count($submitted['inputs']); $i++) {
                if (!compareFormulas($submitted['inputs'][$i], $correct['inputs'][$i])) {
                    return false;
                }
            }
        }
    }

    return true;
}

/**
 * 교환 법칙을 고려한 입력 비교
 */
function areInputsEquivalent($inputs1, $inputs2) {
    if (count($inputs1) !== count($inputs2)) {
        return false;
    }

    $matched = [];
    foreach ($inputs1 as $input1) {
        $found = false;
        foreach ($inputs2 as $idx => $input2) {
            if (!in_array($idx, $matched) && compareFormulas($input1, $input2)) {
                $matched[] = $idx;
                $found = true;
                break;
            }
        }
        if (!$found) {
            return false;
        }
    }

    return true;
}

/**
 * 부분 점수 계산
 *
 * @param array $submitted 제출된 논리식
 * @param array $correct 정답 논리식
 * @return float 부분 점수 (0-100)
 */
function calculatePartialScore($submitted, $correct) {
    // 구조 유사도 계산
    $similarity = calculateSimilarity($submitted, $correct);
    return round($similarity * 50); // 최대 50점
}

/**
 * 구조 유사도 계산
 */
function calculateSimilarity($formula1, $formula2) {
    if ($formula1['type'] === $formula2['type']) {
        $score = 0.5; // 같은 타입이면 50%

        if ($formula1['type'] === 'variable' && $formula1['value'] === $formula2['value']) {
            return 1.0; // 완전히 같은 변수
        }

        if (isset($formula1['inputs']) && isset($formula2['inputs'])) {
            $inputScore = 0;
            $count = max(count($formula1['inputs']), count($formula2['inputs']));

            for ($i = 0; $i < min(count($formula1['inputs']), count($formula2['inputs'])); $i++) {
                $inputScore += calculateSimilarity($formula1['inputs'][$i], $formula2['inputs'][$i]);
            }

            $score += ($inputScore / $count) * 0.5;
        }

        return $score;
    }

    return 0.0;
}

/**
 * 피드백 생성
 *
 * @param array $submitted 제출된 논리식
 * @param array $correct 정답 논리식
 * @return string 피드백 메시지
 */
function generateFeedback($submitted, $correct) {
    $feedback = [];

    // 최상위 연산자 비교
    if ($submitted['type'] !== $correct['type']) {
        $operatorNames = [
            'and' => 'AND (∧)',
            'or' => 'OR (∨)',
            'not' => 'NOT (¬)',
            'implies' => 'IMPLIES (→)',
            'iff' => 'IFF (↔)'
        ];

        $feedback[] = "최상위 연산자가 다릅니다. '{$operatorNames[$correct['type']]}'를 사용해보세요.";
    } else {
        // 입력 개수 비교
        if (isset($submitted['inputs']) && isset($correct['inputs'])) {
            $submittedCount = count($submitted['inputs']);
            $correctCount = count($correct['inputs']);

            if ($submittedCount < $correctCount) {
                $feedback[] = "입력이 부족합니다. " . ($correctCount - $submittedCount) . "개 더 필요합니다.";
            } elseif ($submittedCount > $correctCount) {
                $feedback[] = "입력이 너무 많습니다. " . ($submittedCount - $correctCount) . "개를 제거해보세요.";
            } else {
                $feedback[] = "구조는 거의 맞습니다! 변수나 하위 연산자를 확인해보세요.";
            }
        }
    }

    return implode(' ', $feedback) ?: '다시 시도해보세요.';
}
