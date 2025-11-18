<?php
/**
 * Student Recommendations API Endpoint
 * Provides personalized trap recommendations for students
 * Trap Detection LMS
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../src/services/TrapDetectionService.php';

try {
    // Only allow GET requests
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        throw new Exception("Only GET requests are allowed");
    }

    // Get student ID from query parameter
    if (!isset($_GET['student_id'])) {
        throw new Exception("Missing required parameter: student_id");
    }

    $studentId = intval($_GET['student_id']);

    // Get recommendations
    $trapService = new TrapDetectionService();
    $recommendations = $trapService->getStudentRecommendations($studentId);

    // Return response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $recommendations,
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
    ]);
}
