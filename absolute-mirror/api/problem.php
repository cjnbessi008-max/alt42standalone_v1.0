<?php
/**
 * Absolute Mirror API - Get Single Problem
 * Returns a specific problem by ID or random problem
 */

require_once '../config/database.php';

// Enable CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJSON(['success' => false, 'error' => 'Method not allowed'], 405);
}

try {
    $pdo = getDBConnection();

    // Check if requesting random problem
    if (isset($_GET['random']) && $_GET['random']) {
        // Get difficulty filter if provided
        $difficulty = $_GET['difficulty'] ?? null;

        $sql = "SELECT
                    id,
                    title,
                    description,
                    equation,
                    axis_of_symmetry,
                    target_value,
                    solution_left,
                    solution_right,
                    explanation,
                    difficulty,
                    grade_level,
                    created_at
                FROM problems
                WHERE is_active = 1";

        $params = [];

        if ($difficulty) {
            $sql .= " AND difficulty = :difficulty";
            $params[':difficulty'] = $difficulty;
        }

        $sql .= " ORDER BY RAND() LIMIT 1";

        $stmt = $pdo->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->execute();
        $problem = $stmt->fetch();

        if (!$problem) {
            sendJSON([
                'success' => false,
                'error' => 'No problems found'
            ], 404);
        }

        // Format solutions array
        $problem['solutions'] = [
            (float)$problem['solution_left'],
            (float)$problem['solution_right']
        ];

        // Convert numeric fields to appropriate types
        $problem['axis'] = (float)$problem['axis_of_symmetry'];
        $problem['target'] = (float)$problem['target_value'];

        sendJSON([
            'success' => true,
            'data' => $problem
        ]);
    }

    // Get specific problem by ID
    if (!isset($_GET['id'])) {
        sendJSON(['success' => false, 'error' => 'Problem ID required'], 400);
    }

    $problemId = (int)$_GET['id'];

    $sql = "SELECT
                id,
                title,
                description,
                equation,
                axis_of_symmetry,
                target_value,
                solution_left,
                solution_right,
                explanation,
                difficulty,
                grade_level,
                created_at
            FROM problems
            WHERE id = :id AND is_active = 1";

    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':id', $problemId, PDO::PARAM_INT);
    $stmt->execute();

    $problem = $stmt->fetch();

    if (!$problem) {
        sendJSON([
            'success' => false,
            'error' => 'Problem not found'
        ], 404);
    }

    // Format solutions array
    $problem['solutions'] = [
        (float)$problem['solution_left'],
        (float)$problem['solution_right']
    ];

    // Convert numeric fields
    $problem['axis'] = (float)$problem['axis_of_symmetry'];
    $problem['target'] = (float)$problem['target_value'];

    sendJSON([
        'success' => true,
        'data' => $problem
    ]);

} catch (Exception $e) {
    error_log("Error fetching problem: " . $e->getMessage());
    sendJSON([
        'success' => false,
        'error' => 'Failed to fetch problem'
    ], 500);
}
