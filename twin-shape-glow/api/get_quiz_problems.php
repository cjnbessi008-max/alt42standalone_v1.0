<?php
/**
 * API: Get Quiz Problems
 * Returns all problems associated with a Moodle quiz
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../includes/moodle_integration.php';

try {
    $quiz_id = isset($_GET['quiz_id']) ? intval($_GET['quiz_id']) : null;

    if (!$quiz_id) {
        throw new Exception('Quiz ID is required');
    }

    $moodle = new MoodleIntegration();
    $questions = $moodle->getQuizQuestions($quiz_id);

    if (!$questions) {
        throw new Exception('No questions found for this quiz');
    }

    // Get or create TSG problems for each question
    $tsg_conn = $moodle->getTSGConnection();
    $problems = [];

    foreach ($questions as $question) {
        // Check if TSG problem exists for this question
        $stmt = $tsg_conn->prepare("
            SELECT * FROM tsg_problems
            WHERE moodle_question_id = ?
            LIMIT 1
        ");

        $stmt->bind_param("i", $question['id']);
        $stmt->execute();
        $result = $stmt->get_result();
        $problem = $result->fetch_assoc();
        $stmt->close();

        $problems[] = [
            'question' => $question,
            'problem' => $problem,
            'has_tsg_problem' => $problem !== null
        ];
    }

    echo json_encode([
        'success' => true,
        'quiz_id' => $quiz_id,
        'total_questions' => count($questions),
        'problems' => $problems
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
