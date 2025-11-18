<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Define all the backup steps that will be used by the backup_smoothsteps_activity_task
 */
class backup_smoothsteps_activity_structure_step extends backup_activity_structure_step {

    protected function define_structure() {

        // Define each element separated
        $smoothsteps = new backup_nested_element('smoothsteps', array('id'), array(
            'course', 'name', 'intro', 'introformat', 'distributiontype',
            'animationspeed', 'timecreated', 'timemodified'));

        $progress = new backup_nested_element('progress_entries');

        $progressentry = new backup_nested_element('progress', array('id'), array(
            'userid', 'attempt', 'correct', 'timespent', 'problemdata', 'timecreated'));

        $interactions = new backup_nested_element('interactions');

        $interaction = new backup_nested_element('interaction', array('id'), array(
            'userid', 'interactiontype', 'interactiondata', 'timecreated'));

        // Build the tree
        $smoothsteps->add_child($progress);
        $progress->add_child($progressentry);

        $smoothsteps->add_child($interactions);
        $interactions->add_child($interaction);

        // Define sources
        $smoothsteps->set_source_table('smoothsteps', array('id' => backup::VAR_ACTIVITYID));

        $progressentry->set_source_table('smoothsteps_progress',
            array('smoothstepsid' => backup::VAR_PARENTID));

        $interaction->set_source_table('smoothsteps_interactions',
            array('smoothstepsid' => backup::VAR_PARENTID));

        // Define id annotations
        $progressentry->annotate_ids('user', 'userid');
        $interaction->annotate_ids('user', 'userid');

        // Define file annotations (none for this module)
        $smoothsteps->annotate_files('mod_smoothsteps', 'intro', null);

        // Return the root element (smoothsteps)
        return $this->prepare_activity_structure($smoothsteps);
    }
}
