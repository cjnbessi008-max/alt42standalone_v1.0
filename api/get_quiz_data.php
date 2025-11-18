<?php
/**
 * API Endpoint: Fetch quiz/problem data from Moodle
 * Returns quiz attempts and scores for visualization
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../config/database.php';

try {
    $db = Database::getInstance()->getConnection();

    // Get parameters
    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    $quizId = isset($_GET['quiz_id']) ? intval($_GET['quiz_id']) : 0;

    // Query quiz attempts
    $sql = "SELECT
                qa.id,
                qa.quiz,
                qa.userid,
                qa.attempt,
                qa.sumgrades,
                qa.timefinish,
                qa.timestart,
                q.name as quizname,
                q.grade as maxgrade,
                u.firstname,
                u.lastname
            FROM mdl_quiz_attempts qa
            JOIN mdl_quiz q ON qa.quiz = q.id
            JOIN mdl_user u ON qa.userid = u.id
            WHERE qa.state = 'finished'";

    $params = array();

    if ($userId > 0) {
        $sql .= " AND qa.userid = :userid";
        $params[':userid'] = $userId;
    }

    if ($quizId > 0) {
        $sql .= " AND qa.quiz = :quizid";
        $params[':quizid'] = $quizId;
    }

    $sql .= " ORDER BY qa.timefinish ASC";

    $stmt = $db->prepare($sql);

    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value, PDO::PARAM_INT);
    }

    $stmt->execute();
    $attempts = $stmt->fetchAll();

    // Transform for curvy log visualization
    $curvyData = array();

    foreach ($attempts as $index => $attempt) {
        $normalizedScore = $attempt['maxgrade'] > 0
            ? ($attempt['sumgrades'] / $attempt['maxgrade']) * 100
            : 0;

        // Log transformation for smooth curves
        $logValue = $normalizedScore > 0 ? log($normalizedScore + 1) : 0;

        $curvyData[] = array(
            'x' => $index,
            'y' => $logValue,
            'rawScore' => $normalizedScore,
            'attempt' => $attempt['attempt'],
            'quizName' => $attempt['quizname'],
            'userName' => $attempt['firstname'] . ' ' . $attempt['lastname'],
            'timeTaken' => $attempt['timefinish'] - $attempt['timestart'],
            'timestamp' => $attempt['timefinish']
        );
    }

    $response = array(
        'success' => true,
        'count' => count($attempts),
        'data' => $curvyData,
        'metadata' => array(
            'userId' => $userId,
            'quizId' => $quizId,
            'generatedAt' => time()
        )
    );

    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        'success' => false,
        'error' => $e->getMessage()
    ));
}
?>
