<?php
/**
 * AI Function Recommendation Engine
 *
 * Implements multiple recommendation strategies:
 * 1. Content-based filtering (function similarity)
 * 2. Collaborative filtering (similar students)
 * 3. Skill-based recommendations (adaptive difficulty)
 * 4. Sequential learning paths
 * 5. AI-generated recommendations (Claude API)
 */

require_once 'config.php';

class RecommendationEngine {
    private $conn;
    private $userId;
    private $userProfile;

    // Recommendation weights
    private $weights = [
        'skill_match' => 0.30,
        'success_rate' => 0.25,
        'collaborative' => 0.20,
        'diversity' => 0.15,
        'recency' => 0.10
    ];

    public function __construct($userId) {
        $this->conn = getDBConnection(FS_DB_NAME);
        $this->userId = $userId;
        $this->userProfile = $this->loadUserProfile();
    }

    /**
     * Get personalized function recommendations
     *
     * @param int $count Number of recommendations to return
     * @param array $options Additional options
     * @return array Array of recommended functions with scores
     */
    public function getRecommendations($count = 5, $options = []) {
        $strategy = $options['strategy'] ?? 'hybrid';

        switch ($strategy) {
            case 'skill_based':
                return $this->getSkillBasedRecommendations($count);

            case 'collaborative':
                return $this->getCollaborativeRecommendations($count);

            case 'content_based':
                return $this->getContentBasedRecommendations($count);

            case 'sequential':
                return $this->getSequentialRecommendations($count);

            case 'ai_generated':
                return $this->getAIRecommendations($count, $options);

            case 'hybrid':
            default:
                return $this->getHybridRecommendations($count);
        }
    }

    /**
     * Hybrid recommendation combining multiple strategies
     */
    private function getHybridRecommendations($count) {
        $candidates = $this->getCandidateFunctions();
        $scoredFunctions = [];

        foreach ($candidates as $function) {
            $score = 0;

            // 1. Skill match score
            $skillScore = $this->calculateSkillMatchScore($function);
            $score += $skillScore * $this->weights['skill_match'];

            // 2. Historical success rate
            $successScore = $this->calculateSuccessScore($function);
            $score += $successScore * $this->weights['success_rate'];

            // 3. Collaborative score
            $collabScore = $this->calculateCollaborativeScore($function);
            $score += $collabScore * $this->weights['collaborative'];

            // 4. Diversity score (encourage trying new types)
            $diversityScore = $this->calculateDiversityScore($function);
            $score += $diversityScore * $this->weights['diversity'];

            // 5. Recency penalty (avoid recently attempted)
            $recencyScore = $this->calculateRecencyScore($function);
            $score += $recencyScore * $this->weights['recency'];

            $scoredFunctions[] = [
                'function' => $function,
                'score' => $score,
                'breakdown' => [
                    'skill_match' => $skillScore,
                    'success_rate' => $successScore,
                    'collaborative' => $collabScore,
                    'diversity' => $diversityScore,
                    'recency' => $recencyScore
                ]
            ];
        }

        // Sort by score descending
        usort($scoredFunctions, function($a, $b) {
            return $b['score'] <=> $a['score'];
        });

        // Take top N
        $recommendations = array_slice($scoredFunctions, 0, $count);

        // Log recommendations
        $this->logRecommendations($recommendations, 'hybrid');

        return $recommendations;
    }

    /**
     * Skill-based recommendations matching student level
     */
    private function getSkillBasedRecommendations($count) {
        $skillLevel = $this->userProfile['skill_level'] ?? 'beginner';

        // Map skill level to difficulty
        $difficultyMap = [
            'beginner' => ['easy'],
            'intermediate' => ['easy', 'medium'],
            'advanced' => ['medium', 'hard'],
            'expert' => ['hard', 'expert']
        ];

        $difficulties = $difficultyMap[$skillLevel];
        $placeholders = implode(',', array_fill(0, count($difficulties), '?'));

        $sql = "SELECT * FROM " . FS_TABLE_PREFIX . "function_library
                WHERE difficulty_level IN ($placeholders)
                AND is_active = TRUE
                AND id NOT IN (
                    SELECT function_id FROM " . FS_TABLE_PREFIX . "attempt_history
                    WHERE user_id = ? AND is_correct = TRUE
                    AND attempted_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
                )
                ORDER BY complexity_score ASC, RAND()
                LIMIT ?";

        $stmt = $this->conn->prepare($sql);

        $types = str_repeat('s', count($difficulties)) . 'ii';
        $params = array_merge($difficulties, [$this->userId, $count]);

        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();

        $recommendations = [];
        while ($row = $result->fetch_assoc()) {
            $recommendations[] = [
                'function' => $row,
                'score' => 100 - abs($this->userProfile['calculus_mastery'] - $row['complexity_score']),
                'reasoning' => "Matched to your {$skillLevel} skill level"
            ];
        }

        $this->logRecommendations($recommendations, 'skill_based');

        return $recommendations;
    }

    /**
     * Collaborative filtering based on similar students
     */
    private function getCollaborativeRecommendations($count) {
        // Find similar students
        $similarStudents = $this->findSimilarStudents(10);

        if (empty($similarStudents)) {
            return $this->getSkillBasedRecommendations($count);
        }

        $studentIds = array_column($similarStudents, 'user_id');
        $placeholders = implode(',', array_fill(0, count($studentIds), '?'));

        // Find functions that similar students succeeded with
        $sql = "SELECT
                    fl.*,
                    COUNT(DISTINCT ah.user_id) as similar_student_count,
                    AVG(CASE WHEN ah.is_correct THEN 1 ELSE 0 END) * 100 as success_rate
                FROM " . FS_TABLE_PREFIX . "function_library fl
                JOIN " . FS_TABLE_PREFIX . "attempt_history ah ON fl.id = ah.function_id
                WHERE ah.user_id IN ($placeholders)
                AND ah.is_correct = TRUE
                AND fl.id NOT IN (
                    SELECT function_id FROM " . FS_TABLE_PREFIX . "attempt_history
                    WHERE user_id = ?
                )
                AND fl.is_active = TRUE
                GROUP BY fl.id
                HAVING success_rate > 60
                ORDER BY similar_student_count DESC, success_rate DESC
                LIMIT ?";

        $stmt = $this->conn->prepare($sql);

        $types = str_repeat('i', count($studentIds)) . 'ii';
        $params = array_merge($studentIds, [$this->userId, $count]);

        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();

        $recommendations = [];
        while ($row = $result->fetch_assoc()) {
            $recommendations[] = [
                'function' => $row,
                'score' => ($row['similar_student_count'] * 10) + $row['success_rate'],
                'reasoning' => "Students similar to you succeeded with this function"
            ];
        }

        $this->logRecommendations($recommendations, 'collaborative');

        return $recommendations;
    }

    /**
     * Content-based filtering using function similarity
     */
    private function getContentBasedRecommendations($count) {
        // Get functions student has succeeded with
        $sql = "SELECT DISTINCT fl.*
                FROM " . FS_TABLE_PREFIX . "function_library fl
                JOIN " . FS_TABLE_PREFIX . "attempt_history ah ON fl.id = ah.function_id
                WHERE ah.user_id = ? AND ah.is_correct = TRUE
                ORDER BY ah.attempted_at DESC
                LIMIT 5";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('i', $this->userId);
        $stmt->execute();
        $masteredFunctions = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        if (empty($masteredFunctions)) {
            return $this->getSkillBasedRecommendations($count);
        }

        // Find similar functions
        $recommendations = [];
        foreach ($masteredFunctions as $mastered) {
            $similar = $this->findSimilarFunctions($mastered['id'], 2);
            $recommendations = array_merge($recommendations, $similar);
        }

        // Remove duplicates and limit
        $uniqueRecommendations = [];
        $seen = [];
        foreach ($recommendations as $rec) {
            if (!in_array($rec['function']['id'], $seen)) {
                $uniqueRecommendations[] = $rec;
                $seen[] = $rec['function']['id'];
            }
        }

        $recommendations = array_slice($uniqueRecommendations, 0, $count);

        $this->logRecommendations($recommendations, 'content_based');

        return $recommendations;
    }

    /**
     * Sequential recommendations following learning paths
     */
    private function getSequentialRecommendations($count) {
        $skillLevel = $this->userProfile['skill_level'] ?? 'beginner';

        // Find appropriate learning path
        $sql = "SELECT * FROM " . FS_TABLE_PREFIX . "learning_paths
                WHERE target_skill_level = ?
                AND is_published = TRUE
                ORDER BY RAND()
                LIMIT 1";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('s', $skillLevel);
        $stmt->execute();
        $path = $stmt->get_result()->fetch_assoc();

        if (!$path) {
            return $this->getSkillBasedRecommendations($count);
        }

        $functionSequence = json_decode($path['function_sequence'], true);

        // Find where student is in the path
        $completedInPath = $this->getCompletedFunctionsInSequence($functionSequence);
        $nextIndex = count($completedInPath);

        // Get next functions in sequence
        $nextFunctionIds = array_slice($functionSequence, $nextIndex, $count);

        if (empty($nextFunctionIds)) {
            return $this->getSkillBasedRecommendations($count);
        }

        $placeholders = implode(',', array_fill(0, count($nextFunctionIds), '?'));

        $sql = "SELECT * FROM " . FS_TABLE_PREFIX . "function_library
                WHERE id IN ($placeholders)";

        $stmt = $this->conn->prepare($sql);
        $types = str_repeat('i', count($nextFunctionIds));
        $stmt->bind_param($types, ...$nextFunctionIds);
        $stmt->execute();
        $result = $stmt->get_result();

        $recommendations = [];
        $position = $nextIndex;
        while ($row = $result->fetch_assoc()) {
            $recommendations[] = [
                'function' => $row,
                'score' => 100 - $position,
                'reasoning' => "Next step in '{$path['path_name']}' learning path",
                'path_info' => [
                    'path_name' => $path['path_name'],
                    'position' => $position + 1,
                    'total' => count($functionSequence)
                ]
            ];
            $position++;
        }

        $this->logRecommendations($recommendations, 'sequential');

        return $recommendations;
    }

    /**
     * AI-generated recommendations using Claude API
     */
    private function getAIRecommendations($count, $options = []) {
        // Check cache first
        $cacheKey = $this->generateCacheKey();
        $cached = $this->checkAICache($cacheKey);

        if ($cached) {
            return $cached;
        }

        // Prepare context for AI
        $context = $this->prepareAIContext();

        // Call Claude API (placeholder - implement actual API call)
        $aiResponse = $this->callClaudeAPI($context, $count);

        // Parse AI response and match to function library
        $recommendations = $this->parseAIResponse($aiResponse);

        // Cache the result
        $this->cacheAIRecommendation($cacheKey, $context, $recommendations);

        $this->logRecommendations($recommendations, 'ai_generated');

        return $recommendations;
    }

    /**
     * Calculate skill match score (0-100)
     */
    private function calculateSkillMatchScore($function) {
        $difficultyMap = [
            'easy' => 25,
            'medium' => 50,
            'hard' => 75,
            'expert' => 100
        ];

        $functionDifficulty = $difficultyMap[$function['difficulty_level']] ?? 50;
        $userMastery = $this->userProfile['calculus_mastery'] ?? 50;

        // Ideal match is within ±10 points
        $difference = abs($functionDifficulty - $userMastery);

        if ($difference <= 10) {
            return 100;
        } elseif ($difference <= 20) {
            return 80;
        } elseif ($difference <= 30) {
            return 60;
        } else {
            return 40;
        }
    }

    /**
     * Calculate success score based on historical data
     */
    private function calculateSuccessScore($function) {
        return min(100, $function['average_success_rate'] ?? 50);
    }

    /**
     * Calculate collaborative score
     */
    private function calculateCollaborativeScore($function) {
        // How many similar students succeeded with this
        $similarStudents = $this->findSimilarStudents(5);

        if (empty($similarStudents)) {
            return 50; // Neutral score
        }

        $studentIds = array_column($similarStudents, 'user_id');
        $placeholders = implode(',', array_fill(0, count($studentIds), '?'));

        $sql = "SELECT COUNT(DISTINCT user_id) as count
                FROM " . FS_TABLE_PREFIX . "attempt_history
                WHERE function_id = ?
                AND user_id IN ($placeholders)
                AND is_correct = TRUE";

        $stmt = $this->conn->prepare($sql);
        $types = 'i' . str_repeat('i', count($studentIds));
        $params = array_merge([$function['id']], $studentIds);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();

        $successCount = $result['count'];
        $totalSimilar = count($similarStudents);

        return ($successCount / $totalSimilar) * 100;
    }

    /**
     * Calculate diversity score
     */
    private function calculateDiversityScore($function) {
        // Check if function type is underrepresented in student's history
        $sql = "SELECT COUNT(*) as count
                FROM " . FS_TABLE_PREFIX . "attempt_history ah
                JOIN " . FS_TABLE_PREFIX . "function_library fl ON ah.function_id = fl.id
                WHERE ah.user_id = ?
                AND fl.function_type = ?";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('is', $this->userId, $function['function_type']);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();

        $attemptCount = $result['count'];

        // Reward functions of types the student hasn't tried much
        if ($attemptCount == 0) {
            return 100;
        } elseif ($attemptCount <= 2) {
            return 80;
        } elseif ($attemptCount <= 5) {
            return 60;
        } else {
            return 40;
        }
    }

    /**
     * Calculate recency score (penalize recently attempted)
     */
    private function calculateRecencyScore($function) {
        $sql = "SELECT MAX(attempted_at) as last_attempt
                FROM " . FS_TABLE_PREFIX . "attempt_history
                WHERE user_id = ? AND function_id = ?";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('ii', $this->userId, $function['id']);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();

        if (!$result['last_attempt']) {
            return 100; // Never attempted
        }

        $daysSince = (time() - strtotime($result['last_attempt'])) / 86400;

        if ($daysSince < 1) {
            return 20;
        } elseif ($daysSince < 3) {
            return 50;
        } elseif ($daysSince < 7) {
            return 70;
        } else {
            return 100;
        }
    }

    /**
     * Find similar students based on skill profile
     */
    private function findSimilarStudents($limit = 10) {
        $sql = "SELECT
                    user_id,
                    ABS(polynomial_mastery - ?) +
                    ABS(trigonometry_mastery - ?) +
                    ABS(calculus_mastery - ?) as similarity_distance
                FROM " . FS_TABLE_PREFIX . "student_profiles
                WHERE user_id != ?
                ORDER BY similarity_distance ASC
                LIMIT ?";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('dddii',
            $this->userProfile['polynomial_mastery'],
            $this->userProfile['trigonometry_mastery'],
            $this->userProfile['calculus_mastery'],
            $this->userId,
            $limit
        );
        $stmt->execute();

        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    /**
     * Find functions similar to a given function
     */
    private function findSimilarFunctions($functionId, $limit = 5) {
        // Get the reference function
        $sql = "SELECT * FROM " . FS_TABLE_PREFIX . "function_library WHERE id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('i', $functionId);
        $stmt->execute();
        $reference = $stmt->get_result()->fetch_assoc();

        if (!$reference) {
            return [];
        }

        // Find similar by type and complexity
        $sql = "SELECT *,
                ABS(complexity_score - ?) as complexity_diff
                FROM " . FS_TABLE_PREFIX . "function_library
                WHERE id != ?
                AND (function_type = ? OR difficulty_level = ?)
                AND is_active = TRUE
                ORDER BY complexity_diff ASC
                LIMIT ?";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('dissi',
            $reference['complexity_score'],
            $functionId,
            $reference['function_type'],
            $reference['difficulty_level'],
            $limit
        );
        $stmt->execute();
        $result = $stmt->get_result();

        $similar = [];
        while ($row = $result->fetch_assoc()) {
            $similar[] = [
                'function' => $row,
                'score' => 100 - $row['complexity_diff'],
                'reasoning' => "Similar to functions you've mastered"
            ];
        }

        return $similar;
    }

    /**
     * Get candidate functions for recommendations
     */
    private function getCandidateFunctions() {
        $sql = "SELECT * FROM " . FS_TABLE_PREFIX . "function_library
                WHERE is_active = TRUE
                ORDER BY RAND()
                LIMIT 50";

        $result = $this->conn->query($sql);
        return $result->fetch_all(MYSQLI_ASSOC);
    }

    /**
     * Load user profile
     */
    private function loadUserProfile() {
        $sql = "SELECT * FROM " . FS_TABLE_PREFIX . "student_profiles WHERE user_id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('i', $this->userId);
        $stmt->execute();
        $profile = $stmt->get_result()->fetch_assoc();

        if (!$profile) {
            // Create default profile
            return $this->createDefaultProfile();
        }

        return $profile;
    }

    /**
     * Create default profile for new user
     */
    private function createDefaultProfile() {
        $sql = "INSERT INTO " . FS_TABLE_PREFIX . "student_profiles (user_id)
                VALUES (?)";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('i', $this->userId);
        $stmt->execute();

        return $this->loadUserProfile();
    }

    /**
     * Get completed functions in a sequence
     */
    private function getCompletedFunctionsInSequence($sequence) {
        if (empty($sequence)) {
            return [];
        }

        $placeholders = implode(',', array_fill(0, count($sequence), '?'));

        $sql = "SELECT DISTINCT function_id
                FROM " . FS_TABLE_PREFIX . "attempt_history
                WHERE user_id = ?
                AND function_id IN ($placeholders)
                AND is_correct = TRUE";

        $stmt = $this->conn->prepare($sql);
        $types = 'i' . str_repeat('i', count($sequence));
        $params = array_merge([$this->userId], $sequence);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();

        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    /**
     * Log recommendations for analytics
     */
    private function logRecommendations($recommendations, $type) {
        foreach ($recommendations as $rec) {
            $sql = "INSERT INTO " . FS_TABLE_PREFIX . "recommendations_log
                    (user_id, function_id, recommendation_type, confidence_score, reasoning)
                    VALUES (?, ?, ?, ?, ?)";

            $stmt = $this->conn->prepare($sql);
            $functionId = $rec['function']['id'];
            $score = $rec['score'] ?? 50;
            $reasoning = $rec['reasoning'] ?? 'Recommended based on ' . $type;

            $stmt->bind_param('iisds', $this->userId, $functionId, $type, $score, $reasoning);
            $stmt->execute();
        }
    }

    /**
     * Generate cache key for AI recommendations
     */
    private function generateCacheKey() {
        return 'ai_rec_' . $this->userId . '_' . $this->userProfile['skill_level'];
    }

    /**
     * Check AI recommendation cache
     */
    private function checkAICache($cacheKey) {
        $sql = "SELECT * FROM " . FS_TABLE_PREFIX . "ai_recommendation_cache
                WHERE cache_key = ?
                AND expires_at > NOW()";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('s', $cacheKey);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();

        if ($result) {
            // Update hit count
            $sql = "UPDATE " . FS_TABLE_PREFIX . "ai_recommendation_cache
                    SET hit_count = hit_count + 1
                    WHERE cache_key = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param('s', $cacheKey);
            $stmt->execute();

            return json_decode($result['recommended_functions'], true);
        }

        return null;
    }

    /**
     * Prepare context for AI API
     */
    private function prepareAIContext() {
        return [
            'user_profile' => $this->userProfile,
            'recent_attempts' => $this->getRecentAttempts(10),
            'skill_level' => $this->userProfile['skill_level'],
            'preferences' => $this->userProfile['preferred_difficulty']
        ];
    }

    /**
     * Get recent attempts
     */
    private function getRecentAttempts($limit = 10) {
        $sql = "SELECT ah.*, fl.function_expression, fl.function_type
                FROM " . FS_TABLE_PREFIX . "attempt_history ah
                JOIN " . FS_TABLE_PREFIX . "function_library fl ON ah.function_id = fl.id
                WHERE ah.user_id = ?
                ORDER BY ah.attempted_at DESC
                LIMIT ?";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('ii', $this->userId, $limit);
        $stmt->execute();

        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    /**
     * Call Claude API (placeholder implementation)
     */
    private function callClaudeAPI($context, $count) {
        // In production, implement actual Claude API call
        // For now, return empty array
        return [];
    }

    /**
     * Parse AI response
     */
    private function parseAIResponse($aiResponse) {
        // Parse and match AI recommendations to function library
        return [];
    }

    /**
     * Cache AI recommendation
     */
    private function cacheAIRecommendation($cacheKey, $context, $recommendations) {
        $sql = "INSERT INTO " . FS_TABLE_PREFIX . "ai_recommendation_cache
                (cache_key, user_profile, recommended_functions, expires_at)
                VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))
                ON DUPLICATE KEY UPDATE
                recommended_functions = VALUES(recommended_functions),
                expires_at = VALUES(expires_at)";

        $stmt = $this->conn->prepare($sql);

        $userProfile = json_encode($context['user_profile']);
        $recommendedFunctions = json_encode($recommendations);

        $stmt->bind_param('sss', $cacheKey, $userProfile, $recommendedFunctions);
        $stmt->execute();
    }

    public function __destruct() {
        if ($this->conn) {
            $this->conn->close();
        }
    }
}
