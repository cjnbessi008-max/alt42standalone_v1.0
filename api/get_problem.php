<?php
/**
 * Get Problem API
 * Fetches problem data from database or Moodle LMS
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/moodle.php';

try {
    $db = Database::getInstance()->getConnection();

    // Get problem ID from request
    $problemId = isset($_GET['id']) ? intval($_GET['id']) : null;
    $moodleId = isset($_GET['moodle_id']) ? intval($_GET['moodle_id']) : null;

    if (!$problemId && !$moodleId) {
        throw new Exception('Problem ID or Moodle ID required');
    }

    // Try to get from local database first
    if ($problemId) {
        $stmt = $db->prepare('SELECT * FROM problems WHERE id = :id');
        $stmt->execute(['id' => $problemId]);
        $problem = $stmt->fetch();
    } else {
        $stmt = $db->prepare('SELECT * FROM problems WHERE moodle_problem_id = :moodle_id');
        $stmt->execute(['moodle_id' => $moodleId]);
        $problem = $stmt->fetch();
    }

    // If not found locally and Moodle ID provided, fetch from Moodle
    if (!$problem && $moodleId && MOODLE_TOKEN) {
        try {
            $moodle = new MoodleAPI();
            $moodleData = $moodle->getProblem(0, $moodleId);

            // Store in local database
            $stmt = $db->prepare('
                INSERT INTO problems (moodle_problem_id, title, description, problem_type, original_code, substituted_code)
                VALUES (:moodle_id, :title, :description, :type, :original, :substituted)
            ');
            $stmt->execute([
                'moodle_id' => $moodleId,
                'title' => $moodleData['name'] ?? 'Untitled',
                'description' => $moodleData['questiontext'] ?? '',
                'type' => 'substitute',
                'original' => $moodleData['originalcode'] ?? '',
                'substituted' => $moodleData['substitutedcode'] ?? ''
            ]);

            $problem = [
                'id' => $db->lastInsertId(),
                'moodle_problem_id' => $moodleId,
                'title' => $moodleData['name'] ?? 'Untitled',
                'description' => $moodleData['questiontext'] ?? '',
                'problem_type' => 'substitute',
                'original_code' => $moodleData['originalcode'] ?? '',
                'substituted_code' => $moodleData['substitutedcode'] ?? ''
            ];
        } catch (Exception $e) {
            error_log('Moodle fetch error: ' . $e->getMessage());
        }
    }

    if (!$problem) {
        throw new Exception('Problem not found');
    }

    // Format response
    $response = [
        'success' => true,
        'data' => [
            'id' => intval($problem['id']),
            'moodle_problem_id' => intval($problem['moodle_problem_id']),
            'title' => $problem['title'],
            'description' => $problem['description'],
            'type' => $problem['problem_type'],
            'original_code' => $problem['original_code'],
            'substituted_code' => $problem['substituted_code']
        ]
    ];

    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
