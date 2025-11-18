<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Geo Spiral block main class
 *
 * @package    block_geospiral
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

class block_geospiral extends block_base {

    /**
     * Initialize block instance
     */
    public function init() {
        $this->title = get_string('pluginname', 'block_geospiral');
    }

    /**
     * Allow multiple instances of this block
     */
    public function instance_allow_multiple() {
        return false;
    }

    /**
     * Get block content
     */
    public function get_content() {
        global $CFG, $USER, $COURSE;

        if ($this->content !== null) {
            return $this->content;
        }

        $this->content = new stdClass;
        $this->content->text = '';
        $this->content->footer = '';

        // Only show to logged in users
        if (!isloggedin() || isguestuser()) {
            return $this->content;
        }

        // Get course context
        $context = context_course::instance($COURSE->id);

        // Check if user has capability to view
        if (!has_capability('block/geospiral:view', $context)) {
            return $this->content;
        }

        // Generate unique container ID
        $containerid = 'geospiral-container-' . $this->instance->id;

        // Build the content
        $this->content->text = html_writer::start_div('geospiral-block');

        // Add description
        $this->content->text .= html_writer::tag('p',
            get_string('blockdescription', 'block_geospiral'),
            array('class' => 'geospiral-description')
        );

        // Add launch button
        $launchurl = new moodle_url('/blocks/geospiral/view.php', array(
            'courseid' => $COURSE->id,
            'userid' => $USER->id
        ));

        $this->content->text .= html_writer::link(
            $launchurl,
            get_string('launchapp', 'block_geospiral'),
            array('class' => 'btn btn-primary geospiral-launch-btn')
        );

        // Add container for virtual phone (will be populated by JavaScript)
        $this->content->text .= html_writer::div('', 'geospiral-phone-container', array('id' => $containerid));

        $this->content->text .= html_writer::end_div();

        // Include JavaScript and CSS
        $this->page->requires->css('/blocks/geospiral/styles/geospiral.css');
        $this->page->requires->js('/blocks/geospiral/js/geospiral-init.js');

        // Pass configuration to JavaScript
        $config = array(
            'userid' => $USER->id,
            'courseid' => $COURSE->id,
            'containerid' => $containerid,
            'apiurl' => $CFG->wwwroot . '/blocks/geospiral/api.php'
        );

        $this->page->requires->js_init_call('initGeoSpiral', array($config));

        return $this->content;
    }

    /**
     * Define where this block can be added
     */
    public function applicable_formats() {
        return array(
            'course-view' => true,
            'site' => true,
            'my' => true
        );
    }

    /**
     * Does this block have a global settings page?
     */
    public function has_config() {
        return true;
    }
}
