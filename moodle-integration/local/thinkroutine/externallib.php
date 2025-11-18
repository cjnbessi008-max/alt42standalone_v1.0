<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/externallib.php');
require_once($CFG->dirroot . '/local/thinkroutine/lib.php');

class local_thinkroutine_external extends external_api {

    /**
     * Returns description of get_student_activity parameters
     */
    public static function get_student_activity_parameters() {
        return new external_function_parameters(
            array(
                'userid' => new external_value(PARAM_INT, 'User ID'),
                'courseid' => new external_value(PARAM_INT, 'Course ID', VALUE_DEFAULT, 0),
                'timestart' => new external_value(PARAM_INT, 'Start timestamp', VALUE_DEFAULT, 0),
                'timeend' => new external_value(PARAM_INT, 'End timestamp', VALUE_DEFAULT, 0),
            )
        );
    }

    /**
     * Get student activity and performance data
     */
    public static function get_student_activity($userid, $courseid = 0, $timestart = 0, $timeend = 0) {
        global $DB, $USER;

        $params = self::validate_parameters(
            self::get_student_activity_parameters(),
            array('userid' => $userid, 'courseid' => $courseid, 'timestart' => $timestart, 'timeend' => $timeend)
        );

        $context = context_system::instance();
        self::validate_context($context);
        require_capability('moodle/site:viewreports', $context);

        if ($timeend == 0) {
            $timeend = time();
        }
        if ($timestart == 0) {
            $timestart = $timeend - (30 * 24 * 60 * 60); // Last 30 days
        }

        $analyzer = new \local_thinkroutine\analyzer();
        return $analyzer->get_student_activity_data($userid, $courseid, $timestart, $timeend);
    }

    /**
     * Returns description of get_student_activity return value
     */
    public static function get_student_activity_returns() {
        return new external_single_structure(
            array(
                'userid' => new external_value(PARAM_INT, 'User ID'),
                'total_sessions' => new external_value(PARAM_INT, 'Total learning sessions'),
                'avg_session_duration' => new external_value(PARAM_FLOAT, 'Average session duration (minutes)'),
                'total_time_spent' => new external_value(PARAM_FLOAT, 'Total time spent (hours)'),
                'completion_rate' => new external_value(PARAM_FLOAT, 'Activity completion rate (%)'),
                'avg_grade' => new external_value(PARAM_FLOAT, 'Average grade (%)'),
                'quiz_attempts' => new external_value(PARAM_INT, 'Number of quiz attempts'),
                'forum_posts' => new external_value(PARAM_INT, 'Number of forum posts'),
                'resource_views' => new external_value(PARAM_INT, 'Number of resource views'),
                'activity_pattern' => new external_single_structure(array(
                    'morning' => new external_value(PARAM_FLOAT, 'Morning activity %'),
                    'afternoon' => new external_value(PARAM_FLOAT, 'Afternoon activity %'),
                    'evening' => new external_value(PARAM_FLOAT, 'Evening activity %'),
                    'night' => new external_value(PARAM_FLOAT, 'Night activity %'),
                )),
                'peak_performance_time' => new external_value(PARAM_TEXT, 'Peak performance time period'),
                'learning_velocity' => new external_value(PARAM_FLOAT, 'Learning velocity score'),
            )
        );
    }

    /**
     * Returns description of get_course_analytics parameters
     */
    public static function get_course_analytics_parameters() {
        return new external_function_parameters(
            array(
                'courseid' => new external_value(PARAM_INT, 'Course ID'),
                'top_percentile' => new external_value(PARAM_FLOAT, 'Top percentile to analyze', VALUE_DEFAULT, 10.0),
            )
        );
    }

    /**
     * Get course analytics and top performer patterns
     */
    public static function get_course_analytics($courseid, $top_percentile = 10.0) {
        global $DB;

        $params = self::validate_parameters(
            self::get_course_analytics_parameters(),
            array('courseid' => $courseid, 'top_percentile' => $top_percentile)
        );

        $context = context_course::instance($courseid);
        self::validate_context($context);
        require_capability('moodle/course:viewhiddenactivities', $context);

        $analyzer = new \local_thinkroutine\analyzer();
        return $analyzer->get_top_performer_patterns($courseid, $top_percentile);
    }

    /**
     * Returns description of get_course_analytics return value
     */
    public static function get_course_analytics_returns() {
        return new external_single_structure(
            array(
                'courseid' => new external_value(PARAM_INT, 'Course ID'),
                'total_students' => new external_value(PARAM_INT, 'Total students'),
                'top_performers_count' => new external_value(PARAM_INT, 'Number of top performers'),
                'avg_top_performer_grade' => new external_value(PARAM_FLOAT, 'Average grade of top performers'),
                'common_patterns' => new external_multiple_structure(
                    new external_single_structure(array(
                        'pattern_type' => new external_value(PARAM_TEXT, 'Pattern type'),
                        'description' => new external_value(PARAM_TEXT, 'Pattern description'),
                        'frequency' => new external_value(PARAM_FLOAT, 'Frequency among top performers (%)'),
                        'impact_score' => new external_value(PARAM_FLOAT, 'Impact on performance'),
                    ))
                ),
                'optimal_study_duration' => new external_value(PARAM_FLOAT, 'Optimal study duration (minutes)'),
                'optimal_session_frequency' => new external_value(PARAM_FLOAT, 'Optimal sessions per week'),
                'recommended_time_of_day' => new external_value(PARAM_TEXT, 'Recommended study time'),
            )
        );
    }

    /**
     * Returns description of analyze_learning_patterns parameters
     */
    public static function analyze_learning_patterns_parameters() {
        return new external_function_parameters(
            array(
                'userid' => new external_value(PARAM_INT, 'User ID'),
                'courseid' => new external_value(PARAM_INT, 'Course ID'),
            )
        );
    }

    /**
     * Analyze learning patterns and provide personalized thinking routine recommendations
     */
    public static function analyze_learning_patterns($userid, $courseid) {
        global $DB;

        $params = self::validate_parameters(
            self::analyze_learning_patterns_parameters(),
            array('userid' => $userid, 'courseid' => $courseid)
        );

        $context = context_course::instance($courseid);
        self::validate_context($context);

        $analyzer = new \local_thinkroutine\analyzer();
        return $analyzer->generate_thinking_routine_recommendations($userid, $courseid);
    }

    /**
     * Returns description of analyze_learning_patterns return value
     */
    public static function analyze_learning_patterns_returns() {
        return new external_single_structure(
            array(
                'userid' => new external_value(PARAM_INT, 'User ID'),
                'courseid' => new external_value(PARAM_INT, 'Course ID'),
                'current_performance_percentile' => new external_value(PARAM_FLOAT, 'Current performance percentile'),
                'recommendations' => new external_multiple_structure(
                    new external_single_structure(array(
                        'category' => new external_value(PARAM_TEXT, 'Recommendation category'),
                        'title' => new external_value(PARAM_TEXT, 'Recommendation title'),
                        'description' => new external_value(PARAM_TEXT, 'Detailed recommendation'),
                        'priority' => new external_value(PARAM_TEXT, 'Priority level'),
                        'expected_impact' => new external_value(PARAM_FLOAT, 'Expected impact score'),
                    ))
                ),
                'thinking_routine' => new external_single_structure(array(
                    'morning_routine' => new external_value(PARAM_TEXT, 'Morning learning routine'),
                    'study_approach' => new external_value(PARAM_TEXT, 'Recommended study approach'),
                    'problem_solving_steps' => new external_value(PARAM_TEXT, 'Problem-solving methodology'),
                    'review_schedule' => new external_value(PARAM_TEXT, 'Review schedule'),
                )),
                'gap_analysis' => new external_multiple_structure(
                    new external_single_structure(array(
                        'area' => new external_value(PARAM_TEXT, 'Performance area'),
                        'current_level' => new external_value(PARAM_FLOAT, 'Current level'),
                        'top_performer_level' => new external_value(PARAM_FLOAT, 'Top performer level'),
                        'gap' => new external_value(PARAM_FLOAT, 'Performance gap'),
                        'improvement_strategy' => new external_value(PARAM_TEXT, 'Strategy to close gap'),
                    ))
                ),
            )
        );
    }
}
