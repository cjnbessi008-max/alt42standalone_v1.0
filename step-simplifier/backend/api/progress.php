<?php
/**
 * Progress API Endpoints
 * Handles user progress tracking and step attempts
 */

require_once __DIR__ . '/../models/UserProgress.php';
require_once __DIR__ . '/../models/Problem.php';
require_once __DIR__ . '/../models/EquationSolver.php';

function handleProgress($method, $segments) {
    $progressModel = new UserProgress();
    $problemModel = new Problem();

    switch ($method) {
        case 'POST':
            $data = getRequestBody();

            if ($segments[0] === 'start') {
                // POST /api/progress/start - Start a problem
                if (!isset($data['user_id']) || !isset($data['problem_id'])) {
                    sendResponse([
                        'success' => false,
                        'error' => 'Missing required fields'
                    ], 400);
                }

                // Get total steps for the problem
                $steps = $problemModel->getSteps($data['problem_id']);
                $totalSteps = count($steps);

                $progressModel->startProblem(
                    $data['user_id'],
                    $data['problem_id'],
                    $totalSteps
                );

                sendResponse([
                    'success' => true,
                    'data' => [
                        'current_step' => 1,
                        'total_steps' => $totalSteps
                    ]
                ]);

            } elseif ($segments[0] === 'submit') {
                // POST /api/progress/submit - Submit step attempt
                if (!isset($data['user_id']) || !isset($data['problem_id']) ||
                    !isset($data['step_number']) || !isset($data['user_answer'])) {
                    sendResponse([
                        'success' => false,
                        'error' => 'Missing required fields'
                    ], 400);
                }

                // Get the step
                $step = $problemModel->getStep($data['problem_id'], $data['step_number']);
                if (!$step) {
                    sendResponse([
                        'success' => false,
                        'error' => 'Step not found'
                    ], 404);
                }

                // Get problem
                $problem = $problemModel->getById($data['problem_id']);

                // Verify answer
                $solver = new EquationSolver($problem['equation_text']);
                $solver->solve();
                $isCorrect = $solver->verifyStep($data['step_number'], $data['user_answer']);

                // Record attempt
                $progressModel->recordAttempt(
                    $data['user_id'],
                    $data['problem_id'],
                    $step['id'],
                    $data['user_answer'],
                    $isCorrect,
                    $data['time_spent'] ?? 0
                );

                // If correct, move to next step
                if ($isCorrect) {
                    $progress = $progressModel->getProgress($data['user_id'], $data['problem_id']);
                    $nextStep = $progress['current_step'] + 1;

                    if ($nextStep <= $progress['total_steps']) {
                        $progressModel->updateStep($data['user_id'], $data['problem_id'], $nextStep);
                    } else {
                        // Problem completed
                        $score = $progressModel->calculateScore($data['user_id'], $data['problem_id']);
                        $progressModel->completeProblem($data['user_id'], $data['problem_id'], $score);

                        sendResponse([
                            'success' => true,
                            'data' => [
                                'is_correct' => true,
                                'completed' => true,
                                'score' => $score,
                                'message' => 'Congratulations! Problem completed!'
                            ]
                        ]);
                    }
                }

                sendResponse([
                    'success' => true,
                    'data' => [
                        'is_correct' => $isCorrect,
                        'completed' => false,
                        'message' => $isCorrect ? 'Correct! Move to next step.' : 'Not quite right. Try again!'
                    ]
                ]);

            } elseif ($segments[0] === 'user') {
                // POST /api/progress/user - Create or get user
                if (!isset($data['moodle_user_id']) || !isset($data['username'])) {
                    sendResponse([
                        'success' => false,
                        'error' => 'Missing required fields'
                    ], 400);
                }

                $user = $progressModel->createOrGetUser(
                    $data['moodle_user_id'],
                    $data['username'],
                    $data['email'] ?? null
                );

                sendResponse([
                    'success' => true,
                    'data' => $user
                ]);
            }
            break;

        case 'GET':
            // GET /api/progress/{userId}/{problemId}
            if (count($segments) < 2) {
                sendResponse([
                    'success' => false,
                    'error' => 'User ID and Problem ID required'
                ], 400);
            }

            $userId = $segments[0];
            $problemId = $segments[1];

            $progress = $progressModel->getProgress($userId, $problemId);

            if (!$progress) {
                sendResponse([
                    'success' => false,
                    'error' => 'Progress not found'
                ], 404);
            }

            // Get current step details
            $currentStep = $problemModel->getStep($problemId, $progress['current_step']);

            // Get attempts history
            $attempts = $progressModel->getAttempts($userId, $problemId);

            sendResponse([
                'success' => true,
                'data' => [
                    'progress' => $progress,
                    'current_step' => $currentStep,
                    'attempts' => $attempts
                ]
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
