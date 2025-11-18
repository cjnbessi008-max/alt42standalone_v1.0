<?php
// This file is part of Moodle - http://moodle.org/
//
// Mini Trial Game - Course module instance list viewed event
//
// @package    mod_minitrial
// @copyright  2025 KAIST Touch Math Academy
// @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later

namespace mod_minitrial\event;

defined('MOODLE_INTERNAL') || die();

/**
 * Course module instance list viewed event class
 */
class course_module_instance_list_viewed extends \core\event\course_module_instance_list_viewed {

    /**
     * Init method
     */
    protected function init() {
        // No objecttable or objectid for this event.
    }
}
