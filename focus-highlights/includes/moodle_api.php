<?php
/**
 * Moodle API Integration
 * Focus Highlights System
 */

require_once __DIR__ . '/../config/moodle.php';
require_once __DIR__ . '/db.php';

class MoodleAPI {
    private $moodleUrl;
    private $token;
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
        $this->moodleUrl = $this->db->getConfig('moodle_url', MOODLE_URL);
        $this->token = $this->db->getConfig('moodle_token', MOODLE_TOKEN);
    }

    /**
     * Make API call to Moodle
     */
    private function callAPI($function, $params = []) {
        if (empty($this->token)) {
            throw new Exception("Moodle token not configured");
        }

        $params['wstoken'] = $this->token;
        $params['wsfunction'] = $function;
        $params['moodlewsrestformat'] = MOODLE_WS_FORMAT;

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, MOODLE_WS_ENDPOINT);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For development only

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if (curl_errno($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new Exception("Moodle API error: $error");
        }

        curl_close($ch);

        if ($httpCode !== 200) {
            throw new Exception("Moodle API HTTP error: $httpCode");
        }

        $result = json_decode($response, true);

        if (isset($result['exception'])) {
            throw new Exception("Moodle API exception: " . $result['message']);
        }

        return $result;
    }

    /**
     * Get user by Moodle user ID
     */
    public function getUserById($moodleUserId) {
        $result = $this->callAPI('core_user_get_users_by_field', [
            'field' => 'id',
            'values[0]' => $moodleUserId
        ]);

        return isset($result[0]) ? $result[0] : null;
    }

    /**
     * Get user by username
     */
    public function getUserByUsername($username) {
        $result = $this->callAPI('core_user_get_users_by_field', [
            'field' => 'username',
            'values[0]' => $username
        ]);

        return isset($result[0]) ? $result[0] : null;
    }

    /**
     * Get all courses
     */
    public function getCourses() {
        return $this->callAPI('core_course_get_courses');
    }

    /**
     * Get course contents
     */
    public function getCourseContents($courseId) {
        return $this->callAPI('core_course_get_contents', [
            'courseid' => $courseId
        ]);
    }

    /**
     * Get enrolled users in a course
     */
    public function getEnrolledUsers($courseId) {
        return $this->callAPI('core_enrol_get_enrolled_users', [
            'courseid' => $courseId
        ]);
    }

    /**
     * Sync user from Moodle to local database
     */
    public function syncUser($moodleUserId) {
        $moodleUser = $this->getUserById($moodleUserId);

        if (!$moodleUser) {
            throw new Exception("User not found in Moodle");
        }

        // Determine role (simplified)
        $role = 'student';
        if (isset($moodleUser['roles']) && is_array($moodleUser['roles'])) {
            foreach ($moodleUser['roles'] as $roleInfo) {
                if (isset($roleInfo['shortname'])) {
                    if ($roleInfo['shortname'] === 'teacher' || $roleInfo['shortname'] === 'editingteacher') {
                        $role = 'teacher';
                        break;
                    } elseif ($roleInfo['shortname'] === 'manager' || $roleInfo['shortname'] === 'admin') {
                        $role = 'admin';
                        break;
                    }
                }
            }
        }

        // Check if user exists
        $existingUser = $this->db->fetchOne(
            "SELECT id FROM fh_users WHERE moodle_user_id = :moodle_id",
            ['moodle_id' => $moodleUserId]
        );

        if ($existingUser) {
            // Update existing user
            $this->db->update(
                'fh_users',
                [
                    'username' => $moodleUser['username'],
                    'firstname' => $moodleUser['firstname'] ?? '',
                    'lastname' => $moodleUser['lastname'] ?? '',
                    'email' => $moodleUser['email'] ?? '',
                    'role' => $role
                ],
                'id = :id',
                ['id' => $existingUser['id']]
            );

            return $existingUser['id'];
        } else {
            // Insert new user
            return $this->db->insert('fh_users', [
                'moodle_user_id' => $moodleUserId,
                'username' => $moodleUser['username'],
                'firstname' => $moodleUser['firstname'] ?? '',
                'lastname' => $moodleUser['lastname'] ?? '',
                'email' => $moodleUser['email'] ?? '',
                'role' => $role
            ]);
        }
    }

    /**
     * Sync course from Moodle to local database
     */
    public function syncCourse($courseId) {
        $courses = $this->getCourses();
        $courseData = null;

        foreach ($courses as $course) {
            if ($course['id'] == $courseId) {
                $courseData = $course;
                break;
            }
        }

        if (!$courseData) {
            throw new Exception("Course not found in Moodle");
        }

        // Check if course exists
        $existingCourse = $this->db->fetchOne(
            "SELECT id FROM fh_courses WHERE moodle_course_id = :course_id",
            ['course_id' => $courseId]
        );

        if ($existingCourse) {
            // Update existing course
            $this->db->update(
                'fh_courses',
                [
                    'course_name' => $courseData['fullname'] ?? '',
                    'course_shortname' => $courseData['shortname'] ?? '',
                    'category_id' => $courseData['categoryid'] ?? null
                ],
                'id = :id',
                ['id' => $existingCourse['id']]
            );

            return $existingCourse['id'];
        } else {
            // Insert new course
            return $this->db->insert('fh_courses', [
                'moodle_course_id' => $courseId,
                'course_name' => $courseData['fullname'] ?? '',
                'course_shortname' => $courseData['shortname'] ?? '',
                'category_id' => $courseData['categoryid'] ?? null
            ]);
        }
    }

    /**
     * Get quiz attempts for a user
     */
    public function getQuizAttempts($quizId, $userId) {
        try {
            return $this->callAPI('mod_quiz_get_user_attempts', [
                'quizid' => $quizId,
                'userid' => $userId
            ]);
        } catch (Exception $e) {
            // Quiz module might not be available or configured
            error_log("Quiz attempts error: " . $e->getMessage());
            return [];
        }
    }
}
