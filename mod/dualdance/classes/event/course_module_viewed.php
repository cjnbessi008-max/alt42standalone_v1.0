<?php
// This file is part of Moodle - http://moodle.org/

/**
 * The mod_dualdance course module viewed event.
 *
 * @package    mod_dualdance
 * @copyright  2025 AI Education System
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace mod_dualdance\event;

defined('MOODLE_INTERNAL') || die();

/**
 * The mod_dualdance course module viewed event class.
 */
class course_module_viewed extends \core\event\course_module_viewed {

    /**
     * Init method.
     */
    protected function init() {
        $this->data['crud'] = 'r';
        $this->data['edulevel'] = self::LEVEL_PARTICIPATING;
        $this->data['objecttable'] = 'dualdance';
    }

    public static function get_objectid_mapping() {
        return array('db' => 'dualdance', 'restore' => 'dualdance');
    }
}
