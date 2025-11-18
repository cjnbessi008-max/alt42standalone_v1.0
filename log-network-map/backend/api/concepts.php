<?php
/**
 * Concepts API Endpoint
 * CRUD operations for concepts
 */

require_once '../config/database.php';
require_once '../models/Concept.php';
require_once '../utils/cors.php';

$database = new Database();
$db = $database->getConnection();

$concept = new Concept($db);

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Get all concepts or by category
        $category = isset($_GET['category']) ? $_GET['category'] : null;

        try {
            if ($category) {
                $stmt = $concept->getByCategory($category);
            } else {
                $stmt = $concept->getAll();
            }

            $concepts = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $concepts[] = $row;
            }

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $concepts,
                'count' => count($concepts)
            ], JSON_UNESCAPED_UNICODE);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to fetch concepts',
                'error' => $e->getMessage()
            ]);
        }
        break;

    case 'POST':
        // Create new concept
        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->name)) {
            $concept->name = $data->name;
            $concept->description = $data->description ?? '';
            $concept->category = $data->category ?? 'mathematics';
            $concept->difficulty_level = $data->difficulty_level ?? 'beginner';
            $concept->color = $data->color ?? '#3498db';
            $concept->icon = $data->icon ?? '';

            $concept_id = $concept->create();

            if ($concept_id) {
                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'message' => 'Concept created successfully',
                    'id' => $concept_id
                ]);
            } else {
                http_response_code(503);
                echo json_encode([
                    'success' => false,
                    'message' => 'Unable to create concept'
                ]);
            }
        } else {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Unable to create concept. Data is incomplete.'
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
