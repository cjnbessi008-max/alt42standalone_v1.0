<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * English strings for invariantfinder
 *
 * @package    mod_invariantfinder
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['modulename'] = 'Invariant Finder';
$string['modulenameplural'] = 'Invariant Finders';
$string['modulename_help'] = 'The Invariant Finder activity allows students to explore geometric shapes and discover properties that remain constant (invariant) when the shape is scaled or transformed.';
$string['invariantfinder:addinstance'] = 'Add a new Invariant Finder activity';
$string['invariantfinder:submit'] = 'Submit Invariant Finder answers';
$string['invariantfinder:view'] = 'View Invariant Finder';
$string['invariantfinder:viewreports'] = 'View Invariant Finder reports';

$string['invariantfindername'] = 'Activity name';
$string['invariantfindername_help'] = 'This is the content of the help tooltip associated with the activity name field.';

// Settings
$string['shapesettings'] = 'Shape Settings';
$string['shapetype'] = 'Shape type';
$string['shapetype_help'] = 'Select the type of geometric shape students will explore.';
$string['difficulty'] = 'Difficulty level';
$string['difficulty_help'] = 'Set the difficulty level from 1 (easiest) to 5 (hardest). Higher difficulty levels may hide some hints or require finding more invariants.';
$string['showhints'] = 'Show hints';
$string['showhints_help'] = 'Display helpful hints to guide students in discovering invariants.';

// Shape types
$string['triangle'] = 'Triangle';
$string['rectangle'] = 'Rectangle';
$string['circle'] = 'Circle';
$string['parallelogram'] = 'Parallelogram';

// Difficulty levels
$string['difficulty1'] = 'Level 1 - Beginner';
$string['difficulty2'] = 'Level 2 - Easy';
$string['difficulty3'] = 'Level 3 - Medium';
$string['difficulty4'] = 'Level 4 - Hard';
$string['difficulty5'] = 'Level 5 - Expert';

// View page
$string['instructions'] = 'Instructions';
$string['instructions_text'] = 'Use the slider to scale the shape up and down. Observe which measurements change and which stay the same. Properties that don\'t change are called <strong>invariants</strong>. Click "Check Invariant" when you think you\'ve found one!';
$string['controls'] = 'Controls';
$string['zoomin'] = 'Zoom In';
$string['zoomout'] = 'Zoom Out';
$string['reset'] = 'Reset';
$string['invariantsfound'] = 'Invariants Found';
$string['hints'] = 'Hints';
$string['appname'] = 'Invariant Finder';
$string['score'] = 'Score';
$string['scale'] = 'Scale';
$string['checkinvariant'] = 'Check Invariant';
$string['submit'] = 'Submit Answer';

// Messages
$string['noinstances'] = 'No Invariant Finder activities found in this course.';

// Page types
$string['page-mod-invariantfinder-x'] = 'Any Invariant Finder module page';

// Privacy
$string['privacy:metadata:invariantfinder_attempts'] = 'Information about the user\'s attempts at finding invariants';
$string['privacy:metadata:invariantfinder_attempts:userid'] = 'The ID of the user who made the attempt';
$string['privacy:metadata:invariantfinder_attempts:invariants_found'] = 'The invariants found by the user';
$string['privacy:metadata:invariantfinder_attempts:scale_actions'] = 'Number of times the user scaled the shape';
$string['privacy:metadata:invariantfinder_attempts:time_spent'] = 'Time spent on the activity in seconds';
$string['privacy:metadata:invariantfinder_attempts:score'] = 'The score achieved by the user';
$string['privacy:metadata:invariantfinder_attempts:timecreated'] = 'The time when the attempt was created';
$string['privacy:metadata:invariantfinder_attempts:timemodified'] = 'The time when the attempt was last modified';

$string['privacy:metadata:invariantfinder_interactions'] = 'Information about user interactions with the shape';
$string['privacy:metadata:invariantfinder_interactions:action_type'] = 'The type of action performed';
$string['privacy:metadata:invariantfinder_interactions:action_data'] = 'Data associated with the action';
$string['privacy:metadata:invariantfinder_interactions:timestamp'] = 'When the interaction occurred';

// Plugin name
$string['pluginname'] = 'Invariant Finder';
$string['pluginadministration'] = 'Invariant Finder administration';
