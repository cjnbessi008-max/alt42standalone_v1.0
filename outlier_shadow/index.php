<?php
/**
 * Outlier Shadow - Main Entry Point
 * Mobile web app for visualizing student performance outliers
 * Integrates with Moodle 3.7 LMS
 */

// Error reporting for development (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Include required files
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/includes/moodle_integration.php';
require_once __DIR__ . '/includes/outlier_detector.php';

// Get parameters
$courseId = isset($_GET['course_id']) ? intval($_GET['course_id']) : null;
$quizId = isset($_GET['quiz_id']) ? intval($_GET['quiz_id']) : null;
$detectionMethod = isset($_GET['method']) ? $_GET['method'] : 'iqr';
?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Outlier Shadow - Student Performance Monitor</title>
    <link rel="stylesheet" href="assets/css/smartphone.css">
</head>
<body>
    <div class="smartphone-container">
        <div class="smartphone-screen">
            <!-- Header -->
            <div class="smartphone-header">
                <h1>📊 Outlier Shadow</h1>
                <p>Real-time Performance Monitor</p>
            </div>

            <!-- Content -->
            <div class="smartphone-content">
                <!-- Filter Tabs -->
                <div class="filter-tabs">
                    <button class="filter-tab active" data-filter="all">All</button>
                    <button class="filter-tab" data-filter="outliers">Outliers</button>
                    <button class="filter-tab" data-filter="low">At Risk</button>
                    <button class="filter-tab" data-filter="high">Excelling</button>
                </div>

                <!-- Statistics Summary -->
                <div class="stats-summary" id="stats-summary">
                    <div class="loading">
                        <div class="loading-spinner"></div>
                        <p>Loading statistics...</p>
                    </div>
                </div>

                <!-- Students Container -->
                <div id="students-container">
                    <div class="loading">
                        <div class="loading-spinner"></div>
                        <p>Loading student data...</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="assets/js/smartphone.js"></script>
</body>
</html>
