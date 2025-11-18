<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Jump Reasoning Detection Plugin
 *
 * 점프 추론(중간 건너뛰기) 습관 자동 감지 플러그인
 *
 * @package    local_jumpdetect
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$plugin->component = 'local_jumpdetect';
$plugin->version = 2025111800;  // YYYYMMDDXX
$plugin->requires = 2017111300; // Moodle 3.4+
$plugin->maturity = MATURITY_BETA;
$plugin->release = 'v1.0-beta';
