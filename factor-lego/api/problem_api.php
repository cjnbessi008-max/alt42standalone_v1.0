<?php
/**
 * Factor Lego - Problem API
 * 문제 정보 제공 API
 */

require_once '../moodle-integration/config.php';
require_once '../moodle-integration/moodle_connector.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$connector = new MoodleConnector();

try {
    switch ($method) {
        case 'GET':
            handle_get_request($connector);
            break;
        case 'POST':
            handle_post_request($connector);
            break;
        default:
            send_response(405, ['error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    send_response(500, ['error' => $e->getMessage()]);
} finally {
    $connector->close();
}

/**
 * GET 요청 처리 - 문제 정보 가져오기
 */
function handle_get_request($connector) {
    if (!isset($_GET['problem_id'])) {
        send_response(400, ['error' => 'problem_id is required']);
        return;
    }

    $problem_id = intval($_GET['problem_id']);

    // Factor Lego DB에서 문제 가져오기
    $pdo = get_factor_db_connection();
    $stmt = $pdo->prepare("
        SELECT
            id,
            moodle_question_id,
            expression,
            difficulty_level,
            problem_type,
            correct_factors,
            hints
        FROM factor_problems
        WHERE id = :id
    ");
    $stmt->execute(['id' => $problem_id]);
    $problem = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$problem) {
        send_response(404, ['error' => 'Problem not found']);
        return;
    }

    // JSON 필드 파싱
    $problem['correct_factors'] = json_decode($problem['correct_factors'], true);
    $problem['hints'] = json_decode($problem['hints'], true);

    send_response(200, [
        'success' => true,
        'problem' => $problem
    ]);
}

/**
 * POST 요청 처리 - 답안 제출
 */
function handle_post_request($connector) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['student_id']) || !isset($data['problem_id']) || !isset($data['answer'])) {
        send_response(400, ['error' => 'student_id, problem_id, and answer are required']);
        return;
    }

    $student_id = intval($data['student_id']);
    $problem_id = intval($data['problem_id']);
    $student_answer = $data['answer'];
    $time_spent = isset($data['time_spent']) ? intval($data['time_spent']) : 0;
    $interactions_count = isset($data['interactions_count']) ? intval($data['interactions_count']) : 0;

    // 문제 정보 가져오기
    $pdo = get_factor_db_connection();
    $stmt = $pdo->prepare("SELECT correct_factors FROM factor_problems WHERE id = :id");
    $stmt->execute(['id' => $problem_id]);
    $problem = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$problem) {
        send_response(404, ['error' => 'Problem not found']);
        return;
    }

    $correct_factors = json_decode($problem['correct_factors'], true);

    // 답안 검증
    $is_correct = validate_answer($student_answer, $correct_factors['factors']);
    $score = $is_correct ? 100.00 : calculate_partial_score($student_answer, $correct_factors['factors']);

    // 답안 저장
    $insert_stmt = $pdo->prepare("
        INSERT INTO student_attempts
        (student_id, problem_id, student_answer, is_correct, score, time_spent, interactions_count)
        VALUES (:student_id, :problem_id, :answer, :is_correct, :score, :time_spent, :interactions)
    ");

    $insert_stmt->execute([
        'student_id' => $student_id,
        'problem_id' => $problem_id,
        'answer' => json_encode($student_answer),
        'is_correct' => $is_correct ? 1 : 0,
        'score' => $score,
        'time_spent' => $time_spent,
        'interactions' => $interactions_count
    ]);

    // 학생 진행 상황 업데이트
    update_student_progress($pdo, $student_id, $is_correct);

    send_response(200, [
        'success' => true,
        'is_correct' => $is_correct,
        'score' => $score,
        'correct_factors' => $correct_factors['factors'],
        'feedback' => get_feedback($is_correct, $student_answer, $correct_factors)
    ]);
}

/**
 * 답안 검증
 */
function validate_answer($student_answer, $correct_factors) {
    // 단순 비교 (실제로는 더 정교한 검증 필요)
    $student_factors_str = implode('', $student_answer);
    $correct_factors_str = implode('', $correct_factors);

    // 공백 제거하고 비교
    $student_factors_str = str_replace(' ', '', $student_factors_str);
    $correct_factors_str = str_replace(' ', '', $correct_factors_str);

    return $student_factors_str === $correct_factors_str;
}

/**
 * 부분 점수 계산
 */
function calculate_partial_score($student_answer, $correct_factors) {
    $student_count = count($student_answer);
    $correct_count = count($correct_factors);

    if ($student_count == 0) {
        return 0.00;
    }

    $matches = 0;
    foreach ($student_answer as $student_factor) {
        if (in_array($student_factor, $correct_factors)) {
            $matches++;
        }
    }

    return round(($matches / $correct_count) * 100, 2);
}

/**
 * 피드백 생성
 */
function get_feedback($is_correct, $student_answer, $correct_factors) {
    if ($is_correct) {
        return [
            'message' => '정답입니다! 훌륭해요!',
            'type' => 'success'
        ];
    } else {
        $hints = [];
        if (count($student_answer) != count($correct_factors['factors'])) {
            $hints[] = '인수의 개수를 다시 확인해보세요.';
        }
        if (isset($correct_factors['steps'])) {
            $hints[] = '힌트: ' . $correct_factors['steps'][0];
        }

        return [
            'message' => '아직 정답이 아니에요. 다시 시도해보세요!',
            'type' => 'error',
            'hints' => $hints
        ];
    }
}

/**
 * 학생 진행 상황 업데이트
 */
function update_student_progress($pdo, $student_id, $is_correct) {
    $update_stmt = $pdo->prepare("
        INSERT INTO student_progress (student_id, total_attempts, correct_attempts)
        VALUES (:student_id, 1, :correct)
        ON DUPLICATE KEY UPDATE
            total_attempts = total_attempts + 1,
            correct_attempts = correct_attempts + :correct,
            last_activity = CURRENT_TIMESTAMP
    ");

    $update_stmt->execute([
        'student_id' => $student_id,
        'correct' => $is_correct ? 1 : 0
    ]);
}

/**
 * Factor Lego DB 연결
 */
function get_factor_db_connection() {
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO(
            "mysql:host=" . FACTOR_DB_HOST . ";dbname=" . FACTOR_DB_NAME . ";charset=utf8mb4",
            FACTOR_DB_USER,
            FACTOR_DB_PASS,
            array(PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION)
        );
    }
    return $pdo;
}

/**
 * JSON 응답 전송
 */
function send_response($status_code, $data) {
    http_response_code($status_code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}
