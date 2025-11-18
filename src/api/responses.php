<?php
/**
 * Student Responses API Endpoint
 * 학생 답안 및 넓이 완성 처리
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/MoodleAPI.php';

header('Content-Type: application/json');

$db = Database::getInstance();
$moodle = new MoodleAPI();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'submit':
            // 답안 제출
            $data = json_decode(file_get_contents('php://input'), true);

            $userId = $data['user_id'] ?? null;
            $questionId = $data['question_id'] ?? null;
            $answer = $data['answer'] ?? null;

            if (!$userId || !$questionId || !$answer) {
                throw new Exception('Missing required fields');
            }

            // 정답 확인
            $question = $db->selectOne(
                "SELECT correct_answer FROM questions WHERE id = ?",
                [$questionId]
            );

            if (!$question) {
                throw new Exception('Question not found');
            }

            $isCorrect = abs($answer - $question['correct_answer']) < 0.01;

            // 응답 저장
            $responseId = $db->insert(
                "INSERT INTO student_responses (moodle_user_id, question_id, user_answer, is_correct, area_completed)
                 VALUES (?, ?, ?, ?, ?)",
                [$userId, $questionId, $answer, $isCorrect ? 1 : 0, 0]
            );

            echo json_encode([
                'success' => true,
                'data' => [
                    'response_id' => $responseId,
                    'is_correct' => $isCorrect,
                    'correct_answer' => $question['correct_answer']
                ]
            ]);
            break;

        case 'update_progress':
            // 넓이 그리기 진행 상황 업데이트
            $data = json_decode(file_get_contents('php://input'), true);

            $responseId = $data['response_id'] ?? null;
            $shapeType = $data['shape_type'] ?? null;
            $progressData = $data['progress_data'] ?? null;
            $completionPercentage = $data['completion_percentage'] ?? 0;

            if (!$responseId || !$shapeType) {
                throw new Exception('Missing required fields');
            }

            $isCompleted = $completionPercentage >= 100 ? 1 : 0;

            // 진행 상황 저장
            $progressId = $db->insert(
                "INSERT INTO area_progress (response_id, shape_type, progress_data, completion_percentage, is_completed, completed_at)
                 VALUES (?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                 progress_data = VALUES(progress_data),
                 completion_percentage = VALUES(completion_percentage),
                 is_completed = VALUES(is_completed),
                 completed_at = VALUES(completed_at)",
                [
                    $responseId,
                    $shapeType,
                    json_encode($progressData),
                    $completionPercentage,
                    $isCompleted,
                    $isCompleted ? date('Y-m-d H:i:s') : null
                ]
            );

            // 넓이가 완성되면 area_completed 플래그 설정
            $shouldPlayChime = false;
            if ($isCompleted) {
                $db->update(
                    "UPDATE student_responses SET area_completed = 1, completed_at = NOW() WHERE id = ?",
                    [$responseId]
                );
                $shouldPlayChime = true;
            }

            echo json_encode([
                'success' => true,
                'data' => [
                    'progress_id' => $progressId,
                    'is_completed' => $isCompleted,
                    'play_chime' => $shouldPlayChime
                ]
            ]);
            break;

        case 'complete_area':
            // 넓이 완성 (종소리 재생 트리거)
            $data = json_decode(file_get_contents('php://input'), true);

            $responseId = $data['response_id'] ?? null;

            if (!$responseId) {
                throw new Exception('Response ID is required');
            }

            // 완성 처리
            $db->update(
                "UPDATE student_responses SET area_completed = 1, chime_played = 1, completed_at = NOW() WHERE id = ?",
                [$responseId]
            );

            // 설정에서 종소리 활성화 여부 확인
            $chimeSetting = $db->selectOne(
                "SELECT setting_value FROM app_settings WHERE setting_key = 'chime_enabled'"
            );

            $chimeEnabled = $chimeSetting ? (bool)$chimeSetting['setting_value'] : true;

            echo json_encode([
                'success' => true,
                'data' => [
                    'area_completed' => true,
                    'play_chime' => $chimeEnabled,
                    'chime_file' => CHIME_FILE
                ]
            ]);
            break;

        case 'get_progress':
            // 진행 상황 조회
            $responseId = $_GET['response_id'] ?? null;

            if (!$responseId) {
                throw new Exception('Response ID is required');
            }

            $progress = $db->selectOne(
                "SELECT * FROM area_progress WHERE response_id = ? ORDER BY created_at DESC LIMIT 1",
                [$responseId]
            );

            echo json_encode([
                'success' => true,
                'data' => $progress ? [
                    'shape_type' => $progress['shape_type'],
                    'progress_data' => json_decode($progress['progress_data'], true),
                    'completion_percentage' => $progress['completion_percentage'],
                    'is_completed' => $progress['is_completed']
                ] : null
            ]);
            break;

        default:
            throw new Exception('Invalid action');
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
