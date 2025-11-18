-- Seed data for DMN Rest Routines
-- Insert sample rest routines

INSERT INTO dmn_routines (name, description, duration_seconds, type, complexity_level, instructions, media_url) VALUES
(
    'Deep Breathing Exercise',
    'Simple breathing exercise to reset focus and calm the mind',
    60,
    'breathing',
    1,
    '{"steps": ["Sit comfortably in your chair", "Close your eyes gently", "Breathe in slowly through your nose for 4 counts", "Hold your breath for 4 counts", "Breathe out slowly through your mouth for 4 counts", "Repeat this cycle 5 times"], "tips": "Focus on the sensation of breathing"}',
    NULL
),
(
    'Progressive Muscle Relaxation',
    'Quick muscle tension and release exercise',
    90,
    'physical',
    2,
    '{"steps": ["Sit up straight", "Tense your shoulders, hold for 5 seconds", "Release and feel the relaxation", "Clench your fists, hold for 5 seconds", "Release slowly", "Tense your leg muscles, hold", "Release and breathe"], "tips": "Notice the difference between tension and relaxation"}',
    NULL
),
(
    'Tree Visualization',
    'Guided visualization exercise to relax and refresh the mind',
    120,
    'visualization',
    2,
    '{"steps": ["Close your eyes", "Imagine a small seed in rich soil", "See roots growing down into the earth", "Watch a stem push up toward the sun", "See branches spreading out", "Notice leaves unfurling", "Feel the tree strong and peaceful", "Open your eyes slowly"], "tips": "Make the image as vivid as possible"}',
    NULL
),
(
    'Desk Stretch',
    'Physical movement to refresh body and mind',
    90,
    'physical',
    1,
    '{"steps": ["Stand up from your chair", "Stretch both arms overhead", "Roll your shoulders backward 5 times", "Do gentle neck rolls - left, right", "Bend forward slightly and reach toward your toes", "Take 3 deep breaths", "Sit back down"], "tips": "Move slowly and gently, never force a stretch"}',
    NULL
),
(
    '5-4-3-2-1 Mindfulness',
    'Sensory awareness exercise to ground yourself in the present',
    120,
    'mindfulness',
    3,
    '{"steps": ["Pause and take a deep breath", "Notice 5 things you can see around you", "Notice 4 things you can touch or feel", "Notice 3 things you can hear", "Notice 2 things you can smell (or would like to smell)", "Notice 1 thing you can taste"], "tips": "Take your time with each sense, really notice the details"}',
    NULL
),
(
    'Counting Meditation',
    'Simple counting meditation for mental clarity',
    90,
    'mindfulness',
    2,
    '{"steps": ["Sit comfortably", "Close your eyes", "Breathe naturally", "Count each exhale from 1 to 10", "If you lose count, start over at 1", "Repeat for 90 seconds", "Open your eyes"], "tips": "It''s normal to lose count - just gently start again"}',
    NULL
),
(
    'Energy Shake',
    'Quick physical movement to boost energy',
    60,
    'physical',
    1,
    '{"steps": ["Stand up", "Shake your hands vigorously for 10 seconds", "Shake your arms", "Gently bounce on your toes", "Shake your legs one at a time", "Take a deep breath", "Sit back down feeling refreshed"], "tips": "Let go of any tension as you shake"}',
    NULL
),
(
    'Color Breathing',
    'Visualization combined with breathing for relaxation',
    120,
    'visualization',
    3,
    '{"steps": ["Sit comfortably", "Close your eyes", "Imagine breathing in a calming blue color", "See it filling your body with peace", "Breathe out any tension as gray color", "Continue for several breaths", "Notice how you feel"], "tips": "Choose any color that feels calming to you"}',
    NULL
),
(
    'Gratitude Pause',
    'Brief gratitude reflection for positive mindset',
    60,
    'cognitive_break',
    2,
    '{"steps": ["Take a deep breath", "Think of one thing you''re grateful for today", "It can be something small", "Notice how it makes you feel", "Take another deep breath", "Return to your task"], "tips": "Even small things count - a sunny day, a good meal, a kind word"}',
    NULL
),
(
    'Eye Rest',
    'Eye relaxation exercise for screen fatigue',
    60,
    'physical',
    1,
    '{"steps": ["Look away from your screen", "Focus on something far away (20 feet) for 20 seconds", "Close your eyes gently", "Rub your palms together to warm them", "Cup your palms over your closed eyes", "Rest for 20 seconds", "Open your eyes slowly"], "tips": "Do this every 20 minutes when using screens"}',
    NULL
);

-- Verify insertion
SELECT COUNT(*) as routine_count FROM dmn_routines;
SELECT name, type, duration_seconds FROM dmn_routines ORDER BY complexity_level, duration_seconds;
