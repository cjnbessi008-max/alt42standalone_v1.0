<?php
/**
 * Questions API Endpoint
 * GET /api/questions - Get all questions
 * GET /api/questions/:id - Get specific question
 * POST /api/questions - Create new question
 * PUT /api/questions/:id - Update question
 * DELETE /api/questions/:id - Delete question
 * GET /api/questions/random - Get random question
 */

require_once '../config/config.php';
require_once '../config/database.php';
require_once '../models/Question.php';

header('Content-Type: application/json');

$database = new Database();
$db = $database->getConnection();
$question = new Question($db);

$method = getRequestMethod();
$request_uri = $_SERVER['REQUEST_URI'];
$uri_parts = explode('/', trim(parse_url($request_uri, PHP_URL_PATH), '/'));

// Extract ID from URL if present
$id = null;
$action = null;

// URL structure: /api/questions/{id or action}
if (count($uri_parts) >= 3) {
    $lastPart = end($uri_parts);
    if (is_numeric($lastPart)) {
        $id = (int)$lastPart;
    } else {
        $action = $lastPart;
    }
}

try {
    switch ($method) {
        case 'GET':
            if ($action === 'random') {
                // Get random question
                $filters = [
                    'question_type' => $_GET['type'] ?? null,
                    'difficulty_level' => $_GET['difficulty'] ?? null
                ];

                $result = $question->getRandom($filters);

                if ($result) {
                    sendResponse([
                        'success' => true,
                        'data' => $result
                    ]);
                } else {
                    sendError('No questions found', 404);
                }
            } elseif ($id) {
                // Get specific question
                $result = $question->getById($id);

                if ($result) {
                    sendResponse([
                        'success' => true,
                        'data' => $result
                    ]);
                } else {
                    sendError('Question not found', 404);
                }
            } else {
                // Get all questions with filters
                $filters = [
                    'question_type' => $_GET['type'] ?? null,
                    'difficulty_level' => $_GET['difficulty'] ?? null,
                    'limit' => $_GET['limit'] ?? null
                ];

                $results = $question->getAll($filters);

                sendResponse([
                    'success' => true,
                    'data' => $results,
                    'count' => count($results)
                ]);
            }
            break;

        case 'POST':
            // Create new question
            $data = getRequestBody();

            validateRequired($data, [
                'moodle_question_id',
                'title',
                'question_type'
            ]);

            $data = array_map('sanitizeInput', $data);

            // Set defaults
            if (!isset($data['difficulty_level'])) {
                $data['difficulty_level'] = 3;
            }

            $newId = $question->create($data);

            if ($newId) {
                // Add operators if provided
                if (!empty($data['operators']) && is_array($data['operators'])) {
                    foreach ($data['operators'] as $operator) {
                        $operator['question_id'] = $newId;
                        $question->addOperator($newId, $operator);
                    }
                }

                $result = $question->getById($newId);

                sendResponse([
                    'success' => true,
                    'message' => 'Question created successfully',
                    'data' => $result
                ], 201);
            } else {
                sendError('Failed to create question', 500);
            }
            break;

        case 'PUT':
            // Update question
            if (!$id) {
                sendError('Question ID is required', 400);
            }

            $data = getRequestBody();
            $data = array_map('sanitizeInput', $data);

            if ($question->update($id, $data)) {
                $result = $question->getById($id);

                sendResponse([
                    'success' => true,
                    'message' => 'Question updated successfully',
                    'data' => $result
                ]);
            } else {
                sendError('Failed to update question', 500);
            }
            break;

        case 'DELETE':
            // Delete question
            if (!$id) {
                sendError('Question ID is required', 400);
            }

            if ($question->delete($id)) {
                sendResponse([
                    'success' => true,
                    'message' => 'Question deleted successfully'
                ]);
            } else {
                sendError('Failed to delete question', 500);
            }
            break;

        default:
            sendError('Method not allowed', 405);
    }
} catch (Exception $e) {
    logMessage("Questions API Error: " . $e->getMessage(), 'ERROR');
    sendError('Internal server error', 500, $e->getMessage());
}
