<?php
/**
 * English strings for Symmetry Discovery module
 *
 * @package    mod_symmetry
 * @copyright  2025 Symmetry Discovery
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

// Module name
$string['modulename'] = 'Symmetry Discovery';
$string['modulenameplural'] = 'Symmetry Discoveries';
$string['modulename_help'] = 'The Symmetry Discovery module allows students to explore geometric symmetry through interactive shape rotation. Students rotate shapes on a virtual smartphone interface to discover hidden symmetry lines that light up when found.';
$string['pluginname'] = 'Symmetry Discovery';
$string['pluginadministration'] = 'Symmetry Discovery administration';

// Capabilities
$string['symmetry:addinstance'] = 'Add a new Symmetry Discovery activity';
$string['symmetry:view'] = 'View Symmetry Discovery activity';
$string['symmetry:submit'] = 'Submit scores to Symmetry Discovery';

// Settings
$string['symmetryname'] = 'Activity name';
$string['symmetryname_help'] = 'The name of this Symmetry Discovery activity';
$string['symmetrysettings'] = 'Settings';

// Activity
$string['instructions'] = 'How to Play';
$string['instructions_text'] = '1. Touch and drag the shape on the smartphone screen to rotate it
2. When you align the shape with a symmetry line, it will light up!
3. Find all symmetry lines to complete the level
4. Progress through different shapes and earn points';

// Feedback
$string['congratulations'] = 'Congratulations!';
$string['symmetryfound'] = 'Symmetry line discovered!';
$string['allsymmetriesfound'] = 'All symmetries found! Moving to next shape...';
$string['score'] = 'Score';
$string['highscore'] = 'High Score';
$string['level'] = 'Level';

// Errors
$string['error_loading'] = 'Error loading Symmetry Discovery application';
$string['no_permission'] = 'You do not have permission to view this activity';

// Events
$string['eventcourse_module_viewed'] = 'Symmetry Discovery activity viewed';
$string['eventsymmetryfound'] = 'Symmetry line discovered';
$string['eventshapecompleted'] = 'Shape completed';

// Privacy
$string['privacy:metadata:symmetry_discovery'] = 'Stores user progress and scores for the Symmetry Discovery activity';
$string['privacy:metadata:symmetry_discovery:userid'] = 'The ID of the user';
$string['privacy:metadata:symmetry_discovery:score'] = 'The user\'s score';
$string['privacy:metadata:symmetry_discovery:highscore'] = 'The user\'s highest score';
$string['privacy:metadata:symmetry_discovery:level'] = 'The user\'s current level';
$string['privacy:metadata:symmetry_discovery:timecreated'] = 'When the record was created';
$string['privacy:metadata:symmetry_discovery:timemodified'] = 'When the record was last modified';
