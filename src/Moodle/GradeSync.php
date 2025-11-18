<?php
/**
 * Grade Synchronization with Moodle
 * Sends student scores back to Moodle gradebook
 */

class GradeSync {
    private $db;
    private $moodleUrl;
    private $token;

    public function __construct($db) {
        $this->db = $db;
        $this->moodleUrl = MOODLE_URL;
        $this->token = MOODLE_TOKEN;
    }

    /**
     * Send grade to Moodle
     */
    public function sendGrade($sessionId, $puzzleId, $score, $maxScore = 100) {
        $session = $this->db->fetchOne(
            "SELECT * FROM student_sessions WHERE id = ?",
            [$sessionId]
        );

        if (!$session) {
            return false;
        }

        // Calculate percentage grade
        $gradeValue = ($score / $maxScore) * 100;

        // Log grade sync attempt
        $logId = $this->logGradeSync($sessionId, $puzzleId, $gradeValue);

        // Send to Moodle via Web Services API
        $result = $this->callMoodleAPI('core_grades_update_grades', [
            'source' => APP_NAME,
            'courseid' => $_SESSION['context_id'] ?? 0,
            'component' => 'mod_lti',
            'activityid' => $_SESSION['resource_link_id'] ?? 0,
            'itemnumber' => 0,
            'grades' => [[
                'studentid' => $session['moodle_user_id'],
                'grade' => $gradeValue
            ]]
        ]);

        // Update log
        if ($result) {
            $this->db->execute(
                "UPDATE grade_sync_log SET sync_status = 'success', synced_at = NOW() WHERE id = ?",
                [$logId]
            );
        } else {
            $this->db->execute(
                "UPDATE grade_sync_log SET sync_status = 'failed', error_message = ? WHERE id = ?",
                ['API call failed', $logId]
            );
        }

        return $result;
    }

    /**
     * Log grade synchronization
     */
    private function logGradeSync($sessionId, $puzzleId, $gradeValue) {
        $this->db->execute(
            "INSERT INTO grade_sync_log (session_id, puzzle_id, grade_value) VALUES (?, ?, ?)",
            [$sessionId, $puzzleId, $gradeValue]
        );
        return $this->db->lastInsertId();
    }

    /**
     * Call Moodle Web Services API
     */
    private function callMoodleAPI($function, $params) {
        if (empty($this->token)) {
            return false; // Token not configured
        }

        $url = $this->moodleUrl . '/webservice/rest/server.php';

        $postData = [
            'wstoken' => $this->token,
            'wsfunction' => $function,
            'moodlewsrestformat' => 'json'
        ];

        foreach ($params as $key => $value) {
            $postData[$key] = is_array($value) ? json_encode($value) : $value;
        }

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200 && $response) {
            $data = json_decode($response, true);
            return !isset($data['exception']);
        }

        return false;
    }

    /**
     * Get grade sync history
     */
    public function getSyncHistory($sessionId, $limit = 10) {
        return $this->db->fetchAll(
            "SELECT * FROM grade_sync_log WHERE session_id = ? ORDER BY created_at DESC LIMIT ?",
            [$sessionId, $limit]
        );
    }
}
