<?php
/**
 * Sync Moodle Questions API Endpoint
 * Syncs questions from Moodle to local database
 */

require_once '../config.php';
require_once '../database.php';
require_once '../moodle_connector.php';

try {
    $db = new Database();
    $moodle = new MoodleConnector();

    // Sync questions
    $result = $moodle->syncQuestions($db);

    if ($result['success']) {
        http_response_code(200);
    } else {
        http_response_code(500);
    }

    echo json_encode($result, JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        'success' => false,
        'message' => $e->getMessage()
    ), JSON_UNESCAPED_UNICODE);
}
