<?php
/**
 * API Endpoint - Get Students with Outlier Detection
 * Returns student performance data with outlier analysis
 */

// Set JSON header
header('Content-Type: application/json');

// Enable CORS if needed
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// Error handling
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Include required files
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/moodle_integration.php';
require_once __DIR__ . '/../includes/outlier_detector.php';

try {
    // Get parameters
    $courseId = isset($_GET['course_id']) ? intval($_GET['course_id']) : null;
    $quizId = isset($_GET['quiz_id']) ? intval($_GET['quiz_id']) : null;
    $method = isset($_GET['method']) && in_array($_GET['method'], ['iqr', 'zscore']) ? $_GET['method'] : 'iqr';

    // Initialize components
    $moodle = new MoodleIntegration();
    $detector = new OutlierDetector();

    // Fetch student data
    $students = [];

    if ($quizId) {
        // Get data for specific quiz
        $students = $moodle->getQuizAttempts($quizId);
    } else {
        // Get overall student performance
        $students = $moodle->getStudentPerformance($courseId);
    }

    // Check if we have data
    if (empty($students)) {
        echo json_encode([
            'success' => true,
            'students' => [],
            'statistics' => null,
            'outlier_count' => 0,
            'message' => 'No student data available'
        ]);
        exit;
    }

    // Detect outliers
    $result = $detector->detectStudentOutliers($students, $method);

    // Prepare response
    $response = [
        'success' => true,
        'students' => $result['students'],
        'statistics' => $result['statistics'],
        'outlier_count' => $result['outlier_count'],
        'method' => $method,
        'timestamp' => date('Y-m-d H:i:s')
    ];

    echo json_encode($response, JSON_PRETTY_PRINT);

} catch (Exception $e) {
    // Error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'An error occurred while fetching student data',
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
}
