<?php
/**
 * Problem Create Controller
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

$problemModel = new Problem();
$errors = [];
$success = false;

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Validate input
    $title = trim($_POST['title'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $problemStatement = trim($_POST['problem_statement'] ?? '');
    $correctAnswer = trim($_POST['correct_answer'] ?? '');

    if (empty($title)) {
        $errors[] = 'Title is required';
    }
    if (empty($problemStatement)) {
        $errors[] = 'Problem statement is required';
    }
    if (empty($correctAnswer)) {
        $errors[] = 'Correct answer is required';
    }

    if (empty($errors)) {
        try {
            $problemId = $problemModel->create([
                'teacher_id' => $user['id'],
                'title' => $title,
                'description' => $description,
                'problem_statement' => $problemStatement,
                'correct_answer' => $correctAnswer,
                'problem_type' => $_POST['problem_type'] ?? 'arithmetic',
                'difficulty_level' => intval($_POST['difficulty_level'] ?? 1),
                'points' => floatval($_POST['points'] ?? 10),
                'hints' => $_POST['hints'] ?? null,
                'requires_work_shown' => isset($_POST['requires_work_shown']) ? 1 : 0,
                'requires_verification' => isset($_POST['requires_verification']) ? 1 : 0,
                'time_limit_minutes' => !empty($_POST['time_limit_minutes']) ? intval($_POST['time_limit_minutes']) : null,
                'active' => isset($_POST['active']) ? 1 : 0
            ]);

            Logger::info('Problem created', ['problem_id' => $problemId, 'teacher_id' => $user['id']]);

            $success = true;
            $_SESSION['flash_message'] = 'Problem created successfully!';
            header('Location: /teacher/dashboard');
            exit;

        } catch (Exception $e) {
            Logger::error('Problem creation failed: ' . $e->getMessage());
            $errors[] = 'Failed to create problem. Please try again.';
        }
    }
}

// Load view
$pageTitle = 'Create Problem';
include __DIR__ . '/../views/problem_create.php';
