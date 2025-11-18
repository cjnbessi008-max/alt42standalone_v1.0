<?php
/**
 * Moodle Web Services Client
 * Compatible with Moodle 3.7 and PHP 7.1.9
 */

class MoodleClient {
    private $moodleUrl;
    private $token;
    private $format = 'json';

    /**
     * Constructor
     * @param string $moodleUrl Moodle installation URL
     * @param string $token Web service token
     */
    public function __construct($moodleUrl = null, $token = null) {
        $this->moodleUrl = $moodleUrl ?: MOODLE_URL;
        $this->token = $token ?: MOODLE_TOKEN;

        if (empty($this->token)) {
            throw new Exception('Moodle token is required');
        }
    }

    /**
     * Make a web service call to Moodle
     * @param string $function Moodle function name
     * @param array $params Function parameters
     * @return mixed Response data
     */
    public function call($function, $params = []) {
        $url = $this->moodleUrl . '/webservice/rest/server.php';

        $requestParams = array_merge([
            'wstoken' => $this->token,
            'wsfunction' => $function,
            'moodlewsrestformat' => $this->format
        ], $params);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($requestParams));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, API_TIMEOUT);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For development only

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception("Curl error: $error");
        }

        if ($httpCode !== 200) {
            throw new Exception("HTTP error: $httpCode");
        }

        $data = json_decode($response, true);

        if (isset($data['exception'])) {
            throw new Exception("Moodle error: " . $data['message']);
        }

        return $data;
    }

    /**
     * Get user information by ID
     * @param int $userId Moodle user ID
     * @return array User data
     */
    public function getUser($userId) {
        return $this->call('core_user_get_users_by_field', [
            'field' => 'id',
            'values[0]' => $userId
        ]);
    }

    /**
     * Get multiple users by IDs
     * @param array $userIds Array of Moodle user IDs
     * @return array Users data
     */
    public function getUsers($userIds) {
        $params = ['field' => 'id'];
        foreach ($userIds as $index => $userId) {
            $params["values[$index]"] = $userId;
        }
        return $this->call('core_user_get_users_by_field', $params);
    }

    /**
     * Get course information
     * @param int $courseId Moodle course ID
     * @return array Course data
     */
    public function getCourse($courseId) {
        $result = $this->call('core_course_get_courses', [
            'options[ids][0]' => $courseId
        ]);
        return isset($result[0]) ? $result[0] : null;
    }

    /**
     * Get all courses
     * @return array Courses data
     */
    public function getCourses() {
        return $this->call('core_course_get_courses');
    }

    /**
     * Get enrolled users for a course
     * @param int $courseId Moodle course ID
     * @return array Enrolled users
     */
    public function getEnrolledUsers($courseId) {
        return $this->call('core_enrol_get_enrolled_users', [
            'courseid' => $courseId
        ]);
    }

    /**
     * Get user's enrolled courses
     * @param int $userId Moodle user ID
     * @return array User's courses
     */
    public function getUserCourses($userId) {
        return $this->call('core_enrol_get_users_courses', [
            'userid' => $userId
        ]);
    }

    /**
     * Create or update a grade for a user
     * @param int $courseId Course ID
     * @param int $userId User ID
     * @param string $itemName Grade item name
     * @param float $grade Grade value
     * @return mixed Response
     */
    public function setGrade($courseId, $userId, $itemName, $grade) {
        return $this->call('core_grades_update_grades', [
            'source' => 'cognitive_recovery',
            'courseid' => $courseId,
            'component' => 'mod_assign',
            'activityid' => 0,
            'itemnumber' => 0,
            'grades[0][studentid]' => $userId,
            'grades[0][grade]' => $grade
        ]);
    }

    /**
     * Get site information
     * @return array Site info
     */
    public function getSiteInfo() {
        return $this->call('core_webservice_get_site_info');
    }

    /**
     * Test connection to Moodle
     * @return bool Connection status
     */
    public function testConnection() {
        try {
            $info = $this->getSiteInfo();
            return isset($info['sitename']);
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Sync users from Moodle to local database
     * @param PDO $db Database connection
     * @param array $userIds Optional array of specific user IDs to sync
     * @return int Number of users synced
     */
    public function syncUsers($db, $userIds = null) {
        $users = [];

        if ($userIds === null) {
            // Get all users (this might be limited by Moodle permissions)
            $users = $this->call('core_user_get_users', [
                'criteria[0][key]' => 'deleted',
                'criteria[0][value]' => '0'
            ]);
            $users = $users['users'] ?? [];
        } else {
            $users = $this->getUsers($userIds);
        }

        $synced = 0;
        $stmt = $db->prepare("
            INSERT INTO users (moodle_user_id, username, email, first_name, last_name, last_sync_at)
            VALUES (:moodle_user_id, :username, :email, :first_name, :last_name, NOW())
            ON DUPLICATE KEY UPDATE
                username = VALUES(username),
                email = VALUES(email),
                first_name = VALUES(first_name),
                last_name = VALUES(last_name),
                last_sync_at = NOW()
        ");

        foreach ($users as $user) {
            $stmt->execute([
                ':moodle_user_id' => $user['id'],
                ':username' => $user['username'],
                ':email' => $user['email'],
                ':first_name' => $user['firstname'] ?? '',
                ':last_name' => $user['lastname'] ?? ''
            ]);
            $synced++;
        }

        return $synced;
    }

    /**
     * Sync courses from Moodle to local database
     * @param PDO $db Database connection
     * @return int Number of courses synced
     */
    public function syncCourses($db) {
        $courses = $this->getCourses();

        $synced = 0;
        $stmt = $db->prepare("
            INSERT INTO courses (moodle_course_id, course_name, course_code, description, start_date, end_date)
            VALUES (:moodle_course_id, :course_name, :course_code, :description, :start_date, :end_date)
            ON DUPLICATE KEY UPDATE
                course_name = VALUES(course_name),
                course_code = VALUES(course_code),
                description = VALUES(description),
                start_date = VALUES(start_date),
                end_date = VALUES(end_date)
        ");

        foreach ($courses as $course) {
            $startDate = isset($course['startdate']) && $course['startdate'] > 0
                ? date('Y-m-d', $course['startdate'])
                : null;
            $endDate = isset($course['enddate']) && $course['enddate'] > 0
                ? date('Y-m-d', $course['enddate'])
                : null;

            $stmt->execute([
                ':moodle_course_id' => $course['id'],
                ':course_name' => $course['fullname'],
                ':course_code' => $course['shortname'] ?? '',
                ':description' => $course['summary'] ?? '',
                ':start_date' => $startDate,
                ':end_date' => $endDate
            ]);
            $synced++;
        }

        return $synced;
    }
}
