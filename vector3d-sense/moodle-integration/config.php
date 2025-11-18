<?php
/**
 * Vector 3D Sense - Moodle Integration Configuration
 * Compatible with Moodle 3.7, PHP 7.1.9, MySQL 5.7
 *
 * @package    vector3d_sense
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

// Database configuration
$CFG->vector3d_dbhost = 'localhost';
$CFG->vector3d_dbname = 'vector3d_sense';
$CFG->vector3d_dbuser = 'vector3d_user';
$CFG->vector3d_dbpass = 'your_secure_password_here';
$CFG->vector3d_dbport = 3306;

// Application settings
$CFG->vector3d_enabled = true;
$CFG->vector3d_version = '1.0.0';

// Virtual smartphone display settings
$CFG->vector3d_display_position = 'bottom-right'; // bottom-right, bottom-left, top-right, top-left
$CFG->vector3d_display_width = 375; // pixels (iPhone X width)
$CFG->vector3d_display_height = 812; // pixels (iPhone X height)
$CFG->vector3d_display_scale = 0.5; // Scale factor for desktop display

// 3D visualization settings
$CFG->vector3d_max_vectors = 10; // Maximum vectors per problem
$CFG->vector3d_grid_size = 10;
$CFG->vector3d_animation_speed = 1.0; // 1.0 = normal speed

// Session settings
$CFG->vector3d_session_timeout = 3600; // 1 hour in seconds
$CFG->vector3d_max_attempts = 3; // Maximum attempts per problem

// API settings
$CFG->vector3d_api_base_url = '/local/vector3d_sense/api';
$CFG->vector3d_enable_cors = false;

// Debug mode
$CFG->vector3d_debug = false;
