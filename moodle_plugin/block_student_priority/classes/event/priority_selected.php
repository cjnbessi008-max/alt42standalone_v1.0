<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Priority selected event.
 *
 * @package    block_student_priority
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace block_student_priority\event;

defined('MOODLE_INTERNAL') || die();

/**
 * Priority selected event class
 */
class priority_selected extends \core\event\base {

    /**
     * Initialize the event
     */
    protected function init() {
        $this->data['crud'] = 'c';
        $this->data['edulevel'] = self::LEVEL_PARTICIPATING;
        $this->data['objecttable'] = 'block_student_priority';
    }

    /**
     * Get event name
     *
     * @return string Event name
     */
    public static function get_name() {
        return get_string('event_priority_selected', 'block_student_priority');
    }

    /**
     * Get event description
     *
     * @return string Event description
     */
    public function get_description() {
        return "The user with id '$this->relateduserid' selected priority step '{$this->objectid}' " .
               "in course '{$this->other['courseid']}'.";
    }

    /**
     * Get event URL
     *
     * @return \moodle_url Event URL
     */
    public function get_url() {
        return new \moodle_url('/course/view.php', array('id' => $this->other['courseid']));
    }

    /**
     * Custom validation
     *
     * @throws \coding_exception
     */
    protected function validate_data() {
        parent::validate_data();

        if (!isset($this->relateduserid)) {
            throw new \coding_exception('The \'relateduserid\' must be set.');
        }

        if (!isset($this->other['courseid'])) {
            throw new \coding_exception('The \'courseid\' value must be set in other.');
        }
    }

    /**
     * Get object ID mapping
     *
     * @return array Mapping
     */
    public static function get_objectid_mapping() {
        return array('db' => 'block_student_priority', 'restore' => 'block_student_priority');
    }

    /**
     * Get other mapping
     *
     * @return array Mapping
     */
    public static function get_other_mapping() {
        $othermapped = array();
        $othermapped['courseid'] = array('db' => 'course', 'restore' => 'course');
        return $othermapped;
    }
}
