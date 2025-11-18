<?php
/**
 * Recommendation Engine
 * AI-powered personalized learning recommendations for Step Derivative
 *
 * Features:
 * - Adaptive difficulty adjustment based on performance
 * - Next problem recommendation using skill analysis
 * - Weakness detection and remedial practice suggestions
 * - Personalized learning path generation
 */

class RecommendationEngine {
    private $pdo;
    private $settings;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->loadSettings();
    }

    /**
     * Load recommendation settings from database
     */
    private function loadSettings() {
        $stmt = $this->pdo->query("SELECT setting_key, setting_value, setting_type FROM recommendation_settings");
        $this->settings = [];

        while ($row = $stmt->fetch()) {
            $value = $row['setting_value'];

            // Type conversion
            switch ($row['setting_type']) {
                case 'int':
                    $value = (int)$value;
                    break;
                case 'float':
                    $value = (float)$value;
                    break;
                case 'boolean':
                    $value = ($value === 'true');
                    break;
                case 'json':
                    $value = json_decode($value, true);
                    break;
            }

            $this->settings[$row['setting_key']] = $value;
        }
    }

    /**
     * Get setting value
     */
    private function getSetting($key, $default = null) {
        return isset($this->settings[$key]) ? $this->settings[$key] : $default;
    }

    /**
     * Update student skill levels based on attempt performance
     *
     * @param int $userId Moodle user ID
     * @param int $attemptId Student attempt ID
     * @return array Updated skill levels
     */
    public function updateSkillLevels($userId, $attemptId) {
        // Get attempt details
        $stmt = $this->pdo->prepare(
            "SELECT sa.*, p.id as problem_id, p.difficulty_level
             FROM student_attempts sa
             JOIN problems p ON sa.problem_id = p.id
             WHERE sa.id = :attempt_id AND sa.moodle_user_id = :user_id"
        );
        $stmt->execute([':attempt_id' => $attemptId, ':user_id' => $userId]);
        $attempt = $stmt->fetch();

        if (!$attempt) {
            return ['error' => 'Attempt not found'];
        }

        // Get problem skills
        $stmt = $this->pdo->prepare(
            "SELECT skill_name, skill_weight, is_primary
             FROM problem_skills
             WHERE problem_id = :problem_id"
        );
        $stmt->execute([':problem_id' => $attempt['problem_id']]);
        $problemSkills = $stmt->fetchAll();

        if (empty($problemSkills)) {
            // Auto-detect skills from solution steps
            $problemSkills = $this->detectSkillsFromSteps($attempt['problem_id']);
        }

        // Calculate performance score
        $performanceScore = $this->calculatePerformanceScore($attemptId, $attempt);

        // Update each skill
        $updatedSkills = [];
        foreach ($problemSkills as $skill) {
            $skillName = $skill['skill_name'];
            $skillWeight = $skill['skill_weight'];

            // Get current skill level
            $stmt = $this->pdo->prepare(
                "SELECT * FROM student_skill_levels
                 WHERE moodle_user_id = :user_id AND skill_name = :skill_name"
            );
            $stmt->execute([':user_id' => $userId, ':skill_name' => $skillName]);
            $currentSkill = $stmt->fetch();

            if ($currentSkill) {
                // Update existing skill level using Bayesian update
                $newLevel = $this->updateSkillLevel(
                    $currentSkill['skill_level'],
                    $performanceScore,
                    $skillWeight
                );

                $stmt = $this->pdo->prepare(
                    "UPDATE student_skill_levels
                     SET skill_level = :skill_level,
                         attempts_count = attempts_count + 1,
                         success_count = success_count + :success,
                         average_time_seconds = (average_time_seconds * attempts_count + :time_spent) / (attempts_count + 1),
                         last_practiced = NOW()
                     WHERE id = :id"
                );
                $stmt->execute([
                    ':skill_level' => $newLevel,
                    ':success' => $attempt['completed'] ? 1 : 0,
                    ':time_spent' => $attempt['time_spent'],
                    ':id' => $currentSkill['id']
                ]);

                $updatedSkills[$skillName] = $newLevel;
            } else {
                // Create new skill entry
                $initialLevel = $performanceScore * 0.7; // Conservative initial estimate

                $stmt = $this->pdo->prepare(
                    "INSERT INTO student_skill_levels
                     (moodle_user_id, skill_name, skill_level, attempts_count, success_count, average_time_seconds, last_practiced)
                     VALUES (:user_id, :skill_name, :skill_level, 1, :success, :time_spent, NOW())"
                );
                $stmt->execute([
                    ':user_id' => $userId,
                    ':skill_name' => $skillName,
                    ':skill_level' => $initialLevel,
                    ':success' => $attempt['completed'] ? 1 : 0,
                    ':time_spent' => $attempt['time_spent']
                ]);

                $updatedSkills[$skillName] = $initialLevel;
            }
        }

        // Update performance summary
        $this->updatePerformanceSummary($userId);

        return $updatedSkills;
    }

    /**
     * Calculate performance score from attempt
     */
    private function calculatePerformanceScore($attemptId, $attempt) {
        // Base score from completion
        $score = $attempt['completed'] ? 1.0 : 0.5;

        // Adjust for time efficiency
        $avgTime = $this->getAverageTimeForDifficulty($attempt['difficulty_level']);
        if ($avgTime > 0 && $attempt['time_spent'] > 0) {
            $timeRatio = $avgTime / $attempt['time_spent'];
            $timeBonus = max(-0.2, min(0.2, ($timeRatio - 1) * 0.1));
            $score += $timeBonus;
        }

        // Adjust for attempt number (fewer attempts = better)
        if ($attempt['attempt_number'] > 1) {
            $score -= min(0.2, ($attempt['attempt_number'] - 1) * 0.05);
        }

        return max(0.0, min(1.0, $score));
    }

    /**
     * Update skill level using exponential moving average
     */
    private function updateSkillLevel($currentLevel, $performanceScore, $weight = 1.0) {
        // Learning rate (how quickly to adjust to new evidence)
        $learningRate = 0.15 * $weight;

        // Exponential moving average
        $newLevel = $currentLevel * (1 - $learningRate) + $performanceScore * $learningRate;

        return max(0.0, min(1.0, $newLevel));
    }

    /**
     * Auto-detect skills from problem solution steps
     */
    private function detectSkillsFromSteps($problemId) {
        $stmt = $this->pdo->prepare(
            "SELECT DISTINCT step_type as skill_name
             FROM solution_steps
             WHERE problem_id = :problem_id
             AND step_type NOT IN ('initial', 'final', 'simplification')"
        );
        $stmt->execute([':problem_id' => $problemId]);

        $skills = [];
        while ($row = $stmt->fetch()) {
            // Auto-insert into problem_skills
            $stmt2 = $this->pdo->prepare(
                "INSERT IGNORE INTO problem_skills (problem_id, skill_name, skill_weight, is_primary)
                 VALUES (:problem_id, :skill_name, 1.0, 0)"
            );
            $stmt2->execute([
                ':problem_id' => $problemId,
                ':skill_name' => $row['skill_name']
            ]);

            $skills[] = [
                'skill_name' => $row['skill_name'],
                'skill_weight' => 1.0,
                'is_primary' => false
            ];
        }

        return $skills;
    }

    /**
     * Update student performance summary
     */
    private function updatePerformanceSummary($userId) {
        // Calculate aggregate statistics
        $stmt = $this->pdo->prepare(
            "SELECT
                COUNT(*) as total_attempts,
                SUM(completed) as total_completed,
                AVG(CASE WHEN completed THEN 1 ELSE 0 END) * 100 as completion_rate,
                SUM(time_spent) as total_time
             FROM student_attempts
             WHERE moodle_user_id = :user_id"
        );
        $stmt->execute([':user_id' => $userId]);
        $stats = $stmt->fetch();

        // Get average skill level
        $stmt = $this->pdo->prepare(
            "SELECT AVG(skill_level) as avg_skill FROM student_skill_levels WHERE moodle_user_id = :user_id"
        );
        $stmt->execute([':user_id' => $userId]);
        $skillData = $stmt->fetch();
        $avgSkill = $skillData['avg_skill'] ?? 0.5;

        // Determine current and recommended difficulty
        $currentDifficulty = $this->getDifficultyForSkillLevel($avgSkill);

        // Get weak and strong skills
        $weakSkills = $this->getWeakSkills($userId);
        $strongSkills = $this->getStrongSkills($userId);

        // Upsert performance summary
        $stmt = $this->pdo->prepare(
            "INSERT INTO student_performance_summary
             (moodle_user_id, total_attempts, total_completed, average_completion_rate,
              average_skill_level, current_difficulty, recommended_difficulty,
              weak_skills, strong_skills, total_time_spent_seconds, last_activity)
             VALUES (:user_id, :attempts, :completed, :comp_rate, :avg_skill,
                     :current_diff, :rec_diff, :weak, :strong, :time, NOW())
             ON DUPLICATE KEY UPDATE
             total_attempts = :attempts,
             total_completed = :completed,
             average_completion_rate = :comp_rate,
             average_skill_level = :avg_skill,
             current_difficulty = :current_diff,
             recommended_difficulty = :rec_diff,
             weak_skills = :weak,
             strong_skills = :strong,
             total_time_spent_seconds = :time,
             last_activity = NOW()"
        );

        $stmt->execute([
            ':user_id' => $userId,
            ':attempts' => $stats['total_attempts'],
            ':completed' => $stats['total_completed'],
            ':comp_rate' => $stats['completion_rate'],
            ':avg_skill' => $avgSkill,
            ':current_diff' => $currentDifficulty,
            ':rec_diff' => $currentDifficulty,
            ':weak' => json_encode($weakSkills),
            ':strong' => json_encode($strongSkills),
            ':time' => $stats['total_time']
        ]);
    }

    /**
     * Get difficulty level for a skill level
     */
    private function getDifficultyForSkillLevel($skillLevel) {
        $stmt = $this->pdo->prepare(
            "SELECT difficulty_level FROM difficulty_thresholds
             WHERE :skill_level >= min_skill_level AND :skill_level <= max_skill_level
             LIMIT 1"
        );
        $stmt->execute([':skill_level' => $skillLevel]);
        $result = $stmt->fetch();

        return $result ? $result['difficulty_level'] : 'basic';
    }

    /**
     * Get weak skills (below threshold)
     */
    private function getWeakSkills($userId) {
        $threshold = $this->getSetting('skill_weakness_threshold', 0.5);

        $stmt = $this->pdo->prepare(
            "SELECT skill_name, skill_level
             FROM student_skill_levels
             WHERE moodle_user_id = :user_id AND skill_level < :threshold
             ORDER BY skill_level ASC
             LIMIT 5"
        );
        $stmt->execute([':user_id' => $userId, ':threshold' => $threshold]);

        return $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
    }

    /**
     * Get strong skills (above mastery threshold)
     */
    private function getStrongSkills($userId) {
        $threshold = $this->getSetting('skill_mastery_threshold', 0.8);

        $stmt = $this->pdo->prepare(
            "SELECT skill_name, skill_level
             FROM student_skill_levels
             WHERE moodle_user_id = :user_id AND skill_level >= :threshold
             ORDER BY skill_level DESC"
        );
        $stmt->execute([':user_id' => $userId, ':threshold' => $threshold]);

        return $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
    }

    /**
     * Get average time for difficulty level
     */
    private function getAverageTimeForDifficulty($difficulty) {
        $stmt = $this->pdo->prepare(
            "SELECT AVG(time_spent) as avg_time
             FROM student_attempts sa
             JOIN problems p ON sa.problem_id = p.id
             WHERE p.difficulty_level = :difficulty AND sa.completed = 1"
        );
        $stmt->execute([':difficulty' => $difficulty]);
        $result = $stmt->fetch();

        return $result['avg_time'] ?? 0;
    }

    /**
     * Get recommended difficulty for user
     */
    public function getRecommendedDifficulty($userId) {
        $stmt = $this->pdo->prepare(
            "SELECT average_skill_level, total_attempts
             FROM student_performance_summary
             WHERE moodle_user_id = :user_id"
        );
        $stmt->execute([':user_id' => $userId]);
        $summary = $stmt->fetch();

        if (!$summary) {
            return 'basic'; // Default for new users
        }

        $minAttempts = $this->getSetting('min_attempts_for_recommendation', 3);
        if ($summary['total_attempts'] < $minAttempts) {
            return 'basic'; // Need more data
        }

        return $this->getDifficultyForSkillLevel($summary['average_skill_level']);
    }

    /**
     * Recommend next problem based on skill gaps and learning path
     */
    public function recommendNextProblem($userId) {
        $summary = $this->getPerformanceSummary($userId);

        if (!$summary) {
            // New user - recommend basic problem
            return $this->getRandomProblem('basic');
        }

        // Check for weak skills that need practice
        $weakSkills = json_decode($summary['weak_skills'], true) ?? [];

        if (!empty($weakSkills)) {
            // Focus on weakest skill
            $targetSkill = $weakSkills[0];
            return $this->getProblemForSkill($targetSkill, $summary['recommended_difficulty']);
        }

        // Check learning path
        $pathProblem = $this->getNextProblemFromLearningPath($userId);
        if ($pathProblem) {
            return $pathProblem;
        }

        // Default: recommend problem at appropriate difficulty
        return $this->getRandomProblem($summary['recommended_difficulty']);
    }

    /**
     * Get performance summary for user
     */
    public function getPerformanceSummary($userId) {
        $stmt = $this->pdo->prepare(
            "SELECT * FROM student_performance_summary WHERE moodle_user_id = :user_id"
        );
        $stmt->execute([':user_id' => $userId]);
        return $stmt->fetch();
    }

    /**
     * Get random problem at difficulty level
     */
    private function getRandomProblem($difficulty) {
        $stmt = $this->pdo->prepare(
            "SELECT * FROM problems
             WHERE difficulty_level = :difficulty
             ORDER BY RAND()
             LIMIT 1"
        );
        $stmt->execute([':difficulty' => $difficulty]);
        return $stmt->fetch();
    }

    /**
     * Get problem focusing on specific skill
     */
    private function getProblemForSkill($skillName, $difficulty = 'basic') {
        $stmt = $this->pdo->prepare(
            "SELECT p.* FROM problems p
             JOIN problem_skills ps ON p.id = ps.problem_id
             WHERE ps.skill_name = :skill_name
             AND p.difficulty_level = :difficulty
             ORDER BY ps.is_primary DESC, RAND()
             LIMIT 1"
        );
        $stmt->execute([
            ':skill_name' => $skillName,
            ':difficulty' => $difficulty
        ]);

        $problem = $stmt->fetch();

        // Fallback to any difficulty if none found
        if (!$problem) {
            $stmt = $this->pdo->prepare(
                "SELECT p.* FROM problems p
                 JOIN problem_skills ps ON p.id = ps.problem_id
                 WHERE ps.skill_name = :skill_name
                 ORDER BY ps.is_primary DESC, RAND()
                 LIMIT 1"
            );
            $stmt->execute([':skill_name' => $skillName]);
            $problem = $stmt->fetch();
        }

        return $problem;
    }

    /**
     * Get next problem from active learning path
     */
    private function getNextProblemFromLearningPath($userId) {
        $stmt = $this->pdo->prepare(
            "SELECT lps.problem_id
             FROM learning_paths lp
             JOIN learning_path_steps lps ON lp.id = lps.path_id
             WHERE lp.moodle_user_id = :user_id
             AND lp.is_active = 1
             AND lps.is_completed = 0
             ORDER BY lps.step_number ASC
             LIMIT 1"
        );
        $stmt->execute([':user_id' => $userId]);
        $step = $stmt->fetch();

        if ($step && $step['problem_id']) {
            $stmt = $this->pdo->prepare("SELECT * FROM problems WHERE id = :id");
            $stmt->execute([':id' => $step['problem_id']]);
            return $stmt->fetch();
        }

        return null;
    }

    /**
     * Create personalized learning path for user
     */
    public function createLearningPath($userId, $targetSkills, $pathName = null) {
        if (!$pathName) {
            $pathName = "맞춤 학습 경로 " . date('Y-m-d H:i');
        }

        // Deactivate old paths
        $stmt = $this->pdo->prepare(
            "UPDATE learning_paths SET is_active = 0 WHERE moodle_user_id = :user_id"
        );
        $stmt->execute([':user_id' => $userId]);

        // Sort skills by prerequisite order
        $orderedSkills = $this->orderSkillsByPrerequisites($targetSkills);

        // Estimate duration
        $estimatedDuration = count($orderedSkills) * 15; // 15 minutes per skill

        // Create learning path
        $stmt = $this->pdo->prepare(
            "INSERT INTO learning_paths
             (moodle_user_id, path_name, target_skills, total_steps, estimated_duration_minutes, started_at)
             VALUES (:user_id, :path_name, :target_skills, :total_steps, :duration, NOW())"
        );
        $stmt->execute([
            ':user_id' => $userId,
            ':path_name' => $pathName,
            ':target_skills' => json_encode($targetSkills),
            ':total_steps' => count($orderedSkills),
            ':duration' => $estimatedDuration
        ]);

        $pathId = $this->pdo->lastInsertId();

        // Create steps
        foreach ($orderedSkills as $index => $skill) {
            $problem = $this->getProblemForSkill($skill);

            $stmt = $this->pdo->prepare(
                "INSERT INTO learning_path_steps
                 (path_id, step_number, problem_id, skill_focus, description)
                 VALUES (:path_id, :step_number, :problem_id, :skill_focus, :description)"
            );
            $stmt->execute([
                ':path_id' => $pathId,
                ':step_number' => $index + 1,
                ':problem_id' => $problem ? $problem['id'] : null,
                ':skill_focus' => $skill,
                ':description' => $this->getSkillDescription($skill)
            ]);
        }

        return $pathId;
    }

    /**
     * Order skills by prerequisite dependencies
     */
    private function orderSkillsByPrerequisites($skills) {
        // Simple topological sort
        $ordered = [];
        $remaining = $skills;

        while (!empty($remaining)) {
            $added = false;

            foreach ($remaining as $key => $skill) {
                // Check if all prerequisites are already in ordered list
                $prereqs = $this->getPrerequisites($skill);
                $canAdd = true;

                foreach ($prereqs as $prereq) {
                    if (in_array($prereq, $remaining)) {
                        $canAdd = false;
                        break;
                    }
                }

                if ($canAdd) {
                    $ordered[] = $skill;
                    unset($remaining[$key]);
                    $added = true;
                }
            }

            if (!$added && !empty($remaining)) {
                // Circular dependency or missing prerequisites - add remaining as-is
                $ordered = array_merge($ordered, array_values($remaining));
                break;
            }
        }

        return $ordered;
    }

    /**
     * Get prerequisites for a skill
     */
    private function getPrerequisites($skillName) {
        $stmt = $this->pdo->prepare(
            "SELECT prerequisite_skill FROM skill_prerequisites
             WHERE skill_name = :skill_name AND importance = 'required'"
        );
        $stmt->execute([':skill_name' => $skillName]);

        return $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
    }

    /**
     * Get skill description
     */
    private function getSkillDescription($skillName) {
        $descriptions = [
            'constant_rule' => '상수의 미분 규칙',
            'power_rule' => '거듭제곱의 미분 규칙',
            'constant_multiple' => '상수배의 미분 규칙',
            'sum_rule' => '합과 차의 미분 규칙',
            'product_rule' => '곱셈의 미분 규칙',
            'quotient_rule' => '나눗셈의 미분 규칙',
            'chain_rule' => '합성함수의 연쇄 법칙',
            'sin_rule' => '사인 함수의 미분',
            'cos_rule' => '코사인 함수의 미분',
            'tan_rule' => '탄젠트 함수의 미분',
            'exponential_rule' => '지수 함수의 미분',
            'logarithm_rule' => '로그 함수의 미분'
        ];

        return $descriptions[$skillName] ?? $skillName;
    }
}
