<?php
/**
 * Attention Monitor block
 *
 * @package    block_attention_monitor
 * @copyright  2025 Your Name
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

class block_attention_monitor extends block_base {

    public function init() {
        $this->title = get_string('pluginname', 'block_attention_monitor');
    }

    public function get_content() {
        global $USER, $COURSE, $CFG, $OUTPUT, $PAGE;

        if ($this->content !== null) {
            return $this->content;
        }

        $this->content = new stdClass;
        $this->content->text = '';
        $this->content->footer = '';

        // Check if user is logged in
        if (!isloggedin() || isguestuser()) {
            $this->content->text = html_writer::div(
                get_string('notloggedin', 'block_attention_monitor'),
                'alert alert-warning'
            );
            return $this->content;
        }

        // Get user consent status
        $consent = $this->get_user_consent($USER->id);

        if (!$consent) {
            // Show consent form
            $this->content->text = $this->render_consent_form();
        } else {
            // Show tracking interface
            $this->content->text = $this->render_tracking_interface();
        }

        // Add JavaScript and CSS
        $this->page->requires->js('/blocks/attention_monitor/js/attention_monitor.js');
        $this->page->requires->css('/blocks/attention_monitor/styles.css');

        return $this->content;
    }

    /**
     * Render consent form
     */
    private function render_consent_form() {
        global $USER, $COURSE;

        $html = html_writer::start_div('attention-monitor-consent');

        $html .= html_writer::tag('h4', get_string('consenttitle', 'block_attention_monitor'));

        $html .= html_writer::tag('p', get_string('consentdesc', 'block_attention_monitor'));

        $html .= html_writer::start_tag('ul');
        $html .= html_writer::tag('li', get_string('consentpoint1', 'block_attention_monitor'));
        $html .= html_writer::tag('li', get_string('consentpoint2', 'block_attention_monitor'));
        $html .= html_writer::tag('li', get_string('consentpoint3', 'block_attention_monitor'));
        $html .= html_writer::tag('li', get_string('consentpoint4', 'block_attention_monitor'));
        $html .= html_writer::end_tag('ul');

        // Consent button
        $consenturl = new moodle_url('/blocks/attention_monitor/consent.php', [
            'userid' => $USER->id,
            'courseid' => $COURSE->id,
            'sesskey' => sesskey()
        ]);

        $html .= html_writer::tag('button',
            get_string('giveconsent', 'block_attention_monitor'),
            [
                'class' => 'btn btn-primary',
                'onclick' => "window.location.href='{$consenturl->out(false)}'"
            ]
        );

        $html .= html_writer::end_div();

        return $html;
    }

    /**
     * Render tracking interface
     */
    private function render_tracking_interface() {
        global $USER, $COURSE, $CFG;

        $html = html_writer::start_div('attention-monitor-tracker');

        // Status indicator
        $html .= html_writer::start_div('tracker-status');
        $html .= html_writer::tag('span',
            get_string('status', 'block_attention_monitor') . ': ',
            ['class' => 'status-label']
        );
        $html .= html_writer::tag('span',
            get_string('inactive', 'block_attention_monitor'),
            ['class' => 'status-value', 'id' => 'tracker-status']
        );
        $html .= html_writer::end_div();

        // Attention score
        $html .= html_writer::start_div('attention-score');
        $html .= html_writer::tag('span',
            get_string('attentionscore', 'block_attention_monitor') . ': ',
            ['class' => 'score-label']
        );
        $html .= html_writer::tag('span',
            '--',
            ['class' => 'score-value', 'id' => 'attention-score']
        );
        $html .= html_writer::end_div();

        // Progress bar
        $html .= html_writer::start_div('attention-progress');
        $html .= html_writer::start_div('progress');
        $html .= html_writer::div('',
            'progress-bar bg-success',
            ['id' => 'attention-progress-bar', 'role' => 'progressbar', 'style' => 'width: 0%']
        );
        $html .= html_writer::end_div();
        $html .= html_writer::end_div();

        // Control buttons
        $html .= html_writer::start_div('tracker-controls');

        $html .= html_writer::tag('button',
            get_string('starttracking', 'block_attention_monitor'),
            [
                'class' => 'btn btn-success',
                'id' => 'start-tracking-btn',
                'onclick' => 'AttentionMonitor.start()'
            ]
        );

        $html .= html_writer::tag('button',
            get_string('stoptracking', 'block_attention_monitor'),
            [
                'class' => 'btn btn-danger',
                'id' => 'stop-tracking-btn',
                'onclick' => 'AttentionMonitor.stop()',
                'style' => 'display: none;'
            ]
        );

        $html .= html_writer::tag('button',
            get_string('viewreport', 'block_attention_monitor'),
            [
                'class' => 'btn btn-info',
                'id' => 'view-report-btn',
                'onclick' => 'AttentionMonitor.viewReport()'
            ]
        );

        $html .= html_writer::end_div();

        // Alerts container
        $html .= html_writer::div('',
            'attention-alerts',
            ['id' => 'attention-alerts']
        );

        // Hidden data attributes
        $html .= html_writer::start_div('tracker-data', [
            'data-user-id' => $USER->id,
            'data-course-id' => $COURSE->id,
            'data-api-base-url' => $CFG->wwwroot . '/blocks/attention_monitor/api',
            'style' => 'display: none;'
        ]);
        $html .= html_writer::end_div();

        $html .= html_writer::end_div();

        return $html;
    }

    /**
     * Get user consent status
     */
    private function get_user_consent($userid) {
        global $DB;

        // This would query your custom database or user preferences
        // For now, use Moodle's user preferences
        $consent = get_user_preferences('block_attention_monitor_consent', 0, $userid);
        return (bool)$consent;
    }

    /**
     * Which page types this block may appear on
     */
    public function applicable_formats() {
        return array(
            'course-view' => true,
            'mod' => true,
            'my' => false
        );
    }

    /**
     * Allow multiple instances
     */
    public function instance_allow_multiple() {
        return false;
    }

    /**
     * Has configuration
     */
    public function has_config() {
        return true;
    }

    /**
     * Serialize and store config data
     */
    public function instance_config_save($data, $nolongerused = false) {
        $config = clone($data);
        parent::instance_config_save($config, $nolongerused);
    }
}
