<?php
/**
 * Main Entry Point
 * Redirects to appropriate dashboard based on authentication status
 */

require_once __DIR__ . '/../src/autoload.php';

use App\Core\Auth;

$auth = Auth::getInstance();

if ($auth->check()) {
    if ($auth->isTeacher()) {
        header('Location: /admin/');
    } else {
        header('Location: /student/');
    }
} else {
    header('Location: /login.php');
}
exit;
