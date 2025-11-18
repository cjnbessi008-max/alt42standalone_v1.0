<?php
/**
 * Network API Endpoint
 * Returns network graph data for visualization
 */

require_once '../config/database.php';
require_once '../models/Concept.php';
require_once '../models/LearningLog.php';
require_once '../utils/cors.php';

$database = new Database();
$db = $database->getConnection();

$concept = new Concept($db);
$log = new LearningLog($db);

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

// Get student_id from query parameter if provided
$student_id = isset($_GET['student_id']) ? intval($_GET['student_id']) : null;

if ($method === 'GET') {
    try {
        // Get all concepts as nodes
        $concepts_stmt = $concept->getAll();
        $nodes = [];

        while ($row = $concepts_stmt->fetch(PDO::FETCH_ASSOC)) {
            $nodes[] = [
                'id' => intval($row['id']),
                'label' => $row['name'],
                'title' => $row['description'],
                'group' => $row['difficulty_level'],
                'color' => $row['color'],
                'shape' => 'dot',
                'size' => 20
            ];
        }

        // Get concept relationships as edges
        $relationships_stmt = $concept->getAllRelationships();
        $edges = [];

        while ($row = $relationships_stmt->fetch(PDO::FETCH_ASSOC)) {
            $edges[] = [
                'from' => intval($row['source_concept_id']),
                'to' => intval($row['target_concept_id']),
                'label' => $row['relationship_type'],
                'value' => floatval($row['strength']),
                'arrows' => 'to',
                'color' => [
                    'opacity' => floatval($row['strength'])
                ]
            ];
        }

        // Get learning paths if student_id provided
        $learning_paths = [];
        if ($student_id) {
            $paths_stmt = $log->getLearningPaths($student_id);
            while ($row = $paths_stmt->fetch(PDO::FETCH_ASSOC)) {
                $learning_paths[] = [
                    'from' => intval($row['from_concept_id']),
                    'to' => intval($row['to_concept_id']),
                    'count' => intval($row['transition_count']),
                    'success_rate' => floatval($row['success_rate']),
                    'avg_duration' => intval($row['avg_duration_seconds'])
                ];
            }

            // Add learning paths as dashed edges
            foreach ($learning_paths as $path) {
                $edges[] = [
                    'from' => $path['from'],
                    'to' => $path['to'],
                    'label' => $path['count'] . 'x',
                    'value' => $path['count'],
                    'dashes' => true,
                    'color' => [
                        'color' => '#ff6b6b',
                        'opacity' => min(1.0, $path['count'] / 10)
                    ],
                    'arrows' => 'to',
                    'width' => min(5, $path['count'])
                ];
            }
        }

        // Get network statistics
        $stats_stmt = $log->getNetworkStats($student_id);
        $statistics = [];

        while ($row = $stats_stmt->fetch(PDO::FETCH_ASSOC)) {
            $concept_id = intval($row['id']);
            $statistics[$concept_id] = [
                'total_interactions' => intval($row['total_interactions']),
                'unique_students' => intval($row['unique_students']),
                'avg_score' => floatval($row['avg_score']),
                'mastery_count' => intval($row['mastery_count'])
            ];

            // Update node size based on interactions
            foreach ($nodes as &$node) {
                if ($node['id'] === $concept_id) {
                    $node['size'] = 20 + min(30, intval($row['total_interactions']) * 2);
                    $node['value'] = intval($row['total_interactions']);
                }
            }
        }

        // Response
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => [
                'nodes' => $nodes,
                'edges' => $edges,
                'statistics' => $statistics,
                'learning_paths' => $learning_paths
            ],
            'metadata' => [
                'total_concepts' => count($nodes),
                'total_relationships' => count($edges),
                'student_id' => $student_id,
                'generated_at' => date('c')
            ]
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to fetch network data',
            'error' => $e->getMessage()
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
}
