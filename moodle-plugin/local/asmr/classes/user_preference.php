<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * User preference manager for ASMR plugin
 *
 * @package    local_asmr
 * @copyright  2025 KAIST
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_asmr;

defined('MOODLE_INTERNAL') || die();

/**
 * Class for managing user preferences
 */
class user_preference {

    /** @var int Default volume level (0-100) */
    const DEFAULT_VOLUME = 70;

    /** @var bool Default auto-play setting */
    const DEFAULT_AUTO_PLAY = false;

    /** @var array Preference keys */
    const PREF_VOLUME = 'volume';
    const PREF_AUTO_PLAY = 'auto_play';
    const PREF_FAVORITES = 'favorites';
    const PREF_LAST_PLAYED = 'last_played';
    const PREF_PLAYLISTS = 'playlists';
    const PREF_LOOP = 'loop';
    const PREF_SHUFFLE = 'shuffle';

    /**
     * Get user preference
     *
     * @param int $userid User ID
     * @param string $key Preference key
     * @param mixed $default Default value if not set
     * @return mixed Preference value
     */
    public static function get($userid, $key, $default = null) {
        global $DB;

        $pref = $DB->get_record('asmr_user_prefs', array(
            'userid' => $userid,
            'prefkey' => $key
        ));

        if (!$pref) {
            return $default !== null ? $default : self::get_default($key);
        }

        // Decode JSON if applicable
        $value = $pref->prefvalue;
        $decoded = json_decode($value, true);

        return $decoded !== null ? $decoded : $value;
    }

    /**
     * Set user preference
     *
     * @param int $userid User ID
     * @param string $key Preference key
     * @param mixed $value Preference value
     * @return bool Success
     */
    public static function set($userid, $key, $value) {
        global $DB;

        // Encode value as JSON if it's an array or object
        if (is_array($value) || is_object($value)) {
            $value = json_encode($value);
        }

        $existing = $DB->get_record('asmr_user_prefs', array(
            'userid' => $userid,
            'prefkey' => $key
        ));

        if ($existing) {
            // Update existing preference
            $existing->prefvalue = $value;
            $existing->timemodified = time();
            return $DB->update_record('asmr_user_prefs', $existing);
        } else {
            // Insert new preference
            $pref = new \stdClass();
            $pref->userid = $userid;
            $pref->prefkey = $key;
            $pref->prefvalue = $value;
            $pref->timecreated = time();
            $pref->timemodified = time();
            return $DB->insert_record('asmr_user_prefs', $pref);
        }
    }

    /**
     * Delete user preference
     *
     * @param int $userid User ID
     * @param string $key Preference key
     * @return bool Success
     */
    public static function delete($userid, $key) {
        global $DB;

        return $DB->delete_records('asmr_user_prefs', array(
            'userid' => $userid,
            'prefkey' => $key
        ));
    }

    /**
     * Get all preferences for a user
     *
     * @param int $userid User ID
     * @return array Associative array of preferences
     */
    public static function get_all($userid) {
        global $DB;

        $prefs = $DB->get_records('asmr_user_prefs', array('userid' => $userid));
        $result = array();

        foreach ($prefs as $pref) {
            $value = $pref->prefvalue;
            $decoded = json_decode($value, true);
            $result[$pref->prefkey] = $decoded !== null ? $decoded : $value;
        }

        return $result;
    }

    /**
     * Get default value for a preference key
     *
     * @param string $key Preference key
     * @return mixed Default value
     */
    private static function get_default($key) {
        switch ($key) {
            case self::PREF_VOLUME:
                return self::DEFAULT_VOLUME;
            case self::PREF_AUTO_PLAY:
                return self::DEFAULT_AUTO_PLAY;
            case self::PREF_FAVORITES:
                return array();
            case self::PREF_PLAYLISTS:
                return array();
            case self::PREF_LOOP:
                return false;
            case self::PREF_SHUFFLE:
                return false;
            default:
                return null;
        }
    }

    /**
     * Add sound to favorites
     *
     * @param int $userid User ID
     * @param int $soundid Sound ID
     * @return bool Success
     */
    public static function add_favorite($userid, $soundid) {
        $favorites = self::get($userid, self::PREF_FAVORITES, array());

        if (!in_array($soundid, $favorites)) {
            $favorites[] = $soundid;
            return self::set($userid, self::PREF_FAVORITES, $favorites);
        }

        return true;
    }

    /**
     * Remove sound from favorites
     *
     * @param int $userid User ID
     * @param int $soundid Sound ID
     * @return bool Success
     */
    public static function remove_favorite($userid, $soundid) {
        $favorites = self::get($userid, self::PREF_FAVORITES, array());
        $key = array_search($soundid, $favorites);

        if ($key !== false) {
            unset($favorites[$key]);
            $favorites = array_values($favorites); // Re-index array
            return self::set($userid, self::PREF_FAVORITES, $favorites);
        }

        return true;
    }

    /**
     * Check if sound is favorited
     *
     * @param int $userid User ID
     * @param int $soundid Sound ID
     * @return bool Is favorited
     */
    public static function is_favorite($userid, $soundid) {
        $favorites = self::get($userid, self::PREF_FAVORITES, array());
        return in_array($soundid, $favorites);
    }

    /**
     * Get favorite sounds
     *
     * @param int $userid User ID
     * @return array Array of sound objects
     */
    public static function get_favorite_sounds($userid) {
        global $DB;

        $favorites = self::get($userid, self::PREF_FAVORITES, array());

        if (empty($favorites)) {
            return array();
        }

        list($insql, $params) = $DB->get_in_or_equal($favorites);
        $sql = "SELECT * FROM {asmr_sounds}
                WHERE id $insql
                AND isactive = 1
                ORDER BY name ASC";

        return $DB->get_records_sql($sql, $params);
    }

    /**
     * Update last played sound
     *
     * @param int $userid User ID
     * @param int $soundid Sound ID
     * @return bool Success
     */
    public static function update_last_played($userid, $soundid) {
        $data = array(
            'soundid' => $soundid,
            'time' => time()
        );

        return self::set($userid, self::PREF_LAST_PLAYED, $data);
    }

    /**
     * Get last played sound
     *
     * @param int $userid User ID
     * @return object|null Sound object or null
     */
    public static function get_last_played($userid) {
        global $DB;

        $data = self::get($userid, self::PREF_LAST_PLAYED, null);

        if (!$data || !isset($data['soundid'])) {
            return null;
        }

        return $DB->get_record('asmr_sounds', array('id' => $data['soundid']));
    }
}
