<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Multi-Perspective Practice Module
 *
 * Provides students with the ability to view and solve problems from multiple perspectives,
 * encouraging deeper understanding through different viewpoints and approaches.
 *
 * @package    mod_multiperspective
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$plugin->version   = 2025111800;        // The current module version (Date: YYYYMMDDXX)
$plugin->requires  = 2019052000;        // Requires Moodle 3.7
$plugin->component = 'mod_multiperspective'; // Full name of the plugin
$plugin->maturity  = MATURITY_STABLE;
$plugin->release   = 'v1.0';
