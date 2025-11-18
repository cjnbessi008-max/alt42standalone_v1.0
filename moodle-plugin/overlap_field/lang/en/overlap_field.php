<?php
/**
 * English strings for Overlap Field module
 *
 * @package    mod_overlap_field
 * @copyright  2025 KAIST
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['modulename'] = 'Overlap Field';
$string['modulenameplural'] = 'Overlap Fields';
$string['modulename_help'] = 'The Overlap Field activity allows students to visualize and interact with systems of inequalities, displaying their intersections with smooth color gradients.';
$string['pluginname'] = 'Overlap Field';
$string['pluginadministration'] = 'Overlap Field administration';

// Activity settings
$string['overlap_fieldname'] = 'Activity name';
$string['overlap_fieldname_help'] = 'The name of this Overlap Field activity';
$string['inequalities'] = 'Inequalities';
$string['inequalities_help'] = 'Enter the system of inequalities (one per line), e.g., y > 2x + 1';
$string['visualization_config'] = 'Visualization configuration';

// View page
$string['view_instructions'] = 'Interact with the virtual smartphone below to explore the overlap field visualization.';
$string['smartphone_view'] = 'Virtual Smartphone View';
$string['no_inequalities'] = 'No inequalities have been defined for this activity.';

// Capabilities
$string['overlap_field:addinstance'] = 'Add a new Overlap Field activity';
$string['overlap_field:view'] = 'View Overlap Field activity';
$string['overlap_field:submit'] = 'Submit answers to Overlap Field activity';
$string['overlap_field:viewattempts'] = 'View student attempts';

// Errors
$string['error_invalid_inequality'] = 'Invalid inequality format: {$a}';
$string['error_no_data'] = 'No problem data available';
