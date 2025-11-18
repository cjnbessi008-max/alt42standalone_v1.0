<?php
// This file is part of Moodle - http://moodle.org/

namespace mod_3dlineseq\event;

defined('MOODLE_INTERNAL') || die();

/**
 * The course_module_instance_list_viewed event.
 */
class course_module_instance_list_viewed extends \core\event\course_module_instance_list_viewed {

    /**
     * Init method.
     */
    protected function init() {
        // No custom initialization needed.
    }
}
