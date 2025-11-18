<?php
/**
 * Main Entry Point
 */

session_start();

require_once __DIR__ . '/../src/config/config.php';
require_once __DIR__ . '/../src/autoload.php';

// Simple routing
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = trim($uri, '/');

// Route handling
switch ($uri) {
    case '':
    case 'index.php':
        require __DIR__ . '/../src/views/home.php';
        break;

    case 'lti/launch':
    case 'lti/launch.php':
        require __DIR__ . '/../src/controllers/lti_launch.php';
        break;

    case 'problems':
        require __DIR__ . '/../src/controllers/problem_list.php';
        break;

    case 'problem/create':
        require __DIR__ . '/../src/controllers/problem_create.php';
        break;

    case 'problem/view':
        require __DIR__ . '/../src/controllers/problem_view.php';
        break;

    case 'submission/create':
        require __DIR__ . '/../src/controllers/submission_create.php';
        break;

    case 'submission/submit':
        require __DIR__ . '/../src/controllers/submission_submit.php';
        break;

    case 'submission/view':
        require __DIR__ . '/../src/controllers/submission_view.php';
        break;

    case 'teacher/dashboard':
        require __DIR__ . '/../src/controllers/teacher_dashboard.php';
        break;

    case 'student/dashboard':
        require __DIR__ . '/../src/controllers/student_dashboard.php';
        break;

    case 'api/verify':
        require __DIR__ . '/../src/api/verify.php';
        break;

    case 'logout':
        session_destroy();
        header('Location: /');
        exit;

    default:
        http_response_code(404);
        echo "404 - Page Not Found";
        break;
}
