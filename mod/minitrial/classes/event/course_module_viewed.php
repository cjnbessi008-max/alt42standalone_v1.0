<?php
// This file is part of Moodle - http://moodle.org/
//
// Mini Trial Game - Course module viewed event
//
// @package    mod_minitrial
// @copyright  2025 KAIST Touch Math Academy
// @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later

namespace mod_minitrial\event;

defined('MOODLE_INTERNAL') || die();

/**
 * Course module viewed event class
 */
class course_module_viewed extends \core\event\course_module_viewed {

    /**
     * Init method
     */
    protected function init() {
        $this->data['objecttable'] = 'minitrial';
        $this->data['crud'] = 'r';
        $this->data['edulevel'] = self::LEVEL_PARTICIPATING;
    }

    public static function get_objectid_mapping() {
        return array('db' => 'minitrial', 'restore' => 'minitrial');
    }
}
