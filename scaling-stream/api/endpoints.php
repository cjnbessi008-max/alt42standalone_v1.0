<?php
/**
 * REST API Endpoints for Scaling Stream
 * Provides JSON responses for frontend consumption
 */

require_once __DIR__ . '/moodle_connector.php';
require_once __DIR__ . '/../config/config.php';

header('Content-Type: application/json');

// Get request parameters
$action = isset($_GET['action']) ? $_GET['action'] : '';
$connector = new MoodleConnector();

// Route requests
switch ($action) {
    case 'get_questions':
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 20;
        $category_id = isset($_GET['category_id']) ? intval($_GET['category_id']) : null;

        $questions = $connector->fetchQuestionsDB($limit, $category_id);
        echo json_encode(array(
            'success' => !isset($questions['error']),
            'data' => $questions,
            'count' => is_array($questions) ? count($questions) : 0
        ));
        break;

    case 'get_question_details':
        $question_id = isset($_GET['id']) ? intval($_GET['id']) : 0;

        if ($question_id === 0) {
            echo json_encode(array(
                'success' => false,
                'error' => 'Question ID is required'
            ));
            break;
        }

        $question = $connector->getQuestionDetails($question_id);
        echo json_encode(array(
            'success' => !isset($question['error']),
            'data' => $question
        ));
        break;

    case 'get_courses':
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 20;

        $courses = $connector->getCourses($limit);
        echo json_encode(array(
            'success' => !isset($courses['error']),
            'data' => $courses,
            'count' => is_array($courses) ? count($courses) : 0
        ));
        break;

    case 'get_quiz_attempts':
        $quiz_id = isset($_GET['quiz_id']) ? intval($_GET['quiz_id']) : 0;
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;

        if ($quiz_id === 0) {
            echo json_encode(array(
                'success' => false,
                'error' => 'Quiz ID is required'
            ));
            break;
        }

        $attempts = $connector->getQuizAttempts($quiz_id, $limit);
        echo json_encode(array(
            'success' => !isset($attempts['error']),
            'data' => $attempts,
            'count' => is_array($attempts) ? count($attempts) : 0
        ));
        break;

    case 'calculate_similarity':
        $q1_id = isset($_GET['question1']) ? intval($_GET['question1']) : 0;
        $q2_id = isset($_GET['question2']) ? intval($_GET['question2']) : 0;

        if ($q1_id === 0 || $q2_id === 0) {
            echo json_encode(array(
                'success' => false,
                'error' => 'Both question IDs are required'
            ));
            break;
        }

        $similarity = $connector->calculateQuestionSimilarity($q1_id, $q2_id);
        echo json_encode(array(
            'success' => true,
            'data' => array(
                'question1' => $q1_id,
                'question2' => $q2_id,
                'similarity' => $similarity,
                'percentage' => round($similarity * 100, 2)
            )
        ));
        break;

    case 'get_random_question':
        // Get a random question for streaming
        $questions = $connector->fetchQuestionsDB(100);

        if (isset($questions['error']) || empty($questions)) {
            echo json_encode(array(
                'success' => false,
                'error' => 'No questions available'
            ));
            break;
        }

        $random_question = $questions[array_rand($questions)];
        $details = $connector->getQuestionDetails($random_question['id']);

        echo json_encode(array(
            'success' => true,
            'data' => $details
        ));
        break;

    case 'health_check':
        // Check if the API and database are working
        echo json_encode(array(
            'success' => true,
            'app' => APP_NAME,
            'version' => APP_VERSION,
            'timestamp' => time(),
            'status' => 'operational'
        ));
        break;

    default:
        echo json_encode(array(
            'success' => false,
            'error' => 'Invalid action',
            'available_actions' => array(
                'get_questions',
                'get_question_details',
                'get_courses',
                'get_quiz_attempts',
                'calculate_similarity',
                'get_random_question',
                'health_check'
            )
        ));
        break;
}
?>
