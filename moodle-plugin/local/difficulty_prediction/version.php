<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Difficulty Prediction Plugin - Version information
 *
 * Automatically predicts reasoning difficulty levels for Moodle questions
 * based on multi-factor analysis and student performance data.
 *
 * @package    local_difficulty_prediction
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$plugin->version   = 2025111800;        // The current plugin version (Date: YYYYMMDDXX).
$plugin->requires  = 2019052000;        // Requires Moodle 3.7.
$plugin->component = 'local_difficulty_prediction'; // Full name of the plugin.
$plugin->maturity  = MATURITY_STABLE;
$plugin->release   = 'v1.0.0';

// Plugin dependencies (none for this plugin).
$plugin->dependencies = array();
