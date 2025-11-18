<?php
/**
 * Moodle 3.7 Configuration for Higher Derivative Lines Module
 */

defined('MOODLE_INTERNAL') || die();

// Moodle version requirements
$CFG->moodle_version = '2019052000';  // Moodle 3.7
$CFG->php_version = '7.1.9';

// Module configuration
$module_config = array(
    'module_name' => 'Higher Derivative Lines',
    'module_shortname' => 'derivative_lines',
    'version' => '2024011800',
    'requires' => '2019052000',  // Requires Moodle 3.7+
    'component' => 'mod_derivative_lines',
    'maturity' => MATURITY_STABLE,
    'release' => '1.0.0',
);

// API endpoints
$api_endpoints = array(
    'calculate' => '/api/derivatives',
    'graph' => '/api/graph',
    'styles' => '/api/styles',
    'moodle_question' => '/api/moodle/question',
    'examples' => '/api/examples',
);

// Default settings
$default_settings = array(
    'max_derivative_order' => 4,
    'default_domain_min' => -10,
    'default_domain_max' => 10,
    'num_points' => 500,
    'color_scheme' => 'professional',
    'enable_virtual_screen' => true,
    'virtual_screen_position' => 'bottom-right',
);

return array(
    'module' => $module_config,
    'endpoints' => $api_endpoints,
    'defaults' => $default_settings,
);
