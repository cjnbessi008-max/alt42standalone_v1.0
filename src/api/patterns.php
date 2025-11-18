<?php
/**
 * Patterns API Endpoint
 * Handles avoidance pattern operations
 */

$db = Database::getInstance();
$detector = new AvoidanceDetector();

switch ($method) {
    case 'GET':
        if ($id) {
            // Get specific pattern
            $sql = "SELECT * FROM v_avoidance_dashboard WHERE id = :id";
            $pattern = $db->fetchOne($sql, [':id' => $id]);

            if ($pattern) {
                send_success_response($pattern);
            } else {
                send_error_response('Pattern not found', 404);
            }
        } else {
            // Get all patterns with filters
            $user_id = $_GET['user_id'] ?? null;
            $concept_id = $_GET['concept_id'] ?? null;
            $severity = $_GET['severity'] ?? null;
            $type = $_GET['type'] ?? null;
            $include_resolved = isset($_GET['include_resolved']) && $_GET['include_resolved'] === 'true';

            $sql = "SELECT * FROM v_avoidance_dashboard WHERE 1=1";
            $params = [];

            if ($user_id) {
                $sql .= " AND moodle_user_id = :user_id";
                $params[':user_id'] = $user_id;
            }

            if ($concept_id) {
                $sql .= " AND concept_id = :concept_id";
                $params[':concept_id'] = $concept_id;
            }

            if ($severity) {
                $sql .= " AND severity_level = :severity";
                $params[':severity'] = $severity;
            }

            if ($type) {
                $sql .= " AND avoidance_type = :type";
                $params[':type'] = $type;
            }

            if (!$include_resolved) {
                $sql .= " AND is_resolved = 0";
            }

            $sql .= " ORDER BY severity_level DESC, confidence_score DESC, detection_date DESC";

            $patterns = $db->fetchAll($sql, $params);
            send_success_response($patterns);
        }
        break;

    case 'PUT':
        // Update pattern
        if (!$id) {
            send_error_response('Pattern ID required', 400);
        }

        if ($action === 'resolve') {
            $notes = $input['notes'] ?? null;
            $rows = $detector->resolvePattern($id, $notes);

            if ($rows > 0) {
                send_success_response(null, 'Pattern resolved successfully');
            } else {
                send_error_response('Pattern not found', 404);
            }
        }
        elseif ($action === 'notify') {
            $rows = $detector->markNotified($id);

            if ($rows > 0) {
                send_success_response(null, 'Pattern marked as notified');
            } else {
                send_error_response('Pattern not found', 404);
            }
        }
        else {
            send_error_response('Unknown action', 400);
        }
        break;

    default:
        send_error_response('Method not allowed', 405);
}
