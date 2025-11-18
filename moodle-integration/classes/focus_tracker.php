<?php
/**
 * Focus Tracker Class for Moodle Integration
 * Connects Moodle with Alt42 Focus Tracking API
 *
 * @package    local_alt42_focus
 * @copyright  2025 Alt42 Standalone
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_alt42_focus;

defined('MOODLE_INTERNAL') || die();

class focus_tracker {

    /** @var string API base URL */
    private $api_base_url;

    /** @var string API key for authentication */
    private $api_key;

    /**
     * Constructor
     */
    public function __construct() {
        $this->api_base_url = get_config('local_alt42_focus', 'api_base_url')
            ?: 'http://localhost:8000/api/v1/focus';
        $this->api_key = get_config('local_alt42_focus', 'api_key') ?: '';
    }

    /**
     * Start a focus session for a student
     *
     * @param int $userid Moodle user ID
     * @param int $courseid Moodle course ID
     * @param string $moduleid Module identifier
     * @return array|false Session data or false on failure
     */
    public function start_session($userid, $courseid, $moduleid) {
        global $DB;

        $student_id = $this->get_student_identifier($userid);

        $data = [
            'student_id' => $student_id,
            'module_id' => $moduleid
        ];

        $response = $this->api_request('POST', '/sessions', $data);

        if ($response && isset($response['id'])) {
            // Store mapping in Moodle database
            $record = new \stdClass();
            $record->userid = $userid;
            $record->courseid = $courseid;
            $record->moduleid = $moduleid;
            $record->session_id = $response['id'];
            $record->student_identifier = $student_id;
            $record->session_start = time();
            $record->timecreated = time();

            try {
                $DB->insert_record('local_alt42_focus_sessions', $record);
            } catch (\Exception $e) {
                debugging('Failed to store session mapping: ' . $e->getMessage());
            }

            return $response;
        }

        return false;
    }

    /**
     * End a focus session
     *
     * @param int $session_id Session ID from API
     * @return array|false Updated session data or false on failure
     */
    public function end_session($session_id) {
        global $DB;

        $response = $this->api_request('POST', "/sessions/{$session_id}/end");

        if ($response) {
            // Update local record
            try {
                $record = $DB->get_record('local_alt42_focus_sessions',
                    ['session_id' => $session_id]);
                if ($record) {
                    $record->session_end = time();
                    $record->timemodified = time();
                    $DB->update_record('local_alt42_focus_sessions', $record);
                }
            } catch (\Exception $e) {
                debugging('Failed to update session record: ' . $e->getMessage());
            }

            return $response;
        }

        return false;
    }

    /**
     * Record user interaction
     *
     * @param int $session_id Session ID from API
     * @return array|false Updated session data or false on failure
     */
    public function record_interaction($session_id) {
        return $this->api_request('POST', "/sessions/{$session_id}/interact");
    }

    /**
     * Check if a break is needed
     *
     * @param int $session_id Session ID from API
     * @param string $student_id Student identifier
     * @return array Break check result
     */
    public function check_break_needed($session_id, $student_id) {
        $response = $this->api_request('GET', "/breaks/check/{$session_id}",
            ['student_id' => $student_id]);

        return $response ?: ['should_trigger_break' => false];
    }

    /**
     * Create a focus break
     *
     * @param int $session_id Session ID
     * @param string $student_id Student identifier
     * @param string $reason Break reason
     * @param int $idle_duration Idle duration in seconds
     * @return array|false Break data or false on failure
     */
    public function create_break($session_id, $student_id, $reason, $idle_duration = null) {
        $data = [
            'session_id' => $session_id,
            'student_id' => $student_id,
            'break_reason' => $reason,
            'idle_duration_seconds' => $idle_duration
        ];

        return $this->api_request('POST', '/breaks', $data);
    }

    /**
     * Get recommended routine for a student
     *
     * @param string $student_id Student identifier
     * @return array|false Routine data or false on failure
     */
    public function get_recommended_routine($student_id) {
        return $this->api_request('GET', "/routines/recommend/{$student_id}");
    }

    /**
     * Get student focus preferences
     *
     * @param string $student_id Student identifier
     * @return array|false Preferences data or false on failure
     */
    public function get_preferences($student_id) {
        return $this->api_request('GET', "/preferences/{$student_id}");
    }

    /**
     * Update student focus preferences
     *
     * @param string $student_id Student identifier
     * @param array $preferences Preferences to update
     * @return array|false Updated preferences or false on failure
     */
    public function update_preferences($student_id, $preferences) {
        return $this->api_request('PATCH', "/preferences/{$student_id}", $preferences);
    }

    /**
     * Get student analytics
     *
     * @param string $student_id Student identifier
     * @param int $days Number of days to analyze
     * @return array|false Analytics data or false on failure
     */
    public function get_analytics($student_id, $days = 30) {
        return $this->api_request('GET', "/analytics/{$student_id}", ['days' => $days]);
    }

    /**
     * Get active session for a student
     *
     * @param int $userid Moodle user ID
     * @param string $moduleid Module identifier
     * @return array|false Session data or false
     */
    public function get_active_session($userid, $moduleid) {
        global $DB;

        // Try to get from local database first
        $record = $DB->get_record('local_alt42_focus_sessions', [
            'userid' => $userid,
            'moduleid' => $moduleid
        ], '*', IGNORE_MULTIPLE);

        if ($record && empty($record->session_end)) {
            // Session exists locally, verify with API
            $student_id = $this->get_student_identifier($userid);
            $response = $this->api_request('GET',
                "/sessions/student/{$student_id}/active",
                ['module_id' => $moduleid]);

            if ($response) {
                return $response;
            }
        }

        return false;
    }

    /**
     * Get student identifier for API
     *
     * @param int $userid Moodle user ID
     * @return string Student identifier
     */
    private function get_student_identifier($userid) {
        global $DB;

        $user = $DB->get_record('user', ['id' => $userid], 'id,username,email');

        // Use Moodle user ID prefixed with instance identifier
        $instance_id = get_config('local_alt42_focus', 'instance_id') ?: 'moodle';
        return "{$instance_id}_{$userid}";
    }

    /**
     * Make an API request
     *
     * @param string $method HTTP method (GET, POST, PATCH, etc.)
     * @param string $endpoint API endpoint
     * @param array $data Request data
     * @return array|false Response data or false on failure
     */
    private function api_request($method, $endpoint, $data = []) {
        $url = rtrim($this->api_base_url, '/') . $endpoint;

        $curl = curl_init();

        $headers = [
            'Content-Type: application/json',
            'Accept: application/json'
        ];

        if ($this->api_key) {
            $headers[] = 'Authorization: Bearer ' . $this->api_key;
        }

        curl_setopt($curl, CURLOPT_URL, $url);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($curl, CURLOPT_TIMEOUT, 30);

        if ($method === 'GET' && !empty($data)) {
            $url .= '?' . http_build_query($data);
            curl_setopt($curl, CURLOPT_URL, $url);
        } else if ($method !== 'GET') {
            curl_setopt($curl, CURLOPT_CUSTOMREQUEST, $method);
            if (!empty($data)) {
                curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($data));
            }
        }

        $response = curl_exec($curl);
        $http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $error = curl_error($curl);

        curl_close($curl);

        if ($error) {
            debugging("API request failed: {$error}");
            return false;
        }

        if ($http_code >= 200 && $http_code < 300) {
            return json_decode($response, true);
        }

        debugging("API request failed with status {$http_code}: {$response}");
        return false;
    }

    /**
     * Inject focus tracking JavaScript into page
     *
     * @param int $userid Moodle user ID
     * @param int $courseid Moodle course ID
     * @param string $moduleid Module identifier
     * @return string JavaScript code
     */
    public function inject_tracking_script($userid, $courseid, $moduleid) {
        global $CFG;

        $student_id = $this->get_student_identifier($userid);
        $api_url = $this->api_base_url;

        // Get or create active session
        $session = $this->get_active_session($userid, $moduleid);
        $session_id = $session['id'] ?? null;

        if (!$session_id) {
            $session = $this->start_session($userid, $courseid, $moduleid);
            $session_id = $session['id'] ?? null;
        }

        if (!$session_id) {
            return ''; // Failed to create session
        }

        $script = <<<EOT
<script>
(function() {
    var sessionId = {$session_id};
    var studentId = '{$student_id}';
    var apiUrl = '{$api_url}';
    var checkInterval = 30000; // 30 seconds

    // Load focus tracking from CDN or local
    var script = document.createElement('script');
    script.src = '{$CFG->wwwroot}/local/alt42_focus/js/focus_tracker.js';
    document.head.appendChild(script);

    script.onload = function() {
        if (typeof Alt42FocusTracker !== 'undefined') {
            new Alt42FocusTracker({
                sessionId: sessionId,
                studentId: studentId,
                apiUrl: apiUrl,
                checkInterval: checkInterval
            });
        }
    };
})();
</script>
EOT;

        return $script;
    }
}
