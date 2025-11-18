<?php
// This file is part of Moodle - http://moodle.org/
//
// Event for when an answer is submitted

namespace mod_sequencepearls\event;

defined('MOODLE_INTERNAL') || die();

/**
 * The answer_submitted event class
 */
class answer_submitted extends \core\event\base {

    /**
     * Init method
     */
    protected function init() {
        $this->data['crud'] = 'c';
        $this->data['edulevel'] = self::LEVEL_PARTICIPATING;
        $this->data['objecttable'] = 'sequencepearls_attempts';
    }

    /**
     * Returns localised general event name
     */
    public static function get_name() {
        return get_string('eventanswersubmitted', 'mod_sequencepearls');
    }

    /**
     * Returns description of what happened
     */
    public function get_description() {
        return "The user with id '$this->userid' submitted an answer for problem with id '$this->objectid' " .
               "in the sequencepearls activity with course module id '$this->contextinstanceid'.";
    }

    /**
     * Returns relevant URL
     */
    public function get_url() {
        return new \moodle_url('/mod/sequencepearls/view.php', array('id' => $this->contextinstanceid));
    }

    public static function get_objectid_mapping() {
        return array('db' => 'sequencepearls_attempts', 'restore' => 'sequencepearls_attempt');
    }
}
