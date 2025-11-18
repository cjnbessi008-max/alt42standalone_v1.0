<?php
/**
 * Truth Rhythm - Moodle LMS Connector
 * Moodle 3.7 Web Services Integration
 */

require_once 'config.php';

class MoodleConnector {
    private $moodleUrl;
    private $token;
    private $restFormat = 'json';

    public function __construct() {
        $this->moodleUrl = MOODLE_URL;
        $this->token = MOODLE_TOKEN;
    }

    /**
     * Make API call to Moodle
     */
    private function callMoodleApi($functionName, $params = []) {
        $url = $this->moodleUrl . '/webservice/rest/server.php';

        $requestParams = array_merge([
            'wstoken' => $this->token,
            'wsfunction' => $functionName,
            'moodlewsrestformat' => $this->restFormat
        ], $params);

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($requestParams));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, API_TIMEOUT);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if (curl_errno($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new Exception("Moodle API Error: " . $error);
        }

        curl_close($ch);

        $data = json_decode($response, true);

        if ($httpCode !== 200) {
            throw new Exception("Moodle API returned HTTP {$httpCode}");
        }

        // Check for Moodle error response
        if (isset($data['exception'])) {
            throw new Exception("Moodle Error: " . $data['message']);
        }

        return $data;
    }

    /**
     * Get questions from Moodle
     */
    public function getQuestions($categoryId = null, $limit = 10) {
        try {
            $params = [
                'limitnum' => $limit
            ];

            if ($categoryId !== null) {
                $params['categoryid'] = $categoryId;
            }

            // Moodle 3.7의 질문 뱅크에서 질문 가져오기
            $questions = $this->callMoodleApi('core_question_get_random_question_summaries', $params);

            return $this->formatQuestions($questions);
        } catch (Exception $e) {
            logMessage("Failed to get questions from Moodle: " . $e->getMessage(), 'ERROR');
            return [];
        }
    }

    /**
     * Get specific question by ID
     */
    public function getQuestionById($questionId) {
        try {
            $params = [
                'questionid' => $questionId
            ];

            $question = $this->callMoodleApi('core_question_get_question_data', $params);

            return $this->formatQuestion($question);
        } catch (Exception $e) {
            logMessage("Failed to get question {$questionId} from Moodle: " . $e->getMessage(), 'ERROR');
            return null;
        }
    }

    /**
     * Sync questions from Moodle to local database
     */
    public function syncQuestions($categoryId = null, $limit = 50) {
        $pdo = getDbConnection();
        $moodleQuestions = $this->getQuestions($categoryId, $limit);

        $synced = 0;
        $failed = 0;

        foreach ($moodleQuestions as $mq) {
            try {
                // Check if question already exists
                $stmt = $pdo->prepare("
                    SELECT id FROM questions WHERE moodle_question_id = ?
                ");
                $stmt->execute([$mq['id']]);
                $existing = $stmt->fetch();

                if ($existing) {
                    // Update existing question
                    $stmt = $pdo->prepare("
                        UPDATE questions
                        SET question_text = ?,
                            correct_answer = ?,
                            difficulty_level = ?,
                            category = ?,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE moodle_question_id = ?
                    ");
                    $stmt->execute([
                        $mq['question_text'],
                        $mq['correct_answer'],
                        $mq['difficulty_level'],
                        $mq['category'],
                        $mq['id']
                    ]);
                } else {
                    // Insert new question
                    $stmt = $pdo->prepare("
                        INSERT INTO questions (
                            moodle_question_id,
                            question_text,
                            correct_answer,
                            difficulty_level,
                            category,
                            explanation
                        ) VALUES (?, ?, ?, ?, ?, ?)
                    ");
                    $stmt->execute([
                        $mq['id'],
                        $mq['question_text'],
                        $mq['correct_answer'],
                        $mq['difficulty_level'],
                        $mq['category'],
                        $mq['explanation']
                    ]);
                }

                $synced++;
            } catch (Exception $e) {
                logMessage("Failed to sync question {$mq['id']}: " . $e->getMessage(), 'ERROR');
                $failed++;
            }
        }

        return [
            'synced' => $synced,
            'failed' => $failed,
            'total' => count($moodleQuestions)
        ];
    }

    /**
     * Get user info from Moodle
     */
    public function getUserInfo($username) {
        try {
            $params = [
                'criteria' => [
                    [
                        'key' => 'username',
                        'value' => $username
                    ]
                ]
            ];

            $users = $this->callMoodleApi('core_user_get_users', $params);

            if (!empty($users['users'])) {
                return $users['users'][0];
            }

            return null;
        } catch (Exception $e) {
            logMessage("Failed to get user info from Moodle: " . $e->getMessage(), 'ERROR');
            return null;
        }
    }

    /**
     * Submit grade to Moodle (if needed)
     */
    public function submitGrade($userId, $courseId, $itemId, $grade) {
        try {
            $params = [
                'source' => 'truth_rhythm',
                'courseid' => $courseId,
                'component' => 'mod_assign',
                'itemid' => $itemId,
                'itemnumber' => 0,
                'grades' => [
                    [
                        'userid' => $userId,
                        'grade' => $grade
                    ]
                ]
            ];

            return $this->callMoodleApi('core_grades_update_grades', $params);
        } catch (Exception $e) {
            logMessage("Failed to submit grade to Moodle: " . $e->getMessage(), 'ERROR');
            return false;
        }
    }

    /**
     * Format questions from Moodle response
     */
    private function formatQuestions($moodleData) {
        $formatted = [];

        if (!is_array($moodleData)) {
            return $formatted;
        }

        foreach ($moodleData as $item) {
            $formatted[] = $this->formatQuestion($item);
        }

        return $formatted;
    }

    /**
     * Format single question
     */
    private function formatQuestion($item) {
        // Moodle의 True/False 질문 타입 처리
        $correctAnswer = false;
        $questionText = $item['questiontext'] ?? $item['name'] ?? '';

        // HTML 태그 제거
        $questionText = strip_tags($questionText);

        // True/False 답변 파싱
        if (isset($item['answer'])) {
            $correctAnswer = (strtolower($item['answer']) === 'true' || $item['answer'] === '1');
        }

        // 난이도 추정 (질문 길이나 카테고리 기반)
        $difficulty = 'medium';
        $textLength = strlen($questionText);

        if ($textLength < 50) {
            $difficulty = 'easy';
        } elseif ($textLength > 150) {
            $difficulty = 'hard';
        }

        return [
            'id' => $item['id'] ?? null,
            'question_text' => $questionText,
            'correct_answer' => $correctAnswer,
            'difficulty_level' => $difficulty,
            'category' => $item['category'] ?? 'general',
            'explanation' => $item['generalfeedback'] ?? null
        ];
    }

    /**
     * Test Moodle connection
     */
    public function testConnection() {
        try {
            $siteInfo = $this->callMoodleApi('core_webservice_get_site_info');

            return [
                'success' => true,
                'site_name' => $siteInfo['sitename'] ?? 'Unknown',
                'moodle_version' => $siteInfo['release'] ?? 'Unknown',
                'user' => $siteInfo['username'] ?? 'Unknown'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}

/**
 * Standalone test endpoint
 */
if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'])) {
    setCorsHeaders();

    $action = $_GET['action'] ?? 'test';
    $connector = new MoodleConnector();

    switch ($action) {
        case 'test':
            $result = $connector->testConnection();
            successResponse($result);
            break;

        case 'sync':
            requireLogin();
            $categoryId = $_GET['category'] ?? null;
            $limit = $_GET['limit'] ?? 50;
            $result = $connector->syncQuestions($categoryId, $limit);
            successResponse($result, 'Questions synced successfully');
            break;

        case 'questions':
            $categoryId = $_GET['category'] ?? null;
            $limit = $_GET['limit'] ?? 10;
            $questions = $connector->getQuestions($categoryId, $limit);
            successResponse($questions);
            break;

        default:
            errorResponse('Invalid action', 400);
    }
}
