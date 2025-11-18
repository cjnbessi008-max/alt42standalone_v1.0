<?php
/**
 * Moodle Connector
 * Integration with Moodle 3.7 LMS
 * PHP 7.1.9 compatible
 */

class MoodleConnector {
    private $moodleAvailable;
    private $moodleConfig;

    /**
     * Constructor
     */
    public function __construct() {
        $this->moodleAvailable = $this->checkMoodleAvailability();
        if ($this->moodleAvailable) {
            $this->loadMoodleConfig();
        }
    }

    /**
     * Check if Moodle is available
     * @return bool True if Moodle is available
     */
    private function checkMoodleAvailability() {
        if (!MOODLE_ENABLED) {
            return false;
        }

        // Check if Moodle config file exists
        $configPath = MOODLE_DIR . '/config.php';
        if (!file_exists($configPath)) {
            $this->logWarning('Moodle config.php not found at: ' . $configPath);
            return false;
        }

        return true;
    }

    /**
     * Load Moodle configuration
     */
    private function loadMoodleConfig() {
        try {
            // Suppress output during Moodle load
            ob_start();

            // Load Moodle configuration
            global $CFG;
            require_once(MOODLE_DIR . '/config.php');

            $this->moodleConfig = $CFG;

            ob_end_clean();
        } catch (Exception $e) {
            ob_end_clean();
            $this->logError('Failed to load Moodle config: ' . $e->getMessage());
            $this->moodleAvailable = false;
        }
    }

    /**
     * Check if Moodle is available
     * @return bool
     */
    public function isAvailable() {
        return $this->moodleAvailable;
    }

    /**
     * Validate Moodle session
     * @param string $sessionId Moodle session ID
     * @return array|null User data or null
     */
    public function validateSession($sessionId) {
        if (!$this->isAvailable()) {
            return null;
        }

        try {
            global $DB, $USER, $SESSION;

            // Load Moodle libraries
            require_once(MOODLE_DIR . '/lib/sessionlib.php');
            require_once(MOODLE_DIR . '/lib/accesslib.php');

            // Get session from Moodle database
            $session = $DB->get_record('sessions', [
                'sid' => $sessionId,
                'state' => 0
            ]);

            if (!$session) {
                return null;
            }

            // Check if session is expired
            if ($session->timecreated + $session->timemodified < time()) {
                return null;
            }

            // Get user data
            $userId = $session->userid;
            $user = $DB->get_record('user', ['id' => $userId]);

            if (!$user) {
                return null;
            }

            return [
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,
                'firstname' => $user->firstname,
                'lastname' => $user->lastname
            ];
        } catch (Exception $e) {
            $this->logError('Session validation failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get user by ID
     * @param int $userId Moodle user ID
     * @return array|null User data
     */
    public function getUserById($userId) {
        if (!$this->isAvailable()) {
            return null;
        }

        try {
            global $DB;
            require_once(MOODLE_DIR . '/lib/accesslib.php');

            $user = $DB->get_record('user', ['id' => $userId]);

            if (!$user) {
                return null;
            }

            return [
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,
                'firstname' => $user->firstname,
                'lastname' => $user->lastname
            ];
        } catch (Exception $e) {
            $this->logError('Get user failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Submit grade to Moodle gradebook
     * @param array $gradeData Grade data
     * @return bool Success status
     */
    public function submitGrade($gradeData) {
        if (!$this->isAvailable()) {
            return false;
        }

        try {
            global $DB, $CFG;

            require_once(MOODLE_DIR . '/lib/gradelib.php');
            require_once(MOODLE_DIR . '/lib/grade/grade_item.php');

            $userId = $gradeData['userid'] ?? 0;
            $courseId = $gradeData['courseid'] ?? 0;
            $activityId = $gradeData['activityid'] ?? 0;
            $score = $gradeData['grade'] ?? 0;

            if (!$userId || !$courseId || !$activityId) {
                return false;
            }

            // Normalize score to 0-100 scale
            $normalizedGrade = min(100, max(0, $score / 100));

            // Create grade item
            $gradeItem = grade_item::fetch([
                'courseid' => $courseId,
                'itemtype' => 'mod',
                'itemmodule' => 'symmetry', // Custom module name
                'iteminstance' => $activityId
            ]);

            if (!$gradeItem) {
                // Create grade item if it doesn't exist
                $gradeItem = new grade_item([
                    'courseid' => $courseId,
                    'itemtype' => 'mod',
                    'itemmodule' => 'symmetry',
                    'iteminstance' => $activityId,
                    'itemname' => 'Symmetry Discovery',
                    'grademin' => 0,
                    'grademax' => 100
                ], false);
                $gradeItem->insert();
            }

            // Update grade
            $gradeItem->update_final_grade($userId, $normalizedGrade);

            return true;
        } catch (Exception $e) {
            $this->logError('Submit grade failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Log activity to Moodle
     * @param array $activityData Activity data
     * @return bool Success status
     */
    public function logActivity($activityData) {
        if (!$this->isAvailable()) {
            return false;
        }

        try {
            global $DB;

            require_once(MOODLE_DIR . '/lib/datalib.php');

            $logEntry = [
                'userid' => $activityData['userid'] ?? 0,
                'courseid' => $activityData['courseid'] ?? 0,
                'objectid' => $activityData['activityid'] ?? 0,
                'component' => 'mod_symmetry',
                'action' => $activityData['action'] ?? 'viewed',
                'timecreated' => time(),
                'other' => json_encode([
                    'score' => $activityData['score'] ?? 0
                ])
            ];

            $DB->insert_record('logstore_standard_log', $logEntry);

            return true;
        } catch (Exception $e) {
            $this->logError('Log activity failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Get course information
     * @param int $courseId Course ID
     * @return array|null Course data
     */
    public function getCourse($courseId) {
        if (!$this->isAvailable()) {
            return null;
        }

        try {
            global $DB;

            $course = $DB->get_record('course', ['id' => $courseId]);

            if (!$course) {
                return null;
            }

            return [
                'id' => $course->id,
                'fullname' => $course->fullname,
                'shortname' => $course->shortname,
                'startdate' => $course->startdate,
                'enddate' => $course->enddate
            ];
        } catch (Exception $e) {
            $this->logError('Get course failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Check if user is enrolled in course
     * @param int $userId User ID
     * @param int $courseId Course ID
     * @return bool
     */
    public function isUserEnrolled($userId, $courseId) {
        if (!$this->isAvailable()) {
            return false;
        }

        try {
            global $DB;

            $sql = "SELECT COUNT(*)
                    FROM {user_enrolments} ue
                    JOIN {enrol} e ON ue.enrolid = e.id
                    WHERE ue.userid = ? AND e.courseid = ? AND ue.status = 0";

            $count = $DB->count_records_sql($sql, [$userId, $courseId]);

            return $count > 0;
        } catch (Exception $e) {
            $this->logError('Check enrollment failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Get user's role in course
     * @param int $userId User ID
     * @param int $courseId Course ID
     * @return string|null Role shortname
     */
    public function getUserRole($userId, $courseId) {
        if (!$this->isAvailable()) {
            return null;
        }

        try {
            global $DB;

            require_once(MOODLE_DIR . '/lib/accesslib.php');

            $context = context_course::instance($courseId);
            $roles = get_user_roles($context, $userId);

            if (empty($roles)) {
                return null;
            }

            $role = reset($roles);
            return $role->shortname;
        } catch (Exception $e) {
            $this->logError('Get user role failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Create completion record
     * @param array $completionData Completion data
     * @return bool
     */
    public function createCompletion($completionData) {
        if (!$this->isAvailable()) {
            return false;
        }

        try {
            global $DB, $CFG;

            require_once(MOODLE_DIR . '/lib/completionlib.php');

            $userId = $completionData['userid'] ?? 0;
            $courseId = $completionData['courseid'] ?? 0;
            $activityId = $completionData['activityid'] ?? 0;

            if (!$userId || !$courseId || !$activityId) {
                return false;
            }

            $course = $DB->get_record('course', ['id' => $courseId]);
            $completion = new completion_info($course);

            if (!$completion->is_enabled()) {
                return false;
            }

            // Mark activity as complete
            $cm = get_coursemodule_from_id('symmetry', $activityId);
            if ($cm) {
                $completion->update_state($cm, COMPLETION_COMPLETE, $userId);
            }

            return true;
        } catch (Exception $e) {
            $this->logError('Create completion failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Log warning
     * @param string $message Warning message
     */
    private function logWarning($message) {
        if (ENABLE_EVENT_LOGGING) {
            $logMessage = sprintf(
                "[%s] MOODLE WARNING: %s\n",
                date('Y-m-d H:i:s'),
                $message
            );
            error_log($logMessage, 3, LOG_FILE_PATH);
        }
    }

    /**
     * Log error
     * @param string $message Error message
     */
    private function logError($message) {
        if (ENABLE_EVENT_LOGGING) {
            $logMessage = sprintf(
                "[%s] MOODLE ERROR: %s\n",
                date('Y-m-d H:i:s'),
                $message
            );
            error_log($logMessage, 3, LOG_FILE_PATH);
        }
    }
}
