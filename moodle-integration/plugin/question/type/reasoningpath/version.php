<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Version information for the Reasoning Path question type.
 *
 * @package    qtype_reasoningpath
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$plugin->component = 'qtype_reasoningpath';
$plugin->version   = 2025011800;
$plugin->requires  = 2017111300; // Moodle 3.4 minimum (compatible with 3.7)
$plugin->maturity  = MATURITY_BETA;
$plugin->release   = '1.0-beta';
$plugin->dependencies = array();
