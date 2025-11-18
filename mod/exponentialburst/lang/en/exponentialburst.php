<?php
// This file is part of Moodle - http://moodle.org/

/**
 * English language strings for mod_exponentialburst
 *
 * @package    mod_exponentialburst
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['modulename'] = 'Exponential Burst';
$string['modulenameplural'] = 'Exponential Bursts';
$string['modulename_help'] = 'The Exponential Burst activity enables students to visualize exponential growth through interactive firework animations. Students solve problems related to exponential functions and see their answers explode into visual bursts.';
$string['pluginname'] = 'Exponential Burst';
$string['pluginadministration'] = 'Exponential Burst administration';

// Settings
$string['exponentialburstname'] = 'Activity name';
$string['exponentialburstname_help'] = 'The name of this Exponential Burst activity';
$string['difficulty'] = 'Difficulty level';
$string['difficulty_help'] = 'Set the difficulty level from 1 (easiest) to 5 (hardest)';
$string['maxvalue'] = 'Maximum exponential value';
$string['maxvalue_help'] = 'The maximum value that the exponential function can reach';
$string['showgraph'] = 'Show graph';
$string['showgraph_help'] = 'Display the exponential function graph alongside the burst visualization';

// Capabilities
$string['exponentialburst:addinstance'] = 'Add a new Exponential Burst activity';
$string['exponentialburst:view'] = 'View Exponential Burst activity';
$string['exponentialburst:submit'] = 'Submit answers to Exponential Burst';
$string['exponentialburst:viewreports'] = 'View Exponential Burst reports';

// View page
$string['welcome'] = 'Welcome to Exponential Burst!';
$string['instructions'] = 'Solve the exponential problems and watch your answers burst into amazing fireworks!';
$string['startactivity'] = 'Start Activity';
$string['currentlevel'] = 'Current Level: {$a}';
$string['bestscore'] = 'Best Score: {$a}';
$string['totalbursts'] = 'Total Bursts: {$a}';

// Phone UI
$string['phonescreen'] = 'Smartphone View';
$string['loading'] = 'Loading...';
$string['submit'] = 'Submit Answer';
$string['nextproblem'] = 'Next Problem';
$string['correct'] = 'Correct! Watch the burst!';
$string['incorrect'] = 'Not quite. Try again!';

// Errors
$string['error:noquestions'] = 'No questions available. Please contact your teacher.';
$string['error:invalidanswer'] = 'Please enter a valid answer.';

// Privacy
$string['privacy:metadata:exponentialburst_attempts'] = 'Information about student attempts';
$string['privacy:metadata:exponentialburst_attempts:userid'] = 'The ID of the user';
$string['privacy:metadata:exponentialburst_attempts:answer'] = 'The answer submitted by the user';
$string['privacy:metadata:exponentialburst_attempts:iscorrect'] = 'Whether the answer was correct';
$string['privacy:metadata:exponentialburst_attempts:timecreated'] = 'The time when the attempt was made';
