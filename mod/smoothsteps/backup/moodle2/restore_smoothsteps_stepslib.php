<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Define all the restore steps that will be used by the restore_smoothsteps_activity_task
 */
class restore_smoothsteps_activity_structure_step extends restore_activity_structure_step {

    protected function define_structure() {

        $paths = array();
        $userinfo = $this->get_setting_value('userinfo');

        $paths[] = new restore_path_element('smoothsteps', '/activity/smoothsteps');

        if ($userinfo) {
            $paths[] = new restore_path_element('smoothsteps_progress', '/activity/smoothsteps/progress_entries/progress');
            $paths[] = new restore_path_element('smoothsteps_interaction', '/activity/smoothsteps/interactions/interaction');
        }

        // Return the paths wrapped into standard activity structure
        return $this->prepare_activity_structure($paths);
    }

    protected function process_smoothsteps($data) {
        global $DB;

        $data = (object)$data;
        $oldid = $data->id;
        $data->course = $this->get_courseid();

        $data->timecreated = $this->apply_date_offset($data->timecreated);
        $data->timemodified = $this->apply_date_offset($data->timemodified);

        // Insert the smoothsteps record
        $newitemid = $DB->insert_record('smoothsteps', $data);
        // Immediately after inserting, call this
        $this->apply_activity_instance($newitemid);
    }

    protected function process_smoothsteps_progress($data) {
        global $DB;

        $data = (object)$data;
        $oldid = $data->id;

        $data->smoothstepsid = $this->get_new_parentid('smoothsteps');
        $data->userid = $this->get_mappingid('user', $data->userid);
        $data->timecreated = $this->apply_date_offset($data->timecreated);

        $newitemid = $DB->insert_record('smoothsteps_progress', $data);
        // No need to save this mapping normally
    }

    protected function process_smoothsteps_interaction($data) {
        global $DB;

        $data = (object)$data;
        $oldid = $data->id;

        $data->smoothstepsid = $this->get_new_parentid('smoothsteps');
        $data->userid = $this->get_mappingid('user', $data->userid);
        $data->timecreated = $this->apply_date_offset($data->timecreated);

        $newitemid = $DB->insert_record('smoothsteps_interactions', $data);
        // No need to save this mapping normally
    }

    protected function after_execute() {
        // Add smoothsteps related files, no need to match by itemname (just internally handled context)
        $this->add_related_files('mod_smoothsteps', 'intro', null);
    }
}
