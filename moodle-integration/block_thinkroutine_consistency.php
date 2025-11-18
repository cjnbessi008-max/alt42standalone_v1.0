<?php
/**
 * Block definition for Thinking Routine Consistency Score
 *
 * @package    block_thinkroutine_consistency
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

class block_thinkroutine_consistency extends block_base {

    /**
     * Initialize block
     */
    public function init() {
        $this->title = get_string('pluginname', 'block_thinkroutine_consistency');
    }

    /**
     * Allow multiple instances per page
     */
    public function instance_allow_multiple() {
        return false;
    }

    /**
     * Allow configuration
     */
    public function has_config() {
        return true;
    }

    /**
     * Applicable formats
     */
    public function applicable_formats() {
        return array(
            'course-view' => true,
            'site' => false,
            'mod' => false,
            'my' => true
        );
    }

    /**
     * Get block content
     */
    public function get_content() {
        global $USER, $COURSE, $OUTPUT;

        if ($this->content !== null) {
            return $this->content;
        }

        $this->content = new stdClass();
        $this->content->text = '';
        $this->content->footer = '';

        // Check if user is enrolled in course
        if (!isloggedin() || isguestuser()) {
            return $this->content;
        }

        // Get consistency scores for the current period (last 30 days)
        $periodend = time();
        $periodstart = $periodend - (30 * 24 * 60 * 60);

        // Get overall score
        $overall_score = \block_thinkroutine_consistency\consistency_calculator::get_overall_score(
            $USER->id,
            $COURSE->id,
            $periodstart,
            $periodend
        );

        // Get individual pattern scores
        $scores = $this->get_pattern_scores($USER->id, $COURSE->id, $periodstart, $periodend);

        // Render the content
        $this->content->text = $this->render_scores($overall_score, $scores);

        return $this->content;
    }

    /**
     * Get pattern scores for display
     */
    private function get_pattern_scores($userid, $courseid, $periodstart, $periodend) {
        global $DB;

        $sql = "SELECT s.*, p.name, p.category, p.description
                FROM {block_trc_scores} s
                JOIN {block_trc_patterns} p ON s.patternid = p.id
                WHERE s.userid = :userid
                AND s.courseid = :courseid
                AND s.period_start = :periodstart
                AND s.period_end = :periodend
                ORDER BY s.score DESC";

        return $DB->get_records_sql($sql, [
            'userid' => $userid,
            'courseid' => $courseid,
            'periodstart' => $periodstart,
            'periodend' => $periodend
        ]);
    }

    /**
     * Render scores HTML
     */
    private function render_scores($overall_score, $scores) {
        global $OUTPUT;

        $html = '';

        // Overall score display
        $html .= html_writer::start_div('trc-overall-score');
        $html .= html_writer::tag('h3', get_string('overallscore', 'block_thinkroutine_consistency'));
        $html .= html_writer::start_div('trc-score-circle ' . $this->get_score_class($overall_score));
        $html .= html_writer::tag('span', round($overall_score), ['class' => 'score-value']);
        $html .= html_writer::tag('span', '/100', ['class' => 'score-max']);
        $html .= html_writer::end_div();
        $html .= html_writer::end_div();

        // Individual pattern scores
        if (!empty($scores)) {
            $html .= html_writer::start_div('trc-pattern-scores');
            $html .= html_writer::tag('h4', get_string('patternscores', 'block_thinkroutine_consistency'));

            foreach ($scores as $score) {
                $html .= $this->render_pattern_score($score);
            }

            $html .= html_writer::end_div();
        } else {
            $html .= html_writer::div(
                get_string('noscoresyet', 'block_thinkroutine_consistency'),
                'alert alert-info'
            );
        }

        // Add link to detailed view
        $html .= html_writer::start_div('trc-actions');
        $url = new moodle_url('/blocks/thinkroutine_consistency/view.php', ['courseid' => $this->page->course->id]);
        $html .= html_writer::link($url, get_string('viewdetails', 'block_thinkroutine_consistency'), ['class' => 'btn btn-secondary']);
        $html .= html_writer::end_div();

        return $html;
    }

    /**
     * Render individual pattern score
     */
    private function render_pattern_score($score) {
        $html = html_writer::start_div('trc-pattern-item');

        $html .= html_writer::start_div('pattern-header');
        $html .= html_writer::tag('strong', $score->name);
        $html .= html_writer::tag('span', ' (' . $score->category . ')', ['class' => 'pattern-category']);
        $html .= html_writer::end_div();

        // Progress bar for score
        $html .= html_writer::start_div('progress');
        $score_class = $this->get_score_class($score->score);
        $html .= html_writer::div(
            round($score->score) . '%',
            'progress-bar ' . $score_class,
            ['style' => 'width: ' . $score->score . '%', 'role' => 'progressbar']
        );
        $html .= html_writer::end_div();

        // Additional metrics
        $html .= html_writer::start_div('pattern-metrics');
        $html .= html_writer::tag('small',
            get_string('frequency', 'block_thinkroutine_consistency') . ': ' . $score->frequency . ' | ' .
            get_string('adherence', 'block_thinkroutine_consistency') . ': ' . round($score->adherence_rate) . '% | ' .
            get_string('consistency', 'block_thinkroutine_consistency') . ': ' . round($score->consistency_index) . '%'
        );
        $html .= html_writer::end_div();

        $html .= html_writer::end_div();

        return $html;
    }

    /**
     * Get CSS class based on score value
     */
    private function get_score_class($score) {
        if ($score >= 80) {
            return 'bg-success';
        } else if ($score >= 60) {
            return 'bg-info';
        } else if ($score >= 40) {
            return 'bg-warning';
        } else {
            return 'bg-danger';
        }
    }
}
