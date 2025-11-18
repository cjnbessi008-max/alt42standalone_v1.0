<?php
/**
 * Moodle Integration API Endpoints
 */

require_once __DIR__ . '/../moodle/MoodleClient.php';
require_once __DIR__ . '/../models/Problem.php';

function handleMoodle($method, $segments) {
    $moodleClient = new MoodleClient();
    $problemModel = new Problem();

    switch ($method) {
        case 'POST':
            if ($segments[0] === 'sync') {
                // POST /api/moodle/sync - Sync question from Moodle
                $data = getRequestBody();

                if (!isset($data['question_id'])) {
                    sendResponse([
                        'success' => false,
                        'error' => 'Question ID required'
                    ], 400);
                }

                try {
                    // Get question from Moodle
                    $questionData = $moodleClient->syncQuestion($data['question_id']);

                    // Check if problem already exists
                    $existingProblem = $problemModel->getByMoodleId($data['question_id']);

                    if (!$existingProblem) {
                        // Create new problem
                        // Note: This assumes the Moodle question has equation text
                        // You may need to adjust based on your Moodle question format
                        $problemId = $problemModel->create(
                            $data['question_id'],
                            $questionData['equation'] ?? '3x + 12 = 27', // Default for testing
                            $questionData['difficulty'] ?? 'medium'
                        );

                        $problem = $problemModel->getById($problemId);
                    } else {
                        $problem = $existingProblem;
                    }

                    sendResponse([
                        'success' => true,
                        'data' => [
                            'problem' => $problem,
                            'moodle_data' => $questionData
                        ]
                    ]);

                } catch (Exception $e) {
                    sendResponse([
                        'success' => false,
                        'error' => 'Failed to sync question: ' . $e->getMessage()
                    ], 500);
                }

            } elseif ($segments[0] === 'grade') {
                // POST /api/moodle/grade - Update grade in Moodle
                $data = getRequestBody();

                if (!isset($data['user_id']) || !isset($data['item_id']) || !isset($data['grade'])) {
                    sendResponse([
                        'success' => false,
                        'error' => 'Missing required fields'
                    ], 400);
                }

                try {
                    $result = $moodleClient->updateGrade(
                        $data['user_id'],
                        $data['item_id'],
                        $data['grade']
                    );

                    sendResponse([
                        'success' => true,
                        'data' => $result
                    ]);

                } catch (Exception $e) {
                    sendResponse([
                        'success' => false,
                        'error' => 'Failed to update grade: ' . $e->getMessage()
                    ], 500);
                }
            }
            break;

        case 'GET':
            if ($segments[0] === 'user' && isset($segments[1])) {
                // GET /api/moodle/user/{id} - Get user from Moodle
                try {
                    $user = $moodleClient->getUser($segments[1]);

                    sendResponse([
                        'success' => true,
                        'data' => $user
                    ]);

                } catch (Exception $e) {
                    sendResponse([
                        'success' => false,
                        'error' => 'Failed to get user: ' . $e->getMessage()
                    ], 500);
                }
            }
            break;

        default:
            sendResponse([
                'success' => false,
                'error' => 'Method not allowed'
            ], 405);
            break;
    }
}
