<?php
/**
 * API: Get Questions from Moodle
 *
 * This API endpoint fetches question data from Moodle database
 * and returns slope/difficulty information for heat map visualization
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../config.php';

try {
    $db = getDbConnection();

    // Get course ID from request (optional)
    $courseId = isset($_GET['course_id']) ? intval($_GET['course_id']) : null;

    /**
     * Fetch questions with difficulty/slope data
     *
     * In a real scenario, slope could be calculated from:
     * - Student success rate over time
     * - Question difficulty progression
     * - Learning curve steepness
     */

    $query = "
        SELECT
            q.id,
            q.name,
            q.questiontext,
            q.defaultmark,
            qc.name as category_name,
            COUNT(qa.id) as attempt_count,
            AVG(qa.fraction) as avg_score
        FROM " . DB_PREFIX . "question q
        LEFT JOIN " . DB_PREFIX . "question_categories qc ON q.category = qc.id
        LEFT JOIN " . DB_PREFIX . "question_attempts qa ON q.id = qa.questionid
    ";

    $params = [];

    if ($courseId !== null) {
        $query .= " WHERE qc.contextid IN (
            SELECT ctx.id
            FROM " . DB_PREFIX . "context ctx
            WHERE ctx.instanceid = :course_id
            AND ctx.contextlevel = 50
        )";
        $params['course_id'] = $courseId;
    }

    $query .= " GROUP BY q.id, q.name, q.questiontext, q.defaultmark, qc.name
                ORDER BY q.id ASC
                LIMIT 50";

    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $questions = $stmt->fetchAll();

    // Calculate slope for each question
    // Slope represents difficulty progression (steepness)
    $result = [];
    $questionCount = count($questions);

    foreach ($questions as $index => $question) {
        // Calculate slope based on:
        // 1. Position in sequence (progression)
        // 2. Success rate (difficulty)
        // 3. Default mark (weight)

        $position = $index + 1;
        $successRate = floatval($question['avg_score']) ?: 0.5;
        $weight = floatval($question['defaultmark']) ?: 1.0;

        // Slope calculation: measures learning curve steepness
        // Higher slope = steeper learning curve (more challenging progression)
        $baseSlope = ($position / $questionCount) * 10; // 0-10 range
        $difficultyFactor = (1 - $successRate) * 2; // 0-2 range (lower success = harder)
        $weightFactor = min($weight / 10, 1); // Normalize weight

        $slope = $baseSlope * (1 + $difficultyFactor * $weightFactor);

        $result[] = [
            'id' => $question['id'],
            'name' => strip_tags($question['name']),
            'category' => $question['category_name'],
            'position' => $position,
            'slope' => round($slope, 2),
            'successRate' => round($successRate * 100, 1),
            'attemptCount' => intval($question['attempt_count']),
            'defaultMark' => floatval($question['defaultmark'])
        ];
    }

    echo json_encode([
        'success' => true,
        'count' => count($result),
        'questions' => $result,
        'timestamp' => time()
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => DEBUG_MODE ? $e->getMessage() : 'Internal server error',
        'timestamp' => time()
    ]);
}
