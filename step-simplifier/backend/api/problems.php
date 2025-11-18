<?php
/**
 * Problems API Endpoints
 */

require_once __DIR__ . '/../models/Problem.php';

function handleProblems($method, $segments) {
    $problemModel = new Problem();

    switch ($method) {
        case 'GET':
            if (empty($segments[0])) {
                // GET /api/problems - List all problems
                $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
                $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;

                $problems = $problemModel->getAll($limit, $offset);
                sendResponse([
                    'success' => true,
                    'data' => $problems
                ]);
            } elseif ($segments[0] === 'moodle' && isset($segments[1])) {
                // GET /api/problems/moodle/{id} - Get by Moodle ID
                $problem = $problemModel->getByMoodleId($segments[1]);
                if ($problem) {
                    sendResponse([
                        'success' => true,
                        'data' => $problem
                    ]);
                } else {
                    sendResponse([
                        'success' => false,
                        'error' => 'Problem not found'
                    ], 404);
                }
            } else {
                // GET /api/problems/{id} - Get specific problem
                $problemId = $segments[0];

                if (isset($segments[1]) && $segments[1] === 'steps') {
                    // GET /api/problems/{id}/steps - Get all steps
                    if (isset($segments[2])) {
                        // GET /api/problems/{id}/steps/{stepNumber}
                        $stepNumber = intval($segments[2]);
                        $step = $problemModel->getStep($problemId, $stepNumber);

                        if ($step) {
                            sendResponse([
                                'success' => true,
                                'data' => $step
                            ]);
                        } else {
                            sendResponse([
                                'success' => false,
                                'error' => 'Step not found'
                            ], 404);
                        }
                    } else {
                        $steps = $problemModel->getSteps($problemId);
                        sendResponse([
                            'success' => true,
                            'data' => $steps
                        ]);
                    }
                } else {
                    $problem = $problemModel->getById($problemId);
                    if ($problem) {
                        sendResponse([
                            'success' => true,
                            'data' => $problem
                        ]);
                    } else {
                        sendResponse([
                            'success' => false,
                            'error' => 'Problem not found'
                        ], 404);
                    }
                }
            }
            break;

        case 'POST':
            // POST /api/problems - Create new problem
            $data = getRequestBody();

            if (!isset($data['moodle_question_id']) || !isset($data['equation_text'])) {
                sendResponse([
                    'success' => false,
                    'error' => 'Missing required fields'
                ], 400);
            }

            $problemId = $problemModel->create(
                $data['moodle_question_id'],
                $data['equation_text'],
                $data['difficulty'] ?? 'medium'
            );

            $problem = $problemModel->getById($problemId);
            $steps = $problemModel->getSteps($problemId);

            sendResponse([
                'success' => true,
                'data' => [
                    'problem' => $problem,
                    'steps' => $steps
                ]
            ], 201);
            break;

        case 'DELETE':
            // DELETE /api/problems/{id}
            if (empty($segments[0])) {
                sendResponse([
                    'success' => false,
                    'error' => 'Problem ID required'
                ], 400);
            }

            $problemId = $segments[0];
            $problemModel->delete($problemId);

            sendResponse([
                'success' => true,
                'message' => 'Problem deleted'
            ]);
            break;

        default:
            sendResponse([
                'success' => false,
                'error' => 'Method not allowed'
            ], 405);
            break;
    }
}
