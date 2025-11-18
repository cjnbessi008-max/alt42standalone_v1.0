<?php
/**
 * ShuffleEngine - Core shuffle algorithm for Data Shuffle Feature
 *
 * Implements Fisher-Yates shuffle with deterministic seeding for consistent
 * randomization across multiple requests from the same student.
 *
 * @package DataShuffle
 * @version 1.0.0
 * @author AI Education System Team
 * @license MIT
 */

namespace DataShuffle\Lib;

class ShuffleEngine
{
    /**
     * @var \PDO Database connection
     */
    private $db;

    /**
     * @var array Configuration cache
     */
    private $configCache = [];

    /**
     * @var int Default cache duration in seconds
     */
    const DEFAULT_CACHE_DURATION = 3600;

    /**
     * @var string Default salt for seed generation
     */
    const DEFAULT_SALT = 'datashuffle_v1_2025';

    /**
     * Constructor
     *
     * @param \PDO $db Database connection
     */
    public function __construct(\PDO $db)
    {
        $this->db = $db;
        $this->db->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
    }

    /**
     * Fisher-Yates shuffle with deterministic seeding
     *
     * Time Complexity: O(n)
     * Space Complexity: O(1) in-place shuffle
     *
     * @param array $items Items to shuffle
     * @param string $seed Seed for reproducible randomization
     * @return array Shuffled items
     */
    public function seededShuffle(array $items, $seed)
    {
        $count = count($items);

        // Edge cases
        if ($count <= 1) {
            return $items;
        }

        // Create numeric seed from string
        $numericSeed = crc32($seed);

        // Seed the random generator
        mt_srand($numericSeed);

        // Fisher-Yates shuffle algorithm
        for ($i = $count - 1; $i > 0; $i--) {
            $j = mt_rand(0, $i);

            // Swap elements
            $temp = $items[$i];
            $items[$i] = $items[$j];
            $items[$j] = $temp;
        }

        // Reset random seed to prevent side effects
        mt_srand();

        return $items;
    }

    /**
     * Generate deterministic seed for student/quiz combination
     *
     * @param int $studentId Student ID
     * @param int $quizId Quiz ID
     * @param string $type 'question' or 'answer'
     * @param string|null $customSalt Optional custom salt
     * @return string Generated seed (64 character hex)
     */
    public function generateSeed($studentId, $quizId, $type = 'question', $customSalt = null)
    {
        $config = $this->getQuizConfig($quizId);
        $salt = $customSalt ?? $config['salt'] ?? self::DEFAULT_SALT;

        // Build seed components
        $components = [
            'student_id' => $studentId,
            'quiz_id' => $quizId,
            'type' => $type,
            'strategy' => $config['seed_strategy'] ?? 'combined',
            'salt' => $salt
        ];

        // Add timestamp for timestamp-based strategy
        if ($components['strategy'] === 'timestamp') {
            $components['timestamp'] = time();
        }

        // Generate seed using SHA256
        $seedString = implode('|', $components);
        $seed = hash('sha256', $seedString);

        return $seed;
    }

    /**
     * Get or create shuffle seeds for student/quiz
     *
     * @param int $studentId Student ID
     * @param int $quizId Quiz ID
     * @param string|null $sessionId Optional session ID
     * @return array ['question_seed' => string, 'answer_seed' => string]
     */
    public function getOrCreateSeeds($studentId, $quizId, $sessionId = null)
    {
        $startTime = microtime(true);

        try {
            // Check for existing seeds
            $stmt = $this->db->prepare("
                SELECT question_seed, answer_seed, expires_at
                FROM shuffle_seeds
                WHERE student_id = :student_id
                AND quiz_id = :quiz_id
                AND (expires_at IS NULL OR expires_at > NOW())
            ");

            $stmt->execute([
                'student_id' => $studentId,
                'quiz_id' => $quizId
            ]);

            $existing = $stmt->fetch(\PDO::FETCH_ASSOC);

            if ($existing) {
                // Seeds exist and not expired
                $this->logAnalytics('cache_hit', $quizId, $studentId, microtime(true) - $startTime);
                return [
                    'question_seed' => $existing['question_seed'],
                    'answer_seed' => $existing['answer_seed']
                ];
            }

            // Generate new seeds
            $questionSeed = $this->generateSeed($studentId, $quizId, 'question');
            $answerSeed = $this->generateSeed($studentId, $quizId, 'answer');

            $config = $this->getQuizConfig($quizId);
            $cacheDuration = $config['cache_duration'] ?? self::DEFAULT_CACHE_DURATION;

            // Insert new seeds
            $stmt = $this->db->prepare("
                INSERT INTO shuffle_seeds
                    (student_id, quiz_id, question_seed, answer_seed, session_id, expires_at)
                VALUES
                    (:student_id, :quiz_id, :question_seed, :answer_seed, :session_id, DATE_ADD(NOW(), INTERVAL :duration SECOND))
                ON DUPLICATE KEY UPDATE
                    question_seed = VALUES(question_seed),
                    answer_seed = VALUES(answer_seed),
                    session_id = VALUES(session_id),
                    expires_at = VALUES(expires_at)
            ");

            $stmt->execute([
                'student_id' => $studentId,
                'quiz_id' => $quizId,
                'question_seed' => $questionSeed,
                'answer_seed' => $answerSeed,
                'session_id' => $sessionId,
                'duration' => $cacheDuration
            ]);

            $this->logAnalytics('shuffle_generated', $quizId, $studentId, microtime(true) - $startTime);

            return [
                'question_seed' => $questionSeed,
                'answer_seed' => $answerSeed
            ];

        } catch (\PDOException $e) {
            $this->logAnalytics('error', $quizId, $studentId, microtime(true) - $startTime, 0, $e->getMessage());
            throw new \Exception("Failed to get/create shuffle seeds: " . $e->getMessage());
        }
    }

    /**
     * Shuffle questions for a quiz
     *
     * @param array $questions Array of question objects
     * @param int $studentId Student ID
     * @param int $quizId Quiz ID
     * @param bool $recordHistory Whether to record shuffle history
     * @return array Shuffled questions with mapping metadata
     */
    public function shuffleQuestions(array $questions, $studentId, $quizId, $recordHistory = true)
    {
        $config = $this->getQuizConfig($quizId);

        // Check if question shuffling is enabled
        if (!($config['shuffle_questions'] ?? true)) {
            return $questions;
        }

        $seeds = $this->getOrCreateSeeds($studentId, $quizId);

        // Create array of indices
        $indices = range(0, count($questions) - 1);

        // Shuffle indices
        $shuffledIndices = $this->seededShuffle($indices, $seeds['question_seed']);

        // Build shuffled questions array
        $shuffledQuestions = [];
        foreach ($shuffledIndices as $newPosition => $originalIndex) {
            $question = $questions[$originalIndex];

            // Add metadata
            $question['original_position'] = $originalIndex + 1; // 1-based
            $question['shuffled_position'] = $newPosition + 1; // 1-based

            $shuffledQuestions[] = $question;

            // Record history if enabled
            if ($recordHistory && isset($question['id'])) {
                $this->recordQuestionShuffle(
                    $studentId,
                    $quizId,
                    $question['id'],
                    $originalIndex + 1,
                    $newPosition + 1
                );
            }
        }

        return $shuffledQuestions;
    }

    /**
     * Shuffle answer choices for a question
     *
     * @param array $answers Array of answer objects
     * @param int $questionId Question ID
     * @param int $studentId Student ID
     * @param int $quizId Quiz ID
     * @return array Shuffled answers with mapping metadata
     */
    public function shuffleAnswers(array $answers, $questionId, $studentId, $quizId)
    {
        $config = $this->getQuizConfig($quizId);

        // Check if answer shuffling is enabled
        if (!($config['shuffle_answers'] ?? true)) {
            return $answers;
        }

        $seeds = $this->getOrCreateSeeds($studentId, $quizId);

        // Create seed specific to this question's answers
        $answerSeed = hash('sha256', $seeds['answer_seed'] . '|question_' . $questionId);

        // Create array of indices
        $indices = range(0, count($answers) - 1);

        // Shuffle indices
        $shuffledIndices = $this->seededShuffle($indices, $answerSeed);

        // Build mapping: original answer ID => shuffled position
        $answerMapping = [];
        $shuffledAnswers = [];

        foreach ($shuffledIndices as $newPosition => $originalIndex) {
            $answer = $answers[$originalIndex];

            // Store original position for mapping
            $originalAnswerId = $answer['id'] ?? chr(65 + $originalIndex); // A, B, C, D...

            $answerMapping[$originalAnswerId] = $newPosition;

            // Add metadata
            $answer['original_position'] = $originalIndex;
            $answer['shuffled_position'] = $newPosition;
            $answer['display_letter'] = chr(65 + $newPosition); // A, B, C, D...

            $shuffledAnswers[] = $answer;
        }

        return [
            'answers' => $shuffledAnswers,
            'mapping' => $answerMapping
        ];
    }

    /**
     * Record question shuffle to history
     *
     * @param int $studentId Student ID
     * @param int $quizId Quiz ID
     * @param int $questionId Question ID
     * @param int $originalPosition Original position (1-based)
     * @param int $shuffledPosition Shuffled position (1-based)
     * @param array|null $answerMapping Optional answer mapping
     */
    private function recordQuestionShuffle($studentId, $quizId, $questionId, $originalPosition, $shuffledPosition, $answerMapping = null)
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO shuffle_history
                    (student_id, quiz_id, question_id, original_position, shuffled_position, answer_mapping)
                VALUES
                    (:student_id, :quiz_id, :question_id, :original_position, :shuffled_position, :answer_mapping)
            ");

            $stmt->execute([
                'student_id' => $studentId,
                'quiz_id' => $quizId,
                'question_id' => $questionId,
                'original_position' => $originalPosition,
                'shuffled_position' => $shuffledPosition,
                'answer_mapping' => $answerMapping ? json_encode($answerMapping) : null
            ]);

        } catch (\PDOException $e) {
            // Log but don't fail - history is not critical
            error_log("Failed to record shuffle history: " . $e->getMessage());
        }
    }

    /**
     * Get quiz configuration
     *
     * @param int $quizId Quiz ID
     * @return array Configuration array
     */
    public function getQuizConfig($quizId)
    {
        // Check cache
        if (isset($this->configCache[$quizId])) {
            return $this->configCache[$quizId];
        }

        try {
            $stmt = $this->db->prepare("
                SELECT shuffle_questions, shuffle_answers, seed_strategy, cache_duration, salt, enabled
                FROM shuffle_config
                WHERE quiz_id = :quiz_id
            ");

            $stmt->execute(['quiz_id' => $quizId]);
            $config = $stmt->fetch(\PDO::FETCH_ASSOC);

            if (!$config) {
                // Return default configuration
                $config = [
                    'shuffle_questions' => true,
                    'shuffle_answers' => true,
                    'seed_strategy' => 'combined',
                    'cache_duration' => self::DEFAULT_CACHE_DURATION,
                    'salt' => self::DEFAULT_SALT,
                    'enabled' => true
                ];
            }

            // Cache the configuration
            $this->configCache[$quizId] = $config;

            return $config;

        } catch (\PDOException $e) {
            // Return default on error
            return [
                'shuffle_questions' => true,
                'shuffle_answers' => true,
                'seed_strategy' => 'combined',
                'cache_duration' => self::DEFAULT_CACHE_DURATION,
                'salt' => self::DEFAULT_SALT,
                'enabled' => true
            ];
        }
    }

    /**
     * Verify student's answer (converts shuffled answer back to original)
     *
     * @param int $studentId Student ID
     * @param int $quizId Quiz ID
     * @param int $questionId Question ID
     * @param string $selectedAnswerId Selected answer ID (could be shuffled position)
     * @return string Original answer ID
     */
    public function getOriginalAnswerId($studentId, $quizId, $questionId, $selectedAnswerId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT answer_mapping
                FROM shuffle_history
                WHERE student_id = :student_id
                AND quiz_id = :quiz_id
                AND question_id = :question_id
                ORDER BY created_at DESC
                LIMIT 1
            ");

            $stmt->execute([
                'student_id' => $studentId,
                'quiz_id' => $quizId,
                'question_id' => $questionId
            ]);

            $result = $stmt->fetch(\PDO::FETCH_ASSOC);

            if ($result && $result['answer_mapping']) {
                $mapping = json_decode($result['answer_mapping'], true);

                // Find original answer ID by shuffled position
                foreach ($mapping as $originalId => $shuffledPosition) {
                    if ($originalId === $selectedAnswerId) {
                        return $originalId;
                    }
                }
            }

            // If no mapping found, return as-is
            return $selectedAnswerId;

        } catch (\PDOException $e) {
            error_log("Failed to get original answer ID: " . $e->getMessage());
            return $selectedAnswerId;
        }
    }

    /**
     * Log analytics event
     *
     * @param string $eventType Event type
     * @param int|null $quizId Quiz ID
     * @param int|null $studentId Student ID
     * @param float $executionTime Execution time in seconds
     * @param float $memoryUsage Memory usage in MB
     * @param string|null $errorMessage Error message if any
     */
    private function logAnalytics($eventType, $quizId = null, $studentId = null, $executionTime = 0, $memoryUsage = 0, $errorMessage = null)
    {
        try {
            $executionTimeMs = (int)($executionTime * 1000);
            $memoryUsageMb = $memoryUsage > 0 ? $memoryUsage : (memory_get_usage(true) / 1024 / 1024);

            $stmt = $this->db->prepare("
                INSERT INTO shuffle_analytics
                    (event_type, quiz_id, student_id, execution_time_ms, memory_usage_mb, error_message)
                VALUES
                    (:event_type, :quiz_id, :student_id, :execution_time_ms, :memory_usage_mb, :error_message)
            ");

            $stmt->execute([
                'event_type' => $eventType,
                'quiz_id' => $quizId,
                'student_id' => $studentId,
                'execution_time_ms' => $executionTimeMs,
                'memory_usage_mb' => $memoryUsageMb,
                'error_message' => $errorMessage
            ]);

        } catch (\PDOException $e) {
            // Silently fail - analytics should not break functionality
            error_log("Failed to log analytics: " . $e->getMessage());
        }
    }

    /**
     * Clear expired cache entries
     *
     * @return int Number of rows deleted
     */
    public function clearExpiredCache()
    {
        try {
            $stmt = $this->db->prepare("
                DELETE FROM shuffle_cache
                WHERE expires_at < NOW()
            ");

            $stmt->execute();

            return $stmt->rowCount();

        } catch (\PDOException $e) {
            error_log("Failed to clear expired cache: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Get shuffle statistics for a quiz
     *
     * @param int $quizId Quiz ID
     * @return array Statistics
     */
    public function getQuizStatistics($quizId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT
                    COUNT(DISTINCT student_id) as total_students,
                    COUNT(*) as total_shuffles,
                    AVG(shuffled_position - original_position) as avg_position_change,
                    MIN(created_at) as first_shuffle,
                    MAX(created_at) as last_shuffle
                FROM shuffle_history
                WHERE quiz_id = :quiz_id
            ");

            $stmt->execute(['quiz_id' => $quizId]);

            return $stmt->fetch(\PDO::FETCH_ASSOC);

        } catch (\PDOException $e) {
            return [
                'total_students' => 0,
                'total_shuffles' => 0,
                'avg_position_change' => 0,
                'first_shuffle' => null,
                'last_shuffle' => null
            ];
        }
    }
}
