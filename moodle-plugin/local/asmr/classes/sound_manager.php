<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Sound manager class for ASMR plugin
 *
 * @package    local_asmr
 * @copyright  2025 KAIST
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_asmr;

defined('MOODLE_INTERNAL') || die();

/**
 * Class for managing ASMR sounds
 */
class sound_manager {

    /**
     * Get sounds from the library
     *
     * @param string|null $category Category filter ('asmr' or 'effect')
     * @param string|null $subcategory Subcategory filter
     * @param int $limit Limit results
     * @param int $offset Offset for pagination
     * @return array Array of sound objects
     */
    public static function get_sounds($category = null, $subcategory = null, $limit = 50, $offset = 0) {
        global $DB;

        $params = array('isactive' => 1);
        $where = array('isactive = :isactive');

        if ($category) {
            $where[] = 'category = :category';
            $params['category'] = $category;
        }

        if ($subcategory) {
            $where[] = 'subcategory = :subcategory';
            $params['subcategory'] = $subcategory;
        }

        $sql = "SELECT * FROM {asmr_sounds}
                WHERE " . implode(' AND ', $where) . "
                ORDER BY playcount DESC, name ASC";

        return $DB->get_records_sql($sql, $params, $offset, $limit);
    }

    /**
     * Get a single sound by ID
     *
     * @param int $soundid Sound ID
     * @return object|false Sound object or false
     */
    public static function get_sound($soundid) {
        global $DB;
        return $DB->get_record('asmr_sounds', array('id' => $soundid));
    }

    /**
     * Upload a new sound
     *
     * @param object $filedata File data from form
     * @param int $userid User ID uploading the sound
     * @return int New sound ID
     */
    public static function upload_sound($filedata, $userid) {
        global $DB, $CFG;

        $fs = get_file_storage();
        $context = \context_system::instance();

        // Prepare file record
        $fileinfo = array(
            'contextid' => $context->id,
            'component' => 'local_asmr',
            'filearea' => 'sounds',
            'itemid' => 0,
            'filepath' => '/',
            'filename' => $filedata->get_filename(),
            'userid' => $userid
        );

        // Save file
        $storedfile = $fs->create_file_from_storedfile($fileinfo, $filedata);

        // Get audio duration (if possible)
        $duration = self::get_audio_duration($storedfile);

        // Insert sound record
        $sound = new \stdClass();
        $sound->name = self::clean_filename($filedata->get_filename());
        $sound->category = 'asmr'; // Default, can be changed
        $sound->filename = $storedfile->get_filename();
        $sound->filepath = $storedfile->get_filepath();
        $sound->duration = $duration;
        $sound->filesize = $storedfile->get_filesize();
        $sound->mimetype = $storedfile->get_mimetype();
        $sound->uploadedby = $userid;
        $sound->timecreated = time();
        $sound->timemodified = time();

        return $DB->insert_record('asmr_sounds', $sound);
    }

    /**
     * Delete a sound
     *
     * @param int $soundid Sound ID
     * @return bool Success
     */
    public static function delete_sound($soundid) {
        global $DB;

        $sound = self::get_sound($soundid);
        if (!$sound) {
            return false;
        }

        // Delete file
        $fs = get_file_storage();
        $context = \context_system::instance();
        $files = $fs->get_area_files($context->id, 'local_asmr', 'sounds', 0, 'filename', false);

        foreach ($files as $file) {
            if ($file->get_filename() === $sound->filename) {
                $file->delete();
            }
        }

        // Delete database record
        return $DB->delete_records('asmr_sounds', array('id' => $soundid));
    }

    /**
     * Update sound metadata
     *
     * @param int $soundid Sound ID
     * @param object $data Updated data
     * @return bool Success
     */
    public static function update_sound($soundid, $data) {
        global $DB;

        $sound = self::get_sound($soundid);
        if (!$sound) {
            return false;
        }

        $data->id = $soundid;
        $data->timemodified = time();

        return $DB->update_record('asmr_sounds', $data);
    }

    /**
     * Increment play count
     *
     * @param int $soundid Sound ID
     */
    public static function increment_playcount($soundid) {
        global $DB;

        $sql = "UPDATE {asmr_sounds}
                SET playcount = playcount + 1
                WHERE id = :soundid";

        $DB->execute($sql, array('soundid' => $soundid));
    }

    /**
     * Update sound rating
     *
     * @param int $soundid Sound ID
     * @param float $rating New rating (0-5)
     * @return bool Success
     */
    public static function update_rating($soundid, $rating) {
        global $DB;

        if ($rating < 0 || $rating > 5) {
            return false;
        }

        $sound = new \stdClass();
        $sound->id = $soundid;
        $sound->rating = $rating;
        $sound->timemodified = time();

        return $DB->update_record('asmr_sounds', $sound);
    }

    /**
     * Search sounds by name or tags
     *
     * @param string $query Search query
     * @param int $limit Limit results
     * @return array Array of sound objects
     */
    public static function search_sounds($query, $limit = 20) {
        global $DB;

        $sql = "SELECT * FROM {asmr_sounds}
                WHERE isactive = 1
                AND (name LIKE :query1 OR description LIKE :query2 OR tags LIKE :query3)
                ORDER BY playcount DESC
                LIMIT :limit";

        $params = array(
            'query1' => '%' . $query . '%',
            'query2' => '%' . $query . '%',
            'query3' => '%' . $query . '%',
            'limit' => $limit
        );

        return $DB->get_records_sql($sql, $params);
    }

    /**
     * Get popular sounds
     *
     * @param int $limit Number of sounds to return
     * @return array Array of sound objects
     */
    public static function get_popular_sounds($limit = 10) {
        global $DB;

        return $DB->get_records('asmr_sounds',
            array('isactive' => 1),
            'playcount DESC',
            '*',
            0,
            $limit
        );
    }

    /**
     * Get categories and their counts
     *
     * @return array Category statistics
     */
    public static function get_category_stats() {
        global $DB;

        $sql = "SELECT category, subcategory, COUNT(*) as count
                FROM {asmr_sounds}
                WHERE isactive = 1
                GROUP BY category, subcategory
                ORDER BY category, subcategory";

        return $DB->get_records_sql($sql);
    }

    /**
     * Clean filename for display
     *
     * @param string $filename Original filename
     * @return string Cleaned filename
     */
    private static function clean_filename($filename) {
        // Remove extension
        $name = pathinfo($filename, PATHINFO_FILENAME);

        // Replace underscores and hyphens with spaces
        $name = str_replace(array('_', '-'), ' ', $name);

        // Capitalize words
        $name = ucwords($name);

        return $name;
    }

    /**
     * Get audio duration from file
     *
     * @param stored_file $file Stored file object
     * @return int Duration in seconds (0 if unable to determine)
     */
    private static function get_audio_duration($file) {
        // This is a placeholder - actual implementation would need
        // audio processing library like getID3 or similar
        // For now, return 0
        return 0;
    }

    /**
     * Get file URL for a sound
     *
     * @param object $sound Sound object
     * @return \moodle_url File URL
     */
    public static function get_sound_url($sound) {
        $context = \context_system::instance();

        return \moodle_url::make_pluginfile_url(
            $context->id,
            'local_asmr',
            'sounds',
            0,
            $sound->filepath,
            $sound->filename
        );
    }
}
