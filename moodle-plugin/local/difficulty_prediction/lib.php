<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Library functions for Difficulty Prediction plugin
 *
 * @package    local_difficulty_prediction
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/local/difficulty_prediction/classes/difficulty_predictor.php');

/**
 * Get difficulty level display string
 *
 * @param int $level Difficulty level (1-5)
 * @return string
 */
function local_difficulty_prediction_get_level_string($level) {
    return get_string('difficulty_level_' . $level, 'local_difficulty_prediction');
}

/**
 * Get difficulty level color for display
 *
 * @param int $level Difficulty level (1-5)
 * @return string CSS color code
 */
function local_difficulty_prediction_get_level_color($level) {
    $colors = array(
        1 => '#4CAF50', // Green - Very Easy
        2 => '#8BC34A', // Light Green - Easy
        3 => '#FFC107', // Amber - Medium
        4 => '#FF9800', // Orange - Hard
        5 => '#F44336', // Red - Very Hard
    );

    return isset($colors[$level]) ? $colors[$level] : '#999999';
}

/**
 * Render difficulty badge HTML
 *
 * @param int $questionid Question ID
 * @param bool $showcached Whether to show cached indicator
 * @return string HTML
 */
function local_difficulty_prediction_render_badge($questionid, $showcached = false) {
    global $DB;

    $record = $DB->get_record('question_difficulty', array('questionid' => $questionid));

    if (!$record) {
        return '';
    }

    $level = $record->predicted_level;
    $levelstring = local_difficulty_prediction_get_level_string($level);
    $color = local_difficulty_prediction_get_level_color($level);

    $confidence = round($record->confidence_score * 100);

    $html = '<span class="difficulty-badge" style="background-color: ' . $color . '; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px;">';
    $html .= $levelstring;

    if ($showcached && $confidence < 70) {
        $html .= ' <span style="opacity: 0.7;">(' . $confidence . '%)</span>';
    }

    $html .= '</span>';

    return $html;
}

/**
 * Hook into question bank to display difficulty
 *
 * @param object $question Question object
 * @return string HTML to display
 */
function local_difficulty_prediction_question_bank_column($question) {
    return local_difficulty_prediction_render_badge($question->id, true);
}
