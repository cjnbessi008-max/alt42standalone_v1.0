<?php
/**
 * English language strings for Breathing Curve plugin
 *
 * @package    local_breathing_curve
 * @copyright  2024 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

// Plugin name
$string['pluginname'] = 'Breathing Curve';

// Capabilities
$string['breathing_curve:view'] = 'View Breathing Curve animations';
$string['breathing_curve:manage'] = 'Manage Breathing Curve problems';
$string['breathing_curve:configure'] = 'Configure Breathing Curve settings';

// General strings
$string['title'] = 'Breathing Curve - Animated Function Graphs';
$string['description'] = 'Interactive visualization of function increase/decrease with breathing animation';
$string['loadingproblem'] = 'Loading problem from Moodle...';
$string['noproblem'] = 'No problem found with ID: {$a}';
$string['error'] = 'Error: {$a}';

// Function types
$string['quadratic'] = 'Quadratic Function';
$string['sine'] = 'Trigonometric Function';
$string['cubic'] = 'Cubic Function';

// UI elements
$string['currentfunction'] = 'Current Animation:';
$string['breathingeffect'] = 'Breathing Effect:';
$string['breathingdescription'] = 'Increasing sections expand in blue, decreasing sections contract in red';
$string['changefunction'] = 'Change Function';

// Settings
$string['settings'] = 'Breathing Curve Settings';
$string['animationspeed'] = 'Animation Speed';
$string['animationspeed_desc'] = 'Speed multiplier for breathing animation (0.5 = slow, 1.0 = normal, 2.0 = fast)';
$string['showhints'] = 'Show Hints';
$string['showhints_desc'] = 'Display hints to students';
$string['showcriticalpoints'] = 'Show Critical Points';
$string['showcriticalpoints_desc'] = 'Highlight maximum and minimum points on the graph';
$string['defaultfunction'] = 'Default Function Type';
$string['defaultfunction_desc'] = 'The function type to display when first loaded';

// Privacy
$string['privacy:metadata:breathing_curve_logs'] = 'Logs of user interactions with Breathing Curve';
$string['privacy:metadata:breathing_curve_logs:userid'] = 'The ID of the user';
$string['privacy:metadata:breathing_curve_logs:questionid'] = 'The ID of the question viewed';
$string['privacy:metadata:breathing_curve_logs:action'] = 'The action performed';
$string['privacy:metadata:breathing_curve_logs:timestamp'] = 'The time when the action occurred';

$string['privacy:metadata:breathing_curve_progress'] = 'Student progress on Breathing Curve problems';
$string['privacy:metadata:breathing_curve_progress:userid'] = 'The ID of the user';
$string['privacy:metadata:breathing_curve_progress:questionid'] = 'The ID of the question';
$string['privacy:metadata:breathing_curve_progress:attempts'] = 'Number of attempts';
$string['privacy:metadata:breathing_curve_progress:completed'] = 'Whether the problem was completed';
$string['privacy:metadata:breathing_curve_progress:time_spent'] = 'Total time spent on the problem';
