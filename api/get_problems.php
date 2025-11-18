<?php
/**
 * API Endpoint: Get Problems for Vector Star Map
 * Returns problem data with vector coordinates and constellation connections
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/moodle_connector.php';

try {
    $db = Database::getInstance();
    $courseId = isset($_GET['course_id']) ? intval($_GET['course_id']) : 101;
    $studentId = isset($_GET['student_id']) ? intval($_GET['student_id']) : null;

    // Get problems from database
    $problemsQuery = "
        SELECT
            p.*,
            CASE
                WHEN sp.status IS NOT NULL THEN sp.status
                ELSE 'not_started'
            END as student_status,
            COALESCE(sp.score, 0) as student_score,
            COALESCE(sp.attempts, 0) as attempts
        FROM problems p
        LEFT JOIN student_progress sp ON p.id = sp.problem_id AND sp.student_id = ?
        WHERE p.course_id = ?
        ORDER BY p.difficulty, p.id
    ";

    $problems = $db->fetchAll($problemsQuery, [$studentId ?? 0, $courseId]);

    // Get constellation connections
    $connectionsQuery = "
        SELECT
            c.*,
            p1.title as from_title,
            p2.title as to_title
        FROM constellations c
        INNER JOIN problems p1 ON c.from_problem_id = p1.id
        INNER JOIN problems p2 ON c.to_problem_id = p2.id
        WHERE p1.course_id = ? OR p2.course_id = ?
    ";

    $connections = $db->fetchAll($connectionsQuery, [$courseId, $courseId]);

    // Format response
    $response = [
        'success' => true,
        'data' => [
            'problems' => array_map(function($p) {
                return [
                    'id' => intval($p['id']),
                    'moodleId' => intval($p['moodle_id']),
                    'title' => $p['title'],
                    'description' => $p['description'],
                    'type' => $p['problem_type'],
                    'difficulty' => intval($p['difficulty']),
                    'vector' => [
                        'x' => floatval($p['vector_x']),
                        'y' => floatval($p['vector_y']),
                        'z' => floatval($p['vector_z'])
                    ],
                    'category' => $p['category'],
                    'tags' => json_decode($p['tags'] ?? '[]'),
                    'studentStatus' => $p['student_status'],
                    'studentScore' => floatval($p['student_score']),
                    'attempts' => intval($p['attempts'])
                ];
            }, $problems),
            'connections' => array_map(function($c) {
                return [
                    'id' => intval($c['id']),
                    'from' => intval($c['from_problem_id']),
                    'to' => intval($c['to_problem_id']),
                    'type' => $c['relationship_type'],
                    'strength' => floatval($c['strength']),
                    'fromTitle' => $c['from_title'],
                    'toTitle' => $c['to_title']
                ];
            }, $connections),
            'metadata' => [
                'courseId' => $courseId,
                'studentId' => $studentId,
                'totalProblems' => count($problems),
                'totalConnections' => count($connections),
                'timestamp' => date('c')
            ]
        ]
    ];

    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error',
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>
