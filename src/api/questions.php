<?php
/**
 * Questions API Endpoint
 * 문제 관련 API
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
        case 'get':
            // 문제 가져오기
            $questionId = $_GET['id'] ?? null;

            if (!$questionId) {
                throw new Exception('Question ID is required');
            }

            // 로컬 DB에서 먼저 확인
            $question = $db->selectOne(
                "SELECT * FROM questions WHERE id = ?",
                [$questionId]
            );

            if (!$question) {
                throw new Exception('Question not found');
            }

            echo json_encode([
                'success' => true,
                'data' => [
                    'id' => $question['id'],
                    'type' => $question['question_type'],
                    'data' => json_decode($question['question_data'], true),
                    'moodle_id' => $question['moodle_question_id']
                ]
            ]);
            break;

        case 'list':
            // 문제 목록 가져오기
            $courseId = $_GET['course_id'] ?? null;

            $query = "SELECT * FROM questions";
            $params = [];

            if ($courseId) {
                $query .= " WHERE moodle_course_id = ?";
                $params[] = $courseId;
            }

            $query .= " ORDER BY created_at DESC";

            $questions = $db->select($query, $params);

            $result = array_map(function($q) {
                return [
                    'id' => $q['id'],
                    'type' => $q['question_type'],
                    'data' => json_decode($q['question_data'], true),
                    'correct_answer' => $q['correct_answer']
                ];
            }, $questions);

            echo json_encode([
                'success' => true,
                'data' => $result
            ]);
            break;

        case 'sync':
            // Moodle에서 문제 동기화
            $moodleQuestionId = $_POST['moodle_question_id'] ?? null;
            $courseId = $_POST['course_id'] ?? null;

            if (!$moodleQuestionId) {
                throw new Exception('Moodle question ID is required');
            }

            // Moodle API로 문제 가져오기
            $moodleQuestion = $moodle->getQuestion($moodleQuestionId);

            if (!$moodleQuestion) {
                throw new Exception('Failed to fetch question from Moodle');
            }

            // 로컬 DB에 저장
            $questionId = $db->insert(
                "INSERT INTO questions (moodle_question_id, moodle_course_id, question_type, question_data, correct_answer)
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE question_data = VALUES(question_data), correct_answer = VALUES(correct_answer)",
                [
                    $moodleQuestionId,
                    $courseId ?? 0,
                    'area_calculation',
                    json_encode($moodleQuestion),
                    null
                ]
            );

            echo json_encode([
                'success' => true,
                'message' => 'Question synced successfully',
                'question_id' => $questionId
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
