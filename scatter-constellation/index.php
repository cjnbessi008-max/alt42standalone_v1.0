<?php
/**
 * Scatter Constellation App
 * Main entry point for the application
 *
 * Integrates with Moodle 3.7 to display problem data as constellation-style scatter plots
 * Displays in a virtual smartphone screen (bottom-right position)
 */

require_once('config.php');
require_once('lib/db.php');
require_once('lib/moodle_api.php');

// Initialize session
session_start();

// Get database connection
$db = Database::getInstance();

// Check if we have problem data to display
$problems = [];
if (isset($_GET['course_id'])) {
    $moodle_api = new MoodleAPI();
    $problems = $moodle_api->getProblems($_GET['course_id']);
}

?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scatter Constellation - 별자리 학습 시스템</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="assets/css/smartphone.css">
    <link rel="stylesheet" href="assets/css/constellation.css">
</head>
<body>
    <div class="container">
        <!-- Main content area -->
        <div class="main-content">
            <h1>Scatter Constellation</h1>
            <p class="subtitle">문제 데이터를 별자리처럼 연결하여 시각화합니다</p>

            <div class="controls">
                <label for="course-select">Course 선택:</label>
                <select id="course-select">
                    <option value="">-- Select a Course --</option>
                    <!-- Courses will be loaded via AJAX -->
                </select>

                <button id="refresh-btn">데이터 새로고침</button>
            </div>
        </div>

        <!-- Virtual Smartphone Screen (Bottom Right) -->
        <div class="smartphone-container">
            <div class="smartphone-frame">
                <div class="smartphone-screen">
                    <div class="status-bar">
                        <span class="time" id="current-time">12:00</span>
                        <span class="battery">100%</span>
                    </div>

                    <div class="app-header">
                        <h2>Scatter Constellation</h2>
                    </div>

                    <!-- Canvas for constellation visualization -->
                    <canvas id="constellation-canvas"></canvas>

                    <div class="problem-info" id="problem-info">
                        <h3>문제 정보</h3>
                        <div id="selected-problem-details">
                            점을 클릭하여 문제 정보를 확인하세요
                        </div>
                    </div>
                </div>

                <!-- Home button -->
                <div class="home-button"></div>
            </div>
        </div>
    </div>

    <!-- Hidden data for JavaScript -->
    <script>
        window.INITIAL_PROBLEMS = <?php echo json_encode($problems); ?>;
    </script>

    <!-- JavaScript -->
    <script src="assets/js/utils.js"></script>
    <script src="assets/js/constellation.js"></script>
    <script src="assets/js/app.js"></script>
</body>
</html>
