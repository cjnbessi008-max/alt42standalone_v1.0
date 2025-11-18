<?php
/**
 * The mod_overlap_field course module viewed event.
 *
 * @package    mod_overlap_field
 * @copyright  2025 KAIST
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace mod_overlap_field\event;

defined('MOODLE_INTERNAL') || die();

/**
 * The mod_overlap_field course module viewed event class.
 */
class course_module_viewed extends \core\event\course_module_viewed {

    /**
     * Init method.
     */
    protected function init() {
        $this->data['crud'] = 'r';
        $this->data['edulevel'] = self::LEVEL_PARTICIPATING;
        $this->data['objecttable'] = 'overlap_field';
    }

    public static function get_objectid_mapping() {
        return array('db' => 'overlap_field', 'restore' => 'overlap_field');
    }
}
