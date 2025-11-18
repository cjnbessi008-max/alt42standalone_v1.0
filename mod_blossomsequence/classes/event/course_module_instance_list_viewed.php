<?php
/**
 * The mod_blossomsequence course module instance list viewed event.
 *
 * @package    mod_blossomsequence
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace mod_blossomsequence\event;

defined('MOODLE_INTERNAL') || die();

/**
 * The mod_blossomsequence course module instance list viewed event class.
 */
class course_module_instance_list_viewed extends \core\event\course_module_instance_list_viewed {

    /**
     * Get URL related to the action
     *
     * @return \moodle_url
     */
    public function get_url() {
        return new \moodle_url('/mod/blossomsequence/index.php', array('id' => $this->courseid));
    }

    /**
     * Init method.
     */
    protected function init() {
        $this->data['crud'] = 'r';
        $this->data['edulevel'] = self::LEVEL_TEACHING;
    }

    public static function get_objectid_mapping() {
        // No mapping available for 'blossomsequence' (not an object).
        return array('db' => 'blossomsequence', 'restore' => 'blossomsequence');
    }
}
