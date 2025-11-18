<?php
/**
 * Problem View Controller
 * Shows problem and allows students to submit solution
 */

// Check authentication
if (!isset($_SESSION['authenticated']) || !$_SESSION['authenticated']) {
    header('Location: /');
    exit;
}

$user = $_SESSION['user'];
$problemId = intval($_GET['id'] ?? 0);

if ($problemId === 0) {
    die('Invalid problem ID');
}

$problemModel = new Problem();
$problem = $problemModel->getById($problemId);

if (!$problem) {
    die('Problem not found');
}

// Check if student already has a submission
$submissionModel = new Submission();
$existingSubmission = null;

if ($user['role'] === 'student') {
    $existingSubmission = $submissionModel->getByStudentAndProblem($user['id'], $problemId);
}

// Load view based on role
$pageTitle = htmlspecialchars($problem['title']);

if ($user['role'] === 'teacher' || $user['role'] === 'admin') {
    include __DIR__ . '/../views/problem_view_teacher.php';
} else {
    include __DIR__ . '/../views/problem_view_student.php';
}
