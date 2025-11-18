<?php
// This file is part of Moodle - http://moodle.org/

/**
 * The mod_exponentialburst course module viewed event.
 *
 * @package    mod_exponentialburst
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace mod_exponentialburst\event;

defined('MOODLE_INTERNAL') || die();

/**
 * The mod_exponentialburst course module viewed event class.
 */
class course_module_viewed extends \core\event\course_module_viewed {

    /**
     * Init method.
     */
    protected function init() {
        $this->data['objecttable'] = 'exponentialburst';
        $this->data['crud'] = 'r';
        $this->data['edulevel'] = self::LEVEL_PARTICIPATING;
    }
}
