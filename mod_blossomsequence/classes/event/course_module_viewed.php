<?php
/**
 * The mod_blossomsequence course module viewed event.
 *
 * @package    mod_blossomsequence
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace mod_blossomsequence\event;

defined('MOODLE_INTERNAL') || die();

/**
 * The mod_blossomsequence course module viewed event class.
 */
class course_module_viewed extends \core\event\course_module_viewed {

    /**
     * Init method.
     */
    protected function init() {
        $this->data['objecttable'] = 'blossomsequence';
        parent::init();
    }

    /**
     * Get URL related to the action
     *
     * @return \moodle_url
     */
    public function get_url() {
        return new \moodle_url('/mod/blossomsequence/view.php', array('id' => $this->contextinstanceid));
    }

    public static function get_objectid_mapping() {
        return array('db' => 'blossomsequence', 'restore' => 'blossomsequence');
    }
}
