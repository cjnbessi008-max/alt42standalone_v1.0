<?php
/**
 * Change Wave - 문제 정보 가져오기 API
 *
 * Moodle에서 문제 정보를 가져와서 JSON 형식으로 반환
 *
 * 요청: GET /api/get_problem.php?id={problem_id}
 * 응답: JSON 형식의 문제 정보
 */

require_once __DIR__ . '/config.php';

/**
 * 문제 ID로 문제 정보 조회
 *
 * @param mysqli $conn DB 연결
 * @param int $problemId 문제 ID
 * @return array|null
 */
function getProblemById($conn, $problemId) {
    $problemId = (int) $problemId;

    $query = "
        SELECT
            p.id,
            p.title,
            p.description,
            p.function_expr,
            p.function_name,
            p.x_min,
            p.x_max,
            p.y_min,
            p.y_max,
            p.difficulty,
            p.category,
            p.created_at,
            p.updated_at
        FROM changewave_problems p
        WHERE p.id = ? AND p.active = 1
        LIMIT 1
    ";

    $stmt = $conn->prepare($query);
    if (!$stmt) {
        logError('getProblemById', 'Prepare 실패: ' . $conn->error);
        return null;
    }

    $stmt->bind_param('i', $problemId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        $stmt->close();
        return null;
    }

    $problem = $result->fetch_assoc();
    $stmt->close();

    return $problem;
}

/**
 * Moodle 퀴즈와 연동된 문제 정보 조회
 *
 * @param mysqli $moodleConn Moodle DB 연결
 * @param mysqli $changeWaveConn ChangeWave DB 연결
 * @param int $problemId 문제 ID
 * @return array|null
 */
function getProblemWithMoodleData($moodleConn, $changeWaveConn, $problemId) {
    // Change Wave 문제 정보 조회
    $problem = getProblemById($changeWaveConn, $problemId);

    if (!$problem) {
        return null;
    }

    // Moodle 연동 정보 조회 (선택사항)
    if ($moodleConn && isset($problem['moodle_quiz_id'])) {
        $quizId = (int) $problem['moodle_quiz_id'];

        $query = "
            SELECT
                q.id,
                q.name,
                q.intro,
                q.timeopen,
                q.timeclose,
                q.timelimit
            FROM " . MOODLE_TABLE_PREFIX . "quiz q
            WHERE q.id = ?
            LIMIT 1
        ";

        $stmt = $moodleConn->prepare($query);
        if ($stmt) {
            $stmt->bind_param('i', $quizId);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows > 0) {
                $problem['moodle_quiz'] = $result->fetch_assoc();
            }

            $stmt->close();
        }
    }

    return $problem;
}

/**
 * 기본 샘플 문제 데이터
 *
 * @param int $problemId 문제 ID
 * @return array
 */
function getSampleProblem($problemId) {
    $samples = [
        1 => [
            'id' => 1,
            'title' => '이차함수의 변화 관찰하기',
            'description' => 'f(x) = x² 함수의 변화를 관찰하세요. x값이 증가할 때 함수값과 변화율이 어떻게 변하는지 파동을 통해 확인할 수 있습니다.',
            'function_expr' => 'x * x',
            'function_name' => 'f(x) = x²',
            'x_min' => -5,
            'x_max' => 5,
            'y_min' => -2,
            'y_max' => 25,
            'difficulty' => 'easy',
            'category' => '이차함수'
        ],
        2 => [
            'id' => 2,
            'title' => '삼차함수의 극값 찾기',
            'description' => 'f(x) = x³ - 3x 함수의 극댓값과 극솟값을 파동을 통해 찾아보세요. 변화율이 0이 되는 지점을 관찰하세요.',
            'function_expr' => 'x * x * x - 3 * x',
            'function_name' => 'f(x) = x³ - 3x',
            'x_min' => -3,
            'x_max' => 3,
            'y_min' => -5,
            'y_max' => 5,
            'difficulty' => 'medium',
            'category' => '삼차함수'
        ],
        3 => [
            'id' => 3,
            'title' => '사인 함수의 주기 이해하기',
            'description' => 'f(x) = sin(x) 함수의 주기적 변화를 파동으로 경험하세요. 삼각함수의 특성을 시각적으로 이해할 수 있습니다.',
            'function_expr' => 'sin(x)',
            'function_name' => 'f(x) = sin(x)',
            'x_min' => -6.28,
            'x_max' => 6.28,
            'y_min' => -1.5,
            'y_max' => 1.5,
            'difficulty' => 'medium',
            'category' => '삼각함수'
        ],
        4 => [
            'id' => 4,
            'title' => '지수함수의 급격한 증가',
            'description' => 'f(x) = 2^x 함수의 지수적 증가를 관찰하세요. 변화율도 함께 급격히 증가하는 것을 확인할 수 있습니다.',
            'function_expr' => 'pow(2, x)',
            'function_name' => 'f(x) = 2ˣ',
            'x_min' => -2,
            'x_max' => 4,
            'y_min' => -1,
            'y_max' => 16,
            'difficulty' => 'hard',
            'category' => '지수함수'
        ],
        5 => [
            'id' => 5,
            'title' => '절댓값 함수의 불연속',
            'description' => 'f(x) = |x| 함수에서 x=0 지점의 변화율 불연속을 파동으로 관찰하세요.',
            'function_expr' => 'abs(x)',
            'function_name' => 'f(x) = |x|',
            'x_min' => -5,
            'x_max' => 5,
            'y_min' => -1,
            'y_max' => 5,
            'difficulty' => 'easy',
            'category' => '절댓값함수'
        ]
    ];

    return isset($samples[$problemId]) ? $samples[$problemId] : $samples[1];
}

// ===== 메인 로직 =====

try {
    // 문제 ID 가져오기
    $problemId = getParam('id', 1);

    if (!is_numeric($problemId) || $problemId < 1) {
        sendErrorResponse('유효하지 않은 문제 ID입니다.', 400);
    }

    // DB 연결 시도
    $changeWaveConn = getChangeWaveConnection();
    $moodleConn = getMoodleConnection();

    $problem = null;

    // Change Wave DB가 연결되었으면 DB에서 조회
    if ($changeWaveConn) {
        $problem = getProblemWithMoodleData($moodleConn, $changeWaveConn, $problemId);

        $changeWaveConn->close();
        if ($moodleConn) {
            $moodleConn->close();
        }
    }

    // DB에 문제가 없거나 연결 실패시 샘플 데이터 사용
    if (!$problem) {
        if (DEBUG_MODE) {
            logError('get_problem', "문제 ID {$problemId}를 DB에서 찾을 수 없어 샘플 데이터 사용");
        }
        $problem = getSampleProblem($problemId);
    }

    // 성공 응답
    sendSuccessResponse($problem);

} catch (Exception $e) {
    logError('get_problem', $e->getMessage());
    sendErrorResponse('문제 정보를 불러오는 중 오류가 발생했습니다: ' . $e->getMessage(), 500);
}
