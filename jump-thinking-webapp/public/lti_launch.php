<?php
/**
 * LTI Launch Endpoint
 * Entry point for Moodle LTI integration
 */

require_once __DIR__ . '/../src/autoload.php';

use JumpThinking\LTI\LTIProvider;

// Start session
session_start();

// Handle POST request from Moodle
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die('Method not allowed. This endpoint only accepts POST requests from LTI consumers.');
}

// Get POST parameters
$params = $_POST;

// Initialize LTI Provider
$ltiProvider = new LTIProvider();

// Handle launch
$result = $ltiProvider->handleLaunch($params);

if (!$result['success']) {
    // Show error page
    http_response_code(403);
    ?>
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <title>LTI Launch Error</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .error { background: #fee; border: 1px solid #fcc; padding: 20px; border-radius: 5px; }
            h1 { color: #c00; }
        </style>
    </head>
    <body>
        <div class="error">
            <h1>LTI 연동 오류</h1>
            <p><strong>오류:</strong> <?php echo htmlspecialchars($result['error']); ?></p>
            <p>Moodle 관리자에게 문의하세요.</p>
        </div>
    </body>
    </html>
    <?php
    exit;
}

// Store grade passback info in session
if ($result['has_grade_passback']) {
    $_SESSION['grade_passback'] = $result['grade_passback_data'];
}

$_SESSION['return_url'] = $result['return_url'];

// Redirect based on user role
$user = $result['user'];

if ($user['role'] === 'teacher') {
    // Redirect to teacher dashboard
    header('Location: /teacher/dashboard.php');
} else {
    // Redirect to student problem solving interface
    header('Location: /student/solve.php');
}
exit;
