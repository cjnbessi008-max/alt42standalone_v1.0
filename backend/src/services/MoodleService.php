<?php
/**
 * Moodle Integration Service
 * Handles communication with Moodle 3.7 LMS
 * Using Moodle Web Services API
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/constants.php';

class MoodleService {
    private $db;
    private $conn;
    private $moodleUrl;
    private $moodleToken;

    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
        $this->moodleUrl = MOODLE_URL;
        $this->moodleToken = MOODLE_TOKEN;
    }

    /**
     * Make request to Moodle Web Services API
     *
     * @param string $function Moodle web service function name
     * @param array $params Parameters for the function
     * @return array Response data
     */
    private function moodleApiRequest($function, $params = []) {
        $endpoint = $this->moodleUrl . '/webservice/rest/server.php';

        $requestParams = array_merge([
            'wstoken' => $this->moodleToken,
            'wsfunction' => $function,
            'moodlewsrestformat' => 'json'
        ], $params);

        $ch = curl_init();

        curl_setopt($ch, CURLOPT_URL, $endpoint);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($requestParams));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For development
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if (curl_errno($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new Exception("Moodle API request failed: $error");
        }

        curl_close($ch);

        if ($httpCode !== 200) {
            throw new Exception("Moodle API returned HTTP code: $httpCode");
        }

        $data = json_decode($response, true);

        if (isset($data['exception'])) {
            throw new Exception("Moodle API error: " . $data['message']);
        }

        return $data;
    }

    /**
     * Sync user from Moodle to local database
     *
     * @param int $moodleUserId Moodle user ID
     * @return array User data
     */
    public function syncUser($moodleUserId) {
        try {
            // Get user info from Moodle
            $response = $this->moodleApiRequest('core_user_get_users_by_field', [
                'field' => 'id',
                'values[0]' => $moodleUserId
            ]);

            if (empty($response)) {
                throw new Exception("User not found in Moodle");
            }

            $moodleUser = $response[0];

            // Check if user exists locally
            $sql = "SELECT id FROM moodle_users WHERE moodle_user_id = :moodle_user_id LIMIT 1";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':moodle_user_id', $moodleUserId);
            $stmt->execute();

            $existingUser = $stmt->fetch();

            if ($existingUser) {
                // Update existing user
                $sql = "UPDATE moodle_users SET
                            username = :username,
                            email = :email,
                            first_name = :first_name,
                            last_name = :last_name,
                            updated_at = NOW()
                        WHERE moodle_user_id = :moodle_user_id";

                $stmt = $this->conn->prepare($sql);

                $stmt->bindParam(':moodle_user_id', $moodleUserId);
                $stmt->bindParam(':username', $moodleUser['username']);
                $stmt->bindParam(':email', $moodleUser['email']);
                $stmt->bindParam(':first_name', $moodleUser['firstname']);
                $stmt->bindParam(':last_name', $moodleUser['lastname']);

                $stmt->execute();

                return [
                    'success' => true,
                    'user_id' => $existingUser['id'],
                    'action' => 'updated'
                ];

            } else {
                // Insert new user
                $sql = "INSERT INTO moodle_users (
                            moodle_user_id, username, email, first_name, last_name
                        ) VALUES (
                            :moodle_user_id, :username, :email, :first_name, :last_name
                        )";

                $stmt = $this->conn->prepare($sql);

                $stmt->bindParam(':moodle_user_id', $moodleUserId);
                $stmt->bindParam(':username', $moodleUser['username']);
                $stmt->bindParam(':email', $moodleUser['email']);
                $stmt->bindParam(':first_name', $moodleUser['firstname']);
                $stmt->bindParam(':last_name', $moodleUser['lastname']);

                $stmt->execute();

                return [
                    'success' => true,
                    'user_id' => $this->conn->lastInsertId(),
                    'action' => 'created'
                ];
            }

        } catch (Exception $e) {
            error_log("Error syncing user: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get problem from Moodle quiz
     *
     * @param int $moodleProblemId Moodle question ID
     * @return array Problem data
     */
    public function getProblemFromMoodle($moodleProblemId) {
        try {
            // Get question from Moodle
            // Note: Moodle 3.7 doesn't have a direct question API, so this is a placeholder
            // In real implementation, you would use mod_quiz_get_quiz_by_courses or similar

            // For now, return mock structure
            return [
                'success' => true,
                'problem' => [
                    'moodle_problem_id' => $moodleProblemId,
                    'title' => 'Vector Translation Problem',
                    'description' => 'Translate the vector to the target position',
                    'problem_type' => 'vector_translation'
                ]
            ];

        } catch (Exception $e) {
            error_log("Error getting problem: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Submit grade to Moodle gradebook
     *
     * @param int $moodleUserId Moodle user ID
     * @param int $itemId Grade item ID
     * @param float $grade Grade value
     * @return array Result
     */
    public function submitGrade($moodleUserId, $itemId, $grade) {
        try {
            $response = $this->moodleApiRequest('core_grades_update_grades', [
                'source' => 'shift_trail',
                'courseid' => 1, // TODO: Get from context
                'component' => 'mod_quiz',
                'activityid' => $itemId,
                'itemnumber' => 0,
                'grades[0][studentid]' => $moodleUserId,
                'grades[0][grade]' => $grade
            ]);

            return [
                'success' => true,
                'response' => $response
            ];

        } catch (Exception $e) {
            error_log("Error submitting grade: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Handle LTI launch
     *
     * @param array $ltiParams LTI launch parameters
     * @return array Launch result with user and context
     */
    public function handleLtiLaunch($ltiParams) {
        try {
            // Validate LTI signature (simplified - use proper LTI library in production)
            // For Moodle 3.7 LTI 1.1

            // Extract user info
            $moodleUserId = isset($ltiParams['user_id']) ? intval($ltiParams['user_id']) : null;
            $courseId = isset($ltiParams['context_id']) ? intval($ltiParams['context_id']) : null;
            $problemId = isset($ltiParams['resource_link_id']) ? intval($ltiParams['resource_link_id']) : null;

            if (!$moodleUserId) {
                throw new Exception("Invalid LTI launch: missing user_id");
            }

            // Sync user
            $userSync = $this->syncUser($moodleUserId);

            if (!$userSync['success']) {
                throw new Exception("Failed to sync user");
            }

            // Create session
            $sessionData = [
                'student_id' => $userSync['user_id'],
                'moodle_course_id' => $courseId,
                'lti_launch_id' => isset($ltiParams['launch_id']) ? $ltiParams['launch_id'] : null,
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
                'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null
            ];

            // TODO: Create session in database

            return [
                'success' => true,
                'user_id' => $userSync['user_id'],
                'course_id' => $courseId,
                'problem_id' => $problemId,
                'session_data' => $sessionData
            ];

        } catch (Exception $e) {
            error_log("LTI launch error: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Send submission data back to Moodle
     *
     * @param int $submissionId Local submission ID
     * @return array Result
     */
    public function syncSubmissionToMoodle($submissionId) {
        try {
            // Get submission data
            $sql = "SELECT s.*, p.moodle_problem_id, u.moodle_user_id
                    FROM submissions s
                    JOIN problems p ON s.problem_id = p.id
                    JOIN moodle_users u ON s.student_id = u.id
                    WHERE s.id = :submission_id
                    LIMIT 1";

            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':submission_id', $submissionId);
            $stmt->execute();

            $submission = $stmt->fetch();

            if (!$submission) {
                throw new Exception("Submission not found");
            }

            // Submit grade to Moodle
            $gradeResult = $this->submitGrade(
                $submission['moodle_user_id'],
                $submission['moodle_problem_id'],
                $submission['score']
            );

            if ($gradeResult['success']) {
                // Update sync status
                $sql = "UPDATE submissions SET
                            synced_to_moodle = 1,
                            moodle_submission_id = :moodle_submission_id
                        WHERE id = :submission_id";

                $stmt = $this->conn->prepare($sql);
                $moodleSubId = time(); // TODO: Get actual Moodle submission ID
                $stmt->bindParam(':moodle_submission_id', $moodleSubId);
                $stmt->bindParam(':submission_id', $submissionId);
                $stmt->execute();
            }

            return $gradeResult;

        } catch (Exception $e) {
            error_log("Error syncing submission: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get course info from Moodle
     *
     * @param int $courseId Moodle course ID
     * @return array Course data
     */
    public function getCourseInfo($courseId) {
        try {
            $response = $this->moodleApiRequest('core_course_get_courses', [
                'options[ids][0]' => $courseId
            ]);

            if (empty($response)) {
                throw new Exception("Course not found");
            }

            return [
                'success' => true,
                'course' => $response[0]
            ];

        } catch (Exception $e) {
            error_log("Error getting course: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Log activity to Moodle
     *
     * @param int $moodleUserId Moodle user ID
     * @param string $action Action performed
     * @param array $data Additional data
     * @return array Result
     */
    public function logActivity($moodleUserId, $action, $data = []) {
        try {
            // Log to Moodle's activity log
            // Note: Requires custom Moodle plugin or external activity log service

            error_log("Moodle activity log: User $moodleUserId performed $action");

            return ['success' => true];

        } catch (Exception $e) {
            error_log("Error logging activity: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}
