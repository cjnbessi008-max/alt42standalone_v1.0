<?php
/**
 * ALT42 LMS Integration
 * Moodle 3.7 Integration Layer
 * PHP 7.1.9 / MySQL 5.7
 */

// Error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS headers for cross-origin requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'your_password_here');
define('DB_PREFIX', 'mdl_');

// Moodle configuration
define('MOODLE_DIR', '/path/to/moodle');
define('MOODLE_DATA', '/path/to/moodledata');

class MoodleLMSConnector {
    private $db;
    private $wsToken;

    public function __construct() {
        $this->connectDatabase();
    }

    /**
     * Connect to Moodle MySQL database
     */
    private function connectDatabase() {
        try {
            $this->db = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
                ]
            );
        } catch (PDOException $e) {
            $this->sendError('Database connection failed: ' . $e->getMessage());
        }
    }

    /**
     * Get quiz/problem data from Moodle
     */
    public function getProblemData($problemId = null) {
        try {
            $sql = "SELECT
                        q.id,
                        q.name as title,
                        q.questiontext as description,
                        q.qtype as type,
                        qc.name as category,
                        q.defaultmark as points
                    FROM " . DB_PREFIX . "question q
                    LEFT JOIN " . DB_PREFIX . "question_categories qc ON q.category = qc.id
                    WHERE q.qtype IN ('multichoice', 'shortanswer', 'numerical')";

            if ($problemId) {
                $sql .= " AND q.id = :problemId";
                $stmt = $this->db->prepare($sql);
                $stmt->execute(['problemId' => $problemId]);
                $problem = $stmt->fetch();
            } else {
                $sql .= " ORDER BY RAND() LIMIT 1";
                $stmt = $this->db->query($sql);
                $problem = $stmt->fetch();
            }

            if (!$problem) {
                return $this->generateMockProblem();
            }

            // Extract concepts from question text
            $problem['concepts'] = $this->extractConcepts($problem['description']);

            // Generate graph data based on concepts
            $problem['graphData'] = $this->generateGraphData($problem['concepts']);

            return $problem;
        } catch (PDOException $e) {
            $this->sendError('Failed to fetch problem: ' . $e->getMessage());
        }
    }

    /**
     * Get student progress data
     */
    public function getStudentProgress($studentId) {
        try {
            $sql = "SELECT
                        u.id,
                        u.username,
                        u.firstname,
                        u.lastname,
                        COUNT(DISTINCT qa.questionid) as attempted_questions,
                        AVG(qa.fraction) * 100 as average_score
                    FROM " . DB_PREFIX . "user u
                    LEFT JOIN " . DB_PREFIX . "question_attempts qa ON u.id = qa.userid
                    WHERE u.id = :studentId
                    GROUP BY u.id";

            $stmt = $this->db->prepare($sql);
            $stmt->execute(['studentId' => $studentId]);
            $progress = $stmt->fetch();

            if (!$progress) {
                return ['error' => 'Student not found'];
            }

            // Get concept mastery
            $progress['conceptMastery'] = $this->getConceptMastery($studentId);

            return $progress;
        } catch (PDOException $e) {
            $this->sendError('Failed to fetch progress: ' . $e->getMessage());
        }
    }

    /**
     * Submit student answer
     */
    public function submitAnswer($problemId, $answer, $studentId) {
        try {
            // Insert into question attempts
            $sql = "INSERT INTO " . DB_PREFIX . "question_attempts
                    (questionid, userid, timestart, timefinish, responsesummary)
                    VALUES (:problemId, :studentId, :timestart, :timefinish, :answer)";

            $stmt = $this->db->prepare($sql);
            $timestart = time();
            $timefinish = time();

            $stmt->execute([
                'problemId' => $problemId,
                'studentId' => $studentId,
                'timestart' => $timestart,
                'timefinish' => $timefinish,
                'answer' => $answer
            ]);

            // Grade the answer (simplified - in production, use Moodle's grading engine)
            $isCorrect = $this->gradeAnswer($problemId, $answer);

            // Log the event
            $this->logEvent('question_answered', [
                'problemId' => $problemId,
                'studentId' => $studentId,
                'answer' => $answer,
                'correct' => $isCorrect
            ]);

            return [
                'success' => true,
                'correct' => $isCorrect,
                'feedback' => $isCorrect ? '정답입니다!' : '다시 시도해보세요.',
                'timestamp' => date('Y-m-d H:i:s')
            ];
        } catch (PDOException $e) {
            $this->sendError('Failed to submit answer: ' . $e->getMessage());
        }
    }

    /**
     * Track student interaction
     */
    public function trackInteraction($eventType, $eventData, $studentId = null) {
        try {
            $sql = "INSERT INTO " . DB_PREFIX . "logstore_standard_log
                    (eventname, component, action, target, userid, timecreated, other)
                    VALUES (:eventname, :component, :action, :target, :userid, :timecreated, :other)";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                'eventname' => $eventType,
                'component' => 'mod_alt42',
                'action' => 'viewed',
                'target' => 'graph_intersection',
                'userid' => $studentId ?? 0,
                'timecreated' => time(),
                'other' => json_encode($eventData)
            ]);

            return ['success' => true];
        } catch (PDOException $e) {
            // Log silently, don't fail the main operation
            error_log('Failed to track interaction: ' . $e->getMessage());
            return ['success' => false];
        }
    }

    /**
     * Extract mathematical concepts from question text
     */
    private function extractConcepts($text) {
        $concepts = [];
        $keywords = [
            'fraction' => ['분수', 'fraction'],
            'addition' => ['덧셈', '더하', 'addition', 'add'],
            'subtraction' => ['뺄셈', '빼', 'subtraction', 'subtract'],
            'multiplication' => ['곱셈', '곱하', 'multiplication', 'multiply'],
            'division' => ['나눗셈', '나누', 'division', 'divide'],
            'numerator' => ['분자', 'numerator'],
            'denominator' => ['분모', 'denominator'],
            'common_denominator' => ['통분', 'common denominator']
        ];

        foreach ($keywords as $concept => $patterns) {
            foreach ($patterns as $pattern) {
                if (stripos($text, $pattern) !== false) {
                    $concepts[] = $concept;
                    break;
                }
            }
        }

        return array_unique($concepts);
    }

    /**
     * Generate graph data from concepts
     */
    private function generateGraphData($concepts) {
        $nodes = [];
        $edges = [];
        $nodeId = 0;

        $conceptLabels = [
            'fraction' => '분수',
            'addition' => '덧셈',
            'subtraction' => '뺄셈',
            'multiplication' => '곱셈',
            'division' => '나눗셈',
            'numerator' => '분자',
            'denominator' => '분모',
            'common_denominator' => '통분'
        ];

        // Create nodes
        foreach ($concepts as $concept) {
            $nodes[] = [
                'id' => $nodeId,
                'label' => $conceptLabels[$concept] ?? $concept,
                'concept' => $concept
            ];
            $nodeId++;
        }

        // Create edges based on concept relationships
        $relationships = [
            'fraction' => ['numerator', 'denominator'],
            'addition' => ['common_denominator'],
            'subtraction' => ['common_denominator']
        ];

        foreach ($relationships as $from => $toList) {
            $fromIndex = array_search($from, $concepts);
            if ($fromIndex === false) continue;

            foreach ($toList as $to) {
                $toIndex = array_search($to, $concepts);
                if ($toIndex !== false) {
                    $edges[] = [
                        'from' => $fromIndex,
                        'to' => $toIndex,
                        'label' => '포함'
                    ];
                }
            }
        }

        return [
            'nodes' => $nodes,
            'edges' => $edges
        ];
    }

    /**
     * Get concept mastery for student
     */
    private function getConceptMastery($studentId) {
        // Simplified - in production, analyze question attempts by concept
        return [
            'fraction' => 0.75 + (rand(0, 25) / 100),
            'addition' => 0.80 + (rand(0, 20) / 100),
            'subtraction' => 0.70 + (rand(0, 30) / 100),
            'multiplication' => 0.65 + (rand(0, 35) / 100)
        ];
    }

    /**
     * Grade student answer (simplified)
     */
    private function gradeAnswer($problemId, $answer) {
        // In production, retrieve correct answer from database and compare
        // For now, random grading for demonstration
        return rand(0, 100) > 30;
    }

    /**
     * Generate mock problem data
     */
    private function generateMockProblem() {
        return [
            'id' => 1,
            'title' => '분수의 덧셈',
            'description' => '다음 분수를 더하세요: 1/4 + 1/2',
            'type' => 'fraction_addition',
            'difficulty' => 'easy',
            'concepts' => ['fraction', 'addition', 'common_denominator'],
            'graphData' => [
                'nodes' => [
                    ['id' => 0, 'label' => '분수', 'concept' => 'fraction'],
                    ['id' => 1, 'label' => '덧셈', 'concept' => 'addition'],
                    ['id' => 2, 'label' => '통분', 'concept' => 'common_denominator']
                ],
                'edges' => [
                    ['from' => 0, 'to' => 1, 'label' => '연산'],
                    ['from' => 1, 'to' => 2, 'label' => '필요']
                ]
            ]
        ];
    }

    /**
     * Log event to file
     */
    private function logEvent($eventType, $data) {
        $logFile = __DIR__ . '/logs/lms-events.log';
        $logDir = dirname($logFile);

        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }

        $logEntry = date('Y-m-d H:i:s') . ' - ' . $eventType . ': ' . json_encode($data) . PHP_EOL;
        file_put_contents($logFile, $logEntry, FILE_APPEND);
    }

    /**
     * Send JSON response
     */
    private function sendResponse($data) {
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    /**
     * Send error response
     */
    private function sendError($message) {
        http_response_code(500);
        echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// Handle API requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$lms = new MoodleLMSConnector();
$action = $_GET['action'] ?? $_POST['action'] ?? 'getProblem';

switch ($action) {
    case 'getProblem':
        $problemId = $_GET['problemId'] ?? null;
        $data = $lms->getProblemData($problemId);
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        break;

    case 'getProgress':
        $studentId = $_GET['studentId'] ?? 1;
        $data = $lms->getStudentProgress($studentId);
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        break;

    case 'submitAnswer':
        $input = json_decode(file_get_contents('php://input'), true);
        $data = $lms->submitAnswer(
            $input['problemId'] ?? 1,
            $input['answer'] ?? '',
            $input['studentId'] ?? 1
        );
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        break;

    case 'trackInteraction':
        $input = json_decode(file_get_contents('php://input'), true);
        $data = $lms->trackInteraction(
            $input['eventType'] ?? 'unknown',
            $input['eventData'] ?? [],
            $input['studentId'] ?? null
        );
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        break;

    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action'], JSON_UNESCAPED_UNICODE);
        break;
}
