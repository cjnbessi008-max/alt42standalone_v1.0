<?php
/**
 * Application Entry Point
 *
 * @package AlternativeSolutions
 * @version 1.0
 */

// Start session
session_start();

// Load configuration
require_once __DIR__ . '/../src/config/config.php';
require_once __DIR__ . '/../src/config/database.php';

// Load utilities
require_once SRC_PATH . '/utils/Router.php';
require_once SRC_PATH . '/utils/View.php';

// Load models
require_once SRC_PATH . '/models/User.php';

// Load middleware
require_once SRC_PATH . '/middleware/AuthMiddleware.php';

// Load controllers
require_once SRC_PATH . '/controllers/AuthController.php';

// Initialize router
$router = new Router();

// Public routes
$router->get('/', function() {
    if (isset($_SESSION['logged_in']) && $_SESSION['logged_in']) {
        Router::redirect('/dashboard');
    } else {
        Router::redirect('/login');
    }
});

$router->get('/login', 'AuthController@showLogin');
$router->post('/login', 'AuthController@login');
$router->get('/register', 'AuthController@showRegister');
$router->post('/register', 'AuthController@register');
$router->get('/logout', 'AuthController@logout');

// Protected routes (require authentication)
$router->get('/dashboard', function() {
    AuthController::requireAuth();

    $currentUser = AuthController::getCurrentUser();

    View::render('dashboard/index', [
        'title' => '대시보드',
        'user' => $currentUser
    ]);
}, ['AuthMiddleware']);

// Teacher routes
$router->get('/activities/create', function() {
    AuthController::requireTeacher();

    View::render('activities/create', [
        'title' => '새 활동 만들기'
    ]);
}, ['AuthMiddleware', 'TeacherMiddleware']);

$router->get('/activities/:id/manage', function($id) {
    AuthController::requireTeacher();

    View::render('activities/manage', [
        'title' => '활동 관리',
        'activity_id' => $id
    ]);
}, ['AuthMiddleware', 'TeacherMiddleware']);

// Student routes
$router->get('/activities', function() {
    AuthController::requireAuth();

    View::render('activities/index', [
        'title' => '활동 목록'
    ]);
}, ['AuthMiddleware']);

$router->get('/activities/:id', function($id) {
    AuthController::requireAuth();

    View::render('activities/view', [
        'title' => '활동 상세',
        'activity_id' => $id
    ]);
}, ['AuthMiddleware']);

$router->get('/activities/:id/solve/:step', function($id, $step) {
    AuthController::requireAuth();

    View::render('activities/solve', [
        'title' => '문제 풀이',
        'activity_id' => $id,
        'step_number' => $step
    ]);
}, ['AuthMiddleware']);

$router->get('/activities/:id/reflection', function($id) {
    AuthController::requireAuth();

    View::render('activities/reflection', [
        'title' => '성찰',
        'activity_id' => $id
    ]);
}, ['AuthMiddleware']);

$router->get('/activities/:id/summary', function($id) {
    AuthController::requireAuth();

    View::render('activities/summary', [
        'title' => '완료 요약',
        'activity_id' => $id
    ]);
}, ['AuthMiddleware']);

// Dispatch the request
$router->dispatch();
