<?php
// This file is part of Rule Patternizer

namespace mod_rulepatternizer;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/mod/rulepatternizer/lib.php');

/**
 * API class for Rule Patternizer AJAX calls
 */
class api {

    /**
     * Get all available rules
     *
     * @return array
     */
    public static function get_rules() {
        global $DB;

        $rules = $DB->get_records('rulepatternizer_rules', null, 'difficulty_level ASC, id ASC');

        $result = array();
        foreach ($rules as $rule) {
            $result[] = array(
                'id' => $rule->id,
                'name' => $rule->rule_name,
                'formula' => $rule->rule_formula,
                'pattern_type' => $rule->pattern_type,
                'difficulty' => $rule->difficulty_level,
                'description' => $rule->description,
                'example' => $rule->example
            );
        }

        return array('rules' => $result);
    }

    /**
     * Get a specific problem
     *
     * @param int $problemid
     * @return array
     */
    public static function get_problem($problemid) {
        global $DB;

        $problem = $DB->get_record('rulepatternizer_problems', array('id' => $problemid));

        if (!$problem) {
            return array('error' => 'Problem not found');
        }

        return array(
            'id' => $problem->id,
            'rule_id' => $problem->rule_id,
            'problem_text' => $problem->problem_text,
            'problem_latex' => $problem->problem_latex,
            'hint' => $problem->hint,
            'difficulty' => $problem->difficulty_level
        );
    }

    /**
     * Get random problem for a rule
     *
     * @param int $ruleid
     * @param int $instanceid
     * @return array
     */
    public static function get_random_problem_for_rule($ruleid, $instanceid) {
        global $DB;

        $sql = "SELECT * FROM {rulepatternizer_problems}
                WHERE rule_id = :ruleid AND rulepatternizer_id = :instanceid
                ORDER BY RAND()
                LIMIT 1";

        $problem = $DB->get_record_sql($sql, array('ruleid' => $ruleid, 'instanceid' => $instanceid));

        if (!$problem) {
            return array('error' => 'No problems available for this rule');
        }

        return array(
            'id' => $problem->id,
            'rule_id' => $problem->rule_id,
            'problem_text' => $problem->problem_text,
            'problem_latex' => $problem->problem_latex,
            'hint' => $problem->hint,
            'difficulty' => $problem->difficulty_level
        );
    }

    /**
     * Submit an answer
     *
     * @param int $userid
     * @param int $instanceid
     * @param int $problemid
     * @param string $answer
     * @param int $timetaken
     * @return array
     */
    public static function submit_answer($userid, $instanceid, $problemid, $answer, $timetaken = 0) {
        global $DB;

        // Get the problem
        $problem = $DB->get_record('rulepatternizer_problems', array('id' => $problemid));

        if (!$problem) {
            return array('error' => 'Problem not found');
        }

        // Check if answer is correct
        $iscorrect = rulepatternizer_check_answer($answer, $problem->correct_answer);

        // Log the answer
        rulepatternizer_log_answer($userid, $problemid, $answer, $iscorrect, $timetaken);

        // Update progress
        rulepatternizer_update_progress($userid, $instanceid, $problem->rule_id, $problemid, $iscorrect);

        // Get updated progress
        $progress = rulepatternizer_get_user_progress($userid, $problem->rule_id, $instanceid);

        return array(
            'correct' => $iscorrect,
            'correct_answer' => $iscorrect ? null : $problem->correct_answer,
            'mastery_level' => $progress ? $progress->mastery_level : 0,
            'attempts' => $progress ? $progress->attempts : 0,
            'correct_count' => $progress ? $progress->correct_count : 0
        );
    }

    /**
     * Get user progress for all rules
     *
     * @param int $userid
     * @param int $instanceid
     * @return array
     */
    public static function get_user_progress($userid, $instanceid) {
        global $DB;

        $sql = "SELECT
                    r.id,
                    r.rule_name,
                    r.difficulty_level,
                    COALESCE(p.attempts, 0) as attempts,
                    COALESCE(p.correct_count, 0) as correct_count,
                    COALESCE(p.mastery_level, 0) as mastery_level
                FROM {rulepatternizer_rules} r
                LEFT JOIN {rulepatternizer_progress} p
                    ON r.id = p.rule_id
                    AND p.userid = :userid
                    AND p.rulepatternizer_id = :instanceid
                ORDER BY r.difficulty_level ASC, r.id ASC";

        $progress = $DB->get_records_sql($sql, array('userid' => $userid, 'instanceid' => $instanceid));

        $result = array();
        foreach ($progress as $p) {
            $result[] = array(
                'rule_id' => $p->id,
                'rule_name' => $p->rule_name,
                'difficulty' => $p->difficulty_level,
                'attempts' => $p->attempts,
                'correct_count' => $p->correct_count,
                'mastery_level' => round($p->mastery_level, 2)
            );
        }

        // Get overall stats
        $stats = rulepatternizer_get_user_stats($userid, $instanceid);

        return array(
            'progress' => $result,
            'stats' => array(
                'rules_attempted' => $stats->rules_attempted ? $stats->rules_attempted : 0,
                'total_attempts' => $stats->total_attempts ? $stats->total_attempts : 0,
                'total_correct' => $stats->total_correct ? $stats->total_correct : 0,
                'avg_mastery' => $stats->avg_mastery ? round($stats->avg_mastery, 2) : 0
            )
        );
    }

    /**
     * Get next recommended problem based on user progress
     *
     * @param int $userid
     * @param int $instanceid
     * @return array
     */
    public static function get_next_problem($userid, $instanceid) {
        global $DB;

        // Find rule with lowest mastery level
        $sql = "SELECT r.id, r.rule_name, COALESCE(p.mastery_level, 0) as mastery
                FROM {rulepatternizer_rules} r
                LEFT JOIN {rulepatternizer_progress} p
                    ON r.id = p.rule_id
                    AND p.userid = :userid
                    AND p.rulepatternizer_id = :instanceid
                ORDER BY mastery ASC, r.difficulty_level ASC
                LIMIT 1";

        $rule = $DB->get_record_sql($sql, array('userid' => $userid, 'instanceid' => $instanceid));

        if (!$rule) {
            return array('error' => 'No rules available');
        }

        // Get random problem for this rule
        return self::get_random_problem_for_rule($rule->id, $instanceid);
    }
}
