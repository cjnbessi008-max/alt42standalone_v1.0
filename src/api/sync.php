<?php
/**
 * Sync API Endpoint
 * Handles Moodle data synchronization
 */

$sync = new MoodleSync();

switch ($method) {
    case 'POST':
        // Trigger synchronization
        $type = $input['type'] ?? 'quiz_attempts';
        $limit = $input['limit'] ?? null;

        switch ($type) {
            case 'quiz_attempts':
                $result = $sync->syncQuizAttempts($limit);
                send_success_response($result, 'Quiz attempts synchronized successfully');
                break;

            default:
                send_error_response('Unknown sync type: ' . $type, 400);
        }
        break;

    case 'GET':
        // Get sync history
        if ($id === 'history') {
            $db = Database::getInstance();
            $limit = $_GET['limit'] ?? 20;

            $sql = "SELECT * FROM sync_log
                    ORDER BY start_time DESC
                    LIMIT :limit";

            $stmt = $db->query($sql, [':limit' => intval($limit)]);
            $history = $stmt->fetchAll();

            send_success_response($history);
        }
        // Get latest sync status
        elseif ($id === 'status') {
            $db = Database::getInstance();

            $sql = "SELECT * FROM sync_log
                    ORDER BY start_time DESC
                    LIMIT 1";

            $status = $db->fetchOne($sql);

            send_success_response($status);
        }
        else {
            send_error_response('Unknown action', 400);
        }
        break;

    default:
        send_error_response('Method not allowed', 405);
}
