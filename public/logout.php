<?php
/**
 * Logout Page
 */

require_once __DIR__ . '/../src/autoload.php';

use App\Core\Auth;

$auth = Auth::getInstance();
$auth->logout();

header('Location: /login.php');
exit;
