<?php
/**
 * Concept Detection Plugin for Moodle 3.7
 *
 * Automatically detects concepts that students did not fully understand
 * by analyzing their behavior patterns and assessment results.
 *
 * @package    local_conceptdetection
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$plugin->version   = 2025111800;        // YYYYMMDDXX format
$plugin->requires  = 2019052000;        // Moodle 3.7
$plugin->component = 'local_conceptdetection';
$plugin->maturity  = MATURITY_BETA;
$plugin->release   = 'v1.0.0';
