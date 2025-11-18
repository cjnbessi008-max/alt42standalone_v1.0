<?php
// Save student attempt to Moodle database

require_once('../../config.php');

require_login();

header('Content-Type: application/json');

// Get JSON input
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!isset($data['sesskey']) || !confirm_sesskey($data['sesskey'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid session key']);
    exit;
}

$userid = isset($data['userid']) ? intval($data['userid']) : 0;
$attemptData = isset($data['data']) ? $data['data'] : null;

if ($userid <= 0 || !$attemptData) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid input data']);
    exit;
}

try {
    global $DB, $USER;

    // Verify user
    if ($userid != $USER->id) {
        http_response_code(403);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    // Create or get problem record
    $problemId = null;
    $numbers = json_encode($attemptData['numbers']);
    $algorithm = $attemptData['algorithm'];

    // Check if this problem already exists
    $existingProblem = $DB->get_record('local_dancingline_problems', [
        'numbers' => $numbers,
        'algorithm' => $algorithm
    ]);

    if ($existingProblem) {
        $problemId = $existingProblem->id;
    } else {
        // Create new problem
        $problem = new stdClass();
        $problem->courseid = 0; // Default course
        $problem->name = 'Auto-generated problem';
        $problem->description = 'Sort ' . count($attemptData['numbers']) . ' numbers using ' . $algorithm . ' sort';
        $problem->numbers = $numbers;
        $problem->algorithm = $algorithm;
        $problem->difficulty = 1;
        $problem->timecreated = time();
        $problem->timemodified = time();

        $problemId = $DB->insert_record('local_dancingline_problems', $problem);
    }

    // Save attempt
    $attempt = new stdClass();
    $attempt->problemid = $problemId;
    $attempt->userid = $userid;
    $attempt->comparisons = intval($attemptData['comparisons']);
    $attempt->swaps = intval($attemptData['swaps']);
    $attempt->timeelapsed = intval($attemptData['timeElapsed']);
    $attempt->completed = 1;

    // Calculate score based on efficiency
    // Lower comparisons and swaps = higher score
    $maxScore = 100;
    $n = count($attemptData['numbers']);
    $expectedComparisons = $n * $n; // Rough estimate
    $efficiencyRatio = min(1, $expectedComparisons / max(1, $attempt->comparisons));
    $attempt->score = round($efficiencyRatio * $maxScore, 2);

    $attempt->timecreated = time();

    $attemptId = $DB->insert_record('local_dancingline_attempts', $attempt);

    echo json_encode([
        'success' => true,
        'attemptid' => $attemptId,
        'score' => $attempt->score,
        'message' => 'Attempt saved successfully'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
