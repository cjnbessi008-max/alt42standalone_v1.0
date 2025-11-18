-- ALT42 Seed Data
-- Sample data for development and testing

-- Insert common logical fallacies
INSERT INTO fallacies (name, category, description, severity, examples, educational_content) VALUES
(
    'Ad Hominem',
    'informal',
    'Attacking the person making the argument rather than the argument itself',
    'high',
    '["You can''t trust John''s argument about climate change because he''s not a scientist", "She says we should eat healthier, but she''s overweight herself"]'::jsonb,
    'Focus on evaluating the argument''s logic and evidence, not the person presenting it. An argument stands or falls on its own merits.'
),
(
    'Straw Man',
    'informal',
    'Misrepresenting someone''s argument to make it easier to attack',
    'high',
    '["Person A: We should improve public transportation. Person B: So you want to ban all cars?", "Opponent of gun control: You want to take away everyone''s guns and leave them defenseless"]'::jsonb,
    'Ensure you accurately represent the opposing viewpoint before critiquing it. Address the actual argument, not a distorted version.'
),
(
    'False Dichotomy',
    'informal',
    'Presenting only two options when more exist',
    'medium',
    '["Either you''re with us or against us", "We must either ban smartphones in schools or accept declining academic performance"]'::jsonb,
    'Recognize that most situations have multiple options and nuances. Avoid oversimplifying complex issues into binary choices.'
),
(
    'Circular Reasoning',
    'formal',
    'Using the conclusion as a premise (begging the question)',
    'high',
    '["The Bible is true because it says so in the Bible", "I''m trustworthy because I never lie"]'::jsonb,
    'Ensure your premises provide independent support for your conclusion. Avoid using the conclusion itself as evidence.'
),
(
    'Hasty Generalization',
    'informal',
    'Drawing a conclusion from insufficient evidence',
    'medium',
    '["My neighbor is rude, so all people from that country must be rude", "I got sick after eating at that restaurant once, so their food is always bad"]'::jsonb,
    'Ensure your sample size is adequate before generalizing. Look for patterns across multiple instances, not just one or two.'
),
(
    'Appeal to Authority',
    'informal',
    'Claiming something is true because an authority figure says so, without other evidence',
    'medium',
    '["Famous actor says this product works, so it must", "The CEO believes this strategy will work, so we should follow it"]'::jsonb,
    'While expert opinions matter, they should be supported by evidence and reasoning. Question whether the authority is truly qualified in the specific domain.'
),
(
    'Slippery Slope',
    'informal',
    'Arguing that one event will inevitably lead to a chain of events without evidence',
    'medium',
    '["If we allow students to redo assignments, soon they''ll expect to redo tests, then redo entire courses, and education will become meaningless", "If we raise minimum wage by $1, businesses will all close and the economy will collapse"]'::jsonb,
    'Provide evidence for each step in the proposed chain of events. Don''t assume one action automatically leads to extreme outcomes.'
),
(
    'Post Hoc Ergo Propter Hoc',
    'causal',
    'Assuming that because B comes after A, A caused B',
    'medium',
    '["I wore my lucky socks and we won the game, so the socks caused the win", "Crime rates dropped after the new mayor took office, so the mayor''s policies reduced crime"]'::jsonb,
    'Correlation does not imply causation. Look for evidence of a causal mechanism, not just temporal sequence.'
),
(
    'Red Herring',
    'informal',
    'Introducing irrelevant information to distract from the main issue',
    'medium',
    '["We should''n''t worry about the environment when there are people starving", "Why focus on my test score when other students also did poorly?"]'::jsonb,
    'Stay focused on the topic at hand. Address the actual issue rather than shifting to unrelated matters.'
),
(
    'Appeal to Emotion',
    'informal',
    'Manipulating emotions rather than using valid reasoning',
    'medium',
    '["Think of the children! We must ban this immediately", "Don''t you want your family to be safe? Buy this security system"]'::jsonb,
    'While emotions are valid, they shouldn''t replace logical reasoning. Evaluate arguments based on evidence and logic, not just emotional appeal.'
),
(
    'Bandwagon Fallacy',
    'informal',
    'Arguing something is true or right because many people believe it',
    'low',
    '["Everyone is doing it, so it must be okay", "This is the most popular product, so it must be the best"]'::jsonb,
    'Popular opinion doesn''t determine truth. Evaluate claims based on evidence, not popularity.'
),
(
    'False Cause',
    'causal',
    'Incorrectly assuming a cause-and-effect relationship',
    'medium',
    '["Countries with more internet users have higher GDP, so internet causes economic growth", "Students who take music classes get better grades, so music classes improve all academic performance"]'::jsonb,
    'Consider alternative explanations and confounding variables. Look for controlled studies that establish causation.'
),
(
    'Cherry Picking',
    'statistical',
    'Selecting only evidence that supports your position while ignoring contradictory evidence',
    'high',
    '["This study shows coffee is healthy (ignoring 10 studies showing health risks)", "Look at this cold day - climate change isn''t real (ignoring global temperature trends)"]'::jsonb,
    'Consider all relevant evidence, not just data that supports your position. Look at the complete picture.'
),
(
    'Equivocation',
    'formal',
    'Using a word with multiple meanings in different ways within the same argument',
    'medium',
    '["Nothing is better than eternal happiness. A sandwich is better than nothing. Therefore, a sandwich is better than eternal happiness", "Laws require law-givers. Natural laws exist. Therefore, nature has a law-giver"]'::jsonb,
    'Define your terms clearly and use them consistently throughout your argument.'
),
(
    'Composition Fallacy',
    'formal',
    'Assuming what is true of parts is true of the whole',
    'medium',
    '["Each player on the team is excellent, so the team must be excellent", "Atoms are colorless, so objects made of atoms must be colorless"]'::jsonb,
    'Properties of individual parts don''t always transfer to the whole. Consider emergent properties and interactions.'
),
(
    'Division Fallacy',
    'formal',
    'Assuming what is true of the whole is true of the parts',
    'medium',
    '["The company is profitable, so every department must be profitable", "The orchestra plays beautifully, so each musician must be excellent"]'::jsonb,
    'Properties of the whole don''t always apply to individual parts. Examine each component separately.'
);

-- Insert demo users (password: 'password123' for all - CHANGE IN PRODUCTION)
INSERT INTO users (email, username, password_hash, full_name, role, grade_level, institution) VALUES
(
    'admin@alt42.edu',
    'admin',
    crypt('password123', gen_salt('bf')),
    'System Administrator',
    'admin',
    NULL,
    'ALT42 Platform'
),
(
    'teacher1@alt42.edu',
    'teacher_kim',
    crypt('password123', gen_salt('bf')),
    'Kim Min-soo',
    'teacher',
    NULL,
    'Seoul High School'
),
(
    'student1@alt42.edu',
    'student_lee',
    crypt('password123', gen_salt('bf')),
    'Lee Ji-won',
    'student',
    'Grade 10',
    'Seoul High School'
),
(
    'student2@alt42.edu',
    'student_park',
    crypt('password123', gen_salt('bf')),
    'Park Seo-jun',
    'student',
    'Grade 11',
    'Seoul High School'
),
(
    'student3@alt42.edu',
    'student_choi',
    crypt('password123', gen_salt('bf')),
    'Choi Yu-na',
    'student',
    'Grade 10',
    'Busan Middle School'
);

-- Insert sample arguments
INSERT INTO arguments (user_id, title, content, topic, subject, difficulty_level, status)
SELECT
    u.id,
    'Homework Should Be Banned',
    'Homework should be completely banned in schools because my friend told me that she feels stressed from too much homework. If we don''t ban homework immediately, students will become so stressed that they will all develop mental health problems, drop out of school, and society will collapse. Everyone I know agrees that homework is bad, so it must be true. Also, countries with less homework have happier students, which proves homework causes unhappiness.',
    'Education Policy',
    'general',
    2,
    'completed'
FROM users u WHERE u.username = 'student_lee';

INSERT INTO arguments (user_id, title, content, topic, subject, difficulty_level, status)
SELECT
    u.id,
    'Video Games Improve Intelligence',
    'Video games make people smarter. I play video games every day and I got an A on my last test, so video games must have caused my good grade. My math teacher says video games are a waste of time, but he doesn''t even play games, so how would he know? Plus, if video games were really bad, why would millions of people play them?',
    'Gaming and Learning',
    'general',
    2,
    'completed'
FROM users u WHERE u.username = 'student_park';

INSERT INTO arguments (user_id, title, content, topic, subject, difficulty_level, status)
SELECT
    u.id,
    'Climate Change Debate',
    'Climate change cannot be real because it snowed heavily last winter in my city. Scientists say climate change is real, but many of them receive funding for climate research, so they''re just saying that to keep their jobs. We shouldn''t worry about the environment when there are still people who are hungry. Either we stop all carbon emissions immediately or accept that the planet is doomed - there''s no middle ground.',
    'Environmental Science',
    'science',
    3,
    'completed'
FROM users u WHERE u.username = 'student_choi';

-- Insert sample refutations for the arguments
INSERT INTO refutations (argument_id, analysis_summary, refutation_text, correct_reasoning, confidence_score, processing_time_ms)
SELECT
    a.id,
    'This argument contains multiple logical fallacies including hasty generalization, slippery slope, bandwagon fallacy, and false cause.',
    'Your argument contains several logical errors: 1) Hasty Generalization - Using one friend''s experience to conclude all students are stressed. 2) Slippery Slope - Claiming homework will lead to societal collapse without evidence for these extreme consequences. 3) Bandwagon Fallacy - Just because many people agree doesn''t make it true. 4) False Cause - Correlation between less homework and happiness doesn''t prove causation.',
    'A stronger argument would: 1) Provide statistical evidence of widespread stress, not just anecdotal cases. 2) Present research on the actual effects of homework on student wellbeing. 3) Consider nuanced solutions (e.g., reducing homework rather than complete elimination). 4) Account for potential benefits of homework while addressing legitimate concerns about excessive workload.',
    0.92,
    3420
FROM arguments a WHERE a.title = 'Homework Should Be Banned';

INSERT INTO refutations (argument_id, analysis_summary, refutation_text, correct_reasoning, confidence_score, processing_time_ms)
SELECT
    a.id,
    'This argument exhibits post hoc fallacy, ad hominem, and bandwagon reasoning.',
    'Your argument has these logical flaws: 1) Post Hoc Ergo Propter Hoc - Getting an A after playing games doesn''t prove games caused the grade. Many factors could explain your success. 2) Ad Hominem - Dismissing your teacher''s view because he doesn''t play games attacks the person, not the argument. 3) Bandwagon Fallacy - Popularity doesn''t determine whether something is beneficial.',
    'A better approach: 1) Review actual research on video games and cognitive development. 2) Consider confounding variables (your study habits, natural ability, teaching quality). 3) Acknowledge that different types of games may have different effects. 4) Recognize that games might have both benefits and drawbacks. 5) Address your teacher''s argument directly with evidence.',
    0.89,
    2890
FROM arguments a WHERE a.title = 'Video Games Improve Intelligence';

INSERT INTO refutations (argument_id, analysis_summary, refutation_text, correct_reasoning, confidence_score, processing_time_ms)
SELECT
    a.id,
    'Multiple fallacies detected: cherry picking, ad hominem, red herring, and false dichotomy.',
    'Your argument contains these errors: 1) Cherry Picking - One snowy winter doesn''t disprove global climate trends. Climate is about long-term patterns, not individual weather events. 2) Ad Hominem - Attacking scientists'' motives rather than their evidence. 3) Red Herring - Bringing up hunger distracts from the environmental discussion without showing they''re mutually exclusive. 4) False Dichotomy - Presenting only two extreme options when many intermediate solutions exist.',
    'Improve this argument by: 1) Distinguishing between weather (short-term) and climate (long-term patterns). 2) Examining the scientific evidence directly, not scientists'' funding. 3) Recognizing that multiple important issues can be addressed simultaneously. 4) Exploring graduated approaches to emissions reduction. 5) Engaging with the strongest climate science, not the easiest targets.',
    0.94,
    4150
FROM arguments a WHERE a.title = 'Climate Change Debate';

-- Link fallacies to refutations
DO $$
DECLARE
    ref_id UUID;
    fall_id UUID;
BEGIN
    -- Homework argument fallacies
    SELECT r.id INTO ref_id FROM refutations r
    JOIN arguments a ON r.argument_id = a.id
    WHERE a.title = 'Homework Should Be Banned';

    SELECT id INTO fall_id FROM fallacies WHERE name = 'Hasty Generalization';
    INSERT INTO fallacy_instances (refutation_id, fallacy_id, excerpt, explanation, severity, position_start, position_end)
    VALUES (ref_id, fall_id, 'my friend told me that she feels stressed', 'Using one friend''s experience to make a sweeping conclusion about all students', 'medium', 68, 110);

    SELECT id INTO fall_id FROM fallacies WHERE name = 'Slippery Slope';
    INSERT INTO fallacy_instances (refutation_id, fallacy_id, excerpt, explanation, severity, position_start, position_end)
    VALUES (ref_id, fall_id, 'students will become so stressed that they will all develop mental health problems, drop out of school, and society will collapse', 'Claiming extreme outcomes without evidence for this chain of events', 'high', 167, 294);

    SELECT id INTO fall_id FROM fallacies WHERE name = 'Bandwagon Fallacy';
    INSERT INTO fallacy_instances (refutation_id, fallacy_id, excerpt, explanation, severity, position_start, position_end)
    VALUES (ref_id, fall_id, 'Everyone I know agrees that homework is bad, so it must be true', 'Appealing to popular opinion rather than evidence', 'medium', 296, 362);

    SELECT id INTO fall_id FROM fallacies WHERE name = 'False Cause';
    INSERT INTO fallacy_instances (refutation_id, fallacy_id, excerpt, explanation, severity, position_start, position_end)
    VALUES (ref_id, fall_id, 'countries with less homework have happier students, which proves homework causes unhappiness', 'Assuming correlation equals causation', 'medium', 370, 465);

    -- Video games argument fallacies
    SELECT r.id INTO ref_id FROM refutations r
    JOIN arguments a ON r.argument_id = a.id
    WHERE a.title = 'Video Games Improve Intelligence';

    SELECT id INTO fall_id FROM fallacies WHERE name = 'Post Hoc Ergo Propter Hoc';
    INSERT INTO fallacy_instances (refutation_id, fallacy_id, excerpt, explanation, severity, position_start, position_end)
    VALUES (ref_id, fall_id, 'I play video games every day and I got an A on my last test, so video games must have caused my good grade', 'Assuming temporal sequence implies causation', 'high', 44, 149);

    SELECT id INTO fall_id FROM fallacies WHERE name = 'Ad Hominem';
    INSERT INTO fallacy_instances (refutation_id, fallacy_id, excerpt, explanation, severity, position_start, position_end)
    VALUES (ref_id, fall_id, 'My math teacher says video games are a waste of time, but he doesn''t even play games, so how would he know?', 'Attacking the teacher''s credibility rather than addressing the argument', 'high', 151, 267);

    SELECT id INTO fall_id FROM fallacies WHERE name = 'Bandwagon Fallacy';
    INSERT INTO fallacy_instances (refutation_id, fallacy_id, excerpt, explanation, severity, position_start, position_end)
    VALUES (ref_id, fall_id, 'if video games were really bad, why would millions of people play them?', 'Arguing that popularity indicates value or truth', 'low', 275, 349);

    -- Climate change argument fallacies
    SELECT r.id INTO ref_id FROM refutations r
    JOIN arguments a ON r.argument_id = a.id
    WHERE a.title = 'Climate Change Debate';

    SELECT id INTO fall_id FROM fallacies WHERE name = 'Cherry Picking';
    INSERT INTO fallacy_instances (refutation_id, fallacy_id, excerpt, explanation, severity, position_start, position_end)
    VALUES (ref_id, fall_id, 'Climate change cannot be real because it snowed heavily last winter in my city', 'Selecting one weather event while ignoring global long-term trends', 'high', 0, 82);

    SELECT id INTO fall_id FROM fallacies WHERE name = 'Ad Hominem';
    INSERT INTO fallacy_instances (refutation_id, fallacy_id, excerpt, explanation, severity, position_start, position_end)
    VALUES (ref_id, fall_id, 'many of them receive funding for climate research, so they''re just saying that to keep their jobs', 'Attacking scientists'' motives rather than evaluating their evidence', 'high', 139, 238);

    SELECT id INTO fall_id FROM fallacies WHERE name = 'Red Herring';
    INSERT INTO fallacy_instances (refutation_id, fallacy_id, excerpt, explanation, severity, position_start, position_end)
    VALUES (ref_id, fall_id, 'We shouldn''t worry about the environment when there are still people who are hungry', 'Introducing an irrelevant issue to distract from the main topic', 'medium', 240, 327);

    SELECT id INTO fall_id FROM fallacies WHERE name = 'False Dichotomy';
    INSERT INTO fallacy_instances (refutation_id, fallacy_id, excerpt, explanation, severity, position_start, position_end)
    VALUES (ref_id, fall_id, 'Either we stop all carbon emissions immediately or accept that the planet is doomed', 'Presenting only two extreme options when many alternatives exist', 'high', 329, 416);
END $$;

-- Initialize progress stats for students
INSERT INTO progress_stats (user_id, total_arguments, arguments_with_fallacies, average_confidence_score, mastery_level, current_streak, longest_streak)
SELECT
    u.id,
    COUNT(a.id),
    COUNT(a.id),
    AVG(r.confidence_score),
    CASE
        WHEN COUNT(a.id) >= 5 THEN 'intermediate'
        ELSE 'beginner'
    END,
    1,
    1
FROM users u
LEFT JOIN arguments a ON u.id = a.user_id
LEFT JOIN refutations r ON a.id = r.argument_id
WHERE u.role = 'student'
GROUP BY u.id;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✓ Seed data inserted successfully!';
    RAISE NOTICE '✓ Created % fallacy types', (SELECT COUNT(*) FROM fallacies);
    RAISE NOTICE '✓ Created % users (password: password123)', (SELECT COUNT(*) FROM users);
    RAISE NOTICE '✓ Created % sample arguments', (SELECT COUNT(*) FROM arguments);
    RAISE NOTICE '✓ Created % refutations', (SELECT COUNT(*) FROM refutations);
END $$;
