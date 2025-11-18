<?php
// Moodle LTI Tool Configuration for Probability Grid
// Compatible with Moodle 3.7 and PHP 7.1.9

defined('MOODLE_INTERNAL') || die();

// Database configuration
$CFG_DB = new stdClass();
$CFG_DB->host = getenv('DB_HOST') ?: 'localhost';
$CFG_DB->dbname = getenv('DB_NAME') ?: 'probability_grid';
$CFG_DB->username = getenv('DB_USER') ?: 'root';
$CFG_DB->password = getenv('DB_PASS') ?: '';
$CFG_DB->port = getenv('DB_PORT') ?: '3306';

// LTI Configuration
$CFG_LTI = new stdClass();
$CFG_LTI->consumer_key = getenv('LTI_CONSUMER_KEY') ?: 'moodle_probability_grid';
$CFG_LTI->shared_secret = getenv('LTI_SHARED_SECRET') ?: 'change_this_secret_key';
$CFG_LTI->tool_url = getenv('TOOL_URL') ?: 'http://localhost/probability-grid-app/public/index.php';

// App Configuration
$CFG_APP = new stdClass();
$CFG_APP->base_url = getenv('APP_BASE_URL') ?: 'http://localhost/probability-grid-app';
$CFG_APP->debug_mode = getenv('DEBUG_MODE') === 'true';
$CFG_APP->session_lifetime = 3600; // 1 hour

// CORS settings for Moodle integration
$CFG_CORS = new stdClass();
$CFG_CORS->allowed_origins = explode(',', getenv('CORS_ORIGINS') ?: 'http://localhost');
$CFG_CORS->allowed_methods = ['GET', 'POST', 'OPTIONS'];
$CFG_CORS->allowed_headers = ['Content-Type', 'Authorization'];

return [
    'database' => $CFG_DB,
    'lti' => $CFG_LTI,
    'app' => $CFG_APP,
    'cors' => $CFG_CORS
];
