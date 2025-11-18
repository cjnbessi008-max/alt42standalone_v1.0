<?php
/**
 * Vector Digest API
 * Handles Moodle integration and vector concept extraction
 * Compatible with Moodle 3.7, PHP 7.1.9
 */

require_once(__DIR__ . '/../config/config.php');
require_once(__DIR__ . '/VectorAnalyzer.php');

class VectorDigestAPI {

    private $db;
    private $config;
    private $analyzer;

    public function __construct($moodle_db = null) {
        $this->config = require(__DIR__ . '/../config/config.php');

        // Use Moodle's DB if available, otherwise create new connection
        if ($moodle_db !== null) {
            $this->db = $moodle_db;
        } else {
            $this->connect_db();
        }

        $this->analyzer = new VectorAnalyzer($this->config['vector_keywords']);
    }

    /**
     * Connect to database
     */
    private function connect_db() {
        try {
            $dsn = "mysql:host={$this->config['db']['host']};dbname={$this->config['db']['name']};charset=utf8mb4";
            $this->db = new PDO($dsn, $this->config['db']['user'], $this->config['db']['pass']);
            $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e) {
            error_log("Vector Digest DB Connection Error: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get question from Moodle by ID
     */
    public function get_question($question_id) {
        $prefix = $this->config['db']['prefix'];
        $sql = "SELECT q.id, q.questiontext, q.generalfeedback,
                       qc.name as category, c.id as courseid, c.fullname as coursename
                FROM {$prefix}question q
                LEFT JOIN {$prefix}question_categories qc ON q.category = qc.id
                LEFT JOIN {$prefix}course c ON qc.contextid = c.id
                WHERE q.id = :questionid";

        try {
            $stmt = $this->db->prepare($sql);
            $stmt->execute(['questionid' => $question_id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error fetching question: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Generate vector digest for a question
     */
    public function generate_digest($question_id) {
        // Check cache first
        $cached = $this->get_cached_digest($question_id);
        if ($cached !== null) {
            return $cached;
        }

        // Get question data
        $question = $this->get_question($question_id);
        if (!$question) {
            return ['error' => 'Question not found'];
        }

        // Analyze for vector content
        $question_text = strip_tags($question['questiontext']);
        $analysis = $this->analyzer->analyze($question_text);

        if (!$analysis['has_vector_content']) {
            return ['error' => 'No vector content detected', 'confidence' => $analysis['confidence']];
        }

        // Generate 3-line summary
        $digest = $this->analyzer->generate_summary($question_text, $analysis);

        // Save to database
        $digest_id = $this->save_digest($question_id, $question['courseid'], $digest, $analysis);

        return [
            'success' => true,
            'digest_id' => $digest_id,
            'question_id' => $question_id,
            'line1' => $digest['line1'],
            'line2' => $digest['line2'],
            'line3' => $digest['line3'],
            'concepts' => $analysis['concepts'],
            'confidence' => $analysis['confidence'],
            'language' => $digest['language']
        ];
    }

    /**
     * Get cached digest
     */
    private function get_cached_digest($question_id) {
        $prefix = $this->config['db']['prefix'];
        $sql = "SELECT * FROM {$prefix}vector_digest WHERE questionid = :questionid";

        try {
            $stmt = $this->db->prepare($sql);
            $stmt->execute(['questionid' => $question_id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($result) {
                return [
                    'success' => true,
                    'cached' => true,
                    'digest_id' => $result['id'],
                    'question_id' => $question_id,
                    'line1' => $result['digest_line1'],
                    'line2' => $result['digest_line2'],
                    'line3' => $result['digest_line3'],
                    'concepts' => json_decode($result['vector_concepts'], true),
                    'confidence' => (float)$result['confidence_score'],
                    'language' => $result['language']
                ];
            }
            return null;
        } catch (PDOException $e) {
            error_log("Error fetching cached digest: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Save digest to database
     */
    private function save_digest($question_id, $course_id, $digest, $analysis) {
        $prefix = $this->config['db']['prefix'];
        $sql = "INSERT INTO {$prefix}vector_digest
                (questionid, courseid, digest_line1, digest_line2, digest_line3,
                 vector_concepts, confidence_score, language, timecreated, timemodified)
                VALUES (:questionid, :courseid, :line1, :line2, :line3,
                        :concepts, :confidence, :language, :timecreated, :timemodified)
                ON DUPLICATE KEY UPDATE
                digest_line1 = :line1, digest_line2 = :line2, digest_line3 = :line3,
                vector_concepts = :concepts, confidence_score = :confidence,
                timemodified = :timemodified";

        try {
            $stmt = $this->db->prepare($sql);
            $time = time();
            $stmt->execute([
                'questionid' => $question_id,
                'courseid' => $course_id,
                'line1' => $digest['line1'],
                'line2' => $digest['line2'],
                'line3' => $digest['line3'],
                'concepts' => json_encode($analysis['concepts']),
                'confidence' => $analysis['confidence'],
                'language' => $digest['language'],
                'timecreated' => $time,
                'timemodified' => $time
            ]);

            return $this->db->lastInsertId();
        } catch (PDOException $e) {
            error_log("Error saving digest: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Log user interaction
     */
    public function log_interaction($user_id, $question_id, $digest_id, $action, $duration = null) {
        $prefix = $this->config['db']['prefix'];
        $sql = "INSERT INTO {$prefix}vector_digest_log
                (userid, questionid, digestid, action, duration, timecreated)
                VALUES (:userid, :questionid, :digestid, :action, :duration, :timecreated)";

        try {
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                'userid' => $user_id,
                'questionid' => $question_id,
                'digestid' => $digest_id,
                'action' => $action,
                'duration' => $duration,
                'timecreated' => time()
            ]);
            return true;
        } catch (PDOException $e) {
            error_log("Error logging interaction: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get digest for display (API endpoint)
     */
    public function get_digest_for_display($question_id) {
        $digest = $this->get_cached_digest($question_id);

        if ($digest === null) {
            $digest = $this->generate_digest($question_id);
        }

        header('Content-Type: application/json');
        echo json_encode($digest);
    }
}

// API Endpoint handling
if (php_sapi_name() !== 'cli') {
    $action = $_GET['action'] ?? $_POST['action'] ?? '';
    $question_id = $_GET['questionid'] ?? $_POST['questionid'] ?? 0;

    $api = new VectorDigestAPI();

    switch ($action) {
        case 'get_digest':
            $api->get_digest_for_display($question_id);
            break;

        case 'generate':
            $result = $api->generate_digest($question_id);
            header('Content-Type: application/json');
            echo json_encode($result);
            break;

        case 'log':
            $user_id = $_POST['userid'] ?? 0;
            $digest_id = $_POST['digestid'] ?? 0;
            $log_action = $_POST['log_action'] ?? '';
            $duration = $_POST['duration'] ?? null;

            $result = $api->log_interaction($user_id, $question_id, $digest_id, $log_action, $duration);
            header('Content-Type: application/json');
            echo json_encode(['success' => $result]);
            break;

        default:
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Invalid action']);
    }
}
