<?php
/**
 * Get Cases API
 * Retrieves list of cases for a Moodle course
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../models/Case.php';

$database = new Database();
$db = $database->getConnection();

$caseModel = new CaseModel($db);

// Get course ID from query parameter
$course_id = isset($_GET['course_id']) ? $_GET['course_id'] : die(json_encode(array("message" => "Course ID is required.")));

// Get cases
$stmt = $caseModel->getCasesByCourse($course_id);
$cases_arr = array();

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    extract($row);

    $case_item = array(
        "id" => $id,
        "title" => $title,
        "description" => html_entity_decode($description),
        "category" => $category,
        "difficulty_level" => $difficulty_level,
        "total_duration" => (int)$total_duration,
        "status" => $status
    );

    array_push($cases_arr, $case_item);
}

http_response_code(200);
echo json_encode(array("cases" => $cases_arr, "total" => count($cases_arr)));
