<?php
/**
 * External API for getting consistency scores
 *
 * @package    block_thinkroutine_consistency
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace block_thinkroutine_consistency\external;

use external_api;
use external_function_parameters;
use external_value;
use external_single_structure;
use external_multiple_structure;
use block_thinkroutine_consistency\consistency_calculator;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/externallib.php');

class get_consistency_score extends external_api {

    /**
     * Returns description of method parameters
     *
     * @return external_function_parameters
     */
    public static function execute_parameters() {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'User ID'),
            'courseid' => new external_value(PARAM_INT, 'Course ID'),
            'periodstart' => new external_value(PARAM_INT, 'Period start timestamp', VALUE_OPTIONAL, 0),
            'periodend' => new external_value(PARAM_INT, 'Period end timestamp', VALUE_OPTIONAL, 0),
        ]);
    }

    /**
     * Get consistency score
     *
     * @param int $userid
     * @param int $courseid
     * @param int $periodstart
     * @param int $periodend
     * @return array
     */
    public static function execute($userid, $courseid, $periodstart = 0, $periodend = 0) {
        global $USER, $DB;

        $params = self::validate_parameters(self::execute_parameters(), [
            'userid' => $userid,
            'courseid' => $courseid,
            'periodstart' => $periodstart,
            'periodend' => $periodend,
        ]);

        // Validate context
        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);

        // Check permissions
        if ($params['userid'] != $USER->id && !has_capability('block/thinkroutine_consistency:viewall', $context)) {
            throw new \moodle_exception('nopermission', 'block_thinkroutine_consistency');
        }

        // Set default period if not provided (last 30 days)
        if ($params['periodend'] == 0) {
            $params['periodend'] = time();
        }
        if ($params['periodstart'] == 0) {
            $params['periodstart'] = $params['periodend'] - (30 * 24 * 60 * 60);
        }

        // Get overall score
        $overall_score = consistency_calculator::get_overall_score(
            $params['userid'],
            $params['courseid'],
            $params['periodstart'],
            $params['periodend']
        );

        // Get pattern scores
        $sql = "SELECT s.*, p.name, p.category, p.description
                FROM {block_trc_scores} s
                JOIN {block_trc_patterns} p ON s.patternid = p.id
                WHERE s.userid = :userid
                AND s.courseid = :courseid
                AND s.period_start = :periodstart
                AND s.period_end = :periodend
                ORDER BY s.score DESC";

        $scores = $DB->get_records_sql($sql, [
            'userid' => $params['userid'],
            'courseid' => $params['courseid'],
            'periodstart' => $params['periodstart'],
            'periodend' => $params['periodend']
        ]);

        $pattern_scores = [];
        foreach ($scores as $score) {
            $pattern_scores[] = [
                'patternid' => $score->patternid,
                'name' => $score->name,
                'category' => $score->category,
                'score' => $score->score,
                'frequency' => $score->frequency,
                'adherence_rate' => $score->adherence_rate,
                'consistency_index' => $score->consistency_index,
            ];
        }

        return [
            'overall_score' => $overall_score,
            'period_start' => $params['periodstart'],
            'period_end' => $params['periodend'],
            'pattern_scores' => $pattern_scores,
        ];
    }

    /**
     * Returns description of method result value
     *
     * @return external_single_structure
     */
    public static function execute_returns() {
        return new external_single_structure([
            'overall_score' => new external_value(PARAM_FLOAT, 'Overall consistency score'),
            'period_start' => new external_value(PARAM_INT, 'Period start timestamp'),
            'period_end' => new external_value(PARAM_INT, 'Period end timestamp'),
            'pattern_scores' => new external_multiple_structure(
                new external_single_structure([
                    'patternid' => new external_value(PARAM_INT, 'Pattern ID'),
                    'name' => new external_value(PARAM_TEXT, 'Pattern name'),
                    'category' => new external_value(PARAM_TEXT, 'Pattern category'),
                    'score' => new external_value(PARAM_FLOAT, 'Consistency score'),
                    'frequency' => new external_value(PARAM_INT, 'Usage frequency'),
                    'adherence_rate' => new external_value(PARAM_FLOAT, 'Adherence rate'),
                    'consistency_index' => new external_value(PARAM_FLOAT, 'Consistency index'),
                ])
            ),
        ]);
    }
}
