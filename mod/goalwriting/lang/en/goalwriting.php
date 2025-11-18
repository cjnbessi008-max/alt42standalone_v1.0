<?php
// This file is part of Moodle - http://moodle.org/

/**
 * English language strings for mod_goalwriting
 *
 * @package    mod_goalwriting
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['modulename'] = 'Goal Writing';
$string['modulenameplural'] = 'Goal Writings';
$string['modulename_help'] = 'The Goal Writing activity enables students to write their learning objectives in their own words, helping them understand and articulate what they aim to achieve.';
$string['pluginname'] = 'Goal Writing';
$string['pluginadministration'] = 'Goal Writing administration';

// Settings
$string['goalwriting:addinstance'] = 'Add a new Goal Writing activity';
$string['goalwriting:view'] = 'View Goal Writing activity';
$string['goalwriting:submit'] = 'Submit goal writing';
$string['goalwriting:grade'] = 'Grade goal writing submissions';
$string['goalwriting:viewallsubmissions'] = 'View all submissions';

// Form fields
$string['goalwritingname'] = 'Activity name';
$string['goalwritingname_help'] = 'Name of this goal writing activity';
$string['problemtext'] = 'Problem description';
$string['problemtext_help'] = 'Describe the problem or topic for which students will write their learning goals';
$string['minwords'] = 'Minimum words';
$string['minwords_help'] = 'Minimum number of words required in the student\'s goal statement';
$string['maxwords'] = 'Maximum words';
$string['maxwords_help'] = 'Maximum number of words allowed in the student\'s goal statement';
$string['allowresubmit'] = 'Allow resubmission';
$string['allowresubmit_help'] = 'If enabled, students can resubmit their goal after receiving feedback';

// Student view
$string['yourgoal'] = 'Your Learning Goal';
$string['writegoal'] = 'Write your learning goal for this problem';
$string['goalplaceholder'] = 'Describe what you want to learn or achieve with this problem...';
$string['wordcount'] = 'Word count: {$a}';
$string['submitgoal'] = 'Submit Goal';
$string['savedraft'] = 'Save Draft';
$string['goalsubmitted'] = 'Goal submitted successfully';
$string['goalsaved'] = 'Goal saved as draft';
$string['resubmit'] = 'Resubmit';
$string['status'] = 'Status';
$string['draft'] = 'Draft';
$string['submitted'] = 'Submitted';
$string['reviewed'] = 'Reviewed';

// Validation
$string['errorminwords'] = 'Your goal must be at least {$a} words';
$string['errormaxwords'] = 'Your goal cannot exceed {$a} words';
$string['erroremptygoal'] = 'Please write your learning goal';

// Teacher view
$string['viewsubmissions'] = 'View Submissions';
$string['nosubmissions'] = 'No submissions yet';
$string['studentname'] = 'Student Name';
$string['submissiondate'] = 'Submission Date';
$string['teacherfeedback'] = 'Teacher Feedback';
$string['grade'] = 'Grade';
$string['providefeedback'] = 'Provide Feedback';
$string['savefeedback'] = 'Save Feedback';
$string['feedbacksaved'] = 'Feedback saved successfully';
$string['viewsubmission'] = 'View Submission';

// Privacy
$string['privacy:metadata:goalwriting_submissions'] = 'Information about student goal writing submissions';
$string['privacy:metadata:goalwriting_submissions:userid'] = 'The ID of the user who made the submission';
$string['privacy:metadata:goalwriting_submissions:goaltext'] = 'The goal text written by the student';
$string['privacy:metadata:goalwriting_submissions:timesubmitted'] = 'The timestamp indicating when the submission was made';
$string['privacy:metadata:goalwriting_submissions:grade'] = 'The grade received for the submission';
