<?php
/**
 * Answer Reason Tracking System - Main Entry Point
 */

// Error reporting for development
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Start session
session_start();

// Load configuration
$config = require __DIR__ . '/config/config.php';

// Set timezone
date_default_timezone_set($config['app']['timezone']);

// Get the requested route
$requestUri = $_SERVER['REQUEST_URI'];
$scriptName = $_SERVER['SCRIPT_NAME'];
$basePath = str_replace(basename($scriptName), '', $scriptName);
$route = str_replace($basePath, '', $requestUri);
$route = parse_url($route, PHP_URL_PATH);

// Route handling
if (strpos($route, 'api/') === 0) {
    // API routes
    require_once __DIR__ . '/src/controllers/ApiController.php';
    $controller = new ApiController();
    $apiRoute = str_replace('api/', '', $route);
    $controller->handleRequest($apiRoute);
    exit;
}

// Page routes
switch ($route) {
    case '':
    case '/':
    case '/index.php':
        // Landing page
        include __DIR__ . '/src/views/landing.php';
        break;

    case '/student':
    case '/student.php':
        // Student interface
        include __DIR__ . '/src/views/student.php';
        break;

    case '/teacher':
    case '/teacher.php':
        // Teacher dashboard
        include __DIR__ . '/src/views/teacher.php';
        break;

    case '/setup':
    case '/setup.php':
        // Setup wizard
        include __DIR__ . '/src/views/setup.php';
        break;

    default:
        // 404 Not Found
        http_response_code(404);
        echo '<!DOCTYPE html>
        <html lang="ko">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>404 - Page Not Found</title>
            <link rel="stylesheet" href="public/css/style.css">
        </head>
        <body>
            <div class="container" style="text-align: center; padding: 100px 20px;">
                <h1 style="font-size: 72px; color: #dc3545;">404</h1>
                <p style="font-size: 24px; color: #6c757d; margin: 20px 0;">Page Not Found</p>
                <a href="/" class="btn btn-primary">Go Home</a>
            </div>
        </body>
        </html>';
        break;
}
