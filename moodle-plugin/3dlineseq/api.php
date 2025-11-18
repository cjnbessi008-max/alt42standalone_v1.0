<?php
// This file is part of Moodle - http://moodle.org/

require_once('../../config.php');
require_once($CFG->dirroot.'/mod/3dlineseq/lib.php');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['error' => 'Method not allowed']));
}

// Get JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['action'])) {
    http_response_code(400);
    die(json_encode(['error' => 'Invalid request']));
}

$action = $data['action'];

// Handle different actions
switch ($action) {
    case 'get_sequence':
        getSequence($data);
        break;

    case 'submit_attempt':
        submitAttempt($data);
        break;

    case 'get_attempts':
        getUserAttempts($data);
        break;

    default:
        http_response_code(400);
        die(json_encode(['error' => 'Unknown action']));
}

/**
 * Get sequence data
 */
function getSequence($data) {
    global $DB, $USER;

    if (!isset($data['id'])) {
        http_response_code(400);
        die(json_encode(['error' => 'Missing activity ID']));
    }

    $id = intval($data['id']);

    try {
        // Get the record
        $record = $DB->get_record('3dlineseq', ['id' => $id], '*', MUST_EXIST);

        // Check permissions (basic check - enhance as needed)
        $cm = get_coursemodule_from_instance('3dlineseq', $id);
        if ($cm) {
            $context = context_module::instance($cm->id);
            require_capability('mod/3dlineseq:view', $context);
        }

        // Prepare response
        $response = [
            'id' => $record->id,
            'name' => $record->name,
            'type' => $record->sequencetype,
            'style' => $record->visualstyle,
            'values' => json_decode($record->sequencedata, true)
        ];

        header('Content-Type: application/json');
        echo json_encode($response);

    } catch (Exception $e) {
        http_response_code(500);
        die(json_encode(['error' => $e->getMessage()]));
    }
}

/**
 * Submit student attempt
 */
function submitAttempt($data) {
    global $DB, $USER;

    if (!isset($data['id']) || !isset($data['answer'])) {
        http_response_code(400);
        die(json_encode(['error' => 'Missing required fields']));
    }

    $id = intval($data['id']);
    $answer = $data['answer'];
    $score = isset($data['score']) ? floatval($data['score']) : null;

    try {
        // Check permissions
        $cm = get_coursemodule_from_instance('3dlineseq', $id);
        if ($cm) {
            $context = context_module::instance($cm->id);
            require_capability('mod/3dlineseq:submit', $context);
        }

        // Save attempt
        $attemptId = lineseq_save_attempt($id, $USER->id, $answer, $score);

        $response = [
            'success' => true,
            'attemptid' => $attemptId
        ];

        header('Content-Type: application/json');
        echo json_encode($response);

    } catch (Exception $e) {
        http_response_code(500);
        die(json_encode(['error' => $e->getMessage()]));
    }
}

/**
 * Get user attempts
 */
function getUserAttempts($data) {
    global $DB, $USER;

    if (!isset($data['id'])) {
        http_response_code(400);
        die(json_encode(['error' => 'Missing activity ID']));
    }

    $id = intval($data['id']);

    try {
        // Check permissions
        $cm = get_coursemodule_from_instance('3dlineseq', $id);
        if ($cm) {
            $context = context_module::instance($cm->id);
            require_capability('mod/3dlineseq:view', $context);
        }

        // Get attempts
        $attempts = lineseq_get_user_attempts($id, $USER->id);

        $response = [];
        foreach ($attempts as $attempt) {
            $response[] = [
                'id' => $attempt->id,
                'attempt' => $attempt->attempt,
                'answer' => json_decode($attempt->answer, true),
                'score' => $attempt->score,
                'completed' => $attempt->completed,
                'timecreated' => $attempt->timecreated
            ];
        }

        header('Content-Type: application/json');
        echo json_encode($response);

    } catch (Exception $e) {
        http_response_code(500);
        die(json_encode(['error' => $e->getMessage()]));
    }
}
