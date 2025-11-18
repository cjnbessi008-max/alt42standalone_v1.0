<?php
/**
 * English strings for Area Recombination activity module
 *
 * @package    mod_arearecom
 * @copyright  2024 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['modulename'] = 'Area Recombination';
$string['modulenameplural'] = 'Area Recombinations';
$string['modulename_help'] = 'The Area Recombination activity allows students to explore the conservation of area by cutting and reassembling shapes.

Students can:

* Select shapes of varying difficulty levels
* Cut shapes into multiple pieces
* Move and rearrange the pieces
* Validate that the total area remains constant

This interactive tool helps students develop a deep understanding of geometric area conservation.';
$string['pluginadministration'] = 'Area Recombination administration';
$string['pluginname'] = 'Area Recombination';

// Form strings
$string['arearec_name'] = 'Activity name';
$string['settings'] = 'Activity settings';
$string['grade_settings'] = 'Grade settings';

// Settings
$string['difficulty_level'] = 'Difficulty level';
$string['difficulty_level_help'] = 'Select the difficulty level for shapes:<br>
- All: Students can choose any difficulty<br>
- Easy: Simple shapes (triangles, rectangles)<br>
- Medium: Moderate complexity (parallelograms, trapezoids)<br>
- Hard: Complex polygons';

$string['all_difficulties'] = 'All levels';
$string['difficulty_easy'] = 'Easy (Level 1)';
$string['difficulty_medium'] = 'Medium (Level 2)';
$string['difficulty_hard'] = 'Hard (Level 3)';

$string['max_attempts'] = 'Maximum attempts';
$string['max_attempts_help'] = 'Maximum number of attempts allowed per shape before scoring is affected.';

$string['enable_hints'] = 'Enable hints';
$string['enable_sound'] = 'Enable sound effects';

// Errors
$string['error_max_attempts'] = 'Maximum attempts must be at least 1';
$string['error_gradepass'] = 'Grade to pass must be between 0 and 100';

// Capabilities
$string['arearecom:addinstance'] = 'Add a new Area Recombination activity';
$string['arearecom:view'] = 'View Area Recombination activity';
$string['arearecom:submit'] = 'Submit Area Recombination attempts';

// Events
$string['eventcoursemoduleviewed'] = 'Course module viewed';
