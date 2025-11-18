<?php
/**
 * Moodle Controller
 * Handles integration with Moodle LMS
 */

class MoodleController {
    private $db;
    private $moodleUrl;
    private $token;

    public function __construct() {
        $this->db = Database::getInstance();
        $this->moodleUrl = MOODLE_URL;
        $this->token = MOODLE_TOKEN;
    }

    /**
     * Get all Moodle integrations
     */
    public function getAll() {
        $sql = "SELECT mi.*, p.title as problem_title
                FROM moodle_integration mi
                LEFT JOIN problems p ON mi.problem_id = p.id
                ORDER BY mi.created_at DESC";

        $integrations = $this->db->fetchAll($sql);
        sendResponse($integrations);
    }

    /**
     * Get single integration
     */
    public function getOne($id) {
        $sql = "SELECT mi.*, p.title as problem_title
                FROM moodle_integration mi
                LEFT JOIN problems p ON mi.problem_id = p.id
                WHERE mi.id = :id";

        $integration = $this->db->fetchOne($sql, [':id' => $id]);

        if (!$integration) {
            sendError('Integration not found', 404);
        }

        sendResponse($integration);
    }

    /**
     * Create Moodle integration
     */
    public function create() {
        $data = getRequestBody();

        // Validate required fields
        $required = ['problem_id', 'moodle_course_id'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                sendError("Field '$field' is required", 400);
            }
        }

        $sql = "INSERT INTO moodle_integration
                (problem_id, moodle_course_id, moodle_activity_id,
                 moodle_question_id, integration_type, sync_enabled)
                VALUES
                (:problem_id, :moodle_course_id, :moodle_activity_id,
                 :moodle_question_id, :integration_type, :sync_enabled)";

        $params = [
            ':problem_id' => $data['problem_id'],
            ':moodle_course_id' => $data['moodle_course_id'],
            ':moodle_activity_id' => $data['moodle_activity_id'] ?? null,
            ':moodle_question_id' => $data['moodle_question_id'] ?? null,
            ':integration_type' => $data['integration_type'] ?? 'quiz',
            ':sync_enabled' => $data['sync_enabled'] ?? 1
        ];

        try {
            $integrationId = $this->db->insert($sql, $params);
            sendResponse([
                'id' => $integrationId,
                'message' => 'Moodle integration created successfully'
            ], 201);
        } catch (Exception $e) {
            if (strpos($e->getMessage(), 'Duplicate') !== false) {
                sendError('Integration already exists for this Moodle activity', 409);
            }
            throw $e;
        }
    }

    /**
     * Update integration
     */
    public function update($id) {
        $data = getRequestBody();

        $sql = "UPDATE moodle_integration SET
                sync_enabled = :sync_enabled,
                integration_type = :integration_type
                WHERE id = :id";

        $params = [
            ':id' => $id,
            ':sync_enabled' => $data['sync_enabled'] ?? 1,
            ':integration_type' => $data['integration_type'] ?? 'quiz'
        ];

        $affected = $this->db->update($sql, $params);

        if ($affected === 0) {
            sendError('Integration not found', 404);
        }

        sendResponse(['message' => 'Integration updated successfully']);
    }

    /**
     * Delete integration
     */
    public function delete($id) {
        $sql = "DELETE FROM moodle_integration WHERE id = :id";
        $affected = $this->db->delete($sql, [':id' => $id]);

        if ($affected === 0) {
            sendError('Integration not found', 404);
        }

        sendResponse(['message' => 'Integration deleted successfully']);
    }

    /**
     * Handle custom actions
     */
    public function handleAction($id, $action) {
        switch ($action) {
            case 'sync':
                $this->syncWithMoodle($id);
                break;

            case 'courses':
                $this->getMoodleCourses();
                break;

            case 'activities':
                $this->getMoodleActivities($id);
                break;

            default:
                sendError('Action not found', 404);
                break;
        }
    }

    /**
     * Sync problem with Moodle
     */
    private function syncWithMoodle($integrationId) {
        $sql = "SELECT * FROM moodle_integration WHERE id = :id";
        $integration = $this->db->fetchOne($sql, [':id' => $integrationId]);

        if (!$integration) {
            sendError('Integration not found', 404);
        }

        if (empty($this->token)) {
            sendError('Moodle token not configured', 500);
        }

        // Get problem details
        $problemSql = "SELECT * FROM problems WHERE id = :id";
        $problem = $this->db->fetchOne($problemSql, [':id' => $integration['problem_id']]);

        // Call Moodle Web Service API
        $result = $this->callMoodleAPI('local_blendmath_sync_problem', [
            'courseid' => $integration['moodle_course_id'],
            'activityid' => $integration['moodle_activity_id'],
            'problemdata' => json_encode($problem)
        ]);

        // Update last sync time
        $updateSql = "UPDATE moodle_integration SET last_sync_at = NOW() WHERE id = :id";
        $this->db->update($updateSql, [':id' => $integrationId]);

        sendResponse([
            'message' => 'Synced with Moodle successfully',
            'result' => $result
        ]);
    }

    /**
     * Get Moodle courses
     */
    private function getMoodleCourses() {
        if (empty($this->token)) {
            sendError('Moodle token not configured', 500);
        }

        $courses = $this->callMoodleAPI('core_course_get_courses');
        sendResponse($courses);
    }

    /**
     * Get Moodle course activities
     */
    private function getMoodleActivities($courseId) {
        if (empty($this->token)) {
            sendError('Moodle token not configured', 500);
        }

        $activities = $this->callMoodleAPI('core_course_get_contents', [
            'courseid' => $courseId
        ]);

        sendResponse($activities);
    }

    /**
     * Call Moodle Web Service API
     */
    private function callMoodleAPI($function, $params = []) {
        $url = $this->moodleUrl . '/webservice/rest/server.php';

        $queryParams = array_merge([
            'wstoken' => $this->token,
            'wsfunction' => $function,
            'moodlewsrestformat' => 'json'
        ], $params);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url . '?' . http_build_query($queryParams));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception("Moodle API error: " . $error);
        }

        if ($httpCode !== 200) {
            throw new Exception("Moodle API returned HTTP " . $httpCode);
        }

        $data = json_decode($response, true);

        if (isset($data['exception'])) {
            throw new Exception("Moodle error: " . $data['message']);
        }

        return $data;
    }
}
