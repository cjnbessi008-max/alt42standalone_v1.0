<?php
/**
 * Hidden Length Application - Moodle Integration
 * Synchronize grades and progress with Moodle 3.7 LMS
 */

require_once __DIR__ . '/../api/database.php';
require_once __DIR__ . '/../api/config.php';

class MoodleIntegration {
    private $db;
    private $moodle_url;
    private $moodle_token;
    private $enabled;

    public function __construct() {
        $this->db = Database::getInstance();
        $this->moodle_url = MOODLE_URL;
        $this->moodle_token = MOODLE_TOKEN;
        $this->enabled = MOODLE_ENABLED;
    }

    /**
     * Sync user from Moodle
     */
    public function syncUser($moodle_user_id) {
        if (!$this->enabled) {
            return ['success' => false, 'message' => 'Moodle integration disabled'];
        }

        $user_data = $this->getMoodleUser($moodle_user_id);
        if (!$user_data) {
            return ['success' => false, 'message' => 'User not found in Moodle'];
        }

        // Check if user exists in local database
        $local_user = $this->db->queryOne(
            "SELECT * FROM users WHERE moodle_user_id = :moodle_id",
            ['moodle_id' => $moodle_user_id]
        );

        if ($local_user) {
            // Update existing user
            $sql = "UPDATE users SET username = :username, email = :email,
                    full_name = :full_name, updated_at = NOW()
                    WHERE moodle_user_id = :moodle_id";
        } else {
            // Insert new user
            $sql = "INSERT INTO users (moodle_user_id, username, email, full_name, role)
                    VALUES (:moodle_id, :username, :email, :full_name, 'student')";
        }

        $this->db->execute($sql, [
            'moodle_id' => $moodle_user_id,
            'username' => $user_data['username'],
            'email' => $user_data['email'],
            'full_name' => $user_data['firstname'] . ' ' . $user_data['lastname']
        ]);

        return ['success' => true, 'message' => 'User synced successfully'];
    }

    /**
     * Get user data from Moodle via Web Services
     */
    private function getMoodleUser($user_id) {
        $function = 'core_user_get_users_by_field';
        $params = [
            'field' => 'id',
            'values' => [$user_id]
        ];

        $response = $this->callMoodleWebService($function, $params);
        return isset($response[0]) ? $response[0] : null;
    }

    /**
     * Send grade to Moodle gradebook
     * @param int $user_id Local user ID
     * @param int $course_id Moodle course ID
     * @param int $activity_id Moodle activity/assignment ID
     * @param float $grade Grade value (0-100)
     */
    public function sendGrade($user_id, $course_id, $activity_id, $grade) {
        if (!$this->enabled) {
            return ['success' => false, 'message' => 'Moodle integration disabled'];
        }

        // Get moodle_user_id
        $user = $this->db->queryOne("SELECT moodle_user_id FROM users WHERE id = :id", ['id' => $user_id]);
        if (!$user || !$user['moodle_user_id']) {
            return ['success' => false, 'message' => 'User not linked to Moodle'];
        }

        $moodle_user_id = $user['moodle_user_id'];

        // Prepare grade data
        $function = 'core_grades_update_grades';
        $params = [
            'source' => 'hidden_length_app',
            'courseid' => $course_id,
            'component' => 'mod_assign',
            'activityid' => $activity_id,
            'itemnumber' => 0,
            'grades' => [
                [
                    'studentid' => $moodle_user_id,
                    'grade' => $grade
                ]
            ]
        ];

        try {
            $response = $this->callMoodleWebService($function, $params);

            // Log the sync
            $this->logSync($user_id, $course_id, $activity_id, 'grade', [
                'grade' => $grade,
                'moodle_user_id' => $moodle_user_id
            ], 'success');

            return ['success' => true, 'message' => 'Grade sent to Moodle', 'response' => $response];

        } catch (Exception $e) {
            // Log the failure
            $this->logSync($user_id, $course_id, $activity_id, 'grade', [
                'grade' => $grade,
                'moodle_user_id' => $moodle_user_id
            ], 'failed', $e->getMessage());

            return ['success' => false, 'message' => 'Failed to send grade', 'error' => $e->getMessage()];
        }
    }

    /**
     * Send completion status to Moodle
     */
    public function sendCompletion($user_id, $course_id, $activity_id, $completed = true) {
        if (!$this->enabled) {
            return ['success' => false, 'message' => 'Moodle integration disabled'];
        }

        $user = $this->db->queryOne("SELECT moodle_user_id FROM users WHERE id = :id", ['id' => $user_id]);
        if (!$user || !$user['moodle_user_id']) {
            return ['success' => false, 'message' => 'User not linked to Moodle'];
        }

        $moodle_user_id = $user['moodle_user_id'];

        $function = 'core_completion_update_activity_completion_status_manually';
        $params = [
            'cmid' => $activity_id,
            'completed' => $completed ? 1 : 0,
            'userid' => $moodle_user_id
        ];

        try {
            $response = $this->callMoodleWebService($function, $params);

            $this->logSync($user_id, $course_id, $activity_id, 'completion', [
                'completed' => $completed,
                'moodle_user_id' => $moodle_user_id
            ], 'success');

            return ['success' => true, 'message' => 'Completion sent to Moodle', 'response' => $response];

        } catch (Exception $e) {
            $this->logSync($user_id, $course_id, $activity_id, 'completion', [
                'completed' => $completed,
                'moodle_user_id' => $moodle_user_id
            ], 'failed', $e->getMessage());

            return ['success' => false, 'message' => 'Failed to send completion', 'error' => $e->getMessage()];
        }
    }

    /**
     * Calculate and sync overall progress to Moodle
     */
    public function syncProgress($user_id, $course_id, $activity_id) {
        // Get user's overall progress
        $progress = $this->db->query(
            "SELECT * FROM student_progress WHERE user_id = :user_id",
            ['user_id' => $user_id]
        );

        if (empty($progress)) {
            return ['success' => false, 'message' => 'No progress data found'];
        }

        // Calculate overall grade (average mastery score)
        $total_mastery = 0;
        $completed_count = 0;
        foreach ($progress as $item) {
            $total_mastery += floatval($item['mastery_score']);
            if ($item['status'] === 'completed' || $item['status'] === 'mastered') {
                $completed_count++;
            }
        }

        $overall_grade = round($total_mastery / count($progress), 2);
        $is_completed = $completed_count >= count($progress) * 0.8; // 80% completion threshold

        // Send grade to Moodle
        $grade_result = $this->sendGrade($user_id, $course_id, $activity_id, $overall_grade);

        // Send completion if threshold met
        if ($is_completed) {
            $completion_result = $this->sendCompletion($user_id, $course_id, $activity_id, true);
        }

        return [
            'success' => true,
            'overall_grade' => $overall_grade,
            'completed' => $is_completed,
            'grade_sync' => $grade_result,
            'completion_sync' => $completion_result ?? null
        ];
    }

    /**
     * Call Moodle Web Service API
     */
    private function callMoodleWebService($function, $params) {
        $url = $this->moodle_url . '/webservice/rest/server.php';

        $post_data = [
            'wstoken' => $this->moodle_token,
            'wsfunction' => $function,
            'moodlewsrestformat' => 'json'
        ];

        // Merge function parameters
        $post_data = array_merge($post_data, $this->flattenParams($params));

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post_data));

        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($http_code !== 200) {
            throw new Exception("Moodle API request failed with HTTP code: $http_code");
        }

        $result = json_decode($response, true);

        if (isset($result['exception'])) {
            throw new Exception("Moodle API error: " . $result['message']);
        }

        return $result;
    }

    /**
     * Flatten nested parameters for Moodle Web Service
     */
    private function flattenParams($params, $prefix = '') {
        $flat = [];
        foreach ($params as $key => $value) {
            $new_key = $prefix === '' ? $key : $prefix . '[' . $key . ']';
            if (is_array($value)) {
                $flat = array_merge($flat, $this->flattenParams($value, $new_key));
            } else {
                $flat[$new_key] = $value;
            }
        }
        return $flat;
    }

    /**
     * Log sync operations
     */
    private function logSync($user_id, $course_id, $activity_id, $sync_type, $sync_data, $status, $error = null) {
        $sql = "INSERT INTO moodle_sync_log (user_id, moodle_course_id, moodle_activity_id,
                sync_type, sync_data, sync_status, error_message)
                VALUES (:user_id, :course_id, :activity_id, :sync_type, :sync_data, :status, :error)";

        $this->db->execute($sql, [
            'user_id' => $user_id,
            'course_id' => $course_id,
            'activity_id' => $activity_id,
            'sync_type' => $sync_type,
            'sync_data' => json_encode($sync_data, JSON_UNESCAPED_UNICODE),
            'status' => $status,
            'error' => $error
        ]);
    }
}

// API endpoint for Moodle integration
if (basename(__FILE__) == basename($_SERVER['SCRIPT_FILENAME'])) {
    $method = $_SERVER['REQUEST_METHOD'];
    $action = isset($_GET['action']) ? $_GET['action'] : null;

    $moodle = new MoodleIntegration();

    switch ($action) {
        case 'sync_user':
            if ($method !== 'POST') {
                error_response('Method not allowed', 405);
            }
            $input = json_decode(file_get_contents('php://input'), true);
            $result = $moodle->syncUser($input['moodle_user_id']);
            success_response($result);
            break;

        case 'send_grade':
            if ($method !== 'POST') {
                error_response('Method not allowed', 405);
            }
            $input = json_decode(file_get_contents('php://input'), true);
            $result = $moodle->sendGrade(
                $input['user_id'],
                $input['course_id'],
                $input['activity_id'],
                $input['grade']
            );
            success_response($result);
            break;

        case 'sync_progress':
            if ($method !== 'POST') {
                error_response('Method not allowed', 405);
            }
            $input = json_decode(file_get_contents('php://input'), true);
            $result = $moodle->syncProgress(
                $input['user_id'],
                $input['course_id'],
                $input['activity_id']
            );
            success_response($result);
            break;

        default:
            error_response('Invalid action', 400);
    }
}
