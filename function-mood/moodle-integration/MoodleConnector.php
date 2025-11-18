<?php
/**
 * Moodle LMS Integration Connector
 * Compatible with Moodle 3.7 Web Services
 * PHP 7.1.9
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/Database.php';

class MoodleConnector {
    private $moodleUrl;
    private $token;
    private $db;

    public function __construct() {
        $this->moodleUrl = MOODLE_URL;
        $this->token = MOODLE_TOKEN;
        $this->db = Database::getInstance();
    }

    /**
     * Call Moodle Web Service API
     */
    private function callMoodleAPI($functionName, $params = []) {
        $params['wstoken'] = $this->token;
        $params['wsfunction'] = $functionName;
        $params['moodlewsrestformat'] = 'json';

        $url = $this->moodleUrl . '/webservice/rest/server.php';

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, API_TIMEOUT);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            throw new Exception("Moodle API call failed with HTTP code: $httpCode");
        }

        $data = json_decode($response, true);

        if (isset($data['exception'])) {
            throw new Exception("Moodle API error: " . $data['message']);
        }

        return $data;
    }

    /**
     * Fetch problems from Moodle course
     * Using direct database access for custom problem types
     */
    public function fetchProblemsFromCourse($courseId) {
        $moodleDb = $this->db->getMoodleConnection();

        if ($moodleDb === null) {
            throw new Exception("Cannot connect to Moodle database");
        }

        $prefix = MOODLE_DB_PREFIX;

        // Query to get quiz questions with function-related content
        $sql = "
            SELECT
                q.id as question_id,
                q.name,
                q.questiontext,
                q.qtype,
                qi.info as metadata,
                c.id as course_id,
                c.fullname as course_name
            FROM {$prefix}question q
            INNER JOIN {$prefix}quiz_slots qs ON q.id = qs.questionid
            INNER JOIN {$prefix}quiz qz ON qs.quizid = qz.id
            INNER JOIN {$prefix}course c ON qz.course = c.id
            LEFT JOIN {$prefix}question_info qi ON q.id = qi.questionid
            WHERE c.id = :course_id
            AND (
                q.questiontext LIKE '%function%'
                OR q.questiontext LIKE '%함수%'
                OR q.qtype = 'calculated'
            )
            ORDER BY q.id DESC
        ";

        try {
            $stmt = $moodleDb->prepare($sql);
            $stmt->execute(['course_id' => $courseId]);
            $problems = $stmt->fetchAll();

            // Log the sync
            $this->logSync('problem_fetch', "course/$courseId", 'success', count($problems));

            return $problems;
        } catch (PDOException $e) {
            $this->logSync('problem_fetch', "course/$courseId", 'failed', 0, $e->getMessage());
            throw $e;
        }
    }

    /**
     * Parse function expression from problem text
     */
    public function parseFunctionExpression($questionText) {
        // Remove HTML tags
        $text = strip_tags($questionText);

        // Common patterns for function expressions
        $patterns = [
            '/f\(x\)\s*=\s*([^,\.\n]+)/',
            '/y\s*=\s*([^,\.\n]+)/',
            '/함수[:\s]+([^,\.\n]+)/',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                return trim($matches[1]);
            }
        }

        return null;
    }

    /**
     * Import problem into Function Mood system
     */
    public function importProblem($moodleProblemId, $courseId, $functionExpression, $metadata = []) {
        $sql = "
            INSERT INTO problems
            (moodle_problem_id, moodle_course_id, problem_type, function_expression, metadata)
            VALUES (:moodle_id, :course_id, :type, :expression, :metadata)
            ON DUPLICATE KEY UPDATE
                function_expression = :expression,
                metadata = :metadata,
                updated_at = CURRENT_TIMESTAMP
        ";

        return $this->db->insert($sql, [
            'moodle_id' => $moodleProblemId,
            'course_id' => $courseId,
            'type' => 'moodle_quiz',
            'expression' => $functionExpression,
            'metadata' => json_encode($metadata)
        ]);
    }

    /**
     * Sync problems from Moodle course
     */
    public function syncCourseProblems($courseId) {
        $problems = $this->fetchProblemsFromCourse($courseId);
        $imported = 0;

        foreach ($problems as $problem) {
            $expression = $this->parseFunctionExpression($problem['questiontext']);

            if ($expression) {
                $metadata = [
                    'question_name' => $problem['name'],
                    'question_type' => $problem['qtype'],
                    'course_name' => $problem['course_name'],
                    'imported_at' => date('Y-m-d H:i:s')
                ];

                try {
                    $this->importProblem(
                        $problem['question_id'],
                        $courseId,
                        $expression,
                        $metadata
                    );
                    $imported++;
                } catch (Exception $e) {
                    error_log("Failed to import problem {$problem['question_id']}: " . $e->getMessage());
                }
            }
        }

        return [
            'total' => count($problems),
            'imported' => $imported,
            'skipped' => count($problems) - $imported
        ];
    }

    /**
     * Get student data from Moodle
     */
    public function getStudentInfo($userId) {
        try {
            return $this->callMoodleAPI('core_user_get_users_by_field', [
                'field' => 'id',
                'values' => [$userId]
            ]);
        } catch (Exception $e) {
            error_log("Failed to fetch student info: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get course information
     */
    public function getCourseInfo($courseId) {
        try {
            return $this->callMoodleAPI('core_course_get_courses', [
                'options' => ['ids' => [$courseId]]
            ]);
        } catch (Exception $e) {
            error_log("Failed to fetch course info: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Log synchronization activity
     */
    private function logSync($type, $endpoint, $status, $recordsProcessed = 0, $errorMessage = null) {
        $sql = "
            INSERT INTO lms_sync_log
            (sync_type, moodle_endpoint, status, records_processed, error_message)
            VALUES (:type, :endpoint, :status, :records, :error)
        ";

        $this->db->query($sql, [
            'type' => $type,
            'endpoint' => $endpoint,
            'status' => $status,
            'records' => $recordsProcessed,
            'error' => $errorMessage
        ]);
    }

    /**
     * Test Moodle connection
     */
    public function testConnection() {
        try {
            $result = $this->callMoodleAPI('core_webservice_get_site_info');
            return [
                'success' => true,
                'site_name' => $result['sitename'] ?? 'Unknown',
                'moodle_version' => $result['release'] ?? 'Unknown'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}
