<?php
/**
 * English language strings for Concept Detection Plugin
 *
 * @package    local_conceptdetection
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

$string['pluginname'] = 'Concept Detection';
$string['conceptdetection'] = 'Concept Detection';

// Settings strings
$string['threshold_time'] = 'Time threshold (seconds)';
$string['threshold_time_desc'] = 'Minimum time spent on a concept to consider it properly studied';
$string['threshold_attempts'] = 'Attempts threshold';
$string['threshold_attempts_desc'] = 'Maximum number of attempts before flagging as not understood';
$string['threshold_score'] = 'Score threshold (%)';
$string['threshold_score_desc'] = 'Minimum score to consider a concept as understood';
$string['enable_tracking'] = 'Enable behavior tracking';
$string['enable_tracking_desc'] = 'Track student behavior patterns for concept understanding analysis';

// Dashboard strings
$string['dashboard'] = 'Concept Detection Dashboard';
$string['dashboard_desc'] = 'View students who did not understand concepts';
$string['misunderstood_concepts'] = 'Misunderstood Concepts';
$string['student_name'] = 'Student Name';
$string['concept_name'] = 'Concept';
$string['attempts'] = 'Attempts';
$string['time_spent'] = 'Time Spent';
$string['score'] = 'Score';
$string['status'] = 'Status';
$string['not_understood'] = 'Not Understood';
$string['partially_understood'] = 'Partially Understood';
$string['understood'] = 'Understood';

// Analysis strings
$string['analyzing'] = 'Analyzing student behavior...';
$string['no_data'] = 'No data available for analysis';
$string['view_details'] = 'View Details';
$string['student_progress'] = 'Student Progress';
$string['concept_analysis'] = 'Concept Analysis';

// Additional UI strings
$string['no_courses_found'] = 'No courses found where you have teaching access';
$string['select_course'] = 'Select a course';
$string['auto_detecting_concepts'] = 'Auto-detecting concepts from course content...';
$string['concepts_detected'] = '{$a} concepts detected and created';
$string['analyze_now'] = 'Analyze Students Now';
$string['analysis_complete'] = 'Analysis complete for {$a} students';
$string['summary'] = 'Summary';
$string['total_concepts'] = 'Total Concepts';
$string['total_students'] = 'Total Students';
$string['students_struggling'] = 'Students Struggling';
$string['students_partial'] = 'Partially Understanding';
$string['concepts_detail'] = 'Concepts Detail';
$string['difficulty'] = 'Difficulty';
$string['actions'] = 'Actions';
$string['no_concepts_found'] = 'No concepts found. They will be auto-detected on first visit.';

// Difficulty levels
$string['difficulty_1'] = 'Very Easy';
$string['difficulty_2'] = 'Easy';
$string['difficulty_3'] = 'Medium';
$string['difficulty_4'] = 'Hard';
$string['difficulty_5'] = 'Very Hard';
$string['difficulty_very_easy'] = 'Very Easy';
$string['difficulty_easy'] = 'Easy';
$string['difficulty_medium'] = 'Medium';
$string['difficulty_hard'] = 'Hard';
$string['difficulty_very_hard'] = 'Very Hard';

// Concept detail page
$string['struggling_students'] = 'Students Who Need Help';
$string['email'] = 'Email';
$string['last_activity'] = 'Last Activity';
$string['confidence'] = 'Confidence';
$string['module_type'] = 'Module Type';
$string['all'] = 'All';
$string['no_struggling_students'] = 'Great! All students understood this concept.';
$string['back_to_dashboard'] = 'Back to Dashboard';
$string['not_started'] = 'Not Started';

// Recommendations
$string['recommendations'] = 'Recommendations for Teachers';
$string['recommendation_not_understood'] = 'This student appears to have difficulty with this concept.';
$string['recommendation_partially_understood'] = 'This student has partial understanding and may benefit from additional practice.';
$string['recommendation_understood'] = 'This student has demonstrated understanding of this concept.';
$string['recommendation_more_time'] = 'The student spent minimal time on this material. Consider encouraging more engagement.';
$string['recommendation_seek_help'] = 'Multiple attempts with low success suggest the student may need one-on-one help.';
$string['recommendation_focus'] = 'Quick exits may indicate distraction or confusion. Consider checking in with the student.';
$string['recommendation_review_material'] = 'Review the learning material with these students in small groups.';
$string['recommendation_one_on_one'] = 'Provide one-on-one tutoring sessions for students with low confidence scores.';
$string['recommendation_practice'] = 'Assign additional practice problems with gradual difficulty increase.';
$string['recommendation_peer_learning'] = 'Pair struggling students with those who understood the concept well.';

// Capabilities
$string['conceptdetection:view'] = 'View concept detection dashboard';
$string['conceptdetection:manage'] = 'Manage concept detection settings';
