<?php
/**
 * Logout
 *
 * @package InvariantFinder
 */

define('APP_ACCESS', true);
require_once 'config.php';

logoutUser();
setFlash('success', 'You have been logged out successfully');
redirect('login.php');
