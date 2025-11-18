<?php
/**
 * Learning Logs API Endpoint
 * CRUD operations for learning logs
 */

require_once '../config/database.php';
require_once '../models/LearningLog.php';
require_once '../utils/cors.php';

$database = new Database();
$db = $database->getConnection();

$log = new LearningLog($db);

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Get logs by student or concept
        $student_id = isset($_GET['student_id']) ? intval($_GET['student_id']) : null;
        $concept_id = isset($_GET['concept_id']) ? intval($_GET['concept_id']) : null;

        try {
            if ($student_id) {
                $stmt = $log->getByStudent($student_id);
            } elseif ($concept_id) {
                $stmt = $log->getByConcept($concept_id);
            } else {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Please provide student_id or concept_id'
                ]);
                exit;
            }

            $logs = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $logs[] = $row;
            }

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $logs,
                'count' => count($logs)
            ], JSON_UNESCAPED_UNICODE);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to fetch logs',
                'error' => $e->getMessage()
            ]);
        }
        break;

    case 'POST':
        // Create new log entry
        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->student_id) && !empty($data->concept_id) && !empty($data->activity_type)) {
            $log->student_id = $data->student_id;
            $log->concept_id = $data->concept_id;
            $log->activity_type = $data->activity_type;
            $log->duration_seconds = $data->duration_seconds ?? 0;
            $log->score = $data->score ?? null;
            $log->is_correct = $data->is_correct ?? null;
            $log->interaction_data = json_encode($data->interaction_data ?? []);
            $log->session_id = $data->session_id ?? session_id();

            $log_id = $log->create();

            if ($log_id) {
                // Update learning path if transitioning from another concept
                if (!empty($data->from_concept_id)) {
                    $log->updateLearningPath(
                        $data->student_id,
                        $data->from_concept_id,
                        $data->concept_id,
                        $data->duration_seconds ?? 0,
                        $data->is_correct ?? false
                    );
                }

                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'message' => 'Log created successfully',
                    'id' => $log_id
                ]);
            } else {
                http_response_code(503);
                echo json_encode([
                    'success' => false,
                    'message' => 'Unable to create log'
                ]);
            }
        } else {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Unable to create log. Data is incomplete.'
            ]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'message' => 'Method not allowed'
        ]);
        break;
}
