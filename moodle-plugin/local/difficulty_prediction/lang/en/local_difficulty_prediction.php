<?php
// This file is part of Moodle - http://moodle.org/

/**
 * English language strings for Difficulty Prediction plugin
 *
 * @package    local_difficulty_prediction
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['pluginname'] = 'Difficulty Prediction';

// Capabilities.
$string['difficulty_prediction:view'] = 'View difficulty predictions';
$string['difficulty_prediction:manage'] = 'Manage difficulty prediction settings';
$string['difficulty_prediction:viewanalytics'] = 'View difficulty analytics';

// Settings.
$string['settingsheader'] = 'Difficulty Prediction Settings';
$string['enable_auto_prediction'] = 'Enable automatic prediction';
$string['enable_auto_prediction_desc'] = 'Automatically predict difficulty when questions are created or updated';
$string['weight_complexity'] = 'Complexity weight';
$string['weight_complexity_desc'] = 'Weight for complexity score (0.0 - 1.0)';
$string['weight_cognitive'] = 'Cognitive load weight';
$string['weight_cognitive_desc'] = 'Weight for cognitive load score (0.0 - 1.0)';
$string['weight_historical'] = 'Historical data weight';
$string['weight_historical_desc'] = 'Weight for historical performance data (0.0 - 1.0)';
$string['weight_question_type'] = 'Question type weight';
$string['weight_question_type_desc'] = 'Weight for question type score (0.0 - 1.0)';
$string['min_attempts_threshold'] = 'Minimum attempts threshold';
$string['min_attempts_threshold_desc'] = 'Minimum number of student attempts before using actual difficulty data';
$string['cache_ttl'] = 'Cache TTL (seconds)';
$string['cache_ttl_desc'] = 'How long to cache difficulty predictions (in seconds)';

// Difficulty levels.
$string['difficulty_level_1'] = 'Very Easy';
$string['difficulty_level_2'] = 'Easy';
$string['difficulty_level_3'] = 'Medium';
$string['difficulty_level_4'] = 'Hard';
$string['difficulty_level_5'] = 'Very Hard';

// UI strings.
$string['predicted_difficulty'] = 'Predicted Difficulty';
$string['difficulty_level'] = 'Difficulty Level';
$string['confidence_score'] = 'Confidence Score';
$string['actual_difficulty'] = 'Actual Difficulty';
$string['analytics'] = 'Difficulty Analytics';
$string['question_analytics'] = 'Question Analytics';
$string['student_analytics'] = 'Student Performance Analytics';

// Analytics.
$string['total_questions'] = 'Total Questions';
$string['difficulty_distribution'] = 'Difficulty Distribution';
$string['avg_difficulty'] = 'Average Difficulty';
$string['accuracy_rate'] = 'Prediction Accuracy Rate';
$string['success_rate'] = 'Success Rate';
$string['mastery_score'] = 'Mastery Score';
$string['questions_attempted'] = 'Questions Attempted';
$string['performance_trend'] = 'Performance Trend';

// Errors.
$string['error_questionnotfound'] = 'Question not found';
$string['error_insufficientpermissions'] = 'Insufficient permissions';
$string['error_predictionfailed'] = 'Difficulty prediction failed';
$string['error_invalidparameters'] = 'Invalid parameters provided';

// Tasks.
$string['task_update_difficulties'] = 'Update difficulty predictions';
$string['task_cleanup_old_performance'] = 'Clean up old performance data';

// Info messages.
$string['prediction_generated'] = 'Difficulty prediction generated successfully';
$string['prediction_updated'] = 'Difficulty prediction updated based on student performance';
$string['no_historical_data'] = 'No historical data available for this question';
$string['low_confidence'] = 'Low confidence prediction (insufficient data)';
