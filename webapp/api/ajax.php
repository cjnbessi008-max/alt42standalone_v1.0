<?php
/**
 * API Handler for AJAX requests
 *
 * @package InvariantFinder
 */

define('APP_ACCESS', true);
require_once dirname(__DIR__) . '/config.php';

// Set JSON header
header('Content-Type: application/json');

// Check if user is logged in
if (!isLoggedIn()) {
    errorResponse('Unauthorized', 401);
}

// Get action
$action = clean($_POST['action'] ?? $_GET['action'] ?? '');

if (empty($action)) {
    errorResponse('No action specified');
}

// Verify CSRF token for POST requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = $_POST['csrf_token'] ?? '';
    if (!verifyCSRFToken($token)) {
        errorResponse('Invalid CSRF token', 403);
    }
}

$userId = $_SESSION['user_id'];

try {
    switch ($action) {
        case 'log_interaction':
            $attemptId = intval($_POST['attempt_id'] ?? 0);
            $actionType = clean($_POST['action_type'] ?? '');
            $actionData = $_POST['action_data'] ?? '';

            if (!$attemptId || !$actionType) {
                errorResponse('Missing required parameters');
            }

            // Verify attempt belongs to user
            $attempt = db()->fetchOne("SELECT id FROM attempts WHERE id = ? AND user_id = ?", [$attemptId, $userId]);
            if (!$attempt) {
                errorResponse('Invalid attempt', 403);
            }

            // Log interaction
            logInteraction($attemptId, $actionType, $actionData);

            successResponse([], 'Interaction logged');
            break;

        case 'submit_attempt':
            $attemptId = intval($_POST['attempt_id'] ?? 0);
            $invariantsFound = $_POST['invariants_found'] ?? '[]';
            $scaleActions = intval($_POST['scale_actions'] ?? 0);
            $timeSpent = intval($_POST['time_spent'] ?? 0);

            if (!$attemptId) {
                errorResponse('Missing attempt ID');
            }

            // Verify attempt belongs to user
            $attempt = db()->fetchOne("SELECT * FROM attempts WHERE id = ? AND user_id = ?", [$attemptId, $userId]);
            if (!$attempt) {
                errorResponse('Invalid attempt', 403);
            }

            // Get activity
            $activity = getActivity($attempt['activity_id']);
            if (!$activity) {
                errorResponse('Activity not found');
            }

            // Calculate score
            $invariants = json_decode($invariantsFound, true);
            $score = calculateScore($activity['shape_type'], $invariants, $scaleActions, $timeSpent);

            // Update attempt
            db()->update('attempts', [
                'invariants_found' => $invariantsFound,
                'scale_actions' => $scaleActions,
                'time_spent' => $timeSpent,
                'completed' => 1,
                'score' => $score,
                'completed_at' => date('Y-m-d H:i:s')
            ], 'id = ?', [$attemptId]);

            // Update leaderboard
            db()->query("CALL update_leaderboard(?)", [$userId]);

            // Log submission
            logInteraction($attemptId, 'submit', [
                'score' => $score,
                'time_spent' => $timeSpent,
                'invariants_count' => count($invariants)
            ]);

            successResponse([
                'score' => $score,
                'message' => 'Submitted successfully!'
            ]);
            break;

        case 'get_progress':
            $attemptId = intval($_GET['attempt_id'] ?? 0);

            if (!$attemptId) {
                errorResponse('Missing attempt ID');
            }

            // Verify attempt belongs to user
            $attempt = db()->fetchOne("SELECT * FROM attempts WHERE id = ? AND user_id = ?", [$attemptId, $userId]);
            if (!$attempt) {
                errorResponse('Invalid attempt', 403);
            }

            successResponse([
                'invariants_found' => $attempt['invariants_found'],
                'scale_actions' => $attempt['scale_actions'],
                'time_spent' => $attempt['time_spent'],
                'score' => round($attempt['score'], 2),
                'completed' => $attempt['completed']
            ]);
            break;

        case 'update_attempt':
            $attemptId = intval($_POST['attempt_id'] ?? 0);
            $invariantsFound = $_POST['invariants_found'] ?? null;
            $scaleActions = isset($_POST['scale_actions']) ? intval($_POST['scale_actions']) : null;
            $timeSpent = isset($_POST['time_spent']) ? intval($_POST['time_spent']) : null;

            if (!$attemptId) {
                errorResponse('Missing attempt ID');
            }

            // Verify attempt belongs to user
            $attempt = db()->fetchOne("SELECT id FROM attempts WHERE id = ? AND user_id = ?", [$attemptId, $userId]);
            if (!$attempt) {
                errorResponse('Invalid attempt', 403);
            }

            // Build update data
            $updateData = [];
            if ($invariantsFound !== null) {
                $updateData['invariants_found'] = $invariantsFound;
            }
            if ($scaleActions !== null) {
                $updateData['scale_actions'] = $scaleActions;
            }
            if ($timeSpent !== null) {
                $updateData['time_spent'] = $timeSpent;
            }

            if (!empty($updateData)) {
                db()->update('attempts', $updateData, 'id = ?', [$attemptId]);
            }

            successResponse([], 'Attempt updated');
            break;

        default:
            errorResponse('Invalid action');
    }
} catch (Exception $e) {
    if (ENVIRONMENT === 'development') {
        errorResponse($e->getMessage(), 500);
    } else {
        errorResponse('An error occurred. Please try again.', 500);
    }
}
