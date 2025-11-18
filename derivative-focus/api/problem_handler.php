<?php
/**
 * Problem Handler API
 * Receives problems from Moodle and processes them for derivative rule detection
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/moodle.php';
require_once __DIR__ . '/../lib/DerivativeAnalyzer.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

class ProblemHandler {
    private $db;
    private $moodleAPI;
    private $analyzer;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
        $this->moodleAPI = new MoodleAPI();
        $this->analyzer = new DerivativeAnalyzer($this->db);
    }

    /**
     * Fetch problem from Moodle and analyze it
     */
    public function fetchFromMoodle($questionId) {
        try {
            // Get question data from Moodle
            $questionData = $this->moodleAPI->getQuestionData($questionId);

            if (!$questionData || isset($questionData['exception'])) {
                throw new Exception('Failed to fetch question from Moodle');
            }

            // Extract problem text
            $problemText = strip_tags($questionData['questiontext'] ?? '');
            $problemLatex = $this->extractLatex($questionData['questiontext'] ?? '');

            // Save to database
            $stmt = $this->db->prepare(
                "INSERT INTO problems (moodle_question_id, problem_text, problem_latex)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                 problem_text = VALUES(problem_text),
                 problem_latex = VALUES(problem_latex),
                 updated_at = CURRENT_TIMESTAMP"
            );

            $stmt->execute([$questionId, $problemText, $problemLatex]);
            $problemId = $this->db->lastInsertId() ?: $this->getProblemIdByMoodleId($questionId);

            // Analyze and detect derivative rules
            $rules = $this->analyzer->analyzeAndHighlight($problemId, $problemLatex ?: $problemText);

            return [
                'success' => true,
                'problem_id' => $problemId,
                'problem_text' => $problemText,
                'problem_latex' => $problemLatex,
                'detected_rules' => $rules
            ];

        } catch (Exception $e) {
            error_log('Error in fetchFromMoodle: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get problem by ID with detected rules
     */
    public function getProblem($problemId) {
        try {
            $stmt = $this->db->prepare(
                "SELECT p.*,
                        GROUP_CONCAT(
                            JSON_OBJECT(
                                'rule_id', dr.id,
                                'rule_name', dr.rule_name,
                                'rule_type', dr.rule_type,
                                'rule_formula', dr.rule_formula,
                                'matched_expression', pr.matched_expression,
                                'highlight_start', pr.highlight_start,
                                'highlight_end', pr.highlight_end
                            )
                        ) as rules
                 FROM problems p
                 LEFT JOIN problem_rules pr ON p.id = pr.problem_id
                 LEFT JOIN derivative_rules dr ON pr.rule_id = dr.id
                 WHERE p.id = ?
                 GROUP BY p.id"
            );

            $stmt->execute([$problemId]);
            $result = $stmt->fetch();

            if (!$result) {
                throw new Exception('Problem not found');
            }

            // Parse rules JSON
            $result['rules'] = $result['rules'] ?
                array_map('json_decode', explode(',', '[' . $result['rules'] . ']')) :
                [];

            return [
                'success' => true,
                'data' => $result
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Extract LaTeX from HTML content
     */
    private function extractLatex($html) {
        // Match MathJax/LaTeX delimiters
        if (preg_match('/\$\$(.*?)\$\$/s', $html, $matches)) {
            return $matches[1];
        }
        if (preg_match('/\\\[(.*?)\\\]/s', $html, $matches)) {
            return $matches[1];
        }
        if (preg_match('/\$(.*?)\$/s', $html, $matches)) {
            return $matches[1];
        }
        return null;
    }

    /**
     * Get problem ID by Moodle question ID
     */
    private function getProblemIdByMoodleId($moodleId) {
        $stmt = $this->db->prepare("SELECT id FROM problems WHERE moodle_question_id = ?");
        $stmt->execute([$moodleId]);
        $result = $stmt->fetch();
        return $result ? $result['id'] : null;
    }
}

// Handle API requests
$handler = new ProblemHandler();
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

try {
    if ($method === 'POST' && strpos($path, '/fetch-from-moodle') !== false) {
        $input = json_decode(file_get_contents('php://input'), true);
        $questionId = $input['question_id'] ?? null;

        if (!$questionId) {
            throw new Exception('question_id is required');
        }

        $response = $handler->fetchFromMoodle($questionId);

    } elseif ($method === 'GET' && strpos($path, '/problem/') !== false) {
        $parts = explode('/', trim($path, '/'));
        $problemId = end($parts);

        if (!is_numeric($problemId)) {
            throw new Exception('Invalid problem ID');
        }

        $response = $handler->getProblem($problemId);

    } else {
        throw new Exception('Invalid endpoint');
    }

    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
