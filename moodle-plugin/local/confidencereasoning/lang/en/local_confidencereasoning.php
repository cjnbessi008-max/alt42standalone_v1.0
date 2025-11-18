<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

// Plugin name
$string['pluginname'] = 'Confidence Reasoning Tracker';

// Capabilities
$string['confidencereasoning:submit'] = 'Submit confidence level and reasoning';
$string['confidencereasoning:view'] = 'View student confidence and reasoning';
$string['confidencereasoning:viewstats'] = 'View confidence statistics';
$string['confidencereasoning:manage'] = 'Manage confidence reasoning settings';

// UI Labels
$string['confidencelevel'] = 'How confident are you in your answer?';
$string['confidencelevel_help'] = 'Rate your confidence level from 1 (very unsure) to 5 (very confident)';
$string['reasoning'] = 'Why are you confident/not confident?';
$string['reasoning_help'] = 'Briefly explain your reasoning for this answer';
$string['reasoningcategory'] = 'How did you arrive at this answer?';

// Confidence levels
$string['confidence_1'] = '1 - Very unsure';
$string['confidence_2'] = '2 - Unsure';
$string['confidence_3'] = '3 - Neutral';
$string['confidence_4'] = '4 - Confident';
$string['confidence_5'] = '5 - Very confident';

// Reasoning categories
$string['category_studied'] = 'I studied this';
$string['category_calculated'] = 'I calculated it';
$string['category_remembered'] = 'I remembered from class';
$string['category_guessed'] = 'I guessed';
$string['category_eliminated'] = 'I eliminated wrong answers';
$string['category_other'] = 'Other';

// Report/Stats
$string['viewreport'] = 'View Confidence Report';
$string['avgconfidence'] = 'Average Confidence';
$string['confidencestats'] = 'Confidence Statistics';
$string['correctwithhighconfidence'] = 'Correct with high confidence (≥4)';
$string['incorrectwithhighconfidence'] = 'Incorrect with high confidence (≥4)';
$string['calibration'] = 'Confidence Calibration';

// Errors
$string['error_savingdata'] = 'Error saving confidence data';
$string['error_invalidconfidence'] = 'Invalid confidence level';

// Privacy
$string['privacy:metadata:local_confidence_reasoning'] = 'Stores student confidence levels and reasoning for quiz attempts';
$string['privacy:metadata:local_confidence_reasoning:userid'] = 'The ID of the user';
$string['privacy:metadata:local_confidence_reasoning:questionattemptid'] = 'The question attempt ID';
$string['privacy:metadata:local_confidence_reasoning:quizid'] = 'The quiz ID';
$string['privacy:metadata:local_confidence_reasoning:questionid'] = 'The question ID';
$string['privacy:metadata:local_confidence_reasoning:confidencelevel'] = 'Student confidence level (1-5)';
$string['privacy:metadata:local_confidence_reasoning:reasoning'] = 'Student reasoning text';
$string['privacy:metadata:local_confidence_reasoning:reasoningcategory'] = 'Category of reasoning';
$string['privacy:metadata:local_confidence_reasoning:timecreated'] = 'Time when the record was created';
$string['privacy:metadata:local_confidence_reasoning:timemodified'] = 'Time when the record was last modified';

$string['privacy:metadata:local_confidence_stats'] = 'Stores aggregated confidence statistics per student and quiz';
$string['privacy:metadata:local_confidence_stats:userid'] = 'The ID of the user';
$string['privacy:metadata:local_confidence_stats:quizid'] = 'The quiz ID';
$string['privacy:metadata:local_confidence_stats:avgconfidence'] = 'Average confidence level';
$string['privacy:metadata:local_confidence_stats:totalattempts'] = 'Total number of attempts';
$string['privacy:metadata:local_confidence_stats:correctwithhighconfidence'] = 'Number of correct answers with high confidence';
$string['privacy:metadata:local_confidence_stats:incorrectwithhighconfidence'] = 'Number of incorrect answers with high confidence';
