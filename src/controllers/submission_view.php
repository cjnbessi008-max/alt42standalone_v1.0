<?php
/**
 * Submission View Controller
 * Shows submission details with AI feedback
 */

// Check authentication
if (!isset($_SESSION['authenticated']) || !$_SESSION['authenticated']) {
    header('Location: /');
    exit;
}

$user = $_SESSION['user'];
$submissionId = intval($_GET['id'] ?? 0);

if ($submissionId === 0) {
    die('Invalid submission ID');
}

$submissionModel = new Submission();
$submission = $submissionModel->getById($submissionId);

if (!$submission) {
    die('Submission not found');
}

// Check access permission
if ($user['role'] === 'student' && $submission['student_id'] != $user['id']) {
    http_response_code(403);
    die('Access denied');
}

// Get verification details
$verification = $submissionModel->getVerification($submissionId);

// Get problem details
$problemModel = new Problem();
$problem = $problemModel->getById($submission['problem_id']);

// Load view
$pageTitle = 'Submission: ' . htmlspecialchars($submission['problem_title']);
include __DIR__ . '/../views/submission_view.php';
