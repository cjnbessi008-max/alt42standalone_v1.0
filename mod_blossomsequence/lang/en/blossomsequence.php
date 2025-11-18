<?php
/**
 * English strings for blossomsequence
 *
 * @package    mod_blossomsequence
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['modulename'] = 'Blossom Sequence';
$string['modulenameplural'] = 'Blossom Sequences';
$string['modulename_help'] = 'The Blossom Sequence module allows students to learn mathematical sequences through an interactive flower petal visualization displayed on a virtual smartphone screen.';
$string['pluginadministration'] = 'Blossom Sequence administration';
$string['pluginname'] = 'Blossom Sequence';

// Capabilities
$string['blossomsequence:addinstance'] = 'Add a new Blossom Sequence activity';
$string['blossomsequence:submit'] = 'Submit answers to Blossom Sequence';
$string['blossomsequence:view'] = 'View Blossom Sequence';
$string['blossomsequence:viewreports'] = 'View Blossom Sequence reports';

// Settings
$string['blossomsequencename'] = 'Activity name';
$string['sequencesettings'] = 'Sequence Settings';
$string['sequencetype'] = 'Sequence type';
$string['sequencetype_help'] = 'Choose the type of mathematical sequence to display in the blossom pattern.';
$string['petalcount'] = 'Number of petals';
$string['petalcount_help'] = 'The number of petals in the blossom, which corresponds to the number of sequence elements to display.';
$string['difficulty'] = 'Difficulty level';
$string['difficulty_help'] = 'Set the difficulty level from 1 (easiest) to 5 (hardest).';
$string['sequencedata'] = 'Custom sequence data';
$string['sequencedata_help'] = 'For custom sequences, enter a JSON array of numbers, e.g., [1, 3, 5, 7, 9, 11]';

// Sequence types
$string['fibonacci'] = 'Fibonacci Sequence';
$string['arithmetic'] = 'Arithmetic Sequence';
$string['geometric'] = 'Geometric Sequence';
$string['square'] = 'Square Numbers';
$string['prime'] = 'Prime Numbers';
$string['custom'] = 'Custom Sequence';

// Difficulty levels
$string['difficulty1'] = 'Very Easy';
$string['difficulty2'] = 'Easy';
$string['difficulty3'] = 'Medium';
$string['difficulty4'] = 'Hard';
$string['difficulty5'] = 'Very Hard';

// View page
$string['instructions'] = 'Instructions';
$string['instructiontext'] = 'Watch the sequence unfold like flower petals. Identify the pattern and predict the next number in the sequence.';
$string['youranswer'] = 'Your Answer:';
$string['enteranswer'] = 'Enter the next number';
$string['submit'] = 'Submit Answer';
$string['attempthistory'] = 'Attempt History';
$string['attempt'] = 'Attempt';
$string['score'] = 'Score';

// Feedback messages
$string['correct'] = 'Correct! Well done!';
$string['incorrect'] = 'Incorrect. Try again!';
$string['partialcredit'] = 'Partially correct. You\'re close!';

// Index page
$string['noblossomsequences'] = 'No Blossom Sequence activities have been added to this course yet.';
$string['page-mod-blossomsequence-x'] = 'Any Blossom Sequence module page';

// Completion
$string['completionsubmit'] = 'Student must submit an answer to complete this activity';

// Events
$string['eventcoursemodulesviewed'] = 'Course module viewed';
$string['eventinstancelistviewed'] = 'Instance list viewed';
$string['eventanswersubmitted'] = 'Answer submitted';

// Privacy
$string['privacy:metadata:blossomsequence_attempts'] = 'Information about the user\'s attempts at a Blossom Sequence activity';
$string['privacy:metadata:blossomsequence_attempts:userid'] = 'The ID of the user who made the attempt';
$string['privacy:metadata:blossomsequence_attempts:attempt'] = 'The attempt number';
$string['privacy:metadata:blossomsequence_attempts:useranswer'] = 'The answer submitted by the user';
$string['privacy:metadata:blossomsequence_attempts:score'] = 'The score for this attempt';
$string['privacy:metadata:blossomsequence_attempts:timecreated'] = 'The time when the attempt was created';
