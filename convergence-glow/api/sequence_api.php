<?php
/**
 * Sequence Convergence/Divergence API
 * 수열의 수렴/발산 계산 및 문제 관리
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/moodle_api.php';

setCorsHeaders();

// OPTIONS 요청 처리 (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$db = Database::getInstance();
$moodleApi = new MoodleAPI();

// 라우팅
$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['PATH_INFO'] ?? '/';

try {
    switch ($path) {
        case '/problem':
            if ($method === 'GET') {
                getProblem();
            } else {
                errorResponse('Method not allowed', 405);
            }
            break;

        case '/calculate':
            if ($method === 'POST') {
                calculateSequence();
            } else {
                errorResponse('Method not allowed', 405);
            }
            break;

        case '/submit':
            if ($method === 'POST') {
                submitAnswer();
            } else {
                errorResponse('Method not allowed', 405);
            }
            break;

        case '/session':
            if ($method === 'POST') {
                createSession();
            } else {
                errorResponse('Method not allowed', 405);
            }
            break;

        default:
            errorResponse('Not found', 404);
    }
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    errorResponse($e->getMessage(), 500);
}

/**
 * 문제 조회
 */
function getProblem() {
    global $db;

    $questionId = $_GET['question_id'] ?? null;
    $quizId = $_GET['quiz_id'] ?? null;

    if (!$questionId && !$quizId) {
        errorResponse('question_id 또는 quiz_id가 필요합니다');
    }

    if ($questionId) {
        $problem = $db->fetchOne(
            'SELECT * FROM sequence_problems WHERE moodle_question_id = ?',
            [$questionId]
        );
    } else {
        $problem = $db->fetchOne(
            'SELECT * FROM sequence_problems WHERE moodle_quiz_id = ? ORDER BY RAND() LIMIT 1',
            [$quizId]
        );
    }

    if (!$problem) {
        errorResponse('문제를 찾을 수 없습니다', 404);
    }

    // JSON 필드 파싱
    $problem['sequence_formula'] = json_decode($problem['sequence_formula'], true);
    $problem['visualization_config'] = json_decode($problem['visualization_config'], true);

    successResponse($problem);
}

/**
 * 수열 계산 (항 생성)
 */
function calculateSequence() {
    global $db;

    $input = json_decode(file_get_contents('php://input'), true);
    $problemId = $input['problem_id'] ?? null;
    $numTerms = min($input['num_terms'] ?? 50, MAX_SEQUENCE_TERMS);

    if (!$problemId) {
        errorResponse('problem_id가 필요합니다');
    }

    $problem = $db->fetchOne(
        'SELECT * FROM sequence_problems WHERE id = ?',
        [$problemId]
    );

    if (!$problem) {
        errorResponse('문제를 찾을 수 없습니다', 404);
    }

    $formula = json_decode($problem['sequence_formula'], true);
    $terms = [];

    // 수열 유형별 계산
    switch ($problem['sequence_type']) {
        case 'arithmetic':
            $terms = calculateArithmetic(
                $problem['initial_term'],
                $problem['common_difference'],
                $numTerms,
                $formula['n_start'] ?? 1
            );
            break;

        case 'geometric':
            $terms = calculateGeometric(
                $problem['initial_term'],
                $problem['common_ratio'],
                $numTerms,
                $formula['n_start'] ?? 1
            );
            break;

        case 'harmonic':
            $terms = calculateHarmonic($numTerms, $formula['n_start'] ?? 1);
            break;

        case 'custom':
            $terms = calculateCustom($formula['formula'], $numTerms, $formula['n_start'] ?? 1);
            break;

        default:
            errorResponse('지원하지 않는 수열 유형입니다');
    }

    // 수렴성 분석
    $analysis = analyzeConvergence($terms, $problem['convergence_type']);

    successResponse([
        'problem_id' => $problemId,
        'sequence_type' => $problem['sequence_type'],
        'terms' => $terms,
        'analysis' => $analysis,
        'visualization_config' => json_decode($problem['visualization_config'], true)
    ]);
}

/**
 * 답안 제출
 */
function submitAnswer() {
    global $db, $moodleApi;

    $input = json_decode(file_get_contents('php://input'), true);

    $sessionToken = $input['session_token'] ?? null;
    $problemId = $input['problem_id'] ?? null;
    $answer = $input['answer'] ?? null;
    $timeSpent = $input['time_spent'] ?? 0;
    $interactionData = $input['interaction_data'] ?? null;

    if (!$sessionToken || !$problemId || !$answer) {
        errorResponse('session_token, problem_id, answer가 필요합니다');
    }

    // 세션 검증
    $session = $moodleApi->validateSession($sessionToken);

    // 문제 정보 조회
    $problem = $db->fetchOne(
        'SELECT * FROM sequence_problems WHERE id = ?',
        [$problemId]
    );

    if (!$problem) {
        errorResponse('문제를 찾을 수 없습니다', 404);
    }

    // 정답 확인
    $isCorrect = ($answer === $problem['convergence_type']);

    // 응답 기록
    $attemptId = $db->insert('student_attempts', [
        'moodle_user_id' => $session['moodle_user_id'],
        'problem_id' => $problemId,
        'attempt_number' => 1,  // TODO: 실제 시도 횟수 계산
        'student_answer' => $answer,
        'is_correct' => $isCorrect ? 1 : 0,
        'time_spent_seconds' => $timeSpent,
        'interaction_data' => json_encode($interactionData)
    ]);

    // Moodle에 결과 제출 (선택적)
    try {
        $moodleApi->submitAnswer(
            $session['moodle_user_id'],
            $session['moodle_quiz_id'],
            $problem['moodle_question_id'],
            $answer,
            $isCorrect
        );
    } catch (Exception $e) {
        error_log("Moodle 제출 실패: " . $e->getMessage());
    }

    successResponse([
        'attempt_id' => $attemptId,
        'is_correct' => $isCorrect,
        'correct_answer' => $problem['convergence_type'],
        'explanation' => generateExplanation($problem)
    ], $isCorrect ? '정답입니다!' : '다시 시도해보세요.');
}

/**
 * 세션 생성
 */
function createSession() {
    global $moodleApi;

    $input = json_decode(file_get_contents('php://input'), true);

    $userId = $input['user_id'] ?? null;
    $quizId = $input['quiz_id'] ?? null;

    if (!$userId || !$quizId) {
        errorResponse('user_id와 quiz_id가 필요합니다');
    }

    $session = $moodleApi->createSession($userId, $quizId);

    successResponse($session, '세션이 생성되었습니다');
}

// ====== 수열 계산 함수들 ======

function calculateArithmetic($a1, $d, $n, $start = 1) {
    $terms = [];
    for ($i = 0; $i < $n; $i++) {
        $index = $start + $i;
        $value = $a1 + $d * $i;
        $terms[] = [
            'n' => $index,
            'value' => round($value, 6)
        ];
    }
    return $terms;
}

function calculateGeometric($a1, $r, $n, $start = 0) {
    $terms = [];
    for ($i = 0; $i < $n; $i++) {
        $index = $start + $i;
        $value = $a1 * pow($r, $i);
        $terms[] = [
            'n' => $index,
            'value' => round($value, 6)
        ];
    }
    return $terms;
}

function calculateHarmonic($n, $start = 1) {
    $terms = [];
    for ($i = 0; $i < $n; $i++) {
        $index = $start + $i;
        $value = 1.0 / $index;
        $terms[] = [
            'n' => $index,
            'value' => round($value, 6)
        ];
    }
    return $terms;
}

function calculateCustom($formula, $n, $start = 1) {
    $terms = [];
    // 간단한 수식 평가 (보안상 제한적으로 구현)
    for ($i = 0; $i < $n; $i++) {
        $index = $start + $i;

        // 수식에서 n을 실제 값으로 치환
        $expr = str_replace('n', $index, $formula);
        $expr = str_replace('a_n', '', $expr);
        $expr = str_replace('=', '', $expr);
        $expr = trim($expr);

        try {
            // 안전한 수식 평가 (eval 대신 간단한 파싱)
            $value = evaluateExpression($expr, $index);
            $terms[] = [
                'n' => $index,
                'value' => round($value, 6)
            ];
        } catch (Exception $e) {
            $terms[] = [
                'n' => $index,
                'value' => 0,
                'error' => 'Calculation error'
            ];
        }
    }
    return $terms;
}

function evaluateExpression($expr, $n) {
    // 간단한 수식 평가 (보안을 위해 제한적으로 구현)
    // 실제 프로덕션에서는 더 안전한 수식 파서 사용 권장

    $expr = str_replace(' ', '', $expr);
    $expr = str_replace('^', '**', $expr);

    // 허용된 함수와 연산자만 사용
    $allowedPattern = '/^[\d\.\+\-\*\/\(\)\*\*]+$/';

    // (-1)^n 같은 패턴 처리
    $expr = preg_replace('/\(-1\)\*\*' . $n . '/', pow(-1, $n), $expr);
    $expr = preg_replace('/\(-1\)\*\*n/', pow(-1, $n), $expr);

    if (preg_match($allowedPattern, $expr)) {
        return eval("return $expr;");
    }

    throw new Exception("Invalid expression");
}

function analyzeConvergence($terms, $expectedType) {
    $n = count($terms);
    if ($n < 3) {
        return ['type' => 'unknown', 'confidence' => 0];
    }

    $values = array_column($terms, 'value');
    $lastValues = array_slice($values, -10);

    // 수렴 판정
    $variance = calculateVariance($lastValues);
    $trend = calculateTrend($values);

    $isConvergent = $variance < CONVERGENCE_THRESHOLD;
    $isDivergent = abs(end($values)) > DIVERGENCE_THRESHOLD;
    $isOscillating = $trend['oscillating'];

    $detectedType = 'unknown';
    if ($isConvergent) {
        $detectedType = 'convergent';
    } elseif ($isDivergent) {
        $detectedType = 'divergent';
    } elseif ($isOscillating) {
        $detectedType = 'oscillating';
    }

    return [
        'detected_type' => $detectedType,
        'expected_type' => $expectedType,
        'variance' => round($variance, 6),
        'trend' => $trend,
        'limit_value' => $isConvergent ? round(end($values), 6) : null
    ];
}

function calculateVariance($values) {
    $n = count($values);
    if ($n === 0) return 0;

    $mean = array_sum($values) / $n;
    $sumSquares = 0;

    foreach ($values as $value) {
        $sumSquares += pow($value - $mean, 2);
    }

    return $sumSquares / $n;
}

function calculateTrend($values) {
    $n = count($values);
    $signChanges = 0;
    $increasing = 0;
    $decreasing = 0;

    for ($i = 1; $i < $n; $i++) {
        $diff = $values[$i] - $values[$i - 1];

        if ($diff > 0) {
            $increasing++;
        } elseif ($diff < 0) {
            $decreasing++;
        }

        if ($i > 1) {
            $prevDiff = $values[$i - 1] - $values[$i - 2];
            if ($diff * $prevDiff < 0) {
                $signChanges++;
            }
        }
    }

    return [
        'increasing_ratio' => round($increasing / ($n - 1), 2),
        'decreasing_ratio' => round($decreasing / ($n - 1), 2),
        'sign_changes' => $signChanges,
        'oscillating' => $signChanges > ($n / 3)
    ];
}

function generateExplanation($problem) {
    $type = $problem['convergence_type'];
    $seqType = $problem['sequence_type'];

    $explanations = [
        'convergent' => "이 수열은 수렴합니다. 항이 커질수록 특정 값(" . $problem['limit_value'] . ")에 가까워집니다.",
        'divergent' => "이 수열은 발산합니다. 항이 커질수록 값이 무한대로 증가하거나 감소합니다.",
        'oscillating' => "이 수열은 진동하면서 수렴합니다. 부호가 바뀌지만 절댓값은 점점 작아집니다."
    ];

    return $explanations[$type] ?? "수열의 특성을 분석해보세요.";
}
