<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Controllers\AuthController;
use App\Controllers\QuizController;
use App\Controllers\ConfidenceController;
use App\Controllers\StatsController;
use App\Middleware\AuthMiddleware;

// Health check
$app->get('/', function (Request $request, Response $response) {
    $data = [
        'app' => $_ENV['APP_NAME'] ?? 'Confidence Reasoning LMS',
        'version' => '1.0.0',
        'status' => 'running'
    ];
    $response->getBody()->write(json_encode($data));
    return $response->withHeader('Content-Type', 'application/json');
});

// ===================================
// Public Routes (No Auth Required)
// ===================================

// Authentication
$app->post('/api/auth/register', [AuthController::class, 'register']);
$app->post('/api/auth/login', [AuthController::class, 'login']);
$app->post('/api/auth/refresh', [AuthController::class, 'refresh']);

// ===================================
// Protected Routes (Auth Required)
// ===================================

$app->group('/api', function ($group) {

    // Auth
    $group->post('/auth/logout', [AuthController::class, 'logout']);
    $group->get('/auth/me', [AuthController::class, 'me']);

    // Quizzes
    $group->get('/quizzes', [QuizController::class, 'index']);
    $group->get('/quizzes/{id}', [QuizController::class, 'show']);
    $group->post('/quizzes', [QuizController::class, 'create']); // Teacher only
    $group->put('/quizzes/{id}', [QuizController::class, 'update']); // Teacher only
    $group->delete('/quizzes/{id}', [QuizController::class, 'delete']); // Teacher only

    // Quiz Attempts
    $group->post('/quizzes/{id}/start', [QuizController::class, 'startAttempt']);
    $group->post('/quizzes/{id}/submit', [QuizController::class, 'submitAttempt']);
    $group->get('/attempts/{id}', [QuizController::class, 'getAttempt']);
    $group->get('/my-attempts', [QuizController::class, 'myAttempts']);

    // Question Attempts
    $group->post('/question-attempts/{id}/answer', [QuizController::class, 'answerQuestion']);

    // Confidence Reasoning
    $group->post('/confidence', [ConfidenceController::class, 'save']);
    $group->get('/confidence/question/{questionAttemptId}', [ConfidenceController::class, 'get']);
    $group->get('/confidence/quiz/{quizId}/student/{studentId}', [ConfidenceController::class, 'getByQuiz']);

    // Statistics
    $group->get('/stats/student/{studentId}/quiz/{quizId}', [StatsController::class, 'getStudentQuizStats']);
    $group->get('/stats/quiz/{quizId}', [StatsController::class, 'getQuizStats']); // Teacher only
    $group->get('/stats/student/{studentId}', [StatsController::class, 'getStudentStats']); // Teacher only

})->add(AuthMiddleware::class);
