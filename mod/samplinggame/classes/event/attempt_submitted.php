<?php
// This file is part of Moodle - http://moodle.org/

namespace mod_samplinggame\event;

defined('MOODLE_INTERNAL') || die();

/**
 * The attempt_submitted event class.
 */
class attempt_submitted extends \core\event\base {

    /**
     * Init method.
     */
    protected function init() {
        $this->data['objecttable'] = 'samplinggame_attempts';
        $this->data['crud'] = 'c';
        $this->data['edulevel'] = self::LEVEL_PARTICIPATING;
    }

    /**
     * Returns description of what happened.
     */
    public function get_description() {
        return "The user with id '$this->relateduserid' submitted an attempt for the sampling game with " .
               "course module id '$this->contextinstanceid'.";
    }

    /**
     * Return localised event name.
     */
    public static function get_name() {
        return get_string('eventattemptsubmitted', 'mod_samplinggame');
    }

    /**
     * Get URL related to the action.
     */
    public function get_url() {
        return new \moodle_url('/mod/samplinggame/view.php', array('id' => $this->contextinstanceid));
    }

    public static function get_objectid_mapping() {
        return array('db' => 'samplinggame_attempts', 'restore' => 'samplinggame_attempt');
    }
}
