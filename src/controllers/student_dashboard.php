<?php
/**
 * Student Dashboard Controller
 */

// Check authentication
if (!isset($_SESSION['authenticated']) || !$_SESSION['authenticated']) {
    header('Location: /');
    exit;
}

$user = $_SESSION['user'];

if ($user['role'] !== 'student') {
    // Teachers/admins can still access
    if ($user['role'] !== 'teacher' && $user['role'] !== 'admin') {
        http_response_code(403);
        die('Access denied');
    }
}

// Load student's submissions
$submissionModel = new Submission();
$submissions = $submissionModel->getByStudent($user['id']);

// Load available problems
$problemModel = new Problem();
$problems = $problemModel->getAllActive();

// Filter out problems already attempted
$attemptedProblemIds = array_column($submissions, 'problem_id');
$availableProblems = array_filter($problems, function($p) use ($attemptedProblemIds) {
    return !in_array($p['id'], $attemptedProblemIds);
});

// Load view
$pageTitle = 'Student Dashboard';
include __DIR__ . '/../views/student_dashboard.php';
