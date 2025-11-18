<?php
/**
 * Light Effect Configuration
 */

return [
    // Effect duration
    'duration_seconds' => 10,

    // Color transitions (RGB values)
    'color_sequence' => [
        ['r' => 100, 'g' => 150, 'b' => 255], // Soft blue
        ['r' => 120, 'g' => 220, 'b' => 180], // Calming green
        ['r' => 255, 'g' => 255, 'b' => 255], // White
    ],

    // Animation settings
    'transition_easing' => 'ease-in-out',
    'opacity_start' => 0.8,
    'opacity_end' => 0.0,

    // Visual style
    'blur_amount' => '20px',
    'overlay_z_index' => 9999,

    // Sound (optional)
    'play_sound' => true,
    'sound_file' => '/assets/sounds/gentle-chime.mp3',
    'sound_volume' => 0.3,

    // Message display
    'show_message' => true,
    'message_text' => '잠시 휴식하세요 / Take a brief break',
    'message_duration_seconds' => 5,
];
