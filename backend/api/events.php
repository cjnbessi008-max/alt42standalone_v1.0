<?php
/**
 * Interaction Events API
 * Track student interactions for DMN drift analysis
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

class EventsAPI {
    private $conn;

    public function __construct() {
        $database = new Database();
        $database->loadConfig();
        $this->conn = $database->getConnection();
    }

    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = $_SERVER['PATH_INFO'] ?? '/';

        try {
            switch($method) {
                case 'POST':
                    if ($path === '/' || $path === '') {
                        $this->trackEvent();
                    } elseif ($path === '/batch') {
                        $this->trackBatchEvents();
                    } else {
                        $this->sendError(404, 'Endpoint not found');
                    }
                    break;

                case 'GET':
                    if (preg_match('/^\/session\/(\d+)$/', $path, $matches)) {
                        $this->getSessionEvents($matches[1]);
                    } else {
                        $this->sendError(404, 'Endpoint not found');
                    }
                    break;

                default:
                    $this->sendError(405, 'Method not allowed');
            }
        } catch (Exception $e) {
            $this->sendError(500, $e->getMessage());
        }
    }

    /**
     * Track single event
     * POST /api/events
     */
    private function trackEvent() {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['session_id']) || !isset($data['event_type'])) {
            $this->sendError(400, 'Missing required fields: session_id, event_type');
            return;
        }

        $validEventTypes = ['click', 'keypress', 'scroll', 'focus_loss', 'focus_gain',
                           'answer_submit', 'idle_start', 'idle_end', 'mouse_move'];

        if (!in_array($data['event_type'], $validEventTypes)) {
            $this->sendError(400, 'Invalid event_type');
            return;
        }

        $query = "
            INSERT INTO interaction_events (
                session_id, student_id, event_type, event_data, response_time_ms
            )
            SELECT
                :session_id,
                student_id,
                :event_type,
                :event_data,
                :response_time_ms
            FROM learning_sessions
            WHERE id = :session_id
        ";

        $stmt = $this->conn->prepare($query);
        $result = $stmt->execute([
            'session_id' => $data['session_id'],
            'event_type' => $data['event_type'],
            'event_data' => json_encode($data['event_data'] ?? null),
            'response_time_ms' => $data['response_time_ms'] ?? null
        ]);

        if ($result) {
            // Update session activity count
            $updateQuery = "
                UPDATE learning_sessions
                SET activity_count = activity_count + 1
                WHERE id = :session_id
            ";
            $updateStmt = $this->conn->prepare($updateQuery);
            $updateStmt->execute(['session_id' => $data['session_id']]);

            $this->sendSuccess([
                'event_id' => $this->conn->lastInsertId(),
                'tracked_at' => date('Y-m-d H:i:s')
            ], 201);
        } else {
            $this->sendError(500, 'Failed to track event');
        }
    }

    /**
     * Track multiple events in batch
     * POST /api/events/batch
     */
    private function trackBatchEvents() {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['events']) || !is_array($data['events'])) {
            $this->sendError(400, 'Missing events array');
            return;
        }

        $this->conn->beginTransaction();

        try {
            $query = "
                INSERT INTO interaction_events (
                    session_id, student_id, event_type, event_data, response_time_ms
                )
                SELECT
                    :session_id,
                    student_id,
                    :event_type,
                    :event_data,
                    :response_time_ms
                FROM learning_sessions
                WHERE id = :session_id
            ";

            $stmt = $this->conn->prepare($query);

            $count = 0;
            foreach ($data['events'] as $event) {
                if (!isset($event['session_id']) || !isset($event['event_type'])) {
                    continue;
                }

                $stmt->execute([
                    'session_id' => $event['session_id'],
                    'event_type' => $event['event_type'],
                    'event_data' => json_encode($event['event_data'] ?? null),
                    'response_time_ms' => $event['response_time_ms'] ?? null
                ]);
                $count++;
            }

            $this->conn->commit();

            $this->sendSuccess([
                'events_tracked' => $count,
                'tracked_at' => date('Y-m-d H:i:s')
            ], 201);

        } catch (Exception $e) {
            $this->conn->rollBack();
            $this->sendError(500, 'Failed to track batch events: ' . $e->getMessage());
        }
    }

    /**
     * Get events for a session
     * GET /api/events/session/{session_id}
     */
    private function getSessionEvents($sessionId) {
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;
        $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
        $eventType = $_GET['event_type'] ?? null;

        $query = "
            SELECT *
            FROM interaction_events
            WHERE session_id = :session_id
        ";

        $params = ['session_id' => $sessionId];

        if ($eventType) {
            $query .= " AND event_type = :event_type";
            $params['event_type'] = $eventType;
        }

        $query .= " ORDER BY timestamp DESC LIMIT :limit OFFSET :offset";

        $stmt = $this->conn->prepare($query);

        // Bind limit and offset separately as integers
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);

        $stmt->execute();
        $events = $stmt->fetchAll();

        // Decode JSON event_data
        foreach ($events as &$event) {
            $event['event_data'] = json_decode($event['event_data']);
        }

        $this->sendSuccess([
            'events' => $events,
            'limit' => $limit,
            'offset' => $offset
        ]);
    }

    private function sendSuccess($data, $code = 200) {
        http_response_code($code);
        echo json_encode([
            'success' => true,
            'data' => $data
        ]);
    }

    private function sendError($code, $message) {
        http_response_code($code);
        echo json_encode([
            'success' => false,
            'error' => $message
        ]);
    }
}

$api = new EventsAPI();
$api->handleRequest();
