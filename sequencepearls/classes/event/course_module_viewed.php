<?php
// This file is part of Moodle - http://moodle.org/
//
// Event for when a course module is viewed

namespace mod_sequencepearls\event;

defined('MOODLE_INTERNAL') || die();

/**
 * The course_module_viewed event class
 */
class course_module_viewed extends \core\event\course_module_viewed {

    /**
     * Init method
     */
    protected function init() {
        $this->data['objecttable'] = 'sequencepearls';
        $this->data['crud'] = 'r';
        $this->data['edulevel'] = self::LEVEL_PARTICIPATING;
    }

    /**
     * Custom validation
     */
    protected function validate_data() {
        parent::validate_data();
    }

    public static function get_objectid_mapping() {
        return array('db' => 'sequencepearls', 'restore' => 'sequencepearls');
    }
}
