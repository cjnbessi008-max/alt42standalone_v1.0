<?php
/**
 * Get Problems API Endpoint
 * Returns problems optionally filtered by set
 */

require_once '../config.php';
require_once '../database.php';

try {
    $db = new Database();

    // Get set_id from query parameter
    $set_id = isset($_GET['set_id']) ? intval($_GET['set_id']) : null;

    if ($set_id !== null) {
        // Get problems for specific set
        $sql = "SELECT p.id, p.moodle_question_id, p.question_text,
                       p.question_type, p.difficulty_level, p.tags,
                       psm.order_index, s.name as set_name, s.color as set_color
                FROM problems p
                JOIN problem_set_mapping psm ON p.id = psm.problem_id
                JOIN sets s ON psm.set_id = s.id
                WHERE psm.set_id = :set_id
                ORDER BY psm.order_index, p.id";
        $params = array(':set_id' => $set_id);
        $problems = $db->fetchAll($sql, $params);
    } else {
        // Get all problems
        $sql = "SELECT p.id, p.moodle_question_id, p.question_text,
                       p.question_type, p.difficulty_level, p.tags,
                       GROUP_CONCAT(s.name) as sets
                FROM problems p
                LEFT JOIN problem_set_mapping psm ON p.id = psm.problem_id
                LEFT JOIN sets s ON psm.set_id = s.id
                GROUP BY p.id
                ORDER BY p.id";
        $problems = $db->fetchAll($sql);
    }

    echo json_encode(array(
        'success' => true,
        'data' => array(
            'problems' => $problems,
            'total' => count($problems),
            'set_id' => $set_id
        )
    ), JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        'success' => false,
        'message' => $e->getMessage()
    ), JSON_UNESCAPED_UNICODE);
}
