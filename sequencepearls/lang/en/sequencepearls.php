<?php
// This file is part of Moodle - http://moodle.org/
//
// Language strings for Sequence Pearls activity module

defined('MOODLE_INTERNAL') || die();

$string['modulename'] = 'Sequence Pearls';
$string['modulenameplural'] = 'Sequence Pearls';
$string['modulename_help'] = 'Sequence Pearls is an interactive activity where students learn about number sequences. Each term in the sequence appears as a glowing pearl, creating a beautiful visual learning experience.';
$string['sequencepearls:addinstance'] = 'Add a new Sequence Pearls activity';
$string['sequencepearls:view'] = 'View Sequence Pearls activity';
$string['sequencepearls:submit'] = 'Submit answers to Sequence Pearls';
$string['pluginname'] = 'Sequence Pearls';
$string['pluginadministration'] = 'Sequence Pearls administration';

// Settings
$string['sequencepearls_name'] = 'Activity name';
$string['sequence_type'] = 'Sequence type';
$string['sequence_type_help'] = 'Choose the type of number sequence for this activity';
$string['arithmetic'] = 'Arithmetic sequence';
$string['geometric'] = 'Geometric sequence';
$string['fibonacci'] = 'Fibonacci sequence';
$string['custom'] = 'Custom sequence';
$string['difficulty'] = 'Difficulty level';
$string['difficulty_help'] = 'Set the difficulty level (1-5)';
$string['num_problems'] = 'Number of problems';
$string['num_problems_help'] = 'How many sequence problems should be generated?';

// View page
$string['welcome_message'] = 'Welcome to Sequence Pearls!';
$string['instructions'] = 'Find the missing number in the sequence. Each term is represented as a glowing pearl.';
$string['your_answer'] = 'Your answer';
$string['submit_answer'] = 'Submit';
$string['next_problem'] = 'Next Problem';
$string['correct'] = 'Correct! Well done!';
$string['incorrect'] = 'Incorrect. Try again!';
$string['progress'] = 'Progress';
$string['problems_solved'] = 'Problems solved: {$a->correct} / {$a->total}';
$string['accuracy'] = 'Accuracy: {$a}%';
$string['current_streak'] = 'Current streak: {$a}';
$string['best_streak'] = 'Best streak: {$a}';
$string['time_spent'] = 'Time spent: {$a}';

// Mobile view
$string['smartphone_view'] = 'Smartphone View';
$string['fullscreen'] = 'Fullscreen';
$string['exit_fullscreen'] = 'Exit Fullscreen';

// Error messages
$string['error_no_problems'] = 'No problems available. Please contact your teacher.';
$string['error_invalid_answer'] = 'Please enter a valid number.';
