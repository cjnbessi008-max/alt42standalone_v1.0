<?php
/**
 * English language strings for reasoning clip plugin
 *
 * @package    local_reasoningclip
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['pluginname'] = 'Reasoning Clip';
$string['reasoningclip'] = 'Reasoning Clip';

// Capabilities
$string['reasoningclip:view'] = 'View own reasoning clips';
$string['reasoningclip:viewall'] = 'View all students\' reasoning clips';
$string['reasoningclip:manage'] = 'Manage reasoning clip settings';
$string['reasoningclip:delete'] = 'Delete reasoning clips';

// Dashboard
$string['dashboard'] = 'Reasoning Clips Dashboard';
$string['reasoningclips_dashboard'] = 'Student Reasoning Moments Dashboard';
$string['filters'] = 'Filters';
$string['statistics'] = 'Statistics';
$string['total_clips'] = 'Total clips detected: {$a}';

// Clip types
$string['cliptype'] = 'Clip Type';
$string['all_types'] = 'All Types';
$string['cliptype_breakthrough'] = 'Breakthrough Moment';
$string['cliptype_struggle'] = 'Struggle Period';
$string['cliptype_rapid_solve'] = 'Rapid Solve';
$string['cliptype_pause_think'] = 'Pause & Think';
$string['cliptype_systematic'] = 'Systematic Approach';
$string['cliptype_trial_error'] = 'Trial & Error';

// Table headers
$string['student'] = 'Student';
$string['activity'] = 'Activity';
$string['question'] = 'Question';
$string['confidence'] = 'Confidence';
$string['timespent'] = 'Time Spent';
$string['timecreated'] = 'Detected At';
$string['actions'] = 'Actions';

// Actions
$string['view'] = 'View Details';
$string['filter'] = 'Filter';
$string['delete'] = 'Delete';

// Settings
$string['settings_header'] = 'Reasoning Clip Settings';
$string['detection_threshold'] = 'Detection Threshold';
$string['detection_threshold_desc'] = 'Minimum confidence score (0-1) required to save a clip';
$string['enabled_clip_types'] = 'Enabled Clip Types';
$string['enabled_clip_types_desc'] = 'Select which types of reasoning moments to detect';
$string['auto_analyze'] = 'Auto-analyze Sessions';
$string['auto_analyze_desc'] = 'Automatically analyze student sessions for reasoning moments';

// Errors
$string['nopermission'] = 'You do not have permission to access this resource';
$string['clipnotfound'] = 'Reasoning clip not found';
$string['invalidparameters'] = 'Invalid parameters provided';

// Privacy
$string['privacy:metadata:local_reasoningclip'] = 'Stores detected reasoning moments from student problem-solving';
$string['privacy:metadata:local_reasoningclip:userid'] = 'The ID of the student';
$string['privacy:metadata:local_reasoningclip:clipdata'] = 'Data about the reasoning moment';
$string['privacy:metadata:local_reasoningclip:timecreated'] = 'When the clip was created';

$string['privacy:metadata:local_reasoningclip_events'] = 'Stores student interaction events for analysis';
$string['privacy:metadata:local_reasoningclip_events:userid'] = 'The ID of the student';
$string['privacy:metadata:local_reasoningclip_events:eventdata'] = 'Data about the interaction event';
$string['privacy:metadata:local_reasoningclip_events:timecreated'] = 'When the event occurred';

// Clip descriptions
$string['clip_description_breakthrough'] = 'Student had a breakthrough after struggling with the problem';
$string['clip_description_struggle'] = 'Student showing extended difficulty with the concept';
$string['clip_description_rapid_solve'] = 'Student solved the problem quickly, indicating strong understanding';
$string['clip_description_pause_think'] = 'Student paused to think before taking action';
$string['clip_description_systematic'] = 'Student demonstrated a systematic problem-solving approach';
$string['clip_description_trial_error'] = 'Student used trial-and-error strategy';
