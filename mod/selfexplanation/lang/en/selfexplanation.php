<?php
/**
 * English language strings for selfexplanation module
 *
 * @package    mod_selfexplanation
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

// Module basics
$string['modulename'] = 'Self-Explanation Prompt';
$string['modulenameplural'] = 'Self-Explanation Prompts';
$string['modulename_help'] = 'The self-explanation prompt module allows teachers to create metacognitive learning activities where students explain their reasoning and understanding.';
$string['selfexplanation:addinstance'] = 'Add a new self-explanation prompt';
$string['selfexplanation:submit'] = 'Submit self-explanation responses';
$string['selfexplanation:view'] = 'View self-explanation prompt';
$string['selfexplanation:viewresponses'] = 'View all student responses';
$string['selfexplanation:grade'] = 'Grade student responses';
$string['selfexplanation:viewanalytics'] = 'View analytics';
$string['pluginname'] = 'Self-Explanation Prompt';
$string['pluginadministration'] = 'Self-Explanation administration';

// Activity settings
$string['selfexplanationname'] = 'Activity name';
$string['selfexplanationname_help'] = 'The name of this self-explanation activity';
$string['prompttext'] = 'Prompt text';
$string['prompttext_help'] = 'The question or prompt that students will respond to. Default: "Why do I know this?"';
$string['prompttype'] = 'Prompt type';
$string['prompttype_help'] = 'The type of metacognitive prompt';
$string['prompttype_why_know'] = 'Why do I know this?';
$string['prompttype_how_know'] = 'How do I know this?';
$string['prompttype_what_if'] = 'What if...?';
$string['prompttype_explain'] = 'Explain your reasoning';
$string['prompttype_custom'] = 'Custom prompt';
$string['minwords'] = 'Minimum words';
$string['minwords_help'] = 'Minimum number of words required in the response';
$string['allowresubmit'] = 'Allow resubmission';
$string['allowresubmit_help'] = 'Allow students to edit and resubmit their responses';
$string['displayfeedback'] = 'Display feedback';
$string['displayfeedback_help'] = 'Show teacher feedback to students';

// Student view
$string['yourresponse'] = 'Your response';
$string['submitresponse'] = 'Submit response';
$string['saveresponse'] = 'Save draft';
$string['updateresponse'] = 'Update response';
$string['responsetext'] = 'Your self-explanation';
$string['responsetext_help'] = 'Explain your thinking and reasoning. Be specific and thorough.';
$string['wordcount'] = 'Word count: {$a}';
$string['minwordsrequired'] = 'Minimum {$a} words required';
$string['responsesubmitted'] = 'Your response has been submitted';
$string['responsesaved'] = 'Your response has been saved as a draft';
$string['responseupdated'] = 'Your response has been updated';
$string['noresponseyet'] = 'You have not submitted a response yet';
$string['draft'] = 'Draft';
$string['submitted'] = 'Submitted';
$string['graded'] = 'Graded';
$string['status'] = 'Status';
$string['timespent'] = 'Time spent';
$string['minutes'] = '{$a} minutes';
$string['seconds'] = '{$a} seconds';

// Teacher view
$string['viewresponses'] = 'View all responses';
$string['numresponses'] = '{$a} responses';
$string['noresponsesyet'] = 'No responses yet';
$string['studentname'] = 'Student name';
$string['response'] = 'Response';
$string['grade'] = 'Grade';
$string['feedback'] = 'Feedback';
$string['providefeedback'] = 'Provide feedback';
$string['savefeedback'] = 'Save feedback';
$string['feedbacksaved'] = 'Feedback saved';

// Analytics
$string['analytics'] = 'Analytics';
$string['qualityscore'] = 'Quality score';
$string['keywordcount'] = 'Metacognitive keywords';
$string['avgresponselength'] = 'Average response length';
$string['completionrate'] = 'Completion rate';
$string['viewdetails'] = 'View details';

// Privacy
$string['privacy:metadata:selfexplanation_responses'] = 'Information about the user\'s self-explanation responses';
$string['privacy:metadata:selfexplanation_responses:userid'] = 'The ID of the user';
$string['privacy:metadata:selfexplanation_responses:responsetext'] = 'The user\'s self-explanation response';
$string['privacy:metadata:selfexplanation_responses:wordcount'] = 'The number of words in the response';
$string['privacy:metadata:selfexplanation_responses:timespent'] = 'The time spent on the response';
$string['privacy:metadata:selfexplanation_responses:grade'] = 'The grade given by the teacher';
$string['privacy:metadata:selfexplanation_responses:feedback'] = 'The feedback given by the teacher';
$string['privacy:metadata:selfexplanation_responses:timecreated'] = 'The time when the response was created';
$string['privacy:metadata:selfexplanation_responses:timemodified'] = 'The time when the response was last modified';

// Errors
$string['error:cannotsubmit'] = 'You cannot submit this response';
$string['error:invalidresponse'] = 'Invalid response';
$string['error:tooshort'] = 'Your response is too short. Please write at least {$a} words.';
$string['error:notfound'] = 'Self-explanation activity not found';
