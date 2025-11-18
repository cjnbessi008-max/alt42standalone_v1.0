<?php
// This file is part of Moodle - http://moodle.org/

/**
 * English strings for dualdance
 *
 * @package    mod_dualdance
 * @copyright  2025 AI Education System
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['modulename'] = 'Dual Dance';
$string['modulenameplural'] = 'Dual Dances';
$string['modulename_help'] = 'An interactive visualization of exponential and logarithmic functions that "dance" together, helping students understand the relationship between these two function types.';
$string['dualdance:addinstance'] = 'Add a new Dual Dance activity';
$string['dualdance:submit'] = 'Submit answers to Dual Dance problems';
$string['dualdance:view'] = 'View Dual Dance';
$string['dualdance:viewreports'] = 'View Dual Dance reports';
$string['pluginadministration'] = 'Dual Dance administration';
$string['pluginname'] = 'Dual Dance';

// Settings
$string['dualdancename'] = 'Activity name';
$string['dualdancesettings'] = 'Dual Dance Settings';
$string['difficulty'] = 'Difficulty level';
$string['difficulty_help'] = 'Sets the complexity of generated problems (1 = easiest, 5 = hardest)';
$string['difficulty_1'] = 'Very Easy';
$string['difficulty_2'] = 'Easy';
$string['difficulty_3'] = 'Medium';
$string['difficulty_4'] = 'Hard';
$string['difficulty_5'] = 'Very Hard';

$string['exp_base_min'] = 'Exponential base minimum';
$string['exp_base_max'] = 'Exponential base maximum';
$string['log_base_min'] = 'Logarithm base minimum';
$string['log_base_max'] = 'Logarithm base maximum';

$string['animation_speed'] = 'Animation speed';
$string['animation_speed_help'] = 'Controls how fast the functions animate on screen';
$string['speed_very_slow'] = 'Very Slow';
$string['speed_slow'] = 'Slow';
$string['speed_normal'] = 'Normal';
$string['speed_fast'] = 'Fast';
$string['speed_very_fast'] = 'Very Fast';

$string['completionattempts'] = 'Student must make this many attempts:';

// Validation errors
$string['error_base_range'] = 'Maximum must be greater than minimum';
$string['error_base_greater_than_one'] = 'Base must be greater than 1';

// View page
$string['dual_dance'] = 'Dual Dance';
$string['exponential_log_functions'] = 'Exponential & Logarithmic Functions';
$string['your_progress'] = 'Your Progress';
$string['current_grade'] = 'Current Grade';
$string['attempts'] = 'Attempts';
$string['correct'] = 'Correct';
$string['time'] = 'Time';
$string['start'] = 'Start Problem';
$string['submit'] = 'Submit Answer';
$string['next_problem'] = 'Next Problem';
$string['enter_answer'] = 'Enter your answer';
$string['click_start'] = 'Click "Start Problem" to begin';
$string['loading'] = 'Loading...';

// Questions
$string['question_exponential'] = 'Calculate: {$a->coeff} × {$a->base}^{$a->x}';
$string['question_logarithmic'] = 'Calculate: {$a->coeff} × log<sub>{$a->base}</sub>({$a->value})';
$string['question_intersection'] = 'At what x value do these functions intersect?<br>f(x) = {$a->exp_coeff} × {$a->exp_base}^x<br>g(x) = {$a->log_coeff} × log<sub>{$a->log_base}</sub>(x)';

// Feedback
$string['correct'] = 'Correct!';
$string['incorrect'] = 'Incorrect';
$string['correct_answer'] = 'The correct answer was: {$a}';
$string['try_again'] = 'Try again!';

// Instructions
$string['instructions'] = 'How to use';
$string['instruction_1'] = 'Watch the exponential (red) and logarithmic (blue) functions dance on the graph';
$string['instruction_2'] = 'Solve the problem displayed and enter your answer';
$string['instruction_3'] = 'Submit your answer to get instant feedback and see your progress';

$string['no$dualdanceinstances'] = 'No Dual Dance activities found in this course';
