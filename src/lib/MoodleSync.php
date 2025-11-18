<?php
/**
 * Moodle Data Synchronization Class
 *
 * Reads quiz attempt data from Moodle database
 * and synchronizes it with the standalone app database
 */

require_once __DIR__ . '/Database.php';

class MoodleSync {
    private $db;
    private $prefix;

    public function __construct() {
        $this->db = Database::getInstance();
        $this->prefix = $this->db->getMoodlePrefix();
    }

    /**
     * Sync all quiz attempts from Moodle
     */
    public function syncQuizAttempts($limit = null) {
        $sync_id = $this->logSyncStart('quiz_attempts');

        try {
            $sql = "SELECT
                        qa.id as attempt_id,
                        qa.quiz,
                        qa.userid,
                        qa.attempt,
                        qa.timestart,
                        qa.timefinish,
                        qa.timemodified,
                        qa.state,
                        qa.sumgrades,
                        qas.id as step_id,
                        qas.questionattemptid,
                        qas.sequencenumber,
                        qas.state as step_state,
                        qas.timecreated,
                        qas.fraction,
                        qad.name as data_name,
                        qad.value as data_value,
                        qatt.questionid,
                        qatt.slot,
                        qatt.maxmark
                    FROM {$this->prefix}quiz_attempts qa
                    LEFT JOIN {$this->prefix}question_attempts qatt ON qatt.questionusageid = qa.uniqueid
                    LEFT JOIN {$this->prefix}question_attempt_steps qas ON qas.questionattemptid = qatt.id
                    LEFT JOIN {$this->prefix}question_attempt_step_data qad ON qad.attemptstepid = qas.id
                    WHERE qa.state = 'finished'
                    ORDER BY qa.timemodified DESC";

            if ($limit) {
                $sql .= " LIMIT " . intval($limit);
            }

            $moodle_conn = $this->db->getMoodleConnection();
            if (!$moodle_conn) {
                throw new Exception("Moodle database connection not available");
            }

            $stmt = $moodle_conn->query($sql);
            $attempts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $processed = 0;
            $failed = 0;

            foreach ($attempts as $attempt) {
                try {
                    $this->processAttempt($attempt);
                    $processed++;
                } catch (Exception $e) {
                    $failed++;
                    log_message("Failed to process attempt {$attempt['attempt_id']}: " . $e->getMessage(), 'ERROR');
                }
            }

            $this->logSyncComplete($sync_id, 'success', $processed, $failed);
            return ['processed' => $processed, 'failed' => $failed];

        } catch (Exception $e) {
            $this->logSyncComplete($sync_id, 'failed', 0, 0, $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get quiz attempts for a specific student
     */
    public function getStudentAttempts($user_id) {
        try {
            $sql = "SELECT
                        qa.id as attempt_id,
                        qa.quiz,
                        qa.userid,
                        qa.attempt,
                        qa.timestart,
                        qa.timefinish,
                        qa.sumgrades,
                        q.name as quiz_name,
                        q.grade as max_grade
                    FROM {$this->prefix}quiz_attempts qa
                    JOIN {$this->prefix}quiz q ON q.id = qa.quiz
                    WHERE qa.userid = :userid
                    AND qa.state = 'finished'
                    ORDER BY qa.timemodified DESC";

            $stmt = $this->db->queryMoodle($sql, [':userid' => $user_id]);
            return $stmt->fetchAll();

        } catch (Exception $e) {
            log_message("Failed to get student attempts: " . $e->getMessage(), 'ERROR');
            return [];
        }
    }

    /**
     * Get question attempt details
     */
    public function getQuestionAttempts($attempt_id) {
        try {
            $sql = "SELECT
                        qatt.id,
                        qatt.questionid,
                        qatt.slot,
                        qatt.maxmark,
                        qas.id as step_id,
                        qas.sequencenumber,
                        qas.state,
                        qas.timecreated,
                        qas.fraction,
                        q.name as question_name,
                        q.questiontext,
                        q.qtype
                    FROM {$this->prefix}quiz_attempts qa
                    JOIN {$this->prefix}question_attempts qatt ON qatt.questionusageid = qa.uniqueid
                    LEFT JOIN {$this->prefix}question_attempt_steps qas ON qas.questionattemptid = qatt.id
                    LEFT JOIN {$this->prefix}question q ON q.id = qatt.questionid
                    WHERE qa.id = :attempt_id
                    AND qas.sequencenumber > 0
                    ORDER BY qatt.slot, qas.sequencenumber";

            $stmt = $this->db->queryMoodle($sql, [':attempt_id' => $attempt_id]);
            return $stmt->fetchAll();

        } catch (Exception $e) {
            log_message("Failed to get question attempts: " . $e->getMessage(), 'ERROR');
            return [];
        }
    }

    /**
     * Get question details by ID
     */
    public function getQuestion($question_id) {
        try {
            $sql = "SELECT
                        q.id,
                        q.name,
                        q.questiontext,
                        q.qtype,
                        q.defaultmark,
                        qc.name as category_name,
                        qc.contextid
                    FROM {$this->prefix}question q
                    LEFT JOIN {$this->prefix}question_categories qc ON qc.id = q.category
                    WHERE q.id = :question_id";

            $stmt = $this->db->queryMoodle($sql, [':question_id' => $question_id]);
            return $stmt->fetch();

        } catch (Exception $e) {
            log_message("Failed to get question: " . $e->getMessage(), 'ERROR');
            return null;
        }
    }

    /**
     * Process a single attempt and update analysis data
     */
    private function processAttempt($attempt) {
        if (!isset($attempt['questionid']) || !$attempt['questionid']) {
            return; // Skip if no question data
        }

        $user_id = $attempt['userid'];
        $question_id = $attempt['questionid'];

        // Get concept mapping for this question
        $concept_id = $this->getConceptForQuestion($question_id);
        if (!$concept_id) {
            // No concept mapped, skip for now
            return;
        }

        // Calculate response time
        $response_time = 0;
        if (isset($attempt['timecreated']) && isset($attempt['timestart'])) {
            $response_time = $attempt['timecreated'] - $attempt['timestart'];
        }

        // Determine if correct, incorrect, or skipped
        $is_correct = false;
        $is_skipped = false;

        if (isset($attempt['fraction'])) {
            if ($attempt['fraction'] >= 1.0) {
                $is_correct = true;
            } elseif ($attempt['fraction'] == 0 && $response_time < QUICK_SKIP_TIME_SECONDS) {
                $is_skipped = true;
            }
        }

        // Update or insert student analysis
        $this->updateStudentAnalysis($user_id, $concept_id, $is_correct, $is_skipped, $response_time);
    }

    /**
     * Get concept ID for a question
     */
    private function getConceptForQuestion($question_id) {
        $sql = "SELECT concept_id FROM concept_mappings
                WHERE moodle_question_id = :question_id
                AND is_primary = 1
                LIMIT 1";

        $result = $this->db->fetchOne($sql, [':question_id' => $question_id]);
        return $result ? $result['concept_id'] : null;
    }

    /**
     * Update student analysis data
     */
    private function updateStudentAnalysis($user_id, $concept_id, $is_correct, $is_skipped, $response_time) {
        // Check if record exists
        $sql = "SELECT id, total_attempts, correct_attempts, incorrect_attempts, skipped_attempts,
                       avg_response_time, min_response_time, max_response_time
                FROM student_analysis
                WHERE moodle_user_id = :user_id AND concept_id = :concept_id";

        $existing = $this->db->fetchOne($sql, [
            ':user_id' => $user_id,
            ':concept_id' => $concept_id
        ]);

        if ($existing) {
            // Update existing record
            $total = $existing['total_attempts'] + 1;
            $correct = $existing['correct_attempts'] + ($is_correct ? 1 : 0);
            $incorrect = $existing['incorrect_attempts'] + (!$is_correct && !$is_skipped ? 1 : 0);
            $skipped = $existing['skipped_attempts'] + ($is_skipped ? 1 : 0);

            // Update response time statistics
            $avg_time = (($existing['avg_response_time'] * $existing['total_attempts']) + $response_time) / $total;
            $min_time = min($existing['min_response_time'] ?: $response_time, $response_time);
            $max_time = max($existing['max_response_time'], $response_time);

            $accuracy = ($total > 0) ? ($correct / $total) * 100 : 0;

            $this->db->update('student_analysis', [
                'total_attempts' => $total,
                'correct_attempts' => $correct,
                'incorrect_attempts' => $incorrect,
                'skipped_attempts' => $skipped,
                'avg_response_time' => $avg_time,
                'min_response_time' => $min_time,
                'max_response_time' => $max_time,
                'accuracy_rate' => $accuracy,
                'last_attempt_date' => date('Y-m-d H:i:s')
            ], 'id = :id', [':id' => $existing['id']]);

        } else {
            // Insert new record
            $accuracy = $is_correct ? 100 : 0;

            $this->db->insert('student_analysis', [
                'moodle_user_id' => $user_id,
                'concept_id' => $concept_id,
                'total_attempts' => 1,
                'correct_attempts' => $is_correct ? 1 : 0,
                'incorrect_attempts' => (!$is_correct && !$is_skipped) ? 1 : 0,
                'skipped_attempts' => $is_skipped ? 1 : 0,
                'avg_response_time' => $response_time,
                'min_response_time' => $response_time,
                'max_response_time' => $response_time,
                'accuracy_rate' => $accuracy,
                'first_attempt_date' => date('Y-m-d H:i:s'),
                'last_attempt_date' => date('Y-m-d H:i:s')
            ]);
        }
    }

    /**
     * Log sync start
     */
    private function logSyncStart($sync_type) {
        return $this->db->insert('sync_log', [
            'sync_type' => $sync_type,
            'sync_status' => 'started'
        ]);
    }

    /**
     * Log sync completion
     */
    private function logSyncComplete($sync_id, $status, $processed, $failed, $error = null) {
        $this->db->update('sync_log', [
            'sync_status' => $status,
            'records_processed' => $processed,
            'records_failed' => $failed,
            'end_time' => date('Y-m-d H:i:s'),
            'error_message' => $error
        ], 'id = :id', [':id' => $sync_id]);
    }

    /**
     * Get all students from Moodle
     */
    public function getStudents() {
        try {
            $sql = "SELECT id, username, firstname, lastname, email
                    FROM {$this->prefix}user
                    WHERE deleted = 0 AND suspended = 0
                    ORDER BY lastname, firstname";

            $stmt = $this->db->queryMoodle($sql);
            return $stmt->fetchAll();

        } catch (Exception $e) {
            log_message("Failed to get students: " . $e->getMessage(), 'ERROR');
            return [];
        }
    }

    /**
     * Get all quizzes from Moodle
     */
    public function getQuizzes() {
        try {
            $sql = "SELECT q.id, q.name, q.intro, q.timeopen, q.timeclose, q.grade,
                           c.fullname as course_name
                    FROM {$this->prefix}quiz q
                    JOIN {$this->prefix}course c ON c.id = q.course
                    ORDER BY c.fullname, q.name";

            $stmt = $this->db->queryMoodle($sql);
            return $stmt->fetchAll();

        } catch (Exception $e) {
            log_message("Failed to get quizzes: " . $e->getMessage(), 'ERROR');
            return [];
        }
    }
}
