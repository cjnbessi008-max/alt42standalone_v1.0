<?php
/**
 * API Controller
 * AJAX 요청 처리
 */

class ApiController {
    private $moodleIntegration;
    private $patternLoop;

    public function __construct() {
        $this->moodleIntegration = new MoodleIntegration();
        $this->patternLoop = new PatternLoop();
    }

    /**
     * JSON 응답 전송
     */
    private function sendJson($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }

    /**
     * 요청 처리
     */
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $action = $_GET['action'] ?? '';

        // CORS 헤더 (개발 환경)
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');

        if ($method === 'OPTIONS') {
            exit;
        }

        // 액션 라우팅
        switch ($action) {
            case 'get_patterns':
                $this->getPatterns();
                break;
            case 'get_question':
                $this->getQuestion();
                break;
            case 'sync_quiz':
                $this->syncQuiz();
                break;
            case 'get_question_patterns':
                $this->getQuestionPatterns();
                break;
            case 'create_pattern':
                $this->createPattern();
                break;
            case 'update_pattern':
                $this->updatePattern();
                break;
            case 'delete_pattern':
                $this->deletePattern();
                break;
            case 'link_pattern':
                $this->linkPattern();
                break;
            default:
                $this->sendJson(['error' => 'Invalid action'], 400);
        }
    }

    /**
     * 모든 활성 패턴 가져오기
     */
    private function getPatterns() {
        $patterns = $this->patternLoop->getAllActivePatterns();
        $this->sendJson(['success' => true, 'data' => $patterns]);
    }

    /**
     * 문제 정보 가져오기
     */
    private function getQuestion() {
        $questionId = $_GET['id'] ?? null;

        if (!$questionId) {
            $this->sendJson(['error' => 'Question ID required'], 400);
        }

        try {
            $db = getDBConnection();
            $sql = "SELECT * FROM moodle_questions WHERE id = :id";
            $stmt = $db->prepare($sql);
            $stmt->execute(['id' => $questionId]);
            $question = $stmt->fetch();

            if (!$question) {
                $this->sendJson(['error' => 'Question not found'], 404);
            }

            // JSON 디코드
            $question['question_data'] = json_decode($question['question_data'], true);
            $question['pattern_config'] = json_decode($question['pattern_config'], true);

            $this->sendJson(['success' => true, 'data' => $question]);
        } catch (Exception $e) {
            $this->sendJson(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Moodle 퀴즈 동기화
     */
    private function syncQuiz() {
        $quizId = $_POST['quiz_id'] ?? null;

        if (!$quizId) {
            $this->sendJson(['error' => 'Quiz ID required'], 400);
        }

        $result = $this->moodleIntegration->syncQuiz($quizId);
        $this->sendJson(['success' => true, 'data' => $result]);
    }

    /**
     * 문제에 연결된 패턴들 가져오기
     */
    private function getQuestionPatterns() {
        $questionId = $_GET['question_id'] ?? null;

        if (!$questionId) {
            $this->sendJson(['error' => 'Question ID required'], 400);
        }

        $patterns = $this->patternLoop->getPatternsByQuestion($questionId);
        $this->sendJson(['success' => true, 'data' => $patterns]);
    }

    /**
     * 새 패턴 생성
     */
    private function createPattern() {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data || !isset($data['name']) || !isset($data['function_type'])) {
            $this->sendJson(['error' => 'Invalid pattern data'], 400);
        }

        $patternId = $this->patternLoop->createPattern($data);

        if ($patternId) {
            $this->sendJson(['success' => true, 'data' => ['id' => $patternId]]);
        } else {
            $this->sendJson(['error' => 'Failed to create pattern'], 500);
        }
    }

    /**
     * 패턴 업데이트
     */
    private function updatePattern() {
        $data = json_decode(file_get_contents('php://input'), true);
        $patternId = $_GET['id'] ?? null;

        if (!$patternId || !$data) {
            $this->sendJson(['error' => 'Pattern ID and data required'], 400);
        }

        $result = $this->patternLoop->updatePattern($patternId, $data);

        if ($result) {
            $this->sendJson(['success' => true]);
        } else {
            $this->sendJson(['error' => 'Failed to update pattern'], 500);
        }
    }

    /**
     * 패턴 삭제
     */
    private function deletePattern() {
        $patternId = $_GET['id'] ?? null;

        if (!$patternId) {
            $this->sendJson(['error' => 'Pattern ID required'], 400);
        }

        $result = $this->patternLoop->deletePattern($patternId);

        if ($result) {
            $this->sendJson(['success' => true]);
        } else {
            $this->sendJson(['error' => 'Failed to delete pattern'], 500);
        }
    }

    /**
     * 문제와 패턴 연결
     */
    private function linkPattern() {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['question_id']) || !isset($data['pattern_id'])) {
            $this->sendJson(['error' => 'Question ID and Pattern ID required'], 400);
        }

        $result = $this->patternLoop->linkPatternToQuestion(
            $data['question_id'],
            $data['pattern_id'],
            $data['display_order'] ?? 0
        );

        if ($result) {
            $this->sendJson(['success' => true]);
        } else {
            $this->sendJson(['error' => 'Failed to link pattern'], 500);
        }
    }
}
