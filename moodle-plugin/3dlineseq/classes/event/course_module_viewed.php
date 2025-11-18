<?php
// This file is part of Moodle - http://moodle.org/

namespace mod_3dlineseq\event;

defined('MOODLE_INTERNAL') || die();

/**
 * The course_module_viewed event.
 */
class course_module_viewed extends \core\event\course_module_viewed {

    /**
     * Init method.
     */
    protected function init() {
        $this->data['objecttable'] = '3dlineseq';
        parent::init();
    }

    public static function get_objectid_mapping() {
        return array('db' => '3dlineseq', 'restore' => '3dlineseq');
    }
}
