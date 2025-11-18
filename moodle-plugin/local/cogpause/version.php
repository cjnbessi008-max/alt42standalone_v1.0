<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Cognitive Pause Tracking Plugin for Moodle
 *
 * @package    local_cogpause
 * @copyright  2024 AI Education System
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$plugin->version   = 2024111800;        // Plugin version (YYYYMMDDXX)
$plugin->requires  = 2017051500;        // Requires Moodle 3.7+
$plugin->component = 'local_cogpause';  // Plugin component name
$plugin->maturity  = MATURITY_STABLE;
$plugin->release   = '1.0.0';

$plugin->dependencies = array();
