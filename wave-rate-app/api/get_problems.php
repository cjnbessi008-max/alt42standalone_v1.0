<?php
/**
 * Get Problems API
 * Retrieves problem data from database and Moodle
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/moodle.php';

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();

    // GET 파라미터 처리
    $problemId = isset($_GET['id']) ? intval($_GET['id']) : null;
    $moodleQuestionId = isset($_GET['moodle_id']) ? intval($_GET['moodle_id']) : null;

    if ($problemId) {
        // 특정 문제 조회
        $sql = "SELECT * FROM problems WHERE id = :id";
        $stmt = $db->query($sql, ['id' => $problemId]);
        $problem = $stmt->fetch();

        if (!$problem) {
            http_response_code(404);
            echo json_encode(['error' => 'Problem not found']);
            exit;
        }

        // 변화율 데이터 조회
        $sql = "SELECT x_value, y_value, derivative_value, wave_amplitude
                FROM rate_data
                WHERE problem_id = :problem_id
                ORDER BY x_value";
        $stmt = $db->query($sql, ['problem_id' => $problemId]);
        $rateData = $stmt->fetchAll();

        $problem['rate_data'] = $rateData;

        echo json_encode([
            'success' => true,
            'data' => $problem
        ]);

    } elseif ($moodleQuestionId) {
        // Moodle 문제 ID로 조회
        $sql = "SELECT * FROM problems WHERE moodle_question_id = :moodle_id";
        $stmt = $db->query($sql, ['moodle_id' => $moodleQuestionId]);
        $problem = $stmt->fetch();

        if (!$problem) {
            // Moodle에서 문제 정보 가져오기
            try {
                $moodle = new MoodleAPI();
                $moodleData = $moodle->getQuizQuestion($moodleQuestionId);

                // 새 문제 생성 (실제 환경에서는 Moodle 데이터를 파싱해야 함)
                $sql = "INSERT INTO problems
                        (moodle_question_id, question_text, function_expression, difficulty_level)
                        VALUES (:moodle_id, :question, :function, :difficulty)";

                $params = [
                    'moodle_id' => $moodleQuestionId,
                    'question' => "Moodle Question #$moodleQuestionId",
                    'function' => 'x*x', // 기본값
                    'difficulty' => 'medium'
                ];

                $db->query($sql, $params);
                $problemId = $conn->lastInsertId();

                $problem = [
                    'id' => $problemId,
                    'moodle_question_id' => $moodleQuestionId,
                    'question_text' => $params['question'],
                    'function_expression' => $params['function'],
                    'x_min' => -10,
                    'x_max' => 10,
                    'difficulty_level' => 'medium'
                ];

            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to fetch from Moodle: ' . $e->getMessage()]);
                exit;
            }
        }

        echo json_encode([
            'success' => true,
            'data' => $problem
        ]);

    } else {
        // 모든 문제 조회
        $sql = "SELECT id, moodle_question_id, question_text, function_expression,
                       difficulty_level, created_at
                FROM problems
                ORDER BY created_at DESC
                LIMIT 50";
        $stmt = $db->query($sql);
        $problems = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'data' => $problems,
            'count' => count($problems)
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
