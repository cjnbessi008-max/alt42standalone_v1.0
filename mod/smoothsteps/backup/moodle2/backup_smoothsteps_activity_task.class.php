<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

require_once($CFG->dirroot . '/mod/smoothsteps/backup/moodle2/backup_smoothsteps_stepslib.php');

/**
 * Provides the steps to perform one complete backup of the smoothsteps instance
 */
class backup_smoothsteps_activity_task extends backup_activity_task {

    /**
     * No specific settings for this activity
     */
    protected function define_my_settings() {
    }

    /**
     * Defines backup steps to store the instance data and required questions
     */
    protected function define_my_steps() {
        // Generate the smoothsteps.xml file containing all the smoothsteps information
        // and annotating used questions
        $this->add_step(new backup_smoothsteps_activity_structure_step('smoothsteps_structure', 'smoothsteps.xml'));
    }

    /**
     * Encodes URLs to the index.php and view.php scripts
     *
     * @param string $content some HTML text that eventually contains URLs to the activity instance scripts
     * @return string the content with the URLs encoded
     */
    static public function encode_content_links($content) {
        global $CFG;

        $base = preg_quote($CFG->wwwroot, "/");

        // Link to the list of smoothsteps activities
        $search = "/(".$base."\/mod\/smoothsteps\/index.php\?id\=)([0-9]+)/";
        $content = preg_replace($search, '$@SMOOTHSTEPSINDEX*$2@$', $content);

        // Link to smoothsteps view by moduleid
        $search = "/(".$base."\/mod\/smoothsteps\/view.php\?id\=)([0-9]+)/";
        $content = preg_replace($search, '$@SMOOTHSTEPSVIEWBYID*$2@$', $content);

        return $content;
    }
}
