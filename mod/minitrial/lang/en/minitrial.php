<?php
// This file is part of Moodle - http://moodle.org/
//
// Mini Trial Game - English language strings
//
// @package    mod_minitrial
// @copyright  2025 KAIST Touch Math Academy
// @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later

defined('MOODLE_INTERNAL') || die();

// Plugin name
$string['modulename'] = 'Mini Trial Game';
$string['modulenameplural'] = 'Mini Trial Games';
$string['modulename_help'] = 'The Mini Trial Game activity allows students to conduct probability experiments through interactive simulations.

Students can:
* Roll dice
* Flip coins
* Draw cards
* Spin spinners

The activity tracks results and calculates statistics to help students understand probability concepts.';
$string['pluginname'] = 'Mini Trial Game';
$string['pluginadministration'] = 'Mini Trial Game administration';

// Capabilities
$string['minitrial:addinstance'] = 'Add a new Mini Trial Game';
$string['minitrial:view'] = 'View Mini Trial Game';
$string['minitrial:submit'] = 'Submit trial attempts';
$string['minitrial:viewreports'] = 'View reports';

// Settings
$string['minitrial:name'] = 'Activity name';
$string['intro'] = 'Description';
$string['gametype'] = 'Game type';
$string['gametype_help'] = 'Select the type of probability experiment';
$string['trialsrequired'] = 'Trials required';
$string['trialsrequired_help'] = 'Number of trials students must complete';

// Game types
$string['gametype_dice'] = 'Dice Roll';
$string['gametype_coin'] = 'Coin Flip';
$string['gametype_card'] = 'Card Draw';
$string['gametype_spinner'] = 'Spinner';

// View page
$string['startgame'] = 'Start Game';
$string['continuegame'] = 'Continue Game';
$string['runtrial'] = 'Run Trial';
$string['resettrial'] = 'Reset All Trials';
$string['progress'] = 'Progress';
$string['trialscompleted'] = 'Trials completed: {$a->completed} / {$a->required}';
$string['congratulations'] = 'Congratulations!';
$string['activitycompleted'] = 'You have completed all required trials.';

// Results
$string['result'] = 'Result';
$string['statistics'] = 'Statistics';
$string['frequency'] = 'Frequency';
$string['probability'] = 'Probability';
$string['theoretical'] = 'Theoretical';
$string['experimental'] = 'Experimental';

// Dice specific
$string['rollresult'] = 'You rolled: {$a}';
$string['diceside'] = 'Side {$a}';

// Coin specific
$string['flipresult'] = 'Result: {$a}';
$string['heads'] = 'Heads';
$string['tails'] = 'Tails';

// Card specific
$string['drawresult'] = 'You drew: {$a}';
$string['suit_hearts'] = 'Hearts';
$string['suit_diamonds'] = 'Diamonds';
$string['suit_clubs'] = 'Clubs';
$string['suit_spades'] = 'Spades';

// Errors
$string['error_nogametype'] = 'No game type selected';
$string['error_invalidtrial'] = 'Invalid trial data';
$string['nominitrialsincourse'] = 'No Mini Trial Games in this course';

// Page type
$string['page-mod-minitrial-x'] = 'Any Mini Trial Game page';

// Privacy
$string['privacy:metadata:minitrial_attempts'] = 'Information about trial attempts';
$string['privacy:metadata:minitrial_attempts:userid'] = 'User ID';
$string['privacy:metadata:minitrial_attempts:result'] = 'Trial result';
$string['privacy:metadata:minitrial_attempts:timecreated'] = 'Time when trial was created';
$string['privacy:metadata:minitrial_progress'] = 'Progress information';
$string['privacy:metadata:minitrial_progress:userid'] = 'User ID';
$string['privacy:metadata:minitrial_progress:grade'] = 'User grade';
$string['privacy:metadata:minitrial_progress:completed'] = 'Completion status';
