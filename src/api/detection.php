<?php
/**
 * Detection API Endpoint
 * Handles concept avoidance detection
 */

$detector = new AvoidanceDetector();

switch ($method) {
    case 'POST':
        // Run detection
        if ($id === 'run') {
            $user_id = $input['user_id'] ?? null;

            if ($user_id) {
                // Detect for specific student
                $patterns = $detector->detectForStudent($user_id);
                send_success_response([
                    'patterns' => $patterns,
                    'count' => count($patterns)
                ], 'Detection completed for student ' . $user_id);
            } else {
                // Detect for all students
                $patterns = $detector->detectAll();
                send_success_response([
                    'patterns' => $patterns,
                    'count' => count($patterns)
                ], 'Detection completed for all students');
            }
        } else {
            send_error_response('Unknown action', 400);
        }
        break;

    case 'GET':
        // Get statistics
        if ($id === 'statistics') {
            $stats = $detector->getStatistics();
            send_success_response($stats);
        } else {
            send_error_response('Unknown action', 400);
        }
        break;

    default:
        send_error_response('Method not allowed', 405);
}
