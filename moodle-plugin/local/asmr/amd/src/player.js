// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Audio player for ASMR plugin
 *
 * @module     local_asmr/player
 * @package    local_asmr
 * @copyright  2025 KAIST
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['jquery', 'core/ajax', 'core/notification'], function($, Ajax, Notification) {

    /**
     * AudioPlayer class
     */
    class AudioPlayer {
        /**
         * Constructor
         * @param {Object} config Configuration options
         */
        constructor(config) {
            this.audio = new Audio();
            this.playlist = [];
            this.currentIndex = 0;
            this.volume = config.volume || 70;
            this.loop = config.loop || false;
            this.shuffle = config.shuffle || false;
            this.courseid = config.courseid || null;
            this.cmid = config.cmid || null;
            this.startTime = 0;

            this.initEventListeners();
        }

        /**
         * Initialize audio event listeners
         */
        initEventListeners() {
            this.audio.addEventListener('ended', this.onEnded.bind(this));
            this.audio.addEventListener('timeupdate', this.onTimeUpdate.bind(this));
            this.audio.addEventListener('error', this.onError.bind(this));
            this.audio.addEventListener('loadedmetadata', this.onLoadedMetadata.bind(this));
            this.audio.addEventListener('play', this.onPlay.bind(this));
            this.audio.addEventListener('pause', this.onPause.bind(this));

            // Set initial volume
            this.audio.volume = this.volume / 100;
        }

        /**
         * Play a sound
         * @param {Object} sound Sound object with id and url
         */
        play(sound) {
            if (!sound || !sound.url) {
                Notification.addNotification({
                    message: M.util.get_string('error_loading_sound', 'local_asmr'),
                    type: 'error'
                });
                return;
            }

            this.currentSound = sound;
            this.audio.src = sound.url;
            this.audio.load();
            this.audio.play();
            this.startTime = Date.now();

            // Log play action
            this.logUsage(sound.id, 'play', 0);
        }

        /**
         * Pause playback
         */
        pause() {
            this.audio.pause();

            if (this.currentSound) {
                const duration = Math.floor((Date.now() - this.startTime) / 1000);
                this.logUsage(this.currentSound.id, 'pause', duration);
            }
        }

        /**
         * Resume playback
         */
        resume() {
            this.audio.play();
            this.startTime = Date.now();
        }

        /**
         * Stop playback
         */
        stop() {
            if (this.currentSound) {
                const duration = Math.floor((Date.now() - this.startTime) / 1000);
                this.logUsage(this.currentSound.id, 'stop', duration);
            }

            this.audio.pause();
            this.audio.currentTime = 0;
        }

        /**
         * Set volume (0-100)
         * @param {Number} level Volume level
         */
        setVolume(level) {
            this.volume = Math.max(0, Math.min(100, level));
            this.audio.volume = this.volume / 100;

            // Save preference
            this.savePreference('volume', this.volume);
        }

        /**
         * Get current volume
         * @return {Number} Current volume (0-100)
         */
        getVolume() {
            return this.volume;
        }

        /**
         * Load playlist
         * @param {Array} sounds Array of sound objects
         */
        loadPlaylist(sounds) {
            this.playlist = sounds;
            this.currentIndex = 0;

            if (this.playlist.length > 0) {
                this.play(this.playlist[0]);
            }
        }

        /**
         * Play next track
         */
        next() {
            if (this.playlist.length === 0) {
                return;
            }

            if (this.currentSound) {
                const duration = Math.floor((Date.now() - this.startTime) / 1000);
                this.logUsage(this.currentSound.id, 'skip', duration);
            }

            if (this.shuffle) {
                this.currentIndex = Math.floor(Math.random() * this.playlist.length);
            } else {
                this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
            }

            this.play(this.playlist[this.currentIndex]);
        }

        /**
         * Play previous track
         */
        previous() {
            if (this.playlist.length === 0) {
                return;
            }

            this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
            this.play(this.playlist[this.currentIndex]);
        }

        /**
         * Toggle loop mode
         */
        toggleLoop() {
            this.loop = !this.loop;
            this.savePreference('loop', this.loop);
            return this.loop;
        }

        /**
         * Toggle shuffle mode
         */
        toggleShuffle() {
            this.shuffle = !this.shuffle;
            this.savePreference('shuffle', this.shuffle);
            return this.shuffle;
        }

        /**
         * Seek to position
         * @param {Number} position Position in seconds
         */
        seek(position) {
            this.audio.currentTime = position;
        }

        /**
         * Get current playback position
         * @return {Number} Position in seconds
         */
        getCurrentTime() {
            return this.audio.currentTime;
        }

        /**
         * Get total duration
         * @return {Number} Duration in seconds
         */
        getDuration() {
            return this.audio.duration;
        }

        /**
         * Check if playing
         * @return {Boolean} Is playing
         */
        isPlaying() {
            return !this.audio.paused;
        }

        /**
         * Event handler: track ended
         */
        onEnded() {
            if (this.currentSound) {
                const duration = Math.floor((Date.now() - this.startTime) / 1000);
                this.logUsage(this.currentSound.id, 'complete', duration);
            }

            if (this.loop) {
                this.play(this.currentSound);
            } else if (this.playlist.length > 1) {
                this.next();
            }
        }

        /**
         * Event handler: time update
         */
        onTimeUpdate() {
            $(document).trigger('asmr:timeupdate', {
                currentTime: this.audio.currentTime,
                duration: this.audio.duration,
                sound: this.currentSound
            });
        }

        /**
         * Event handler: metadata loaded
         */
        onLoadedMetadata() {
            $(document).trigger('asmr:loaded', {
                duration: this.audio.duration,
                sound: this.currentSound
            });
        }

        /**
         * Event handler: play
         */
        onPlay() {
            $(document).trigger('asmr:play', {
                sound: this.currentSound
            });
        }

        /**
         * Event handler: pause
         */
        onPause() {
            $(document).trigger('asmr:pause', {
                sound: this.currentSound
            });
        }

        /**
         * Event handler: error
         * @param {Event} event Error event
         */
        onError(event) {
            Notification.addNotification({
                message: M.util.get_string('error_loading_sound', 'local_asmr'),
                type: 'error'
            });

            $(document).trigger('asmr:error', {
                error: event,
                sound: this.currentSound
            });
        }

        /**
         * Log usage to server
         * @param {Number} soundid Sound ID
         * @param {String} action Action type
         * @param {Number} duration Duration in seconds
         */
        logUsage(soundid, action, duration) {
            Ajax.call([{
                methodname: 'local_asmr_log_usage',
                args: {
                    soundid: soundid,
                    action: action,
                    duration: duration,
                    courseid: this.courseid,
                    cmid: this.cmid,
                    volume: this.volume
                },
                fail: function(error) {
                    // Silent fail for logging
                    console.error('Failed to log usage:', error);
                }
            }]);
        }

        /**
         * Save user preference
         * @param {String} key Preference key
         * @param {*} value Preference value
         */
        savePreference(key, value) {
            Ajax.call([{
                methodname: 'local_asmr_save_preference',
                args: {
                    key: key,
                    value: JSON.stringify(value)
                },
                fail: function(error) {
                    console.error('Failed to save preference:', error);
                }
            }]);
        }
    }

    /**
     * Format time in MM:SS format
     * @param {Number} seconds Time in seconds
     * @return {String} Formatted time
     */
    function formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) {
            return '00:00';
        }

        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);

        return mins.toString().padStart(2, '0') + ':' +
               secs.toString().padStart(2, '0');
    }

    return {
        AudioPlayer: AudioPlayer,
        formatTime: formatTime
    };
});
