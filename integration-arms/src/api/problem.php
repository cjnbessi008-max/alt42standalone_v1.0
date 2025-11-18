<?php
/**
 * Problem API
 * Get integration problems
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/moodle.php';
require_once __DIR__ . '/../models/Problem.php';
require_once __DIR__ . '/../services/MoodleService.php';
require_once __DIR__ . '/../utils/Session.php';
require_once __DIR__ . '/../utils/Logger.php';

$logger = new Logger();
$session = new Session();

try {
    // Check if user is logged in
    if (!$session->isLoggedIn()) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Unauthorized - Please login'
        ]);
        exit;
    }

    $userId = $session->getUserId();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $problemModel = new Problem();

        // Get specific problem by ID
        if (isset($_GET['id'])) {
            $problemId = intval($_GET['id']);
            $problem = $problemModel->getById($problemId);

            if (!$problem) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Problem not found'
                ]);
                exit;
            }

            $logger->info("Problem fetched: $problemId by user $userId");

            echo json_encode([
                'success' => true,
                'problem' => [
                    'id' => $problem->id,
                    'latex' => $problem->problemLatex,
                    'difficulty' => $problem->difficulty,
                    'hints' => $problem->getHints()
                ]
            ]);
            exit;
        }

        // Get problem by Moodle question ID
        if (isset($_GET['question_id'])) {
            $questionId = intval($_GET['question_id']);
            $problem = $problemModel->getByMoodleQuestionId($questionId);

            if (!$problem) {
                // Try to fetch from Moodle
                $moodleToken = $_GET['session_token'] ?? null;
                if ($moodleToken) {
                    $moodleService = new MoodleService($moodleToken);
                    $moodleQuestion = $moodleService->getQuestion($questionId);

                    if ($moodleQuestion) {
                        // Create problem from Moodle data
                        $problem = $problemModel->create([
                            'moodle_question_id' => $questionId,
                            'problem_latex' => $moodleQuestion['latex'] ?? '',
                            'correct_u' => $moodleQuestion['correct_u'] ?? '',
                            'correct_dv' => $moodleQuestion['correct_dv'] ?? '',
                            'difficulty' => $moodleQuestion['difficulty'] ?? 'medium',
                            'hints' => $moodleQuestion['hints'] ?? []
                        ]);
                    }
                }

                if (!$problem) {
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Problem not found in database or Moodle'
                    ]);
                    exit;
                }
            }

            echo json_encode([
                'success' => true,
                'problem' => [
                    'id' => $problem->id,
                    'latex' => $problem->problemLatex,
                    'difficulty' => $problem->difficulty,
                    'hints' => $problem->getHints()
                ]
            ]);
            exit;
        }

        // Get random problem
        if (isset($_GET['random'])) {
            $difficulty = $_GET['difficulty'] ?? null;
            $problem = $problemModel->getRandom($difficulty);

            if (!$problem) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'No problems available'
                ]);
                exit;
            }

            echo json_encode([
                'success' => true,
                'problem' => [
                    'id' => $problem->id,
                    'latex' => $problem->problemLatex,
                    'difficulty' => $problem->difficulty,
                    'hints' => $problem->getHints()
                ]
            ]);
            exit;
        }

        // Get all problems
        $difficulty = $_GET['difficulty'] ?? null;
        $problems = $problemModel->getAll($difficulty);

        echo json_encode([
            'success' => true,
            'problems' => array_map(function($p) {
                return [
                    'id' => $p['id'],
                    'latex' => $p['problem_latex'],
                    'difficulty' => $p['difficulty']
                ];
            }, $problems),
            'count' => count($problems)
        ]);

    } else {
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'error' => 'Method not allowed'
        ]);
    }

} catch (Exception $e) {
    $logger->error("Problem API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error'
    ]);
}
