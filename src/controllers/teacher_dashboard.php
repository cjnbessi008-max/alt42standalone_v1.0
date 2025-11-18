<?php
/**
 * Teacher Dashboard Controller
 */

// Check authentication
if (!isset($_SESSION['authenticated']) || !$_SESSION['authenticated']) {
    header('Location: /');
    exit;
}

$user = $_SESSION['user'];

if ($user['role'] !== 'teacher' && $user['role'] !== 'admin') {
    http_response_code(403);
    die('Access denied');
}

// Load problems
$problemModel = new Problem();
$problems = $problemModel->getByTeacher($user['id'], false);

// Get statistics for each problem
foreach ($problems as &$problem) {
    $problem['stats'] = $problemModel->getStatistics($problem['id']);
}

// Load view
$pageTitle = 'Teacher Dashboard';
include __DIR__ . '/../views/teacher_dashboard.php';
