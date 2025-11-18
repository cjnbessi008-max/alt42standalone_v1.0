<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Flow Moments - Version information
 *
 * This plugin automatically detects and extracts "flow moments" when students
 * are deeply engaged with complex problems in Moodle.
 *
 * @package    local_flowmoments
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$plugin->version   = 2025111800;        // YYYYMMDDXX format
$plugin->requires  = 2019052000;        // Moodle 3.7 minimum
$plugin->component = 'local_flowmoments';
$plugin->maturity  = MATURITY_BETA;
$plugin->release   = 'v1.0.0';
