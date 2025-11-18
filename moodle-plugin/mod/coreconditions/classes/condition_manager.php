<?php
/**
 * Condition manager class for handling core conditions
 *
 * @package    mod_coreconditions
 * @copyright  2025 AI Education System
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace mod_coreconditions;

defined('MOODLE_INTERNAL') || die();

/**
 * Class for managing core conditions
 */
class condition_manager {

    /**
     * Get all conditions for a problem
     *
     * @param int $problemid
     * @return array
     */
    public static function get_conditions($problemid) {
        global $DB;
        return $DB->get_records('coreconditions_conditions',
            array('problem_id' => $problemid), 'condition_order ASC');
    }

    /**
     * Save or update a condition
     *
     * @param stdClass $condition
     * @return int condition ID
     */
    public static function save_condition($condition) {
        global $DB;

        $condition->timemodified = time();

        if (isset($condition->id) && $condition->id > 0) {
            $DB->update_record('coreconditions_conditions', $condition);
            return $condition->id;
        } else {
            $condition->timecreated = time();
            return $DB->insert_record('coreconditions_conditions', $condition);
        }
    }

    /**
     * Save all 3 conditions for a problem
     *
     * @param int $problemid
     * @param array $conditionsdata Array of 3 condition objects
     * @return bool success
     * @throws \coding_exception if not exactly 3 conditions
     */
    public static function save_all_conditions($problemid, $conditionsdata) {
        global $DB;

        if (count($conditionsdata) != 3) {
            throw new \coding_exception('Must provide exactly 3 conditions');
        }

        // Delete existing conditions
        $DB->delete_records('coreconditions_conditions', array('problem_id' => $problemid));

        // Insert new conditions
        $order = 1;
        foreach ($conditionsdata as $conditiondata) {
            $condition = new \stdClass();
            $condition->problem_id = $problemid;
            $condition->condition_order = $order;
            $condition->condition_type = $conditiondata['type'];
            $condition->condition_name = $conditiondata['name'];
            $condition->condition_description = $conditiondata['description'];
            $condition->condition_rule = $conditiondata['rule'];
            $condition->condition_weight = isset($conditiondata['weight']) ? $conditiondata['weight'] : 33.33;
            $condition->timecreated = time();
            $condition->timemodified = time();

            $DB->insert_record('coreconditions_conditions', $condition);
            $order++;
        }

        return true;
    }

    /**
     * Delete a condition
     *
     * @param int $conditionid
     * @return bool success
     */
    public static function delete_condition($conditionid) {
        global $DB;
        return $DB->delete_records('coreconditions_conditions', array('id' => $conditionid));
    }

    /**
     * Validate if exactly 3 conditions exist for a problem
     *
     * @param int $problemid
     * @return bool
     */
    public static function validate_condition_count($problemid) {
        global $DB;
        $count = $DB->count_records('coreconditions_conditions', array('problem_id' => $problemid));
        return $count === 3;
    }

    /**
     * Evaluate conditions for a student attempt
     *
     * @param int $problemid
     * @param mixed $answer Student's answer
     * @param stdClass $correctanswer Correct answer object
     * @return array ['conditions_met' => [...], 'score' => float, 'feedback' => string]
     */
    public static function evaluate_attempt($problemid, $answer, $correctanswer) {
        global $DB;

        $conditions = self::get_conditions($problemid);
        $conditionsmet = array();
        $totalscore = 0;
        $feedback = '';

        foreach ($conditions as $condition) {
            $met = self::evaluate_condition($condition, $answer, $correctanswer);

            if ($met) {
                $conditionsmet[] = $condition->id;
                $totalscore += $condition->condition_weight;
            }

            // Generate feedback based on condition type
            if (!$met) {
                $feedback .= sprintf("Condition '%s' not met: %s\n",
                    $condition->condition_name,
                    $condition->condition_description);
            }
        }

        return array(
            'conditions_met' => $conditionsmet,
            'score' => min(100, $totalscore), // Cap at 100
            'feedback' => trim($feedback),
            'all_met' => count($conditionsmet) === 3
        );
    }

    /**
     * Evaluate a single condition
     *
     * @param stdClass $condition
     * @param mixed $answer
     * @param mixed $correctanswer
     * @return bool
     */
    private static function evaluate_condition($condition, $answer, $correctanswer) {
        // This is a simplified evaluation. In production, you would:
        // 1. Parse the condition_rule
        // 2. Execute it safely (sandbox)
        // 3. Return the result

        switch ($condition->condition_type) {
            case 'validation':
                // Example: Check if input is valid format
                return self::evaluate_validation($condition->condition_rule, $answer);

            case 'calculation':
                // Example: Check if calculation is correct
                return self::evaluate_calculation($condition->condition_rule, $answer, $correctanswer);

            case 'progression':
                // Example: Check if meets progression criteria
                return self::evaluate_progression($condition->condition_rule, $answer);

            case 'feedback':
                // Example: Always evaluate to provide feedback
                return self::evaluate_feedback($condition->condition_rule, $answer);

            default:
                return false;
        }
    }

    /**
     * Evaluate validation condition
     */
    private static function evaluate_validation($rule, $answer) {
        // Example validation: "denominator != 0"
        if (strpos($rule, 'denominator') !== false) {
            if (is_string($answer) && strpos($answer, '/') !== false) {
                $parts = explode('/', $answer);
                return count($parts) === 2 && trim($parts[1]) !== '0';
            }
        }
        return true; // Default pass
    }

    /**
     * Evaluate calculation condition
     */
    private static function evaluate_calculation($rule, $answer, $correctanswer) {
        // Simple equality check - in production, use more sophisticated comparison
        return trim($answer) === trim($correctanswer);
    }

    /**
     * Evaluate progression condition
     */
    private static function evaluate_progression($rule, $answer) {
        // Progression conditions typically check attempt history
        // For now, return true
        return true;
    }

    /**
     * Evaluate feedback condition
     */
    private static function evaluate_feedback($rule, $answer) {
        // Feedback conditions provide guidance
        // They typically pass but generate messages
        return true;
    }

    /**
     * Get available condition types
     *
     * @return array
     */
    public static function get_condition_types() {
        return array(
            'validation' => get_string('conditiontype_validation', 'coreconditions'),
            'calculation' => get_string('conditiontype_calculation', 'coreconditions'),
            'progression' => get_string('conditiontype_progression', 'coreconditions'),
            'feedback' => get_string('conditiontype_feedback', 'coreconditions'),
        );
    }
}
