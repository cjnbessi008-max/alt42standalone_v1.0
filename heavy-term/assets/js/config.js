/**
 * Heavy Term Configuration
 * Default configuration values
 */

const HeavyTermConfig = {
    // API Configuration
    api: {
        baseURL: '/heavy-term/api/api.php',
        timeout: 10000,
    },

    // Physics Configuration
    physics: {
        gravity_strength: 9.8,
        gravity_multiplier: 2.0,
        bounce_damping: 0.7,
        friction_coefficient: 0.98,
        max_velocity: 500,
        enable_gravity: true,
        enable_collisions: true,
    },

    // Smartphone Screen Configuration
    smartphone: {
        width: 375,
        height: 550,
    },

    // Demo Problem Configuration
    demo: {
        problem: {
            id: 1,
            moodle_question_id: 1001,
            moodle_course_id: 1,
            question_text: '다음 수식을 간단히 하시오: 3x² + 5x + 2x² - 3x + 10',
            question_type: 'simplify',
            difficulty_level: 'medium'
        },
        terms: [
            { id: 1, term_text: '3x²', term_size: 6, term_weight: 3.0 },
            { id: 2, term_text: '5x', term_size: 4, term_weight: 1.7 },
            { id: 3, term_text: '2x²', term_size: 5, term_weight: 2.3 },
            { id: 4, term_text: '3x', term_size: 3, term_weight: 1.5 },
            { id: 5, term_text: '10', term_size: 2, term_weight: 2.0 },
            { id: 6, term_text: '5x²', term_size: 7, term_weight: 2.7 },
            { id: 7, term_text: '2x', term_size: 3, term_weight: 1.3 },
            { id: 8, term_text: 'x³', term_size: 8, term_weight: 1.0 },
            { id: 9, term_text: '√25', term_size: 5, term_weight: 1.4 },
            { id: 10, term_text: '(x+2)', term_size: 4, term_weight: 1.2 }
        ]
    },

    // User Configuration
    user: {
        default_user_id: 1,
    },

    // Debug Configuration
    debug: {
        enabled: true,
        showGravityField: true,
        showVelocityVectors: false,
    },

    // Animation Configuration
    animation: {
        fps_target: 60,
        enable_smooth_dragging: true,
    },

    // Interaction Configuration
    interaction: {
        drag_threshold: 5, // pixels
        tap_duration: 200, // milliseconds
        double_tap_interval: 300, // milliseconds
    }
};

// Freeze config to prevent accidental modifications
Object.freeze(HeavyTermConfig.api);
Object.freeze(HeavyTermConfig.smartphone);
Object.freeze(HeavyTermConfig.demo);
Object.freeze(HeavyTermConfig.user);
Object.freeze(HeavyTermConfig.animation);
Object.freeze(HeavyTermConfig.interaction);
