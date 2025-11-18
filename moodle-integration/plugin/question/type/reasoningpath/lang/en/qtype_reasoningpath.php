<?php
// This file is part of Moodle - http://moodle.org/

/**
 * English language strings for Reasoning Path question type.
 *
 * @package    qtype_reasoningpath
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

// Plugin name
$string['pluginname'] = 'Reasoning Path';
$string['pluginname_help'] = 'A question type that evaluates students\' problem-solving process and reasoning path. Grades based on the completeness of reasoning rather than just the correct answer.';
$string['pluginnameadding'] = 'Adding a Reasoning Path question';
$string['pluginnameediting'] = 'Editing a Reasoning Path question';
$string['pluginnamesummary'] = 'Students write their reasoning process step-by-step, and AI evaluates the completeness and logical coherence of their reasoning.';

// Question editing
$string['min_steps_required'] = 'Minimum steps required';
$string['min_steps_required_help'] = 'The minimum number of reasoning steps students must provide';
$string['expected_steps'] = 'Expected solution steps';
$string['expected_steps_help'] = 'The expected steps in the model answer (optional)';
$string['grading_rubric'] = 'Grading rubric';
$string['grading_rubric_help'] = 'Additional grading criteria and guidelines';
$string['allow_multiple_methods'] = 'Allow multiple solution methods';
$string['enable_ai_grading'] = 'Enable AI auto-grading';

// Grading weights
$string['completeness_weight'] = 'Completeness weight (%)';
$string['coherence_weight'] = 'Logical coherence weight (%)';
$string['method_weight'] = 'Method appropriateness weight (%)';
$string['clarity_weight'] = 'Clarity weight (%)';
$string['weights_must_sum_100'] = 'All weights must sum to 100.';

// Student interface
$string['youranswer'] = 'Your reasoning process';
$string['addstep'] = 'Add step';
$string['removestep'] = 'Remove step';
$string['stepnumber'] = 'Step {$a}';
$string['steptype'] = 'Step type';
$string['stepdescription'] = 'Description';
$string['stepcontent'] = 'Work';
$string['insertmath'] = 'Insert math';

// Step types
$string['calculation'] = 'Calculation';
$string['explanation'] = 'Explanation';
$string['assumption'] = 'Assumption';
$string['conclusion'] = 'Conclusion';

// Validation messages
$string['pleaseprovidereasoning'] = 'Please provide your reasoning.';
$string['invalidstepsformat'] = 'Invalid step format.';
$string['notenoughsteps'] = 'At least {$a} steps are required.';
$string['noresponse'] = 'No response';
$string['invalidresponse'] = 'Invalid response';
$string['stepssubmitted'] = '{$a} steps submitted';
$string['responserequiresgrading'] = 'Requires grading';

// Grading feedback
$string['excellent'] = 'Excellent';
$string['good'] = 'Good';
$string['satisfactory'] = 'Satisfactory';
$string['incomplete'] = 'Incomplete';
$string['multiplecorrectpaths'] = 'Multiple correct solution paths exist.';
$string['expectedsteps'] = 'Expected steps';
$string['fallbackgrading'] = 'AI grading unavailable, using fallback grading. Teacher review may be required.';

// Grading criteria
$string['completeness'] = 'Completeness';
$string['completeness_help'] = 'Are all necessary reasoning steps included?';
$string['logical_coherence'] = 'Logical Coherence';
$string['logical_coherence_help'] = 'Are the steps logically connected?';
$string['method_appropriateness'] = 'Method Appropriateness';
$string['method_appropriateness_help'] = 'Is the approach suitable for this problem?';
$string['clarity'] = 'Clarity';
$string['clarity_help'] = 'Is the reasoning clearly explained?';

// Analysis feedback
$string['analysis_completeness'] = 'Completeness Analysis';
$string['analysis_coherence'] = 'Coherence Analysis';
$string['analysis_method'] = 'Method Analysis';
$string['analysis_clarity'] = 'Clarity Analysis';
$string['overall_feedback'] = 'Overall Feedback';
$string['strengths'] = 'Strengths';
$string['areas_for_improvement'] = 'Areas for Improvement';

// Admin settings
$string['analysis_api_endpoint'] = 'Analysis API endpoint';
$string['analysis_api_endpoint_desc'] = 'URL of the reasoning path analysis engine API';
$string['analysis_api_key'] = 'API authentication key';
$string['analysis_api_key_desc'] = 'Authentication key for accessing the analysis API';
$string['api_timeout'] = 'API timeout (seconds)';
$string['api_timeout_desc'] = 'Timeout for AI analysis API calls';

// Errors
$string['apicallfailed'] = 'AI analysis API call failed: {$a}';
$string['apireturnedcode'] = 'AI analysis API returned error code: {$a}';
$string['invalidjsonresponse'] = 'Invalid JSON response from AI analysis API.';
$string['invalidanalysisresult'] = 'Analysis result is invalid.';

// Privacy
$string['privacy:metadata:qtype_reasoningpath_steps'] = 'Student reasoning step data';
$string['privacy:metadata:qtype_reasoningpath_steps:step_content'] = 'Content written by student for this step';
$string['privacy:metadata:qtype_reasoningpath_steps:step_description'] = 'Description written by student for this step';
$string['privacy:metadata:qtype_reasoningpath_analysis'] = 'AI grading analysis results';
$string['privacy:metadata:qtype_reasoningpath_analysis:ai_feedback'] = 'Feedback generated by AI';
$string['privacy:metadata:external_anthropic'] = 'Claude AI API';
$string['privacy:metadata:external_anthropic:steps'] = 'Reasoning steps are sent to Claude API for AI analysis.';
