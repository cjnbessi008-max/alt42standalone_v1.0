<?php
/**
 * Solution Paint - Get Problem API
 * 부등식 문제 가져오기 (Moodle 또는 로컬 DB에서)
 */

require_once 'db_config.php';

// CORS 헤더 설정
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    $db = Database::getInstance()->getConnection();

    // 파라미터 받기
    $problemId = isset($_GET['id']) ? intval($_GET['id']) : null;
    $difficulty = isset($_GET['difficulty']) ? sanitizeInput($_GET['difficulty']) : null;
    $moodleId = isset($_GET['moodle_id']) ? intval($_GET['moodle_id']) : null;

    // Moodle 연동 활성화 시
    if (MOODLE_ENABLED && $moodleId) {
        $problem = fetchFromMoodle($moodleId);
        if ($problem) {
            jsonResponse(array(
                'success' => true,
                'source' => 'moodle',
                'problem' => $problem
            ));
        }
    }

    // 로컬 DB에서 문제 가져오기
    if ($problemId) {
        // 특정 ID 문제 가져오기
        $stmt = $db->prepare("
            SELECT * FROM inequality_problems
            WHERE id = :id
        ");
        $stmt->execute(['id' => $problemId]);
    } else if ($difficulty) {
        // 난이도별 랜덤 문제 가져오기
        $stmt = $db->prepare("
            SELECT * FROM inequality_problems
            WHERE difficulty = :difficulty
            ORDER BY RAND()
            LIMIT 1
        ");
        $stmt->execute(['difficulty' => $difficulty]);
    } else {
        // 랜덤 문제 가져오기
        $stmt = $db->query("
            SELECT * FROM inequality_problems
            ORDER BY RAND()
            LIMIT 1
        ");
    }

    $problem = $stmt->fetch();

    if ($problem) {
        // 문제 데이터 포맷팅
        $formattedProblem = array(
            'id' => intval($problem['id']),
            'text' => $problem['problem_text'],
            'type' => $problem['inequality_type'],
            'difficulty' => $problem['difficulty'],
            'coefficients' => array(
                'a' => floatval($problem['coefficient_a']),
                'b' => floatval($problem['coefficient_b']),
                'c' => floatval($problem['constant_c'])
            ),
            'operator' => $problem['operator'],
            'solution' => array(
                'start' => $problem['solution_start'] ? floatval($problem['solution_start']) : null,
                'end' => $problem['solution_end'] ? floatval($problem['solution_end']) : null,
                'includeStart' => (bool)$problem['include_start'],
                'includeEnd' => (bool)$problem['include_end']
            ),
            'displayRange' => calculateDisplayRange($problem)
        );

        jsonResponse(array(
            'success' => true,
            'source' => 'local',
            'problem' => $formattedProblem
        ));
    } else {
        jsonResponse(array(
            'success' => false,
            'error' => 'Problem not found'
        ), 404);
    }

} catch (Exception $e) {
    jsonResponse(array(
        'success' => false,
        'error' => $e->getMessage()
    ), 500);
}

/**
 * Moodle에서 문제 가져오기
 */
function fetchFromMoodle($questionId) {
    if (!MOODLE_TOKEN) {
        return null;
    }

    $url = MOODLE_URL . '/webservice/rest/server.php';
    $params = array(
        'wstoken' => MOODLE_TOKEN,
        'wsfunction' => 'core_question_get_question_data',
        'moodlewsrestformat' => 'json',
        'questionid' => $questionId
    );

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url . '?' . http_build_query($params));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200 && $response) {
        $data = json_decode($response, true);
        // Moodle 데이터를 앱 형식으로 변환
        return parseMoodleQuestion($data);
    }

    return null;
}

/**
 * Moodle 문제 데이터 파싱
 */
function parseMoodleQuestion($moodleData) {
    // Moodle 퀴즈 데이터 구조에 맞춰 파싱
    // 실제 Moodle 데이터 구조에 따라 수정 필요
    return array(
        'id' => 0,
        'text' => $moodleData['questiontext'] ?? 'Unknown problem',
        'type' => 'linear',
        'difficulty' => 'medium',
        // ... 추가 필드 파싱
    );
}

/**
 * 수직선 표시 범위 계산
 */
function calculateDisplayRange($problem) {
    $solution_start = $problem['solution_start'];
    $solution_end = $problem['solution_end'];

    // 해의 범위에 따라 표시 범위 자동 계산
    if ($solution_start !== null && $solution_end !== null) {
        $center = ($solution_start + $solution_end) / 2;
        $range = abs($solution_end - $solution_start);
        $margin = max($range * 0.5, 5); // 최소 5 단위 여백

        return array(
            'min' => floor($center - $margin),
            'max' => ceil($center + $margin)
        );
    } else if ($solution_start !== null) {
        // 한쪽 끝만 있는 경우
        return array(
            'min' => $solution_start - 10,
            'max' => $solution_start + 10
        );
    } else if ($solution_end !== null) {
        return array(
            'min' => $solution_end - 10,
            'max' => $solution_end + 10
        );
    }

    // 기본 범위
    return array(
        'min' => -10,
        'max' => 10
    );
}
