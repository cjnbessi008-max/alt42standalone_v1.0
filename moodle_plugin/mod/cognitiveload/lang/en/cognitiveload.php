<?php
/**
 * English language strings
 *
 * @package    mod_cognitiveload
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['modulename'] = 'Cognitive Load Analysis';
$string['modulenameplural'] = 'Cognitive Load Analyses';
$string['modulename_help'] = 'Cognitive load analysis module automatically analyzes the mental effort required to solve problems and provides insights for teachers.';
$string['pluginname'] = 'Cognitive Load Analysis';
$string['pluginadministration'] = 'Cognitive Load Analysis administration';

// Settings
$string['api_url'] = 'API URL';
$string['api_url_desc'] = 'URL of the Cognitive Load Analysis Service (e.g., http://localhost:8000)';
$string['api_key'] = 'API Key';
$string['api_key_desc'] = 'API key for authentication (optional)';
$string['cache_duration'] = 'Cache Duration';
$string['cache_duration_desc'] = 'How long to cache analysis results (in seconds, default: 86400 = 24 hours)';

// Cognitive load levels
$string['level_verylow'] = 'Very Low';
$string['level_low'] = 'Low';
$string['level_medium'] = 'Medium';
$string['level_high'] = 'High';
$string['level_veryhigh'] = 'Very High';

// Dashboard
$string['dashboard'] = 'Cognitive Load Dashboard';
$string['intrinsic_load'] = 'Intrinsic Load';
$string['extraneous_load'] = 'Extraneous Load';
$string['germane_load'] = 'Germane Load';
$string['total_score'] = 'Total Cognitive Load Score';
$string['difficulty_level'] = 'Difficulty Level';
$string['estimated_time'] = 'Estimated Time';
$string['problem_type'] = 'Problem Type';

// Problem types
$string['type_calculation'] = 'Simple Calculation';
$string['type_word_problem'] = 'Word Problem';
$string['type_multistep'] = 'Multi-step Problem';
$string['type_conceptual'] = 'Conceptual Understanding';
$string['type_problem_solving'] = 'Problem Solving';
$string['type_proof'] = 'Proof/Logic';

// Errors
$string['error_api_unavailable'] = 'Cognitive Load Analysis Service is unavailable';
$string['error_analysis_failed'] = 'Failed to analyze question';
