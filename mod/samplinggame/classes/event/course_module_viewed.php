<?php
// This file is part of Moodle - http://moodle.org/

namespace mod_samplinggame\event;

defined('MOODLE_INTERNAL') || die();

/**
 * The course_module_viewed event class.
 */
class course_module_viewed extends \core\event\course_module_viewed {

    /**
     * Init method.
     */
    protected function init() {
        $this->data['objecttable'] = 'samplinggame';
        $this->data['crud'] = 'r';
        $this->data['edulevel'] = self::LEVEL_PARTICIPATING;
    }

    public static function get_objectid_mapping() {
        return array('db' => 'samplinggame', 'restore' => 'samplinggame');
    }
}
