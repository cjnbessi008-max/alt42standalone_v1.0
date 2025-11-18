<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

class block_3dinsight extends block_base {

    public function init() {
        $this->title = get_string('pluginname', 'block_3dinsight');
    }

    public function get_content() {
        global $CFG, $PAGE, $COURSE;

        if ($this->content !== null) {
            return $this->content;
        }

        $this->content = new stdClass();
        $this->content->text = '';
        $this->content->footer = '';

        // Include required JavaScript libraries
        $PAGE->requires->js(new moodle_url($CFG->wwwroot . '/blocks/3dinsight/webapp/dist/bundle.js'));
        $PAGE->requires->css(new moodle_url($CFG->wwwroot . '/blocks/3dinsight/webapp/dist/styles.css'));

        // Get problem data for current course
        $problemdata = $this->get_problem_data($COURSE->id);

        // Create container for the 3D Insight Mode app
        $this->content->text = html_writer::div(
            '',
            '3dinsight-container',
            [
                'id' => '3dinsight-app',
                'data-course-id' => $COURSE->id,
                'data-problem-data' => json_encode($problemdata),
                'data-api-endpoint' => $CFG->wwwroot . '/blocks/3dinsight/api.php'
            ]
        );

        return $this->content;
    }

    public function applicable_formats() {
        return [
            'course-view' => true,
            'mod' => true,
            'my' => false
        ];
    }

    public function instance_allow_multiple() {
        return false;
    }

    public function has_config() {
        return true;
    }

    /**
     * Get problem data for the course
     * @param int $courseid
     * @return array
     */
    private function get_problem_data($courseid) {
        global $DB;

        $problems = $DB->get_records('block_3dinsight_problems', ['courseid' => $courseid]);

        $result = [];
        foreach ($problems as $problem) {
            $result[] = [
                'id' => $problem->id,
                'title' => $problem->title,
                'description' => $problem->description,
                'geometry_type' => $problem->geometry_type,
                'geometry_data' => json_decode($problem->geometry_data),
                'created_at' => $problem->timecreated
            ];
        }

        return $result;
    }
}
