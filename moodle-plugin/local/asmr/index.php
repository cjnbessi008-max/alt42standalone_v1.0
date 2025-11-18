<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * ASMR Player main page
 *
 * @package    local_asmr
 * @copyright  2025 KAIST
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once($CFG->dirroot . '/local/asmr/classes/sound_manager.php');
require_once($CFG->dirroot . '/local/asmr/classes/user_preference.php');

require_login();
require_capability('local/asmr:view', context_system::instance());

$PAGE->set_url('/local/asmr/index.php');
$PAGE->set_context(context_system::instance());
$PAGE->set_title(get_string('pluginname', 'local_asmr'));
$PAGE->set_heading(get_string('player_title', 'local_asmr'));
$PAGE->set_pagelayout('standard');

// Load CSS
$PAGE->requires->css('/local/asmr/styles.css');

// Load JavaScript modules
$PAGE->requires->js_call_amd('local_asmr/controls', 'init', array(
    array(
        'containerId' => 'asmr-player-container',
        'volume' => \local_asmr\user_preference::get($USER->id, 'volume', 70),
        'loop' => \local_asmr\user_preference::get($USER->id, 'loop', false),
        'shuffle' => \local_asmr\user_preference::get($USER->id, 'shuffle', false)
    )
));

echo $OUTPUT->header();

// Get sounds by category
$categories = array(
    'nature' => array('rain', 'ocean', 'forest', 'stream'),
    'ambient' => array('cafe', 'library', 'white_noise', 'pink_noise'),
    'meditation' => array('singing_bowl', 'chimes', 'breathing'),
    'focus' => array('lo-fi', 'classical', 'binaural')
);

?>

<div class="container-fluid">
    <div class="row">
        <div class="col-md-12">
            <h2><?php echo get_string('player_title', 'local_asmr'); ?></h2>
            <p class="text-muted"><?php echo get_string('help_asmr', 'local_asmr'); ?></p>
        </div>
    </div>

    <!-- Player Controls -->
    <div class="row">
        <div class="col-md-12">
            <div id="asmr-player-container"></div>
        </div>
    </div>

    <!-- Category Filters -->
    <div class="row mt-4">
        <div class="col-md-12">
            <div class="asmr-categories">
                <button class="asmr-category-btn active" data-category="all">
                    <?php echo get_string('all', 'core'); ?>
                </button>
                <button class="asmr-category-btn" data-category="nature">
                    🌳 <?php echo get_string('category_nature', 'local_asmr'); ?>
                </button>
                <button class="asmr-category-btn" data-category="ambient">
                    🎵 <?php echo get_string('category_ambient', 'local_asmr'); ?>
                </button>
                <button class="asmr-category-btn" data-category="meditation">
                    🧘 <?php echo get_string('category_meditation', 'local_asmr'); ?>
                </button>
                <button class="asmr-category-btn" data-category="focus">
                    📖 <?php echo get_string('category_focus', 'local_asmr'); ?>
                </button>
            </div>
        </div>
    </div>

    <!-- Sound Library -->
    <div class="row">
        <div class="col-md-12">
            <h3><?php echo get_string('sound_library', 'local_asmr'); ?></h3>
            <div id="asmr-sound-library" class="asmr-sound-library">
                <!-- Sounds will be loaded here via JavaScript -->
            </div>
        </div>
    </div>

    <!-- Favorites -->
    <div class="row mt-4">
        <div class="col-md-12">
            <h3><?php echo get_string('favorite_sounds', 'local_asmr'); ?></h3>
            <div id="asmr-favorites" class="asmr-sound-library">
                <?php
                $favorites = \local_asmr\user_preference::get_favorite_sounds($USER->id);
                if (empty($favorites)) {
                    echo '<p class="text-muted">' . get_string('no_sounds_found', 'local_asmr') . '</p>';
                } else {
                    foreach ($favorites as $sound) {
                        $url = \local_asmr\sound_manager::get_sound_url($sound);
                        echo '<div class="asmr-sound-card" data-soundid="' . $sound->id . '" data-url="' . $url . '">';
                        echo '<div class="asmr-sound-card-title">' . s($sound->name) . '</div>';
                        echo '<div class="asmr-sound-card-category">' . s($sound->category) . ' - ' . s($sound->subcategory) . '</div>';
                        echo '<div class="asmr-sound-card-info">';
                        echo '<span>⭐ ' . number_format($sound->rating, 1) . '</span>';
                        echo '<span>▶️ ' . $sound->playcount . '</span>';
                        echo '</div>';
                        echo '</div>';
                    }
                }
                ?>
            </div>
        </div>
    </div>
</div>

<script>
require(['jquery', 'local_asmr/controls'], function($, Controls) {
    // Load sounds
    function loadSounds(category) {
        $.ajax({
            url: M.cfg.wwwroot + '/local/asmr/ajax/get_sounds.php',
            data: {
                category: category === 'all' ? '' : category,
                limit: 50
            },
            success: function(response) {
                if (response.success) {
                    renderSounds(response.sounds);
                }
            }
        });
    }

    // Render sounds in grid
    function renderSounds(sounds) {
        var container = $('#asmr-sound-library');
        container.empty();

        if (sounds.length === 0) {
            container.html('<p class="text-muted">' + M.util.get_string('no_sounds_found', 'local_asmr') + '</p>');
            return;
        }

        sounds.forEach(function(sound) {
            var card = $('<div>').addClass('asmr-sound-card')
                .attr('data-soundid', sound.id)
                .attr('data-url', sound.url)
                .attr('data-name', sound.name);

            card.append($('<div>').addClass('asmr-sound-card-title').text(sound.name));
            card.append($('<div>').addClass('asmr-sound-card-category').text(sound.category + ' - ' + sound.subcategory));

            var info = $('<div>').addClass('asmr-sound-card-info');
            info.append($('<span>').html('⭐ ' + parseFloat(sound.rating).toFixed(1)));
            info.append($('<span>').html('▶️ ' + sound.playcount));
            card.append(info);

            container.append(card);
        });
    }

    // Category filter buttons
    $('.asmr-category-btn').on('click', function() {
        $('.asmr-category-btn').removeClass('active');
        $(this).addClass('active');
        var category = $(this).data('category');
        loadSounds(category);
    });

    // Sound card click
    $(document).on('click', '.asmr-sound-card', function() {
        var sound = {
            id: $(this).data('soundid'),
            url: $(this).data('url'),
            name: $(this).data('name')
        };

        // Get player instance (stored globally when initialized)
        if (window.asmrPlayer) {
            window.asmrPlayer.play(sound);
        }
    });

    // Load initial sounds
    loadSounds('all');
});
</script>

<?php

echo $OUTPUT->footer();
