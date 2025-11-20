<?php
/**
 * Moodle Controller
 * Handles Moodle LMS integration
 */

require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';

class MoodleController
{
    private $pdo;

    public function __construct()
    {
        $this->pdo = require __DIR__ . '/../../config/database.php';
    }

    public function handleRequest($method, $action, $id)
    {
        switch ($action) {
            case 'trigger':
                if ($method === 'POST') {
                    $this->triggerGame();
                } else {
                    Response::error('Method not allowed', 405);
                }
                break;

            case 'complete':
                if ($method === 'POST') {
                    $this->syncCompletion();
                } else {
                    Response::error('Method not allowed', 405);
                }
                break;

            case 'status':
                if ($method === 'GET') {
                    $this->getStatus($id);
                } else {
                    Response::error('Method not allowed', 405);
                }
                break;

            default:
                Response::error('Action not found', 404);
        }
    }

    /**
     * Trigger game from Moodle problem
     * POST /api/moodle/trigger
     * Body: {
     *   "moodle_user_id": 1001,
     *   "problem_type": "fractions",
     *   "problem_id": 12345,
     *   "problem_url": "http://..."
     * }
     */
    private function triggerGame()
    {
        $input = json_decode(file_get_contents('php://input'), true);

        // Validation
        $required = ['moodle_user_id', 'problem_type'];
        foreach ($required as $field) {
            if (empty($input[$field])) {
                Response::validationError(["$field is required"]);
            }
        }

        // Find student by Moodle user ID
        $stmt = $this->pdo->prepare("SELECT * FROM students WHERE moodle_user_id = ?");
        $stmt->execute([$input['moodle_user_id']]);
        $student = $stmt->fetch();

        if (!$student) {
            Response::error('Student not found. Please sync Moodle users first.', 404);
        }

        // Find concept card by problem type
        $stmt = $this->pdo->prepare("SELECT * FROM concept_cards WHERE concept_name = ?");
        $stmt->execute([$input['problem_type']]);
        $card = $stmt->fetch();

        if (!$card) {
            Response::error('Invalid problem type', 400);
        }

        // Log the trigger event
        $stmt = $this->pdo->prepare("
            INSERT INTO moodle_sync (student_id, moodle_user_id, problem_type, problem_id, problem_url, game_triggered, game_triggered_at)
            VALUES (?, ?, ?, ?, ?, TRUE, NOW())
        ");

        $stmt->execute([
            $student['student_id'],
            $input['moodle_user_id'],
            $input['problem_type'],
            $input['problem_id'] ?? null,
            $input['problem_url'] ?? null
        ]);

        $syncId = $this->pdo->lastInsertId();

        // Return widget launch URL
        $widgetUrl = BASE_URL . "/index.html?game=" . $card['game_folder'] . "&student=" . $student['student_id'] . "&sync=" . $syncId;

        Response::success([
            'widget_url' => $widgetUrl,
            'game_name' => $card['spirit_name'],
            'concept_name' => $card['concept_name'],
            'student_name' => $student['full_name'],
            'sync_id' => $syncId
        ], 'Game trigger successful');
    }

    /**
     * Sync game completion back to Moodle
     * POST /api/moodle/complete
     * Body: {
     *   "sync_id": 123,
     *   "session_id": "...",
     *   "score": 85.5,
     *   "completion_status": "completed"
     * }
     */
    private function syncCompletion()
    {
        $input = json_decode(file_get_contents('php://input'), true);

        // Validation
        if (empty($input['sync_id']) || empty($input['score'])) {
            Response::validationError(['sync_id and score are required']);
        }

        $syncId = $input['sync_id'];
        $score = $input['score'];

        // Get sync record
        $stmt = $this->pdo->prepare("SELECT * FROM moodle_sync WHERE id = ?");
        $stmt->execute([$syncId]);
        $sync = $stmt->fetch();

        if (!$sync) {
            Response::notFound('Sync record not found');
        }

        // TODO: Actually call Moodle Web Services API to update grade
        // For now, we'll just mark it as synced in our database
        // Implement this based on your Moodle setup:
        // $moodleResult = $this->callMoodleWebService($sync, $score);

        $moodleResult = true; // Placeholder

        if ($moodleResult) {
            $stmt = $this->pdo->prepare("
                UPDATE moodle_sync
                SET completion_synced = TRUE,
                    completion_score = ?,
                    synced_at = NOW(),
                    session_id = ?
                WHERE id = ?
            ");

            $stmt->execute([$score, $input['session_id'] ?? null, $syncId]);

            Response::success([
                'synced' => true,
                'score' => $score
            ], 'Completion synced to Moodle');
        } else {
            $stmt = $this->pdo->prepare("
                UPDATE moodle_sync
                SET sync_error = ?
                WHERE id = ?
            ");

            $stmt->execute(['Failed to sync with Moodle', $syncId]);

            Response::error('Failed to sync with Moodle', 500);
        }
    }

    /**
     * Get sync status
     * GET /api/moodle/status/{sync_id}
     */
    private function getStatus($syncId)
    {
        if (empty($syncId)) {
            Response::validationError(['sync_id is required']);
        }

        $stmt = $this->pdo->prepare("
            SELECT
                ms.*,
                s.full_name as student_name,
                cc.spirit_name
            FROM moodle_sync ms
            JOIN students s ON ms.student_id = s.student_id
            LEFT JOIN concept_cards cc ON ms.problem_type = cc.concept_name
            WHERE ms.id = ?
        ");

        $stmt->execute([$syncId]);
        $status = $stmt->fetch();

        if (!$status) {
            Response::notFound('Sync status not found');
        }

        Response::success($status);
    }

    /**
     * Call Moodle Web Services API (implementation stub)
     * You'll need to implement this based on your Moodle configuration
     */
    private function callMoodleWebService($sync, $score)
    {
        // Example implementation (adjust based on your Moodle setup):
        /*
        $params = [
            'wstoken' => MOODLE_WS_TOKEN,
            'wsfunction' => MOODLE_WS_FUNCTION,
            'moodlewsrestformat' => 'json',
            'userid' => $sync['moodle_user_id'],
            'grade' => $score,
            'problemid' => $sync['problem_id']
        ];

        $ch = curl_init(MOODLE_URL . '/webservice/rest/server.php');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $response = curl_exec($ch);
        curl_close($ch);

        $result = json_decode($response, true);
        return !isset($result['exception']);
        */

        return true; // Placeholder
    }
}
