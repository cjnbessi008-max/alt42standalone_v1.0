<?php
// This file is part of Moodle - http://moodle.org/

/**
 * English language strings for Cognitive Load Tips plugin
 *
 * @package    local_cognitiveloadtips
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

// Plugin
$string['pluginname'] = 'Cognitive Load Tips';
$string['cognitive_load_tips'] = 'Cognitive Load Minimization Tips';

// Capabilities
$string['cognitiveloadtips:manage'] = 'Manage cognitive load tips';
$string['cognitiveloadtips:managequizsettings'] = 'Manage quiz cognitive load tip settings';
$string['cognitiveloadtips:viewtips'] = 'View cognitive load tips';
$string['cognitiveloadtips:assigndifficulty'] = 'Assign difficulty levels to questions';

// Difficulty levels
$string['difficulty_level'] = 'Difficulty Level';
$string['difficulty_1'] = 'Very Easy ★☆☆☆☆';
$string['difficulty_2'] = 'Easy ★★☆☆☆';
$string['difficulty_3'] = 'Medium ★★★☆☆';
$string['difficulty_4'] = 'Hard ★★★★☆';
$string['difficulty_5'] = 'Very Hard ★★★★★';

// Categories
$string['category_breathing'] = 'Breathing';
$string['category_focus'] = 'Focus';
$string['category_strategy'] = 'Strategy';
$string['category_mindset'] = 'Mindset';
$string['category_general'] = 'General';

// Tip display
$string['tip_before_difficult_question'] = 'Tip Before You Begin';
$string['please_read_carefully'] = 'Please read carefully';
$string['seconds'] = 's';
$string['was_this_helpful'] = 'Was this tip helpful?';
$string['helpful'] = 'Helpful';
$string['not_helpful'] = 'Not Helpful';
$string['skip'] = 'Skip';
$string['continue_to_question'] = 'Continue to Question';
$string['feedback_thank_you'] = 'Thank you for your feedback!';

// Quiz settings
$string['enable_tips'] = 'Enable cognitive load tips';
$string['enable_tips_desc'] = 'Show cognitive load minimization tips before difficult questions';
$string['show_before_difficulty'] = 'Show tips for difficulty level';
$string['show_before_difficulty_help'] = 'Tips will be shown for questions with this difficulty level or higher';
$string['random_tip'] = 'Show random tip';
$string['random_tip_desc'] = 'Show a random tip instead of all tips for the difficulty level';
$string['allow_skip'] = 'Allow students to skip tips';
$string['allow_skip_desc'] = 'Allow students to skip the tips and go directly to the question';

// Admin
$string['manage_tips'] = 'Manage Cognitive Load Tips';
$string['add_tip'] = 'Add New Tip';
$string['edit_tip'] = 'Edit Tip';
$string['delete_tip'] = 'Delete Tip';
$string['tip_title'] = 'Tip Title';
$string['tip_content'] = 'Tip Content';
$string['tip_category'] = 'Category';
$string['tip_difficulty_min'] = 'Minimum Difficulty';
$string['tip_difficulty_max'] = 'Maximum Difficulty';
$string['tip_duration'] = 'Display Duration (seconds)';
$string['tip_mandatory'] = 'Mandatory Reading';
$string['tip_language'] = 'Language';
$string['tip_enabled'] = 'Enabled';
$string['tip_sortorder'] = 'Sort Order';

// Statistics
$string['statistics'] = 'Usage Statistics';
$string['total_tips'] = 'Total Tips';
$string['total_interactions'] = 'Total Interactions';
$string['tips_shown'] = 'Tips Shown';
$string['tips_skipped'] = 'Tips Skipped';
$string['avg_view_duration'] = 'Average View Duration';
$string['popular_tips'] = 'Most Popular Tips';

// Messages
$string['tip_saved'] = 'Tip saved successfully';
$string['tip_deleted'] = 'Tip deleted successfully';
$string['no_tips'] = 'No tips available';
$string['confirm_delete'] = 'Are you sure you want to delete this tip?';

// Privacy
$string['privacy:metadata:local_clt_user_interactions'] = 'Records of user interactions with cognitive load tips';
$string['privacy:metadata:local_clt_user_interactions:userid'] = 'The ID of the user who viewed the tip';
$string['privacy:metadata:local_clt_user_interactions:tipid'] = 'The ID of the tip that was viewed';
$string['privacy:metadata:local_clt_user_interactions:questionid'] = 'The ID of the question associated with the tip';
$string['privacy:metadata:local_clt_user_interactions:view_duration'] = 'How long the user viewed the tip';
$string['privacy:metadata:local_clt_user_interactions:was_helpful'] = 'Whether the user found the tip helpful';
$string['privacy:metadata:local_clt_user_interactions:skipped'] = 'Whether the user skipped the tip';
$string['privacy:metadata:local_clt_user_interactions:timecreated'] = 'When the interaction occurred';
