<?php
/**
 * Progress API
 * Manages user progress through cases
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../models/UserProgress.php';
include_once '../models/Event.php';

$database = new Database();
$db = $database->getConnection();

$progressModel = new UserProgressModel($db);
$eventModel = new EventModel($db);

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        // Get user progress
        $user_id = isset($_GET['user_id']) ? $_GET['user_id'] : die(json_encode(array("message" => "User ID is required.")));
        $case_id = isset($_GET['case_id']) ? $_GET['case_id'] : die(json_encode(array("message" => "Case ID is required.")));

        $progress_id = $progressModel->getOrCreateProgress($user_id, $case_id);

        if($progress_id) {
            $response = array(
                "id" => $progressModel->id,
                "case_id" => $progressModel->case_id,
                "user_id" => $progressModel->moodle_user_id,
                "current_event_id" => $progressModel->current_event_id,
                "completed_events" => json_decode($progressModel->completed_events ?? '[]'),
                "total_score" => (int)$progressModel->total_score,
                "max_score" => (int)$progressModel->max_score,
                "status" => $progressModel->status,
                "start_time" => $progressModel->start_time,
                "completion_time" => $progressModel->completion_time
            );

            http_response_code(200);
            echo json_encode($response);
        } else {
            http_response_code(404);
            echo json_encode(array("message" => "Progress not found."));
        }
        break;

    case 'POST':
        // Submit response to an event
        $data = json_decode(file_get_contents("php://input"));

        if(!isset($data->progress_id) || !isset($data->event_id) || !isset($data->response)) {
            http_response_code(400);
            echo json_encode(array("message" => "Missing required fields."));
            break;
        }

        // Get event details to check answer
        if($eventModel->getEventById($data->event_id)) {
            $is_correct = false;
            $points_earned = 0;
            $feedback = "";

            if($eventModel->requires_response) {
                // Check if answer is correct
                $is_correct = (strtolower(trim($data->response)) === strtolower(trim($eventModel->correct_response)));

                if($is_correct) {
                    $points_earned = $eventModel->points;
                    $feedback = $eventModel->feedback_correct ?? "Correct!";
                } else {
                    $feedback = $eventModel->feedback_incorrect ?? "Incorrect. Please try again.";
                }

                // Update score if correct
                if($is_correct) {
                    $progressModel->updateScore($data->progress_id, $points_earned);
                }
            }

            // Save response
            $time_spent = isset($data->time_spent) ? $data->time_spent : 0;
            $progressModel->saveResponse(
                $data->progress_id,
                $data->event_id,
                $data->response,
                $is_correct,
                $points_earned,
                $time_spent
            );

            // Mark event as completed if correct or if no response required
            if($is_correct || !$eventModel->requires_response) {
                $progressModel->markEventCompleted($data->progress_id, $data->event_id);
            }

            $response = array(
                "is_correct" => $is_correct,
                "points_earned" => $points_earned,
                "feedback" => $feedback,
                "can_continue" => $is_correct || !$eventModel->requires_response
            );

            http_response_code(200);
            echo json_encode($response);
        } else {
            http_response_code(404);
            echo json_encode(array("message" => "Event not found."));
        }
        break;

    case 'PUT':
        // Update progress (move to next event, complete case, etc.)
        $data = json_decode(file_get_contents("php://input"));

        if(!isset($data->progress_id)) {
            http_response_code(400);
            echo json_encode(array("message" => "Progress ID is required."));
            break;
        }

        if(isset($data->event_id)) {
            // Update current event
            $status = isset($data->status) ? $data->status : 'in_progress';
            $progressModel->updateProgress($data->progress_id, $data->event_id, $status);

            http_response_code(200);
            echo json_encode(array("message" => "Progress updated successfully."));
        } elseif(isset($data->complete) && $data->complete === true) {
            // Mark case as completed
            $progressModel->markCaseCompleted($data->progress_id);

            http_response_code(200);
            echo json_encode(array("message" => "Case completed successfully."));
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Invalid request."));
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(array("message" => "Method not allowed."));
        break;
}
