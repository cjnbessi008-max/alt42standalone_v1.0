<?php
/**
 * Get Case API
 * Retrieves case details and timeline events
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../models/Case.php';
include_once '../models/Event.php';

$database = new Database();
$db = $database->getConnection();

$caseModel = new CaseModel($db);
$eventModel = new EventModel($db);

// Get case ID from query parameter
$case_id = isset($_GET['id']) ? $_GET['id'] : die(json_encode(array("message" => "Case ID is required.")));

// Get case details
if($caseModel->getCaseById($case_id)) {
    // Get all events for this case
    $stmt = $eventModel->getEventsByCase($case_id);
    $events_arr = array();

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        extract($row);

        $event_item = array(
            "id" => $id,
            "event_order" => $event_order,
            "event_time" => $event_time,
            "title" => $title,
            "content" => html_entity_decode($content),
            "event_type" => $event_type,
            "media_type" => $media_type,
            "media_url" => $media_url,
            "is_interactive" => (bool)$is_interactive,
            "requires_response" => (bool)$requires_response,
            "points" => (int)$points
        );

        array_push($events_arr, $event_item);
    }

    // Get total points
    $total_points = $eventModel->getTotalPoints($case_id);

    // Prepare case response
    $case_arr = array(
        "id" => $caseModel->id,
        "moodle_course_id" => $caseModel->moodle_course_id,
        "moodle_activity_id" => $caseModel->moodle_activity_id,
        "title" => $caseModel->title,
        "description" => html_entity_decode($caseModel->description),
        "category" => $caseModel->category,
        "difficulty_level" => $caseModel->difficulty_level,
        "total_duration" => (int)$caseModel->total_duration,
        "total_points" => (int)$total_points,
        "total_events" => count($events_arr),
        "events" => $events_arr
    );

    http_response_code(200);
    echo json_encode($case_arr);
}
else {
    http_response_code(404);
    echo json_encode(array("message" => "Case not found."));
}
