<?php
/**
 * Variance Vibration Service
 * PHP 7.1.9 Compatible Service for Variance Vibration Feature
 * Integrates with Moodle 3.7 and MySQL 5.7
 */

namespace Alt42\Services;

use Alt42\Database\Connection;
use PDO;
use PDOException;
use Exception;

class VarianceVibrationService
{
    /**
     * @var PDO Database connection
     */
    private $db;

    /**
     * @var CacheService Cache service instance
     */
    private $cache;

    /**
     * Constructor
     *
     * @param PDO|null $db Database connection
     * @param CacheService|null $cache Cache service
     */
    public function __construct($db = null, $cache = null)
    {
        $this->db = $db ?: Connection::getInstance()->getConnection();
        $this->cache = $cache;
    }

    /**
     * Get variance problem by ID
     *
     * @param string $problemId Problem ID
     * @return array|null Problem data or null if not found
     */
    public function getProblemById($problemId)
    {
        try {
            $sql = "SELECT * FROM variance_problems WHERE id = :id AND is_active = 1";
            $stmt = $this->db->prepare($sql);
            $stmt->execute(['id' => $problemId]);

            $problem = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$problem) {
                return null;
            }

            return $this->formatProblem($problem);
        } catch (PDOException $e) {
            error_log("Error fetching variance problem: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get problems by category and difficulty
     *
     * @param string $category Problem category
     * @param string|null $difficulty Difficulty level (easy, medium, hard)
     * @param int $limit Maximum number of problems
     * @param int $offset Offset for pagination
     * @return array Array of problems
     */
    public function getProblemsByCategory($category, $difficulty = null, $limit = 10, $offset = 0)
    {
        try {
            $sql = "SELECT * FROM variance_problems WHERE category = :category AND is_active = 1";
            $params = ['category' => $category];

            if ($difficulty !== null) {
                $sql .= " AND difficulty = :difficulty";
                $params['difficulty'] = $difficulty;
            }

            $sql .= " ORDER BY created_at DESC LIMIT :limit OFFSET :offset";

            $stmt = $this->db->prepare($sql);

            // Bind parameters
            foreach ($params as $key => $value) {
                $stmt->bindValue(':' . $key, $value);
            }
            $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);

            $stmt->execute();
            $problems = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return array_map([$this, 'formatProblem'], $problems);
        } catch (PDOException $e) {
            error_log("Error fetching variance problems: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Calculate variance statistics for a dataset
     *
     * @param array $values Array of numeric values
     * @param bool $isSample Use sample variance (n-1) or population (n)
     * @return array Variance statistics
     */
    public function calculateVarianceStats($values, $isSample = false)
    {
        if (empty($values)) {
            return [
                'mean' => 0,
                'variance' => 0,
                'standardDeviation' => 0,
                'count' => 0,
                'min' => 0,
                'max' => 0,
                'range' => 0,
            ];
        }

        $count = count($values);
        $mean = array_sum($values) / $count;

        // Calculate squared differences
        $squaredDiffs = array_map(function($value) use ($mean) {
            return pow($value - $mean, 2);
        }, $values);

        $sumSquaredDiffs = array_sum($squaredDiffs);

        // Calculate variance
        $divisor = $isSample ? ($count - 1) : $count;
        $variance = $divisor > 0 ? $sumSquaredDiffs / $divisor : 0;

        $standardDeviation = sqrt($variance);
        $min = min($values);
        $max = max($values);

        return [
            'mean' => round($mean, 6),
            'variance' => round($variance, 6),
            'standardDeviation' => round($standardDeviation, 6),
            'count' => $count,
            'min' => $min,
            'max' => $max,
            'range' => $max - $min,
        ];
    }

    /**
     * Map variance to vibration intensity (1-10)
     *
     * @param float $variance Calculated variance
     * @param float $mean Mean of dataset
     * @param array $config Vibration configuration
     * @return int Intensity level (1-10)
     */
    public function varianceToIntensity($variance, $mean, $config = [])
    {
        $defaults = [
            'minIntensity' => 1,
            'maxIntensity' => 10,
            'varianceThreshold' => 100.0,
            'useNormalizedVariance' => true,
        ];

        $config = array_merge($defaults, $config);

        if ($config['useNormalizedVariance'] && $mean != 0) {
            // Coefficient of variation approach
            $cv = sqrt($variance) / abs($mean);
            $normalizedValue = min($cv / 2.0, 1.0);
        } else {
            // Raw variance with threshold
            $normalizedValue = min($variance / $config['varianceThreshold'], 1.0);
        }

        // Map to intensity range
        $intensityRange = $config['maxIntensity'] - $config['minIntensity'];
        $intensity = $config['minIntensity'] + ($normalizedValue * $intensityRange);

        return max($config['minIntensity'], min($config['maxIntensity'], round($intensity)));
    }

    /**
     * Generate vibration pattern based on intensity
     *
     * @param int $intensity Vibration intensity (1-10)
     * @param string $patternType Type of pattern (continuous, pulsed, progressive)
     * @return array Array of vibration pulse durations in ms
     */
    public function generateVibrationPattern($intensity, $patternType = 'progressive')
    {
        $baseDuration = 50 + ($intensity * 15); // 50-200ms

        switch ($patternType) {
            case 'continuous':
                return [$baseDuration * 2];

            case 'pulsed':
                $pulseCount = ceil($intensity / 3); // 1-4 pulses
                $pattern = [];
                for ($i = 0; $i < $pulseCount; $i++) {
                    $pattern[] = $baseDuration;
                    if ($i < $pulseCount - 1) {
                        $pattern[] = 50; // Gap
                    }
                }
                return $pattern;

            case 'progressive':
                $steps = min($intensity, 5);
                $pattern = [];
                for ($i = 1; $i <= $steps; $i++) {
                    $pattern[] = (int)($baseDuration * ($i / $steps));
                    if ($i < $steps) {
                        $pattern[] = 30; // Short gap
                    }
                }
                return $pattern;

            default:
                return [$baseDuration];
        }
    }

    /**
     * Submit student answer
     *
     * @param string $problemId Problem ID
     * @param string $studentId Student ID
     * @param float $submittedAnswer Student's answer
     * @param int $timeSpentSeconds Time spent on problem
     * @param array $deviceInfo Device information
     * @return array Submission result
     */
    public function submitAnswer($problemId, $studentId, $submittedAnswer, $timeSpentSeconds, $deviceInfo = [])
    {
        try {
            // Get problem
            $problem = $this->getProblemById($problemId);
            if (!$problem) {
                throw new Exception('Problem not found');
            }

            // Validate answer
            $tolerance = $this->getToleranceForDifficulty($problem['difficulty']);
            $expectedVariance = $problem['expectedVariance'];

            $percentError = $expectedVariance != 0
                ? abs($submittedAnswer - $expectedVariance) / $expectedVariance * 100
                : ($submittedAnswer == 0 ? 0 : 100);

            $isCorrect = $percentError <= ($tolerance * 100);

            // Calculate vibration feedback
            $config = $this->getVibrationConfig();
            $stats = $this->calculateVarianceStats($problem['dataSet'], $problem['isSample']);
            $intensity = $this->varianceToIntensity($stats['variance'], $stats['mean'], $config);
            $pattern = $this->generateVibrationPattern($intensity, $config['patternType']);

            // Get attempt number
            $attemptNumber = $this->getAttemptNumber($studentId, $problemId) + 1;

            // Create submission record
            $submissionId = $this->generateUuid();

            $sql = "INSERT INTO variance_submissions (
                id, problem_id, student_id, submitted_answer, is_correct,
                actual_variance, percent_error, vibration_intensity,
                vibration_pattern, vibration_triggered, time_spent_seconds,
                attempt_number, device_info, submitted_at
            ) VALUES (
                :id, :problem_id, :student_id, :submitted_answer, :is_correct,
                :actual_variance, :percent_error, :vibration_intensity,
                :vibration_pattern, :vibration_triggered, :time_spent_seconds,
                :attempt_number, :device_info, NOW()
            )";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                'id' => $submissionId,
                'problem_id' => $problemId,
                'student_id' => $studentId,
                'submitted_answer' => $submittedAnswer,
                'is_correct' => $isCorrect ? 1 : 0,
                'actual_variance' => $expectedVariance,
                'percent_error' => $percentError,
                'vibration_intensity' => $intensity,
                'vibration_pattern' => json_encode($pattern),
                'vibration_triggered' => 1,
                'time_spent_seconds' => $timeSpentSeconds,
                'attempt_number' => $attemptNumber,
                'device_info' => json_encode($deviceInfo),
            ]);

            return [
                'submissionId' => $submissionId,
                'isCorrect' => $isCorrect,
                'percentError' => round($percentError, 2),
                'expectedVariance' => $expectedVariance,
                'vibrationIntensity' => $intensity,
                'vibrationPattern' => $pattern,
                'attemptNumber' => $attemptNumber,
            ];

        } catch (Exception $e) {
            error_log("Error submitting answer: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get student's attempt number for a problem
     *
     * @param string $studentId Student ID
     * @param string $problemId Problem ID
     * @return int Attempt count
     */
    private function getAttemptNumber($studentId, $problemId)
    {
        $sql = "SELECT COUNT(*) as count FROM variance_submissions
                WHERE student_id = :student_id AND problem_id = :problem_id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'student_id' => $studentId,
            'problem_id' => $problemId,
        ]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int)$result['count'];
    }

    /**
     * Get tolerance based on difficulty level
     *
     * @param string $difficulty Difficulty level
     * @return float Tolerance percentage (0-1)
     */
    private function getToleranceForDifficulty($difficulty)
    {
        $tolerances = [
            'easy' => 0.15,
            'medium' => 0.10,
            'hard' => 0.05,
        ];

        return isset($tolerances[$difficulty]) ? $tolerances[$difficulty] : 0.10;
    }

    /**
     * Get vibration configuration
     *
     * @return array Configuration array
     */
    private function getVibrationConfig()
    {
        try {
            $sql = "SELECT setting_value FROM variance_vibration_settings
                    WHERE setting_key = 'default_vibration_config' AND is_active = 1";

            $stmt = $this->db->prepare($sql);
            $stmt->execute();

            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($result) {
                return json_decode($result['setting_value'], true);
            }
        } catch (PDOException $e) {
            error_log("Error fetching vibration config: " . $e->getMessage());
        }

        // Return defaults if not found
        return [
            'minIntensity' => 1,
            'maxIntensity' => 10,
            'varianceThreshold' => 100.0,
            'useNormalizedVariance' => true,
            'vibrationEnabled' => true,
            'patternType' => 'progressive',
            'debounceMs' => 300,
        ];
    }

    /**
     * Format problem data for API response
     *
     * @param array $problem Raw problem data from database
     * @return array Formatted problem data
     */
    private function formatProblem($problem)
    {
        return [
            'id' => $problem['id'],
            'questionText' => $problem['question_text'],
            'questionTextKo' => $problem['question_text_ko'],
            'dataSet' => json_decode($problem['data_set'], true),
            'isSample' => (bool)$problem['is_sample'],
            'expectedVariance' => (float)$problem['expected_variance'],
            'expectedStdDev' => (float)$problem['expected_std_dev'],
            'meanValue' => (float)$problem['mean_value'],
            'hints' => json_decode($problem['hints'], true),
            'hintsKo' => json_decode($problem['hints_ko'], true),
            'category' => $problem['category'],
            'difficulty' => $problem['difficulty'],
            'gradeLevel' => $problem['grade_level'],
            'tags' => json_decode($problem['tags'], true),
        ];
    }

    /**
     * Generate UUID v4
     *
     * @return string UUID string
     */
    private function generateUuid()
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff)
        );
    }
}
