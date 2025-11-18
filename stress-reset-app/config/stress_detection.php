<?php
/**
 * Stress Detection Configuration
 */

return [
    // Time-based detection
    'time_threshold_minutes' => 45, // Trigger after 45 minutes of continuous study
    'idle_threshold_seconds' => 300, // Consider idle if no activity for 5 minutes

    // Activity pattern detection
    'click_rate_threshold' => 60, // Clicks per minute (excessive clicking)
    'typing_speed_threshold' => 120, // Characters per minute (rapid typing)
    'pattern_window_minutes' => 10, // Time window to analyze patterns

    // Combined score thresholds
    'stress_score_threshold' => 70, // 0-100 scale, trigger at 70

    // Weights for different factors
    'weights' => [
        'time_factor' => 0.4,
        'click_factor' => 0.3,
        'typing_factor' => 0.3,
    ],

    // Reset cooldown
    'reset_cooldown_minutes' => 15, // Don't trigger again for 15 minutes after reset
];
