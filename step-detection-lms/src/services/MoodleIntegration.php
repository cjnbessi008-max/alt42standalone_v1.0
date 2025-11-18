<?php
/**
 * Moodle Integration Service
 * Moodle LMS와의 연동 처리
 */

class MoodleIntegration {
    private $moodleUrl;
    private $token;
    private $db;

    public function __construct() {
        $this->moodleUrl = MOODLE_URL;
        $this->token = MOODLE_TOKEN;
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Check if Moodle integration is enabled
     */
    public function isEnabled() {
        return MOODLE_ENABLED && !empty($this->moodleUrl) && !empty($this->token);
    }

    /**
     * Sync user from Moodle
     */
    public function syncUser($moodleUserId) {
        if (!$this->isEnabled()) {
            return false;
        }

        try {
            $userData = $this->callMoodleApi('core_user_get_users_by_field', [
                'field' => 'id',
                'values' => [$moodleUserId]
            ]);

            if (empty($userData)) {
                return false;
            }

            $user = $userData[0];

            // Check if student exists
            $sql = "SELECT id FROM students WHERE moodle_user_id = :moodle_id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([':moodle_id' => $moodleUserId]);
            $existing = $stmt->fetch();

            if ($existing) {
                // Update existing student
                $sql = "UPDATE students
                        SET username = :username,
                            email = :email,
                            full_name = :full_name
                        WHERE moodle_user_id = :moodle_id";
            } else {
                // Insert new student
                $sql = "INSERT INTO students (moodle_user_id, username, email, full_name)
                        VALUES (:moodle_id, :username, :email, :full_name)";
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':moodle_id' => $moodleUserId,
                ':username' => $user['username'],
                ':email' => $user['email'],
                ':full_name' => $user['firstname'] . ' ' . $user['lastname']
            ]);

            $this->logSync('user', $existing ? $existing['id'] : $this->db->lastInsertId(), $moodleUserId, 'success');

            return true;

        } catch (Exception $e) {
            $this->logSync('user', null, $moodleUserId, 'failed', $e->getMessage());
            return false;
        }
    }

    /**
     * Sync grade to Moodle
     */
    public function syncGrade($solutionId) {
        if (!$this->isEnabled()) {
            return false;
        }

        try {
            // Get solution details
            $sql = "SELECT ss.*, s.moodle_user_id, p.moodle_quiz_id
                    FROM student_solutions ss
                    JOIN students s ON ss.student_id = s.id
                    JOIN problems p ON ss.problem_id = p.id
                    WHERE ss.id = :solution_id";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([':solution_id' => $solutionId]);
            $solution = $stmt->fetch();

            if (!$solution || !$solution['moodle_user_id'] || !$solution['moodle_quiz_id']) {
                return false;
            }

            // Send grade to Moodle
            $result = $this->callMoodleApi('mod_quiz_save_attempt', [
                'attemptid' => $solution['moodle_quiz_id'],
                'userid' => $solution['moodle_user_id'],
                'grade' => $solution['score']
            ]);

            $this->logSync('grade', $solutionId, $solution['moodle_quiz_id'], 'success');

            return true;

        } catch (Exception $e) {
            $this->logSync('grade', $solutionId, null, 'failed', $e->getMessage());
            return false;
        }
    }

    /**
     * Sync activity log to Moodle
     */
    public function syncActivityLog($solutionId) {
        if (!$this->isEnabled()) {
            return false;
        }

        try {
            $sql = "SELECT ss.*, s.moodle_user_id
                    FROM student_solutions ss
                    JOIN students s ON ss.student_id = s.id
                    WHERE ss.id = :solution_id";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([':solution_id' => $solutionId]);
            $solution = $stmt->fetch();

            if (!$solution || !$solution['moodle_user_id']) {
                return false;
            }

            // Log activity to Moodle
            $result = $this->callMoodleApi('core_log_create_log_entry', [
                'userid' => $solution['moodle_user_id'],
                'courseid' => 1, // TODO: Get from configuration
                'component' => 'mod_quiz',
                'action' => 'submit',
                'objectid' => $solutionId,
                'timecreated' => time()
            ]);

            $this->logSync('activity', $solutionId, $solution['moodle_user_id'], 'success');

            return true;

        } catch (Exception $e) {
            $this->logSync('activity', $solutionId, null, 'failed', $e->getMessage());
            return false;
        }
    }

    /**
     * Call Moodle Web Service API
     */
    private function callMoodleApi($function, $params = []) {
        $url = $this->moodleUrl . '/webservice/rest/server.php';

        $postData = [
            'wstoken' => $this->token,
            'wsfunction' => $function,
            'moodlewsrestformat' => 'json'
        ];

        foreach ($params as $key => $value) {
            if (is_array($value)) {
                foreach ($value as $index => $item) {
                    $postData[$key . '[' . $index . ']'] = $item;
                }
            } else {
                $postData[$key] = $value;
            }
        }

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        curl_close($ch);

        if ($httpCode !== 200) {
            throw new Exception("Moodle API request failed with HTTP code: $httpCode");
        }

        $result = json_decode($response, true);

        if (isset($result['exception'])) {
            throw new Exception("Moodle API error: " . $result['message']);
        }

        return $result;
    }

    /**
     * Log sync operation
     */
    private function logSync($type, $entityId, $moodleEntityId, $status, $errorMessage = null) {
        $sql = "INSERT INTO moodle_sync_log (sync_type, entity_id, moodle_entity_id, sync_status, error_message)
                VALUES (:sync_type, :entity_id, :moodle_entity_id, :sync_status, :error_message)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':sync_type' => $type,
            ':entity_id' => $entityId,
            ':moodle_entity_id' => $moodleEntityId,
            ':sync_status' => $status,
            ':error_message' => $errorMessage
        ]);
    }

    /**
     * Get sync logs
     */
    public function getSyncLogs($limit = 100) {
        $sql = "SELECT * FROM moodle_sync_log ORDER BY synced_at DESC LIMIT :limit";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }
}
