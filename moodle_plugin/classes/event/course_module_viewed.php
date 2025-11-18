<?php
// Event definition for course module viewed

namespace mod_dotcollector\event;

defined('MOODLE_INTERNAL') || die();

class course_module_viewed extends \core\event\course_module_viewed {
    protected function init() {
        $this->data['objecttable'] = 'dotcollector';
        parent::init();
    }

    public static function get_objectid_mapping() {
        return array('db' => 'dotcollector', 'restore' => 'dotcollector');
    }
}
