<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

$string['modulename'] = 'Sampling Game';
$string['modulenameplural'] = 'Sampling Games';
$string['modulename_help'] = 'The Sampling Game module allows students to learn about statistical sampling methods through interactive gameplay.';
$string['pluginname'] = 'Sampling Game';
$string['pluginadministration'] = 'Sampling Game administration';

// Capabilities
$string['samplinggame:addinstance'] = 'Add a new Sampling Game';
$string['samplinggame:view'] = 'View Sampling Game';
$string['samplinggame:submit'] = 'Submit Sampling Game attempt';
$string['samplinggame:viewreports'] = 'View Sampling Game reports';

// Settings
$string['samplinggamename'] = 'Game name';
$string['samplinggamename_help'] = 'The name of this sampling game activity';
$string['populationsize'] = 'Population size';
$string['populationsize_help'] = 'The total number of items in the population';
$string['samplesize'] = 'Sample size';
$string['samplesize_help'] = 'The number of items students need to select';
$string['samplingmethod'] = 'Sampling method';
$string['samplingmethod_help'] = 'The statistical sampling method to teach';
$string['gamescenario'] = 'Game scenario';
$string['gamescenario_help'] = 'The visual theme for the game (students, balls, candies, etc.)';
$string['timelimit'] = 'Time limit';
$string['timelimit_help'] = 'Time limit in seconds (leave empty for no limit)';

// Sampling methods
$string['simple_random'] = 'Simple Random Sampling';
$string['systematic'] = 'Systematic Sampling';
$string['stratified'] = 'Stratified Sampling';
$string['cluster'] = 'Cluster Sampling';

// Game scenarios
$string['students'] = 'Students in classroom';
$string['balls'] = 'Colored balls';
$string['candies'] = 'Candy pieces';
$string['cards'] = 'Playing cards';

// Game interface
$string['startgame'] = 'Start Game';
$string['reset'] = 'Reset';
$string['submit'] = 'Submit Answer';
$string['yourattempts'] = 'Your Attempts';
$string['attemptnumber'] = 'Attempt';
$string['score'] = 'Score';
$string['timespent'] = 'Time Spent';
$string['date'] = 'Date';

// Instructions
$string['instructions_simple_random'] = 'Select {$a} items randomly from the population. Each item should have an equal chance of being selected.';
$string['instructions_systematic'] = 'Select every k-th item from the population in a systematic manner.';
$string['instructions_stratified'] = 'Divide the population into groups and select samples from each group proportionally.';
$string['instructions_cluster'] = 'Divide the population into clusters and randomly select entire clusters.';

// Feedback
$string['feedback_excellent'] = 'Excellent! You have demonstrated a strong understanding of sampling methods.';
$string['feedback_good'] = 'Good job! Your sampling technique was mostly correct.';
$string['feedback_needsimprovement'] = 'Your sampling needs improvement. Review the sampling method and try again.';
$string['feedback_tryagain'] = 'Please try again. Make sure you understand the sampling method before selecting items.';
$string['feedback_randomness'] = 'Remember: in random sampling, each item must have an equal probability of selection.';
$string['feedback_systematic'] = 'Remember: in systematic sampling, you must select items at regular intervals.';

// Timer
$string['timeleft'] = 'Time left: {$a}';
$string['timeup'] = 'Time is up!';

// Errors
$string['error_notenoughsamples'] = 'You need to select {$a} samples.';
$string['error_toomanysamples'] = 'You have selected too many samples. Maximum: {$a}';
$string['error_invalidselection'] = 'Invalid selection. Please try again.';

// Reports
$string['viewreport'] = 'View Report';
$string['studentattempts'] = 'Student Attempts';
$string['averagescore'] = 'Average Score';
$string['completionrate'] = 'Completion Rate';

// Additional strings
$string['settings'] = 'Game Settings';
$string['nosamplinggames'] = 'No sampling games in this course';
$string['attemptsaved'] = 'Attempt saved successfully';
$string['eventattemptsubmitted'] = 'Sampling game attempt submitted';

// Form validation errors
$string['error_samplesizetoobig'] = 'Sample size cannot be greater than population size';
$string['error_populationtoosmall'] = 'Population size must be at least 10';
$string['error_populationtoobig'] = 'Population size must not exceed 1000';
$string['error_timelimittoosmall'] = 'Time limit must be at least 30 seconds';
