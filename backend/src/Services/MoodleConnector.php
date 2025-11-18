<?php
/**
 * Moodle Web Services Connector
 * Handles all communication with Moodle LMS via Web Services API
 */

namespace DeviationBreeze\Services;

class MoodleConnector
{
    private $moodleUrl;
    private $token;
    private $restFormat = 'json';

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->moodleUrl = rtrim(getenv('MOODLE_URL'), '/');
        $this->token = getenv('MOODLE_WS_TOKEN');

        if (empty($this->moodleUrl) || empty($this->token)) {
            throw new \Exception('Moodle configuration missing. Please check .env file.');
        }
    }

    /**
     * Make API call to Moodle Web Services
     *
     * @param string $function Web service function name
     * @param array $params Parameters
     * @return mixed Response data
     */
    private function call($function, $params = [])
    {
        $url = $this->moodleUrl . '/webservice/rest/server.php';

        $requestParams = array_merge([
            'wstoken' => $this->token,
            'wsfunction' => $function,
            'moodlewsrestformat' => $this->restFormat
        ], $params);

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($requestParams));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For development only
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            error_log("Moodle API call failed: {$error}");
            throw new \Exception("Failed to connect to Moodle: {$error}");
        }

        if ($httpCode !== 200) {
            error_log("Moodle API returned HTTP {$httpCode}");
            throw new \Exception("Moodle API error: HTTP {$httpCode}");
        }

        $data = json_decode($response, true);

        if (isset($data['exception'])) {
            error_log("Moodle exception: " . $data['message']);
            throw new \Exception("Moodle error: " . $data['message']);
        }

        return $data;
    }

    /**
     * Get all courses
     *
     * @return array List of courses
     */
    public function getCourses()
    {
        return $this->call('core_course_get_courses');
    }

    /**
     * Get course by ID
     *
     * @param int $courseId
     * @return array Course data
     */
    public function getCourse($courseId)
    {
        $result = $this->call('core_course_get_courses', [
            'options[ids][0]' => $courseId
        ]);

        return !empty($result) ? $result[0] : null;
    }

    /**
     * Get quizzes by course IDs
     *
     * @param array $courseIds
     * @return array List of quizzes
     */
    public function getQuizzesByCourses($courseIds)
    {
        $params = [];
        foreach ($courseIds as $index => $courseId) {
            $params["courseids[{$index}]"] = $courseId;
        }

        $result = $this->call('mod_quiz_get_quizzes_by_courses', $params);
        return $result['quizzes'] ?? [];
    }

    /**
     * Get quiz access information
     *
     * @param int $quizId
     * @return array Quiz access info
     */
    public function getQuizAccessInformation($quizId)
    {
        return $this->call('mod_quiz_get_quiz_access_information', [
            'quizid' => $quizId
        ]);
    }

    /**
     * Get user attempts for a quiz
     *
     * @param int $quizId
     * @param int $userId (optional, 0 = current user)
     * @return array List of attempts
     */
    public function getUserAttempts($quizId, $userId = 0)
    {
        $result = $this->call('mod_quiz_get_user_attempts', [
            'quizid' => $quizId,
            'userid' => $userId,
            'status' => 'all'
        ]);

        return $result['attempts'] ?? [];
    }

    /**
     * Get attempt review (detailed results)
     *
     * @param int $attemptId
     * @return array Attempt review data
     */
    public function getAttemptReview($attemptId)
    {
        return $this->call('mod_quiz_get_attempt_review', [
            'attemptid' => $attemptId
        ]);
    }

    /**
     * Get enrolled users in a course
     *
     * @param int $courseId
     * @return array List of users
     */
    public function getEnrolledUsers($courseId)
    {
        return $this->call('core_enrol_get_enrolled_users', [
            'courseid' => $courseId
        ]);
    }

    /**
     * Get user by ID
     *
     * @param int $userId
     * @return array User data
     */
    public function getUser($userId)
    {
        $result = $this->call('core_user_get_users', [
            'criteria[0][key]' => 'id',
            'criteria[0][value]' => $userId
        ]);

        return !empty($result['users']) ? $result['users'][0] : null;
    }

    /**
     * Get users by field
     *
     * @param string $field Field name (id, username, email)
     * @param mixed $value Field value
     * @return array List of users
     */
    public function getUsersByField($field, $value)
    {
        $result = $this->call('core_user_get_users', [
            'criteria[0][key]' => $field,
            'criteria[0][value]' => $value
        ]);

        return $result['users'] ?? [];
    }

    /**
     * Get quiz best grade for user
     *
     * @param int $quizId
     * @param int $userId
     * @return array Grade information
     */
    public function getQuizUserBestGrade($quizId, $userId)
    {
        return $this->call('mod_quiz_get_user_best_grade', [
            'quizid' => $quizId,
            'userid' => $userId
        ]);
    }

    /**
     * Get attempt data (questions and answers)
     *
     * @param int $attemptId
     * @param int $page Page number (-1 for all)
     * @return array Attempt data
     */
    public function getAttemptData($attemptId, $page = -1)
    {
        return $this->call('mod_quiz_get_attempt_data', [
            'attemptid' => $attemptId,
            'page' => $page
        ]);
    }

    /**
     * Test connection to Moodle
     *
     * @return bool Connection status
     */
    public function testConnection()
    {
        try {
            $info = $this->call('core_webservice_get_site_info');
            return isset($info['sitename']);
        } catch (\Exception $e) {
            error_log("Moodle connection test failed: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get site info
     *
     * @return array Site information
     */
    public function getSiteInfo()
    {
        return $this->call('core_webservice_get_site_info');
    }

    /**
     * Sync course data to local database
     *
     * @param int $courseId
     * @return bool Success status
     */
    public function syncCourse($courseId)
    {
        try {
            $course = $this->getCourse($courseId);

            if (!$course) {
                throw new \Exception("Course {$courseId} not found in Moodle");
            }

            $db = \DeviationBreeze\Utils\Database::getInstance();

            // Insert or update course
            $sql = "INSERT INTO courses (moodle_course_id, course_name, course_fullname, visible, start_date)
                    VALUES (?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                    course_name = VALUES(course_name),
                    course_fullname = VALUES(course_fullname),
                    visible = VALUES(visible),
                    start_date = VALUES(start_date),
                    last_sync = CURRENT_TIMESTAMP";

            $db->execute($sql, [
                $course['id'],
                $course['shortname'] ?? '',
                $course['fullname'] ?? '',
                $course['visible'] ?? 1,
                isset($course['startdate']) ? date('Y-m-d H:i:s', $course['startdate']) : null
            ]);

            return true;
        } catch (\Exception $e) {
            error_log("Failed to sync course {$courseId}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Sync quiz data to local database
     *
     * @param int $quizId
     * @param int $localCourseId Local database course ID
     * @return bool Success status
     */
    public function syncQuiz($quizId, $localCourseId)
    {
        try {
            $quizzes = $this->getQuizzesByCourses([$quizId]);

            if (empty($quizzes)) {
                throw new \Exception("Quiz {$quizId} not found");
            }

            $quiz = $quizzes[0];
            $db = \DeviationBreeze\Utils\Database::getInstance();

            $sql = "INSERT INTO quizzes (
                        moodle_quiz_id, course_id, quiz_name, intro, question_count,
                        time_limit, attempts_allowed, grade_method, max_grade
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                    quiz_name = VALUES(quiz_name),
                    intro = VALUES(intro),
                    question_count = VALUES(question_count),
                    time_limit = VALUES(time_limit),
                    last_sync = CURRENT_TIMESTAMP";

            $db->execute($sql, [
                $quiz['id'],
                $localCourseId,
                $quiz['name'] ?? '',
                $quiz['intro'] ?? '',
                $quiz['questions'] ?? 0,
                $quiz['timelimit'] ?? 0,
                $quiz['attempts'] ?? 0,
                'highest',
                $quiz['grade'] ?? 100
            ]);

            return true;
        } catch (\Exception $e) {
            error_log("Failed to sync quiz {$quizId}: " . $e->getMessage());
            return false;
        }
    }
}
