<?php
/**
 * English language strings for mod_problemexplain
 *
 * @package    mod_problemexplain
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

// Module name and description
$string['modulename'] = 'Problem Explanation';
$string['modulenameplural'] = 'Problem Explanations';
$string['modulename_help'] = 'The Problem Explanation activity enables students to explain problems as if teaching others, promoting deeper understanding through the "Learning by Teaching" pedagogical approach.';
$string['pluginname'] = 'Problem Explanation';
$string['pluginadministration'] = 'Problem Explanation administration';

// Capabilities
$string['problemexplain:addinstance'] = 'Add a new Problem Explanation activity';
$string['problemexplain:view'] = 'View Problem Explanation activity';
$string['problemexplain:submit'] = 'Submit problem explanation';
$string['problemexplain:grade'] = 'Grade problem explanations';

// Settings
$string['problemexplainname'] = 'Activity name';
$string['problemexplainname_help'] = 'The name of this Problem Explanation activity';
$string['problem_text'] = 'Problem to explain';
$string['problem_text_help'] = 'Enter the problem that students will explain';
$string['problem_type'] = 'Problem type';
$string['problem_type_help'] = 'Select the type of problem (arithmetic, algebra, geometry, etc.)';
$string['min_steps'] = 'Minimum steps';
$string['min_steps_help'] = 'Minimum number of explanation steps required';
$string['max_steps'] = 'Maximum steps';
$string['max_steps_help'] = 'Maximum number of explanation steps allowed';
$string['enable_peer_review'] = 'Enable peer review';
$string['enable_peer_review_help'] = 'Allow students to review each other\'s explanations';
$string['peer_reviews_required'] = 'Peer reviews required';
$string['peer_reviews_required_help'] = 'Number of peer reviews each student must complete';
$string['enable_ai_evaluation'] = 'Enable AI evaluation';
$string['enable_ai_evaluation_help'] = 'Use AI to automatically evaluate explanation quality';

// Problem types
$string['arithmetic'] = 'Arithmetic';
$string['algebra'] = 'Algebra';
$string['geometry'] = 'Geometry';
$string['calculus'] = 'Calculus';
$string['statistics'] = 'Statistics';
$string['other'] = 'Other';

// Submission interface
$string['myexplanation'] = 'My Explanation';
$string['startexplanation'] = 'Start Explanation';
$string['continueexplanation'] = 'Continue Explanation';
$string['submitexplanation'] = 'Submit Explanation';
$string['explanation_title'] = 'Explanation Title';
$string['explanation_title_help'] = 'Give your explanation a descriptive title';

// Step interface
$string['step'] = 'Step {$a}';
$string['addstep'] = 'Add Step';
$string['removestep'] = 'Remove Step';
$string['step_title'] = 'Step Title';
$string['step_title_help'] = 'Brief title describing what happens in this step';
$string['step_explanation'] = 'Step Explanation';
$string['step_explanation_help'] = 'Explain this step as if teaching someone who doesn\'t know how to solve this problem';
$string['step_reasoning'] = 'Why is this step necessary?';
$string['step_reasoning_help'] = 'Explain why this step is important for solving the problem';
$string['step_image'] = 'Diagram/Image (optional)';
$string['step_image_help'] = 'Upload a diagram or image to illustrate this step';

// Prompts and guidance
$string['teaching_prompt'] = 'Imagine you are teaching this to a friend. How would you explain it step-by-step?';
$string['clarity_prompt'] = 'Use clear language that anyone can understand';
$string['reasoning_prompt'] = 'Don\'t just show the steps - explain WHY each step is necessary';
$string['example_prompt'] = 'Consider using examples or analogies to make it easier to understand';

// Status and feedback
$string['status'] = 'Status';
$string['draft'] = 'Draft';
$string['submitted'] = 'Submitted';
$string['graded'] = 'Graded';
$string['nosubmission'] = 'No submission yet';
$string['timesubmitted'] = 'Time submitted';
$string['numberofsteps'] = 'Number of steps';

// AI Evaluation
$string['ai_evaluation'] = 'AI Evaluation';
$string['clarity_score'] = 'Clarity Score';
$string['completeness_score'] = 'Completeness Score';
$string['accuracy_score'] = 'Accuracy Score';
$string['pedagogy_score'] = 'Teaching Quality Score';
$string['overall_score'] = 'Overall Score';
$string['ai_feedback'] = 'AI Feedback';
$string['ai_suggestions'] = 'Suggestions for Improvement';
$string['evaluating'] = 'AI is evaluating your explanation...';
$string['evaluation_complete'] = 'Evaluation complete!';

// Peer Review
$string['peerreview'] = 'Peer Review';
$string['allsubmissions'] = 'All Submissions';
$string['reviewsubmission'] = 'Review Submission';
$string['understanding_score'] = 'How well did you understand this explanation?';
$string['helpfulness_score'] = 'How helpful was this explanation?';
$string['clarity_score_peer'] = 'How clear was the explanation?';
$string['review_text'] = 'Your feedback';
$string['review_text_help'] = 'Provide constructive feedback to help your peer improve';
$string['submit_review'] = 'Submit Review';
$string['reviews_completed'] = 'Reviews completed: {$a->completed} / {$a->required}';

// Teacher interface
$string['grading'] = 'Grading';
$string['grade_submission'] = 'Grade Submission';
$string['feedback'] = 'Feedback';
$string['viewsubmission'] = 'View Submission';
$string['notgraded'] = 'Not graded yet';

// Errors and warnings
$string['error_minsteps'] = 'You must include at least {$a} steps';
$string['error_maxsteps'] = 'You cannot include more than {$a} steps';
$string['error_emptystep'] = 'Step {$a} is empty. Please fill in all steps.';
$string['error_notitle'] = 'Please provide a title for your explanation';
$string['warning_draft'] = 'This is a draft. Remember to submit when you\'re ready!';

// Notifications
$string['submission_saved'] = 'Your explanation has been saved as a draft';
$string['submission_submitted'] = 'Your explanation has been submitted successfully!';
$string['review_submitted'] = 'Your peer review has been submitted';
$string['grade_saved'] = 'Grade has been saved';

// Help text
$string['howtoexplain'] = 'How to explain a problem effectively';
$string['howtoexplain_help'] = '
<ul>
<li><strong>Start with the big picture:</strong> What are we trying to find or solve?</li>
<li><strong>Break it down:</strong> Divide the problem into clear, manageable steps</li>
<li><strong>Explain your thinking:</strong> Don\'t just show calculations - explain WHY you do each step</li>
<li><strong>Use examples:</strong> Give concrete examples or analogies when helpful</li>
<li><strong>Check understanding:</strong> Would someone reading this be able to solve a similar problem?</li>
</ul>
';

// Settings strings
$string['ai_settings'] = 'AI Evaluation Settings';
$string['ai_settings_desc'] = 'Configure Claude API for AI-powered evaluation of student explanations';
$string['claude_api_key'] = 'Claude API Key';
$string['claude_api_key_desc'] = 'Enter your Anthropic Claude API key. Get one at https://console.anthropic.com/';
$string['claude_model'] = 'Claude Model';
$string['claude_model_desc'] = 'Select which Claude model to use for evaluation';
$string['enable_ai_by_default'] = 'Enable AI evaluation by default';
$string['enable_ai_by_default_desc'] = 'Check this to enable AI evaluation for new activities by default';

// Additional teacher strings
$string['total_submissions'] = 'Total submissions';
$string['no_submissions'] = 'No submissions yet';
$string['ai_score'] = 'AI Score';
$string['savegrade'] = 'Save Grade';
$string['back_to_submissions'] = 'Back to Submissions';
$string['requirements'] = 'Requirements';

// Event strings
$string['event_submission_created'] = 'Submission created';
$string['event_submission_submitted'] = 'Submission submitted';

// Privacy
$string['privacy:metadata:problemexplain_submissions'] = 'Information about student submissions';
$string['privacy:metadata:problemexplain_submissions:userid'] = 'The ID of the user who made the submission';
$string['privacy:metadata:problemexplain_submissions:explanation_title'] = 'The title of the student\'s explanation';
$string['privacy:metadata:problemexplain_submissions:timecreated'] = 'The time when the submission was created';
$string['privacy:metadata:problemexplain_submissions:timesubmitted'] = 'The time when the submission was submitted';
$string['privacy:metadata:problemexplain_steps'] = 'Information about explanation steps';
$string['privacy:metadata:problemexplain_steps:step_explanation'] = 'The explanation text for a step';
$string['privacy:metadata:problemexplain_peer_reviews'] = 'Information about peer reviews';
$string['privacy:metadata:problemexplain_peer_reviews:reviewer_id'] = 'The ID of the user who made the review';
$string['privacy:metadata:problemexplain_peer_reviews:review_text'] = 'The review text provided by the peer';
