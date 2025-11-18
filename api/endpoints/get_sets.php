<?php
/**
 * Get Sets API Endpoint
 * Returns all sets and their relationships
 */

require_once '../config.php';
require_once '../database.php';

try {
    $db = new Database();

    // Get all sets
    $sets_sql = "SELECT id, name, description, parent_id, color, position_x, position_y
                 FROM sets
                 ORDER BY id";
    $sets = $db->fetchAll($sets_sql);

    // Get all relationships
    $rel_sql = "SELECT sr.id, sr.set_a_id, sr.set_b_id, sr.relationship_type,
                       sa.name as set_a_name, sb.name as set_b_name
                FROM set_relationships sr
                JOIN sets sa ON sr.set_a_id = sa.id
                JOIN sets sb ON sr.set_b_id = sb.id";
    $relationships = $db->fetchAll($rel_sql);

    // Build hierarchy
    $hierarchy = array();
    foreach ($sets as $set) {
        $set['children'] = array();
        $set['problems_count'] = 0;
        $hierarchy[$set['id']] = $set;
    }

    // Count problems per set
    $count_sql = "SELECT set_id, COUNT(*) as count
                  FROM problem_set_mapping
                  GROUP BY set_id";
    $counts = $db->fetchAll($count_sql);
    foreach ($counts as $count) {
        if (isset($hierarchy[$count['set_id']])) {
            $hierarchy[$count['set_id']]['problems_count'] = (int)$count['count'];
        }
    }

    // Build tree structure
    $tree = array();
    foreach ($hierarchy as $id => $set) {
        if ($set['parent_id'] === null) {
            $tree[] = $set;
        } else {
            if (isset($hierarchy[$set['parent_id']])) {
                $hierarchy[$set['parent_id']]['children'][] = $set;
            }
        }
    }

    echo json_encode(array(
        'success' => true,
        'data' => array(
            'sets' => array_values($hierarchy),
            'tree' => $tree,
            'relationships' => $relationships,
            'total' => count($sets)
        )
    ), JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        'success' => false,
        'message' => $e->getMessage()
    ), JSON_UNESCAPED_UNICODE);
}
