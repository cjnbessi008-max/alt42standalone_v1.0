-- ====================================================================
-- Ranking & Achievement System Schema
-- LMS Integration for AI Education System Pipeline
-- Created: 2025-11-18
-- ====================================================================

-- ====================================================================
-- 1. ACHIEVEMENT SYSTEM TABLES
-- ====================================================================

-- Achievement Definitions: Predefined achievements that students can earn
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    name_ko VARCHAR(255) NOT NULL, -- Korean translation
    description TEXT NOT NULL,
    description_ko TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'completion',      -- Complete modules/lessons
        'mastery',         -- High performance scores
        'streak',          -- Consecutive days/activities
        'speed',           -- Time-based achievements
        'exploration',     -- Try different modules/topics
        'collaboration',   -- Future: team-based achievements
        'special'          -- Special event achievements
    )),
    icon_url VARCHAR(500),
    badge_color VARCHAR(7), -- Hex color code
    points INTEGER NOT NULL DEFAULT 0, -- Points awarded for earning this achievement
    criteria JSONB NOT NULL, -- JSON criteria for earning (e.g., {"modules_completed": 5})
    tier VARCHAR(20) CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Student Achievements: Track which students have earned which achievements
CREATE TABLE student_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP DEFAULT NOW(),
    module_id UUID REFERENCES modules(id), -- Optional: achievement earned in specific module
    metadata JSONB, -- Additional context (e.g., score when earned, specific problem)

    UNIQUE(student_id, achievement_id) -- Each achievement earned once per student
);

-- Achievement Progress: Track progress toward achievements not yet earned
CREATE TABLE achievement_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    current_value INTEGER NOT NULL DEFAULT 0,
    target_value INTEGER NOT NULL,
    last_updated TIMESTAMP DEFAULT NOW(),

    UNIQUE(student_id, achievement_id)
);

-- ====================================================================
-- 2. RANKING & LEADERBOARD TABLES
-- ====================================================================

-- Student Rankings: Overall ranking across all activities
CREATE TABLE student_rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    total_points INTEGER NOT NULL DEFAULT 0,
    modules_completed INTEGER NOT NULL DEFAULT 0,
    problems_solved INTEGER NOT NULL DEFAULT 0,
    accuracy_percentage DECIMAL(5,2) DEFAULT 0.0, -- 0.00 to 100.00
    total_time_spent_minutes INTEGER NOT NULL DEFAULT 0,
    current_streak_days INTEGER DEFAULT 0,
    longest_streak_days INTEGER DEFAULT 0,
    global_rank INTEGER,
    grade_rank INTEGER, -- Rank within same grade level
    last_activity_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(student_id)
);

-- Module Rankings: Rankings specific to each module
CREATE TABLE module_rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    completion_percentage DECIMAL(5,2) DEFAULT 0.0,
    average_score DECIMAL(5,2) DEFAULT 0.0,
    time_spent_minutes INTEGER NOT NULL DEFAULT 0,
    problems_attempted INTEGER NOT NULL DEFAULT 0,
    problems_correct INTEGER NOT NULL DEFAULT 0,
    module_rank INTEGER, -- Rank within this module
    completed_at TIMESTAMP,
    first_attempt_at TIMESTAMP,
    last_attempt_at TIMESTAMP,

    UNIQUE(student_id, module_id)
);

-- Leaderboard Snapshots: Historical leaderboard data for trends
CREATE TABLE leaderboard_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE NOT NULL,
    leaderboard_type VARCHAR(50) NOT NULL CHECK (leaderboard_type IN (
        'global',
        'grade',
        'module',
        'weekly',
        'monthly'
    )),
    scope_id UUID, -- module_id for module leaderboards, null for global
    rankings JSONB NOT NULL, -- Array of {student_id, rank, points, score}
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(snapshot_date, leaderboard_type, scope_id)
);

-- ====================================================================
-- 3. PERFORMANCE METRICS TABLES
-- ====================================================================

-- Daily Activity Log: Track daily student activity for streaks and trends
CREATE TABLE daily_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    modules_accessed INTEGER DEFAULT 0,
    problems_attempted INTEGER DEFAULT 0,
    problems_correct INTEGER DEFAULT 0,
    time_spent_minutes INTEGER DEFAULT 0,
    points_earned INTEGER DEFAULT 0,
    achievements_earned INTEGER DEFAULT 0,

    UNIQUE(student_id, activity_date)
);

-- Subject Mastery: Track mastery level across different math topics
CREATE TABLE subject_mastery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL, -- e.g., "fractions", "algebra", "geometry"
    mastery_level VARCHAR(20) CHECK (mastery_level IN (
        'beginner',
        'developing',
        'proficient',
        'advanced',
        'expert'
    )),
    mastery_percentage DECIMAL(5,2) DEFAULT 0.0,
    total_practice_time_minutes INTEGER DEFAULT 0,
    last_practiced_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(student_id, subject)
);

-- Learning Analytics: Detailed analytics for graphs and insights
CREATE TABLE learning_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL, -- e.g., "accuracy_trend", "time_efficiency", "difficulty_progression"
    metric_data JSONB NOT NULL, -- Time-series data: [{date, value}, ...]
    analysis_period VARCHAR(20) CHECK (analysis_period IN (
        'daily',
        'weekly',
        'monthly',
        'all_time'
    )),
    calculated_at TIMESTAMP DEFAULT NOW(),

    INDEX idx_learning_analytics_student_module (student_id, module_id),
    INDEX idx_learning_analytics_type (metric_type)
);

-- ====================================================================
-- 4. POINTS & REWARDS TABLES
-- ====================================================================

-- Point Transactions: Detailed log of all point changes
CREATE TABLE point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    points_change INTEGER NOT NULL, -- Can be positive or negative
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
        'problem_solved',
        'module_completed',
        'achievement_earned',
        'streak_bonus',
        'accuracy_bonus',
        'speed_bonus',
        'daily_login',
        'penalty',
        'admin_adjustment'
    )),
    reference_id UUID, -- ID of related entity (problem, module, achievement)
    reference_type VARCHAR(50), -- Type of reference (problem, module, achievement)
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Rewards Catalog: Available rewards that students can unlock
CREATE TABLE rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    name_ko VARCHAR(255) NOT NULL,
    description TEXT,
    description_ko TEXT,
    reward_type VARCHAR(50) CHECK (reward_type IN (
        'avatar',          -- Avatar customization
        'theme',           -- UI theme
        'badge',           -- Display badge
        'title',           -- Student title/rank
        'feature_unlock',  -- Unlock special features
        'certificate'      -- Printable certificate
    )),
    cost_points INTEGER NOT NULL,
    unlock_requirements JSONB, -- Additional requirements beyond points
    icon_url VARCHAR(500),
    is_available BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Student Rewards: Track which rewards students have unlocked
CREATE TABLE student_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP DEFAULT NOW(),
    is_equipped BOOLEAN DEFAULT false, -- Currently using this reward

    UNIQUE(student_id, reward_id)
);

-- ====================================================================
-- 5. INDEXES FOR PERFORMANCE
-- ====================================================================

-- Achievement indexes
CREATE INDEX idx_student_achievements_student ON student_achievements(student_id);
CREATE INDEX idx_student_achievements_earned ON student_achievements(earned_at DESC);
CREATE INDEX idx_achievement_progress_student ON achievement_progress(student_id);

-- Ranking indexes
CREATE INDEX idx_student_rankings_global_rank ON student_rankings(global_rank);
CREATE INDEX idx_student_rankings_grade_rank ON student_rankings(grade_rank);
CREATE INDEX idx_student_rankings_points ON student_rankings(total_points DESC);
CREATE INDEX idx_module_rankings_module ON module_rankings(module_id);
CREATE INDEX idx_module_rankings_rank ON module_rankings(module_rank);

-- Activity indexes
CREATE INDEX idx_daily_activity_student_date ON daily_activity_log(student_id, activity_date DESC);
CREATE INDEX idx_daily_activity_date ON daily_activity_log(activity_date DESC);

-- Points indexes
CREATE INDEX idx_point_transactions_student ON point_transactions(student_id, created_at DESC);
CREATE INDEX idx_point_transactions_type ON point_transactions(transaction_type);

-- Subject mastery indexes
CREATE INDEX idx_subject_mastery_student ON subject_mastery(student_id);
CREATE INDEX idx_subject_mastery_subject ON subject_mastery(subject);

-- ====================================================================
-- 6. VIEWS FOR COMMON QUERIES
-- ====================================================================

-- Global Leaderboard View
CREATE VIEW v_global_leaderboard AS
SELECT
    sr.student_id,
    s.name AS student_name,
    s.grade_level,
    sr.global_rank,
    sr.total_points,
    sr.modules_completed,
    sr.problems_solved,
    sr.accuracy_percentage,
    sr.current_streak_days,
    COUNT(DISTINCT sa.achievement_id) AS achievements_earned,
    sr.last_activity_at
FROM student_rankings sr
JOIN students s ON sr.student_id = s.id
LEFT JOIN student_achievements sa ON sr.student_id = sa.student_id
GROUP BY sr.student_id, s.name, s.grade_level, sr.global_rank,
         sr.total_points, sr.modules_completed, sr.problems_solved,
         sr.accuracy_percentage, sr.current_streak_days, sr.last_activity_at
ORDER BY sr.global_rank NULLS LAST;

-- Student Achievement Summary View
CREATE VIEW v_student_achievement_summary AS
SELECT
    s.id AS student_id,
    s.name AS student_name,
    COUNT(sa.id) AS total_achievements,
    SUM(a.points) AS achievement_points,
    COUNT(CASE WHEN a.tier = 'bronze' THEN 1 END) AS bronze_achievements,
    COUNT(CASE WHEN a.tier = 'silver' THEN 1 END) AS silver_achievements,
    COUNT(CASE WHEN a.tier = 'gold' THEN 1 END) AS gold_achievements,
    COUNT(CASE WHEN a.tier = 'platinum' THEN 1 END) AS platinum_achievements,
    COUNT(CASE WHEN a.tier = 'diamond' THEN 1 END) AS diamond_achievements,
    MAX(sa.earned_at) AS last_achievement_earned
FROM students s
LEFT JOIN student_achievements sa ON s.id = sa.student_id
LEFT JOIN achievements a ON sa.achievement_id = a.id
GROUP BY s.id, s.name;

-- Module Performance View
CREATE VIEW v_module_performance AS
SELECT
    mr.module_id,
    m.name AS module_name,
    COUNT(DISTINCT mr.student_id) AS total_students,
    AVG(mr.completion_percentage) AS avg_completion,
    AVG(mr.average_score) AS avg_score,
    AVG(mr.time_spent_minutes) AS avg_time_spent,
    COUNT(CASE WHEN mr.completion_percentage = 100 THEN 1 END) AS completed_students
FROM module_rankings mr
JOIN modules m ON mr.module_id = m.id
GROUP BY mr.module_id, m.name;

-- ====================================================================
-- 7. FUNCTIONS FOR AUTOMATIC UPDATES
-- ====================================================================

-- Function to update student rankings
CREATE OR REPLACE FUNCTION update_student_ranking(p_student_id UUID)
RETURNS VOID AS $$
DECLARE
    v_total_points INTEGER;
    v_modules_completed INTEGER;
    v_problems_solved INTEGER;
    v_accuracy DECIMAL(5,2);
    v_total_time INTEGER;
    v_current_streak INTEGER;
    v_longest_streak INTEGER;
BEGIN
    -- Calculate total points
    SELECT COALESCE(SUM(points_change), 0)
    INTO v_total_points
    FROM point_transactions
    WHERE student_id = p_student_id;

    -- Calculate modules completed
    SELECT COUNT(*)
    INTO v_modules_completed
    FROM module_rankings
    WHERE student_id = p_student_id AND completion_percentage = 100;

    -- Calculate problems solved and accuracy
    SELECT
        COALESCE(SUM(problems_attempted), 0),
        CASE
            WHEN SUM(problems_attempted) > 0
            THEN (SUM(problems_correct)::DECIMAL / SUM(problems_attempted) * 100)
            ELSE 0
        END
    INTO v_problems_solved, v_accuracy
    FROM module_rankings
    WHERE student_id = p_student_id;

    -- Calculate total time
    SELECT COALESCE(SUM(time_spent_minutes), 0)
    INTO v_total_time
    FROM module_rankings
    WHERE student_id = p_student_id;

    -- Calculate streaks (simplified - count consecutive days with activity)
    WITH streak_calc AS (
        SELECT
            activity_date,
            activity_date - ROW_NUMBER() OVER (ORDER BY activity_date)::INTEGER AS grp
        FROM daily_activity_log
        WHERE student_id = p_student_id
        ORDER BY activity_date DESC
    ),
    streak_groups AS (
        SELECT grp, COUNT(*) AS streak_length
        FROM streak_calc
        GROUP BY grp
    )
    SELECT
        COALESCE(MAX(CASE WHEN grp = (SELECT grp FROM streak_calc LIMIT 1) THEN streak_length END), 0),
        COALESCE(MAX(streak_length), 0)
    INTO v_current_streak, v_longest_streak
    FROM streak_groups;

    -- Upsert student rankings
    INSERT INTO student_rankings (
        student_id, total_points, modules_completed, problems_solved,
        accuracy_percentage, total_time_spent_minutes,
        current_streak_days, longest_streak_days, updated_at
    )
    VALUES (
        p_student_id, v_total_points, v_modules_completed, v_problems_solved,
        v_accuracy, v_total_time,
        v_current_streak, v_longest_streak, NOW()
    )
    ON CONFLICT (student_id) DO UPDATE SET
        total_points = v_total_points,
        modules_completed = v_modules_completed,
        problems_solved = v_problems_solved,
        accuracy_percentage = v_accuracy,
        total_time_spent_minutes = v_total_time,
        current_streak_days = v_current_streak,
        longest_streak_days = v_longest_streak,
        updated_at = NOW();

    -- Update global rank (simplified - based on total points)
    WITH ranked_students AS (
        SELECT
            student_id,
            RANK() OVER (ORDER BY total_points DESC, modules_completed DESC) AS new_rank
        FROM student_rankings
    )
    UPDATE student_rankings sr
    SET global_rank = rs.new_rank
    FROM ranked_students rs
    WHERE sr.student_id = rs.student_id;

    -- Update grade rank
    WITH ranked_by_grade AS (
        SELECT
            sr.student_id,
            RANK() OVER (
                PARTITION BY s.grade_level
                ORDER BY sr.total_points DESC, sr.modules_completed DESC
            ) AS new_grade_rank
        FROM student_rankings sr
        JOIN students s ON sr.student_id = s.id
    )
    UPDATE student_rankings sr
    SET grade_rank = rg.new_grade_rank
    FROM ranked_by_grade rg
    WHERE sr.student_id = rg.student_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_achievements(p_student_id UUID)
RETURNS TABLE(achievement_id UUID, achievement_name VARCHAR) AS $$
DECLARE
    v_achievement RECORD;
    v_earned BOOLEAN;
BEGIN
    -- Iterate through all active achievements
    FOR v_achievement IN
        SELECT id, name, criteria
        FROM achievements
        WHERE is_active = true
        AND id NOT IN (
            SELECT achievement_id
            FROM student_achievements
            WHERE student_id = p_student_id
        )
    LOOP
        v_earned := false;

        -- Check criteria (simplified - extend based on actual criteria types)
        -- This is a placeholder - actual implementation would parse JSONB criteria

        IF v_earned THEN
            INSERT INTO student_achievements (student_id, achievement_id, earned_at)
            VALUES (p_student_id, v_achievement.id, NOW());

            achievement_id := v_achievement.id;
            achievement_name := v_achievement.name;
            RETURN NEXT;
        END IF;
    END LOOP;

    RETURN;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 8. TRIGGERS
-- ====================================================================

-- Update timestamp on achievements update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_achievements_updated_at
    BEFORE UPDATE ON achievements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_rankings_updated_at
    BEFORE UPDATE ON student_rankings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subject_mastery_updated_at
    BEFORE UPDATE ON subject_mastery
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- 9. SAMPLE DATA (for testing)
-- ====================================================================

-- Sample Achievements
INSERT INTO achievements (name, name_ko, description, description_ko, category, points, criteria, tier, display_order) VALUES
('First Steps', '첫 걸음', 'Complete your first module', '첫 모듈 완료하기', 'completion', 10, '{"modules_completed": 1}', 'bronze', 1),
('Five Star Student', '5개 별 학생', 'Complete 5 modules', '5개 모듈 완료하기', 'completion', 50, '{"modules_completed": 5}', 'silver', 2),
('Perfect Score', '완벽한 점수', 'Get 100% on any module', '어떤 모듈에서든 100점 받기', 'mastery', 25, '{"perfect_score": 1}', 'gold', 3),
('Speed Demon', '속도광', 'Complete a module in under 10 minutes', '10분 안에 모듈 완료하기', 'speed', 30, '{"time_under_minutes": 10}', 'silver', 4),
('Week Warrior', '주간 전사', 'Log in 7 days in a row', '7일 연속 로그인', 'streak', 40, '{"streak_days": 7}', 'gold', 5),
('Explorer', '탐험가', 'Try 10 different modules', '10개의 다른 모듈 시도하기', 'exploration', 35, '{"unique_modules": 10}', 'silver', 6),
('Champion', '챔피언', 'Rank in top 10 globally', '전체 순위 10위 안에 들기', 'special', 100, '{"global_rank_max": 10}', 'platinum', 7),
('Math Master', '수학 마스터', 'Complete 50 modules with 90%+ accuracy', '90% 이상의 정확도로 50개 모듈 완료', 'mastery', 200, '{"modules_completed": 50, "min_accuracy": 90}', 'diamond', 8);

-- Sample Rewards
INSERT INTO rewards (name, name_ko, description, description_ko, reward_type, cost_points, icon_url, display_order) VALUES
('Golden Star Badge', '골든 스타 배지', 'Shine bright with a golden star', '황금 별로 빛나기', 'badge', 50, '/assets/badges/golden_star.png', 1),
('Dark Mode Theme', '다크 모드 테마', 'Easy on the eyes, dark mode theme', '눈이 편한 다크 모드 테마', 'theme', 100, '/assets/themes/dark_mode.png', 2),
('Math Wizard Avatar', '수학 마법사 아바타', 'Look like a true math wizard', '진정한 수학 마법사처럼 보이기', 'avatar', 150, '/assets/avatars/wizard.png', 3),
('Genius Title', '천재 칭호', 'Earn the prestigious Genius title', '명예로운 천재 칭호 얻기', 'title', 200, '/assets/titles/genius.png', 4),
('Certificate of Excellence', '우수 증서', 'Printable certificate of your achievements', '성취에 대한 인쇄 가능한 증서', 'certificate', 300, '/assets/certificates/excellence.png', 5);

-- ====================================================================
-- END OF SCHEMA
-- ====================================================================
