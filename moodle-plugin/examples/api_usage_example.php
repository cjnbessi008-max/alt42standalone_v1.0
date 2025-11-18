<?php
/**
 * API Usage Examples
 *
 * This file demonstrates how to use the Difficulty Prediction plugin API
 * both internally within Moodle and via REST endpoints.
 *
 * @package    local_difficulty_prediction
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once('../../../config.php');
require_once($CFG->dirroot . '/local/difficulty_prediction/classes/difficulty_predictor.php');
require_once($CFG->dirroot . '/local/difficulty_prediction/classes/performance_tracker.php');

use local_difficulty_prediction\difficulty_predictor;
use local_difficulty_prediction\performance_tracker;

// ====================
// EXAMPLE 1: Basic Prediction
// ====================

echo "Example 1: Predict difficulty for a single question\n";
echo "===================================================\n\n";

$questionid = 123; // Replace with actual question ID

$prediction = difficulty_predictor::predict($questionid);

echo "Question ID: {$prediction->questionid}\n";
echo "Predicted Difficulty: " . round($prediction->predicted_difficulty, 2) . "\n";
echo "Difficulty Level (1-5): {$prediction->predicted_level}\n";
echo "Confidence Score: " . round($prediction->confidence_score * 100, 1) . "%\n\n";

echo "Feature Breakdown:\n";
echo "  - Complexity: " . round($prediction->features['complexity_score'], 2) . "\n";
echo "  - Cognitive Load: " . round($prediction->features['cognitive_load_score'], 2) . "\n";
echo "  - Historical: " . round($prediction->features['historical_score'], 2) . "\n";
echo "  - Question Type: " . round($prediction->features['question_type_score'], 2) . "\n\n";


// ====================
// EXAMPLE 2: Batch Prediction
// ====================

echo "Example 2: Batch predict multiple questions\n";
echo "============================================\n\n";

$questionids = array(123, 124, 125, 126, 127);

$predictions = difficulty_predictor::batch_predict($questionids);

foreach ($predictions as $qid => $pred) {
    echo "Q{$qid}: Level {$pred->predicted_level} ";
    echo "(Confidence: " . round($pred->confidence_score * 100) . "%)\n";
}
echo "\n";


// ====================
// EXAMPLE 3: Get Course Analytics
// ====================

echo "Example 3: Get difficulty analytics for a course\n";
echo "================================================\n\n";

$courseid = 10; // Replace with actual course ID

$distribution = difficulty_predictor::get_difficulty_distribution($courseid);

echo "Difficulty Distribution:\n";
foreach ($distribution as $level => $count) {
    $bar = str_repeat('█', $count);
    echo "  Level {$level}: {$count} questions {$bar}\n";
}
echo "\n";


// ====================
// EXAMPLE 4: Student Performance Analytics
// ====================

echo "Example 4: Get student performance analytics\n";
echo "============================================\n\n";

$userid = 456; // Replace with actual user ID
$courseid = 10;

$analytics = performance_tracker::get_student_analytics($userid, $courseid);

echo "Student ID: {$userid}\n";
echo "Questions Attempted: {$analytics->questions_attempted}\n";
echo "Success Rate: " . round($analytics->success_rate * 100, 1) . "%\n";
echo "Mastery Score: " . round($analytics->mastery_score, 1) . "/100\n";
echo "Avg Difficulty Attempted: " . round($analytics->avg_difficulty_attempted, 1) . "\n";
echo "Avg Time per Question: " . round($analytics->avg_time / 60, 1) . " minutes\n\n";


// ====================
// EXAMPLE 5: Question-Level Performance
// ====================

echo "Example 5: Get performance analytics for a question\n";
echo "===================================================\n\n";

$questionid = 123;

$qanalytics = performance_tracker::get_question_analytics($questionid);

echo "Question ID: {$questionid}\n";
echo "Total Attempts: {$qanalytics->total_attempts}\n";
echo "Success Rate: " . round($qanalytics->success_rate * 100, 1) . "%\n";
echo "Failure Rate: " . round($qanalytics->failure_rate * 100, 1) . "%\n";
echo "Avg Time Spent: " . round($qanalytics->avg_time / 60, 1) . " minutes\n";
echo "Min Time: " . round($qanalytics->min_time / 60, 1) . " minutes\n";
echo "Max Time: " . round($qanalytics->max_time / 60, 1) . " minutes\n\n";


// ====================
// EXAMPLE 6: Performance Trend
// ====================

echo "Example 6: Get student performance trend over time\n";
echo "==================================================\n\n";

$userid = 456;
$days = 30;

$trend = performance_tracker::get_performance_trend($userid, $days);

echo "Performance Trend (Last {$days} days):\n";
foreach ($trend as $data) {
    $successbar = str_repeat('█', round($data['success_rate'] * 20));
    echo "  {$data['date']}: " . round($data['success_rate'] * 100) . "% {$successbar}\n";
}
echo "\n";


// ====================
// EXAMPLE 7: Adaptive Question Selection
// ====================

echo "Example 7: Get adaptive question recommendation\n";
echo "===============================================\n\n";

$userid = 456;
$courseid = 10;
$currentlevel = 3; // Student's current difficulty level

$nextquestion = difficulty_predictor::get_adaptive_question($userid, $courseid, $currentlevel);

if ($nextquestion) {
    echo "Recommended Next Question ID: {$nextquestion}\n";
    $nextpred = difficulty_predictor::predict($nextquestion);
    echo "Difficulty Level: {$nextpred->predicted_level}\n";
} else {
    echo "No suitable question found\n";
}
echo "\n";


// ====================
// EXAMPLE 8: REST API Call (cURL)
// ====================

echo "Example 8: REST API call via cURL\n";
echo "==================================\n\n";

// Note: This is a demonstration. In practice, you'd call this from external systems.

$url = $CFG->wwwroot . '/local/difficulty_prediction/api.php';
$wstoken = 'YOUR_WEBSERVICE_TOKEN'; // Replace with actual token

// Example: Predict difficulty
$data = array(
    'action' => 'predict',
    'questionid' => 123,
    'wstoken' => $wstoken
);

echo "cURL Command:\n";
echo "curl -X POST '{$url}' \\\n";
echo "  -H 'Content-Type: application/json' \\\n";
echo "  -d '" . json_encode($data) . "'\n\n";


// ====================
// EXAMPLE 9: Batch Update Difficulties
// ====================

echo "Example 9: Batch update difficulty predictions\n";
echo "==============================================\n\n";

$updated = performance_tracker::batch_update_difficulties(50);

echo "Updated difficulty predictions for {$updated} questions\n";
echo "This is typically run via scheduled task\n\n";


// ====================
// EXAMPLE 10: Force Recalculation
// ====================

echo "Example 10: Force recalculation of difficulty\n";
echo "=============================================\n\n";

$questionid = 123;

$prediction = difficulty_predictor::predict($questionid, true); // Force recalculate

echo "Recalculated difficulty for question {$questionid}\n";
echo "New Predicted Level: {$prediction->predicted_level}\n";
echo "Confidence: " . round($prediction->confidence_score * 100) . "%\n\n";


// ====================
// EXAMPLE 11: Custom Feature Extraction
// ====================

echo "Example 11: Extract features from a question\n";
echo "============================================\n\n";

use local_difficulty_prediction\feature_extractor;

$question = $DB->get_record('question', array('id' => $questionid), '*', MUST_EXIST);
$features = feature_extractor::extract_features($question);

echo "Extracted Features:\n";
foreach ($features as $key => $value) {
    if (is_numeric($value)) {
        echo "  {$key}: " . round($value, 3) . "\n";
    } else {
        echo "  {$key}: {$value}\n";
    }
}
echo "\n";


// ====================
// EXAMPLE 12: Display Difficulty Badge
// ====================

echo "Example 12: Render difficulty badge HTML\n";
echo "========================================\n\n";

$badge = local_difficulty_prediction_render_badge($questionid, true);
echo "Badge HTML: {$badge}\n\n";


echo "===== End of Examples =====\n";
