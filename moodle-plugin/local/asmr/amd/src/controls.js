// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Player controls UI for ASMR plugin
 *
 * @module     local_asmr/controls
 * @package    local_asmr
 * @copyright  2025 KAIST
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['jquery', 'local_asmr/player'], function($, Player) {

    /**
     * PlayerControls class
     */
    class PlayerControls {
        /**
         * Constructor
         * @param {AudioPlayer} player Audio player instance
         * @param {String} containerId Container element ID
         */
        constructor(player, containerId) {
            this.player = player;
            this.container = $('#' + containerId);

            if (this.container.length === 0) {
                console.error('Container not found:', containerId);
                return;
            }

            this.render();
            this.bindEvents();
            this.initPlayerEvents();
        }

        /**
         * Render player controls
         */
        render() {
            const html = `
                <div class="asmr-player-controls">
                    <div class="asmr-player-info">
                        <div class="asmr-now-playing">
                            <span class="asmr-sound-name">-</span>
                        </div>
                    </div>

                    <div class="asmr-progress-container">
                        <span class="asmr-time-current">00:00</span>
                        <div class="asmr-progress-bar">
                            <div class="asmr-progress-fill"></div>
                            <div class="asmr-progress-handle"></div>
                        </div>
                        <span class="asmr-time-total">00:00</span>
                    </div>

                    <div class="asmr-controls-main">
                        <button class="asmr-btn asmr-btn-previous" title="${M.util.get_string('previous', 'local_asmr')}">
                            <i class="fa fa-step-backward"></i>
                        </button>

                        <button class="asmr-btn asmr-btn-play" title="${M.util.get_string('play', 'local_asmr')}">
                            <i class="fa fa-play"></i>
                        </button>

                        <button class="asmr-btn asmr-btn-pause" style="display:none;" title="${M.util.get_string('pause', 'local_asmr')}">
                            <i class="fa fa-pause"></i>
                        </button>

                        <button class="asmr-btn asmr-btn-next" title="${M.util.get_string('next', 'local_asmr')}">
                            <i class="fa fa-step-forward"></i>
                        </button>

                        <div class="asmr-volume-control">
                            <button class="asmr-btn asmr-btn-volume">
                                <i class="fa fa-volume-up"></i>
                            </button>
                            <input type="range" class="asmr-volume-slider" min="0" max="100" value="70">
                            <span class="asmr-volume-value">70%</span>
                        </div>

                        <button class="asmr-btn asmr-btn-loop" title="${M.util.get_string('loop', 'local_asmr')}">
                            <i class="fa fa-repeat"></i>
                        </button>

                        <button class="asmr-btn asmr-btn-shuffle" title="${M.util.get_string('shuffle', 'local_asmr')}">
                            <i class="fa fa-random"></i>
                        </button>
                    </div>
                </div>
            `;

            this.container.html(html);

            // Cache elements
            this.elements = {
                soundName: this.container.find('.asmr-sound-name'),
                timeCurrent: this.container.find('.asmr-time-current'),
                timeTotal: this.container.find('.asmr-time-total'),
                progressBar: this.container.find('.asmr-progress-bar'),
                progressFill: this.container.find('.asmr-progress-fill'),
                btnPlay: this.container.find('.asmr-btn-play'),
                btnPause: this.container.find('.asmr-btn-pause'),
                btnPrevious: this.container.find('.asmr-btn-previous'),
                btnNext: this.container.find('.asmr-btn-next'),
                btnLoop: this.container.find('.asmr-btn-loop'),
                btnShuffle: this.container.find('.asmr-btn-shuffle'),
                volumeSlider: this.container.find('.asmr-volume-slider'),
                volumeValue: this.container.find('.asmr-volume-value'),
                btnVolume: this.container.find('.asmr-btn-volume')
            };

            // Set initial volume
            this.elements.volumeSlider.val(this.player.getVolume());
            this.updateVolumeDisplay(this.player.getVolume());
        }

        /**
         * Bind UI events
         */
        bindEvents() {
            // Play button
            this.elements.btnPlay.on('click', () => {
                if (this.player.currentSound) {
                    this.player.resume();
                }
            });

            // Pause button
            this.elements.btnPause.on('click', () => {
                this.player.pause();
            });

            // Previous button
            this.elements.btnPrevious.on('click', () => {
                this.player.previous();
            });

            // Next button
            this.elements.btnNext.on('click', () => {
                this.player.next();
            });

            // Loop button
            this.elements.btnLoop.on('click', () => {
                const loopEnabled = this.player.toggleLoop();
                this.elements.btnLoop.toggleClass('active', loopEnabled);
            });

            // Shuffle button
            this.elements.btnShuffle.on('click', () => {
                const shuffleEnabled = this.player.toggleShuffle();
                this.elements.btnShuffle.toggleClass('active', shuffleEnabled);
            });

            // Volume slider
            this.elements.volumeSlider.on('input', (e) => {
                const volume = parseInt(e.target.value);
                this.player.setVolume(volume);
                this.updateVolumeDisplay(volume);
            });

            // Progress bar seek
            this.elements.progressBar.on('click', (e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                const duration = this.player.getDuration();
                const seekTime = duration * percent;
                this.player.seek(seekTime);
            });
        }

        /**
         * Initialize player event listeners
         */
        initPlayerEvents() {
            $(document).on('asmr:play', (e, data) => {
                this.onPlay(data.sound);
            });

            $(document).on('asmr:pause', () => {
                this.onPause();
            });

            $(document).on('asmr:timeupdate', (e, data) => {
                this.updateProgress(data.currentTime, data.duration);
            });

            $(document).on('asmr:loaded', (e, data) => {
                this.elements.timeTotal.text(Player.formatTime(data.duration));
            });
        }

        /**
         * Handle play event
         * @param {Object} sound Sound object
         */
        onPlay(sound) {
            this.elements.btnPlay.hide();
            this.elements.btnPause.show();
            this.elements.soundName.text(sound.name);
        }

        /**
         * Handle pause event
         */
        onPause() {
            this.elements.btnPlay.show();
            this.elements.btnPause.hide();
        }

        /**
         * Update progress bar
         * @param {Number} currentTime Current time in seconds
         * @param {Number} duration Total duration in seconds
         */
        updateProgress(currentTime, duration) {
            if (!duration || duration <= 0) {
                return;
            }

            const percent = (currentTime / duration) * 100;
            this.elements.progressFill.css('width', percent + '%');
            this.elements.timeCurrent.text(Player.formatTime(currentTime));
        }

        /**
         * Update volume display
         * @param {Number} volume Volume level (0-100)
         */
        updateVolumeDisplay(volume) {
            this.elements.volumeValue.text(volume + '%');

            // Update volume icon
            const icon = this.elements.btnVolume.find('i');
            icon.removeClass('fa-volume-off fa-volume-down fa-volume-up');

            if (volume === 0) {
                icon.addClass('fa-volume-off');
            } else if (volume < 50) {
                icon.addClass('fa-volume-down');
            } else {
                icon.addClass('fa-volume-up');
            }
        }
    }

    return {
        PlayerControls: PlayerControls,

        /**
         * Initialize player with controls
         * @param {Object} config Configuration options
         * @return {Object} Player and controls instances
         */
        init: function(config) {
            const player = new Player.AudioPlayer(config);
            const controls = new PlayerControls(player, config.containerId || 'asmr-player-container');

            return {
                player: player,
                controls: controls
            };
        }
    };
});
