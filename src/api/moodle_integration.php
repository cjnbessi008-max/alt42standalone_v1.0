<?php
/**
 * Moodle Integration API
 * Connects with Moodle 3.7 LMS to fetch problem information
 * Compatible with PHP 7.1.9 and MySQL 5.7
 */

require_once __DIR__ . '/../../config/database.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

class MoodleIntegration {
    private $db;
    private $conn;

    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    /**
     * Get quadratic inequality problem from Moodle
     * @param int $question_id
     * @return array|null
     */
    public function getProblem($question_id = null) {
        try {
            if ($question_id) {
                // Fetch specific problem from Moodle database
                $query = "SELECT
                            q.id,
                            q.name as title,
                            q.questiontext as problem_text,
                            qa.value as answer_data
                          FROM mdl_question q
                          LEFT JOIN mdl_question_answers qa ON q.id = qa.question
                          WHERE q.id = :question_id
                          AND q.qtype = 'calculated'
                          LIMIT 1";

                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(':question_id', $question_id, PDO::PARAM_INT);
                $stmt->execute();

                $result = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($result) {
                    return $this->parseProblemData($result);
                }
            }

            // If no problem found or no ID provided, return sample problem
            return $this->getSampleProblem();

        } catch (PDOException $e) {
            error_log("Database Error: " . $e->getMessage());
            return $this->getSampleProblem();
        }
    }

    /**
     * Parse problem data and extract inequality parameters
     * @param array $data
     * @return array
     */
    private function parseProblemData($data) {
        // Extract inequality from problem text
        // Format: ax^2 + bx + c > 0 or ax^2 + bx + c < 0
        preg_match('/(-?\d*\.?\d*)\s*x\s*\^\s*2\s*([+\-])\s*(-?\d*\.?\d*)\s*x\s*([+\-])\s*(-?\d*\.?\d*)\s*([<>]=?)\s*0/i',
                   $data['problem_text'], $matches);

        if (count($matches) >= 6) {
            $a = floatval($matches[1] ?: 1);
            $b = floatval(($matches[2] === '-' ? '-' : '') . $matches[3]);
            $c = floatval(($matches[4] === '-' ? '-' : '') . $matches[5]);
            $operator = $matches[6];

            return [
                'id' => $data['id'],
                'title' => $data['title'],
                'problem_text' => $data['problem_text'],
                'inequality' => [
                    'a' => $a,
                    'b' => $b,
                    'c' => $c,
                    'operator' => $operator
                ]
            ];
        }

        return $this->getSampleProblem();
    }

    /**
     * Get sample problem for demonstration
     * @return array
     */
    private function getSampleProblem() {
        return [
            'id' => 0,
            'title' => '2차 부등식 예제',
            'problem_text' => 'x² - 4x + 3 < 0의 해를 구하시오.',
            'inequality' => [
                'a' => 1,
                'b' => -4,
                'c' => 3,
                'operator' => '<'
            ]
        ];
    }

    /**
     * Submit student answer
     * @param int $question_id
     * @param int $user_id
     * @param string $answer
     * @return array
     */
    public function submitAnswer($question_id, $user_id, $answer) {
        try {
            $query = "INSERT INTO mdl_question_attempts
                      (questionid, userid, responsesummary, timemodified)
                      VALUES (:question_id, :user_id, :answer, :time)";

            $stmt = $this->conn->prepare($query);
            $time = time();

            $stmt->bindParam(':question_id', $question_id, PDO::PARAM_INT);
            $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt->bindParam(':answer', $answer, PDO::PARAM_STR);
            $stmt->bindParam(':time', $time, PDO::PARAM_INT);

            $stmt->execute();

            return [
                'success' => true,
                'message' => '답안이 제출되었습니다.'
            ];

        } catch (PDOException $e) {
            error_log("Submit Error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => '답안 제출에 실패했습니다.'
            ];
        }
    }
}

// Handle API requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$moodle = new MoodleIntegration();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $question_id = isset($_GET['id']) ? intval($_GET['id']) : null;
    $problem = $moodle->getProblem($question_id);
    echo json_encode($problem, JSON_UNESCAPED_UNICODE);

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $question_id = isset($input['question_id']) ? intval($input['question_id']) : 0;
    $user_id = isset($input['user_id']) ? intval($input['user_id']) : 0;
    $answer = isset($input['answer']) ? $input['answer'] : '';

    $result = $moodle->submitAnswer($question_id, $user_id, $answer);
    echo json_encode($result, JSON_UNESCAPED_UNICODE);
}
