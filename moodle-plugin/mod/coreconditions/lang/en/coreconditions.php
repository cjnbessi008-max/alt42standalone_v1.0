<?php
/**
 * English language strings for mod_coreconditions
 *
 * @package    mod_coreconditions
 * @copyright  2025 AI Education System
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

// Module name
$string['modulename'] = 'Core Conditions';
$string['modulenameplural'] = 'Core Conditions';
$string['modulename_help'] = 'The Core Conditions module allows teachers to create problems where exactly 3 core conditions must be selected and evaluated for each problem.';
$string['pluginname'] = 'Core Conditions';
$string['pluginadministration'] = 'Core Conditions administration';

// Capabilities
$string['coreconditions:addinstance'] = 'Add a new Core Conditions activity';
$string['coreconditions:view'] = 'View Core Conditions activity';
$string['coreconditions:submit'] = 'Submit answers to Core Conditions problems';
$string['coreconditions:manageconditions'] = 'Manage core conditions for problems';
$string['coreconditions:viewreports'] = 'View student reports';

// General
$string['name'] = 'Activity name';
$string['intro'] = 'Description';

// Problems
$string['problems'] = 'Problems';
$string['addproblem'] = 'Add new problem';
$string['editproblem'] = 'Edit problem';
$string['deleteproblem'] = 'Delete problem';
$string['problemname'] = 'Problem name';
$string['problemdescription'] = 'Problem description';
$string['problemtype'] = 'Problem type';
$string['difficultylevel'] = 'Difficulty level';
$string['correctanswer'] = 'Correct answer';
$string['noproblems'] = 'No problems have been created yet.';

// Core Conditions
$string['coreconditions'] = 'Core Conditions';
$string['condition'] = 'Condition {$a}';
$string['conditiontype'] = 'Condition type';
$string['conditionname'] = 'Condition name';
$string['conditiondescription'] = 'Condition description';
$string['conditionrule'] = 'Condition rule/logic';
$string['conditionweight'] = 'Weight (%)';
$string['selectconditions'] = 'Select 3 Core Conditions';
$string['mustselect3'] = 'You must select exactly 3 core conditions for each problem.';
$string['condition1'] = 'Core Condition 1';
$string['condition2'] = 'Core Condition 2';
$string['condition3'] = 'Core Condition 3';

// Condition types
$string['conditiontype_validation'] = 'Validation';
$string['conditiontype_calculation'] = 'Calculation';
$string['conditiontype_progression'] = 'Progression';
$string['conditiontype_feedback'] = 'Feedback';

// Problem types
$string['problemtype_fraction'] = 'Fraction';
$string['problemtype_algebra'] = 'Algebra';
$string['problemtype_geometry'] = 'Geometry';
$string['problemtype_arithmetic'] = 'Arithmetic';
$string['problemtype_other'] = 'Other';

// Student view
$string['submit'] = 'Submit answer';
$string['youranswer'] = 'Your answer';
$string['attempt'] = 'Attempt {$a}';
$string['score'] = 'Score';
$string['conditionsmet'] = 'Conditions met';
$string['timetaken'] = 'Time taken';

// Reports
$string['viewreport'] = 'View report';
$string['studentreport'] = 'Student report';
$string['allstudents'] = 'All students';
$string['attempts'] = 'Attempts';
$string['averagescore'] = 'Average score';
$string['completionrate'] = 'Completion rate';

// Errors
$string['error_noconditions'] = 'No conditions defined for this problem.';
$string['error_invalidproblem'] = 'Invalid problem ID.';
$string['error_cannotsubmit'] = 'You do not have permission to submit answers.';
$string['error_conditioncount'] = 'Each problem must have exactly 3 core conditions.';

// Success messages
$string['conditionssaved'] = 'Core conditions saved successfully.';
$string['problemsaved'] = 'Problem saved successfully.';
$string['answersaved'] = 'Answer submitted successfully.';
