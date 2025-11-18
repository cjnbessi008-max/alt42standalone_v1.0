<?php
// This file is part of Moodle - http://moodle.org/

/**
 * English language strings for Multi-Perspective Practice module
 *
 * @package    mod_multiperspective
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

// Plugin name
$string['modulename'] = 'Multi-Perspective Practice';
$string['modulenameplural'] = 'Multi-Perspective Practices';
$string['modulename_help'] = 'The Multi-Perspective Practice activity allows students to explore and solve problems from different viewpoints, encouraging deeper understanding through multiple approaches.

Students can:
* View problems from multiple perspectives (visual, algebraic, geometric, real-world, etc.)
* Switch between different viewpoints to understand the problem better
* Submit answers after exploring various perspectives
* Track their progress and perspective exploration

Teachers can:
* Create rich problems with multiple perspectives
* Set requirements for minimum perspectives students must view
* Track which perspectives students find most helpful
* Analyze student learning patterns';

$string['pluginname'] = 'Multi-Perspective Practice';
$string['pluginadministration'] = 'Multi-Perspective Practice administration';

// Capabilities
$string['multiperspective:addinstance'] = 'Add a new Multi-Perspective Practice activity';
$string['multiperspective:view'] = 'View Multi-Perspective Practice';
$string['multiperspective:submit'] = 'Submit answers to Multi-Perspective Practice';
$string['multiperspective:viewreports'] = 'View Multi-Perspective Practice reports';
$string['multiperspective:manage'] = 'Manage Multi-Perspective Practice problems';
$string['multiperspective:viewallreports'] = 'View all student reports';

// Activity settings
$string['multiperspectivename'] = 'Activity name';
$string['multiperspectivename_help'] = 'Enter a descriptive name for this Multi-Perspective Practice activity';
$string['min_perspectives'] = 'Minimum perspectives required';
$string['min_perspectives_help'] = 'The minimum number of perspectives a student must view before submitting an answer';
$string['require_all_perspectives'] = 'Require all perspectives';
$string['require_all_perspectives_help'] = 'If enabled, students must view all available perspectives before submitting';
$string['allow_retry'] = 'Allow retry';
$string['allow_retry_help'] = 'Allow students to retry problems after incorrect submissions';
$string['max_attempts'] = 'Maximum attempts';
$string['max_attempts_help'] = 'Maximum number of attempts allowed per problem (0 = unlimited)';
$string['grade'] = 'Maximum grade';

// Problem management
$string['addproblem'] = 'Add problem';
$string['editproblem'] = 'Edit problem';
$string['deleteproblem'] = 'Delete problem';
$string['noproblems'] = 'No problems have been added yet';
$string['problem_title'] = 'Problem title';
$string['problem_description'] = 'Problem statement';
$string['problem_type'] = 'Problem type';
$string['problem_type_open'] = 'Open-ended';
$string['problem_type_multiple_choice'] = 'Multiple choice';
$string['problem_type_numeric'] = 'Numeric answer';
$string['correct_answer'] = 'Correct answer';
$string['difficulty_level'] = 'Difficulty level';
$string['difficulty_1'] = 'Very Easy';
$string['difficulty_2'] = 'Easy';
$string['difficulty_3'] = 'Medium';
$string['difficulty_4'] = 'Hard';
$string['difficulty_5'] = 'Very Hard';

// Perspective management
$string['addperspective'] = 'Add perspective';
$string['editperspective'] = 'Edit perspective';
$string['deleteperspective'] = 'Delete perspective';
$string['noperspectives'] = 'No perspectives have been added yet';
$string['perspective_name'] = 'Perspective name';
$string['perspective_type'] = 'Perspective type';
$string['perspective_type_visual'] = 'Visual/Graphical';
$string['perspective_type_algebraic'] = 'Algebraic/Symbolic';
$string['perspective_type_geometric'] = 'Geometric';
$string['perspective_type_real_world'] = 'Real-world Application';
$string['perspective_type_conceptual'] = 'Conceptual Understanding';
$string['perspective_type_numerical'] = 'Numerical/Computational';
$string['perspective_content'] = 'Perspective content';
$string['perspective_hints'] = 'Hints for this perspective';
$string['media_url'] = 'Media URL (image/video)';

// Student view
$string['viewproblem'] = 'View problem';
$string['perspectives'] = 'Perspectives';
$string['switchperspective'] = 'Switch perspective';
$string['currentperspective'] = 'Current perspective';
$string['perspectivesviewed'] = 'Perspectives viewed: {$a->viewed} / {$a->total}';
$string['minperspectiveswarning'] = 'You must view at least {$a} perspective(s) before submitting';
$string['allperspectiveswarning'] = 'You must view all perspectives before submitting';
$string['submitanswer'] = 'Submit answer';
$string['youranswer'] = 'Your answer';
$string['attempt'] = 'Attempt';
$string['attemptnumber'] = 'Attempt {$a}';
$string['attempts_remaining'] = 'Attempts remaining: {$a}';
$string['no_attempts_remaining'] = 'No attempts remaining';
$string['previousattempts'] = 'Previous attempts';

// Feedback
$string['correct'] = 'Correct!';
$string['incorrect'] = 'Incorrect';
$string['partiallycorrect'] = 'Partially correct';
$string['score'] = 'Score';
$string['feedback'] = 'Feedback';
$string['timespent'] = 'Time spent';
$string['minutes'] = 'minutes';
$string['seconds'] = 'seconds';

// Reports
$string['reports'] = 'Reports';
$string['studentprogress'] = 'Student progress';
$string['perspectiveanalytics'] = 'Perspective analytics';
$string['mostviewedperspective'] = 'Most viewed perspective';
$string['leastviewedperspective'] = 'Least viewed perspective';
$string['averagetime'] = 'Average time spent';
$string['successrate'] = 'Success rate';
$string['viewdetails'] = 'View details';
$string['export'] = 'Export data';

// Privacy
$string['privacy:metadata:multiperspective_attempts'] = 'Information about user attempts on problems';
$string['privacy:metadata:multiperspective_attempts:userid'] = 'The ID of the user who made the attempt';
$string['privacy:metadata:multiperspective_attempts:answer'] = 'The answer submitted by the user';
$string['privacy:metadata:multiperspective_attempts:is_correct'] = 'Whether the answer was correct';
$string['privacy:metadata:multiperspective_attempts:score'] = 'The score achieved';
$string['privacy:metadata:multiperspective_attempts:perspectives_viewed'] = 'Which perspectives the user viewed';
$string['privacy:metadata:multiperspective_attempts:time_spent'] = 'Time spent on the problem';
$string['privacy:metadata:multiperspective_attempts:timecreated'] = 'When the attempt was made';
$string['privacy:metadata:multiperspective_views'] = 'Information about user views of perspectives';
$string['privacy:metadata:multiperspective_views:userid'] = 'The ID of the user who viewed the perspective';
$string['privacy:metadata:multiperspective_views:view_count'] = 'Number of times viewed';
$string['privacy:metadata:multiperspective_views:time_spent'] = 'Time spent viewing this perspective';
$string['privacy:metadata:multiperspective_views:first_viewed'] = 'When first viewed';
$string['privacy:metadata:multiperspective_views:last_viewed'] = 'When last viewed';

// Errors
$string['error_noproblem'] = 'Problem not found';
$string['error_noperspective'] = 'Perspective not found';
$string['error_invalidanswer'] = 'Invalid answer format';
$string['error_maxattempts'] = 'Maximum attempts reached';
$string['error_minperspectives'] = 'You must view at least {$a} perspective(s) before submitting';
$string['error_allperspectives'] = 'You must view all perspectives before submitting';
$string['confirmdelete'] = 'Are you sure you want to delete this?';

// Additional strings
$string['manage'] = 'Manage problems';
$string['problems'] = 'Problems';
$string['save'] = 'Save';
$string['cancel'] = 'Cancel';
$string['back'] = 'Back to problem list';
$string['changessaved'] = 'Changes saved successfully';
$string['problemdeleted'] = 'Problem deleted successfully';
$string['perspectivedeleted'] = 'Perspective deleted successfully';
$string['manualgrading'] = 'This answer requires manual grading';
$string['unknowntype'] = 'Unknown problem type';
$string['invalidproblem'] = 'Invalid problem';
$string['invalidperspective'] = 'Invalid perspective';
$string['noattempts'] = 'No attempts yet';
$string['attempts'] = 'Attempts';
$string['hints'] = 'Hints';
$string['viewmedia'] = 'View media';
$string['unlimited'] = 'Unlimited';

// Events
$string['eventanswersubmitted'] = 'Answer submitted';
$string['eventcoursemoduleviewed'] = 'Course module viewed';
