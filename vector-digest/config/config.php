<?php
/**
 * Vector Digest Configuration
 * Compatible with Moodle 3.7, PHP 7.1.9, MySQL 5.7
 */

defined('MOODLE_INTERNAL') || die();

// Database Configuration
define('VD_DB_HOST', 'localhost');
define('VD_DB_NAME', 'moodle');
define('VD_DB_USER', 'moodle_user');
define('VD_DB_PASS', 'moodle_password');
define('VD_DB_PREFIX', 'mdl_');

// Vector Digest Settings
define('VD_SUMMARY_LINES', 3);
define('VD_MAX_SUMMARY_LENGTH', 200); // characters per line
define('VD_CACHE_DURATION', 3600); // 1 hour in seconds

// AI/NLP Settings (optional - for enhanced summarization)
define('VD_USE_AI', false); // Set to true if using external AI API
define('VD_AI_API_KEY', ''); // API key for AI service

// Display Settings
define('VD_SMARTPHONE_WIDTH', 375); // iPhone X width
define('VD_SMARTPHONE_HEIGHT', 667); // iPhone X height
define('VD_POSITION_RIGHT', 20); // pixels from right
define('VD_POSITION_BOTTOM', 20); // pixels from bottom

// Moodle Integration
define('VD_MOODLE_VERSION', '3.7');
define('VD_SUPPORTED_QUESTION_TYPES', ['multichoice', 'shortanswer', 'essay', 'numerical', 'calculated']);

// Vector Keywords for Detection
$VECTOR_KEYWORDS = [
    'vector', 'vectors', 'magnitude', 'direction', 'component', 'components',
    'scalar', 'dot product', 'cross product', 'unit vector', 'displacement',
    'velocity', 'acceleration', 'force', 'resultant', 'parallelogram',
    'triangle law', 'polygon law', 'position vector', 'basis vector',
    'orthogonal', 'parallel', 'perpendicular', 'angle between vectors',
    '벡터', '크기', '방향', '성분', '스칼라', '내적', '외적', '단위벡터',
    '변위', '속도', '가속도', '힘', '합력', '평행사변형', '삼각형법칙'
];

return [
    'db' => [
        'host' => VD_DB_HOST,
        'name' => VD_DB_NAME,
        'user' => VD_DB_USER,
        'pass' => VD_DB_PASS,
        'prefix' => VD_DB_PREFIX
    ],
    'vector_keywords' => $VECTOR_KEYWORDS,
    'display' => [
        'width' => VD_SMARTPHONE_WIDTH,
        'height' => VD_SMARTPHONE_HEIGHT,
        'position_right' => VD_POSITION_RIGHT,
        'position_bottom' => VD_POSITION_BOTTOM
    ]
];
