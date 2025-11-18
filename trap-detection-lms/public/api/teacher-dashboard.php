<?php
/**
 * Teacher Dashboard API Endpoint
 * Provides trap analytics and statistics
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

    // Get filters from query parameters
    $filters = [];

    if (isset($_GET['date_from'])) {
        $filters['date_from'] = $_GET['date_from'];
    }

    if (isset($_GET['date_to'])) {
        $filters['date_to'] = $_GET['date_to'];
    }

    if (isset($_GET['trap_type'])) {
        $filters['trap_type'] = $_GET['trap_type'];
    }

    if (isset($_GET['severity'])) {
        $filters['severity'] = $_GET['severity'];
    }

    // Get dashboard data
    $trapService = new TrapDetectionService();
    $dashboard = $trapService->getTeacherDashboard($filters);

    // Return response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $dashboard,
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
    ]);
}
