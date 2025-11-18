<?php
/**
 * Main Entry Point
 * Step Detection LMS
 */

require_once __DIR__ . '/../config/config.php';

setCorsHeaders();

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];
$scriptName = dirname($_SERVER['SCRIPT_NAME']);
$path = str_replace($scriptName, '', $requestUri);
$path = trim(parse_url($path, PHP_URL_PATH), '/');

// Simple router
$routes = [
    // Problems
    'GET /api/v1/problems' => 'ProblemController@index',
    'GET /api/v1/problems/(\d+)' => 'ProblemController@show',
    'GET /api/v1/problem-types' => 'ProblemController@types',

    // Solutions
    'POST /api/v1/solutions/start' => 'SolutionController@start',
    'POST /api/v1/solutions/submit-step' => 'SolutionController@submitStep',
    'POST /api/v1/solutions/submit-final' => 'SolutionController@submitFinal',
    'POST /api/v1/solutions/hint' => 'SolutionController@viewHint',
    'GET /api/v1/solutions/(\d+)' => 'SolutionController@show',

    // Detection
    'GET /api/v1/detections/solution/(\d+)' => 'DetectionController@getBySolution',
    'GET /api/v1/detections/student/(\d+)' => 'DetectionController@getByStudent',
    'POST /api/v1/detections/analyze/(\d+)' => 'DetectionController@analyze',

    // Students (for teacher dashboard)
    'GET /api/v1/students' => 'StudentController@index',
    'GET /api/v1/students/(\d+)' => 'StudentController@show',
    'GET /api/v1/students/(\d+)/trust-profile' => 'StudentController@trustProfile',

    // Statistics
    'GET /api/v1/statistics/problem/(\d+)' => 'StatisticsController@problem',
    'GET /api/v1/statistics/overview' => 'StatisticsController@overview'
];

// Route matching
$matched = false;

foreach ($routes as $route => $handler) {
    list($routeMethod, $routePath) = explode(' ', $route, 2);

    if ($method !== $routeMethod) {
        continue;
    }

    $pattern = '#^' . $routePath . '$#';

    if (preg_match($pattern, $path, $matches)) {
        array_shift($matches); // Remove full match

        list($controller, $action) = explode('@', $handler);

        if (!class_exists($controller)) {
            sendError('Controller not found', 500);
        }

        $controllerInstance = new $controller();

        if (!method_exists($controllerInstance, $action)) {
            sendError('Action not found', 500);
        }

        call_user_func_array([$controllerInstance, $action], $matches);
        $matched = true;
        break;
    }
}

if (!$matched) {
    // Serve static pages for non-API routes
    if (empty($path) || $path === 'index.html') {
        require_once __DIR__ . '/student.html';
        exit;
    } elseif ($path === 'teacher' || $path === 'teacher.html') {
        require_once __DIR__ . '/teacher.html';
        exit;
    }

    sendError('Route not found', 404);
}
