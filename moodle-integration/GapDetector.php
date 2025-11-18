<?php
/**
 * Prerequisite Gap Detector
 *
 * Analyzes student performance data to identify gaps in prerequisite knowledge
 */

require_once __DIR__ . '/MoodleClient.php';

class GapDetector {
    private $config;
    private $logger;
    private $moodleClient;
    private $db;

    /**
     * Constructor
     *
     * @param array $config Configuration array
     * @param MoodleClient $moodleClient Moodle API client
     * @param PDO $db Database connection
     */
    public function __construct(array $config, MoodleClient $moodleClient, PDO $db) {
        $this->config = $config['gap_detection'];
        $this->logger = new Logger($config['logging'] ?? []);
        $this->moodleClient = $moodleClient;
        $this->db = $db;
    }

    /**
     * Analyze student performance and detect prerequisite gaps
     *
     * @param int $courseId Course ID
     * @param int $userId User ID
     * @param array $conceptMap Mapping of activities to concepts
     * @return array Array of detected gaps
     */
    public function analyzeStudent($courseId, $userId, array $conceptMap) {
        $this->logger->info("Analyzing student $userId in course $courseId");

        // Get student performance data
        $performanceData = $this->getStudentPerformance($courseId, $userId, $conceptMap);

        // Identify struggling concepts
        $strugglingConcepts = $this->identifyStrugglingConcepts($performanceData);

        // Detect prerequisite gaps
        $gaps = $this->detectPrerequisiteGaps($strugglingConcepts, $performanceData);

        // Calculate confidence scores
        $gaps = $this->calculateConfidenceScores($gaps, $performanceData);

        // Filter by confidence threshold
        $gaps = array_filter($gaps, function($gap) {
            return $gap['confidence'] >= $this->config['confidence_threshold'];
        });

        // Store results in database
        $this->storeGapAnalysis($userId, $courseId, $gaps);

        return $gaps;
    }

    /**
     * Get student performance data for all concepts
     *
     * @param int $courseId Course ID
     * @param int $userId User ID
     * @param array $conceptMap Mapping of activities to concepts
     * @return array Performance data by concept
     */
    private function getStudentPerformance($courseId, $userId, array $conceptMap) {
        $performance = [];

        // Get all grade items for the student
        $gradeItems = $this->moodleClient->getUserCourseGrade($courseId, $userId);

        foreach ($gradeItems as $item) {
            // Map grade item to concept
            $concept = $this->mapActivityToConcept($item['name'], $conceptMap);

            if (!$concept) continue;

            if (!isset($performance[$concept])) {
                $performance[$concept] = [
                    'attempts' => [],
                    'grades' => [],
                    'completion' => [],
                ];
            }

            $performance[$concept]['grades'][] = [
                'score' => $item['grade'],
                'percentage' => $item['percentage'],
                'name' => $item['name'],
            ];
        }

        // Get activity completion status
        $completions = $this->moodleClient->getActivityCompletion($courseId, $userId);

        foreach ($completions as $completion) {
            $concept = $this->mapActivityToConcept($completion['name'] ?? '', $conceptMap);

            if (!$concept) continue;

            if (!isset($performance[$concept])) {
                $performance[$concept] = [
                    'attempts' => [],
                    'grades' => [],
                    'completion' => [],
                ];
            }

            $performance[$concept]['completion'][] = [
                'state' => $completion['state'],
                'timecompleted' => $completion['timecompleted'] ?? null,
            ];
        }

        return $performance;
    }

    /**
     * Map activity name to concept
     *
     * @param string $activityName Activity name
     * @param array $conceptMap Concept mapping
     * @return string|null Concept name or null
     */
    private function mapActivityToConcept($activityName, array $conceptMap) {
        $activityName = strtolower($activityName);

        foreach ($conceptMap as $concept => $keywords) {
            foreach ($keywords as $keyword) {
                if (strpos($activityName, strtolower($keyword)) !== false) {
                    return $concept;
                }
            }
        }

        return null;
    }

    /**
     * Identify concepts where student is struggling
     *
     * @param array $performanceData Performance data by concept
     * @return array Array of struggling concepts with performance metrics
     */
    private function identifyStrugglingConcepts(array $performanceData) {
        $struggling = [];
        $passingThreshold = $this->config['passing_threshold'];

        foreach ($performanceData as $concept => $data) {
            if (empty($data['grades'])) continue;

            // Calculate average performance
            $scores = array_column($data['grades'], 'percentage');
            $scores = array_filter($scores, function($s) { return $s !== null; });

            if (empty($scores)) continue;

            $avgScore = array_sum($scores) / count($scores);
            $minScore = min($scores);
            $maxScore = max($scores);

            // Check if struggling (below passing threshold)
            if ($avgScore < $passingThreshold) {
                $struggling[$concept] = [
                    'avg_score' => $avgScore,
                    'min_score' => $minScore,
                    'max_score' => $maxScore,
                    'attempts' => count($scores),
                    'performance_data' => $data,
                ];
            }
        }

        return $struggling;
    }

    /**
     * Detect prerequisite gaps for struggling concepts
     *
     * @param array $strugglingConcepts Struggling concepts
     * @param array $performanceData All performance data
     * @return array Array of detected gaps
     */
    private function detectPrerequisiteGaps(array $strugglingConcepts, array $performanceData) {
        $gaps = [];
        $prerequisites = $this->config['prerequisites'];

        foreach ($strugglingConcepts as $concept => $metrics) {
            // Check if this concept has defined prerequisites
            if (!isset($prerequisites[$concept])) continue;

            foreach ($prerequisites[$concept] as $prerequisite) {
                // Check performance on prerequisite
                if (isset($performanceData[$prerequisite])) {
                    $prereqData = $performanceData[$prerequisite];

                    if (!empty($prereqData['grades'])) {
                        $prereqScores = array_column($prereqData['grades'], 'percentage');
                        $prereqScores = array_filter($prereqScores, function($s) { return $s !== null; });

                        if (!empty($prereqScores)) {
                            $prereqAvg = array_sum($prereqScores) / count($prereqScores);

                            // If prerequisite performance is also poor, it's likely a gap
                            if ($prereqAvg < $this->config['passing_threshold']) {
                                $gaps[] = [
                                    'current_concept' => $concept,
                                    'prerequisite_concept' => $prerequisite,
                                    'current_performance' => $metrics['avg_score'],
                                    'prerequisite_performance' => $prereqAvg,
                                    'gap_severity' => $this->calculateGapSeverity(
                                        $metrics['avg_score'],
                                        $prereqAvg
                                    ),
                                ];
                            }
                        }
                    }
                } else {
                    // Prerequisite was never attempted - major gap
                    $gaps[] = [
                        'current_concept' => $concept,
                        'prerequisite_concept' => $prerequisite,
                        'current_performance' => $metrics['avg_score'],
                        'prerequisite_performance' => 0,
                        'gap_severity' => 'critical',
                        'never_attempted' => true,
                    ];
                }
            }
        }

        return $gaps;
    }

    /**
     * Calculate gap severity
     *
     * @param float $currentScore Current concept score
     * @param float $prereqScore Prerequisite concept score
     * @return string Severity level (critical, high, medium, low)
     */
    private function calculateGapSeverity($currentScore, $prereqScore) {
        $avgScore = ($currentScore + $prereqScore) / 2;

        if ($avgScore < 40) return 'critical';
        if ($avgScore < 55) return 'high';
        if ($avgScore < 70) return 'medium';
        return 'low';
    }

    /**
     * Calculate confidence scores for detected gaps
     *
     * @param array $gaps Detected gaps
     * @param array $performanceData Performance data
     * @return array Gaps with confidence scores
     */
    private function calculateConfidenceScores(array $gaps, array $performanceData) {
        foreach ($gaps as &$gap) {
            $confidence = 1.0;

            // Factor 1: Number of data points
            $currentConcept = $gap['current_concept'];
            if (isset($performanceData[$currentConcept])) {
                $dataPoints = count($performanceData[$currentConcept]['grades']);
                if ($dataPoints < $this->config['min_attempts']) {
                    $confidence *= $dataPoints / $this->config['min_attempts'];
                }
            }

            // Factor 2: Consistency of poor performance
            if (isset($performanceData[$currentConcept])) {
                $scores = array_column($performanceData[$currentConcept]['grades'], 'percentage');
                $scores = array_filter($scores, function($s) { return $s !== null; });

                if (!empty($scores)) {
                    $stdDev = $this->standardDeviation($scores);
                    // Lower standard deviation = more consistent = higher confidence
                    $consistencyFactor = 1 - min($stdDev / 100, 0.5);
                    $confidence *= $consistencyFactor;
                }
            }

            // Factor 3: Gap severity
            $severityWeights = [
                'critical' => 1.0,
                'high' => 0.9,
                'medium' => 0.75,
                'low' => 0.6,
            ];
            $confidence *= $severityWeights[$gap['gap_severity']];

            // Factor 4: Never attempted prerequisite has high confidence
            if (isset($gap['never_attempted']) && $gap['never_attempted']) {
                $confidence = max($confidence, 0.9);
            }

            $gap['confidence'] = round($confidence, 2);
        }

        return $gaps;
    }

    /**
     * Calculate standard deviation
     *
     * @param array $values Array of numeric values
     * @return float Standard deviation
     */
    private function standardDeviation(array $values) {
        if (count($values) < 2) return 0;

        $mean = array_sum($values) / count($values);
        $variance = array_sum(array_map(function($v) use ($mean) {
            return pow($v - $mean, 2);
        }, $values)) / count($values);

        return sqrt($variance);
    }

    /**
     * Store gap analysis results in database
     *
     * @param int $userId User ID
     * @param int $courseId Course ID
     * @param array $gaps Detected gaps
     */
    private function storeGapAnalysis($userId, $courseId, array $gaps) {
        try {
            // Delete old analysis for this student/course
            $stmt = $this->db->prepare('
                DELETE FROM prerequisite_gaps
                WHERE user_id = ? AND course_id = ?
            ');
            $stmt->execute([$userId, $courseId]);

            // Insert new analysis
            $stmt = $this->db->prepare('
                INSERT INTO prerequisite_gaps (
                    user_id, course_id, current_concept, prerequisite_concept,
                    current_performance, prerequisite_performance, gap_severity,
                    confidence, detected_at, metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
            ');

            foreach ($gaps as $gap) {
                $metadata = json_encode([
                    'never_attempted' => $gap['never_attempted'] ?? false,
                ]);

                $stmt->execute([
                    $userId,
                    $courseId,
                    $gap['current_concept'],
                    $gap['prerequisite_concept'],
                    $gap['current_performance'],
                    $gap['prerequisite_performance'],
                    $gap['gap_severity'],
                    $gap['confidence'],
                    $metadata,
                ]);
            }

            $this->logger->info("Stored " . count($gaps) . " gaps for user $userId in course $courseId");
        } catch (PDOException $e) {
            $this->logger->error("Failed to store gap analysis: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Batch analyze multiple students
     *
     * @param int $courseId Course ID
     * @param array $userIds Array of user IDs
     * @param array $conceptMap Concept mapping
     * @return array Results summary
     */
    public function batchAnalyze($courseId, array $userIds, array $conceptMap) {
        $results = [
            'total_students' => count($userIds),
            'analyzed' => 0,
            'gaps_detected' => 0,
            'errors' => 0,
        ];

        foreach ($userIds as $userId) {
            try {
                $gaps = $this->analyzeStudent($courseId, $userId, $conceptMap);
                $results['analyzed']++;
                $results['gaps_detected'] += count($gaps);
            } catch (Exception $e) {
                $this->logger->error("Failed to analyze user $userId: " . $e->getMessage());
                $results['errors']++;
            }
        }

        return $results;
    }

    /**
     * Get gap analysis for a student
     *
     * @param int $userId User ID
     * @param int $courseId Course ID (optional)
     * @return array Array of gaps
     */
    public function getStudentGaps($userId, $courseId = null) {
        try {
            $query = 'SELECT * FROM prerequisite_gaps WHERE user_id = ?';
            $params = [$userId];

            if ($courseId !== null) {
                $query .= ' AND course_id = ?';
                $params[] = $courseId;
            }

            $query .= ' ORDER BY confidence DESC, gap_severity DESC';

            $stmt = $this->db->prepare($query);
            $stmt->execute($params);

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            $this->logger->error("Failed to get student gaps: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get gap statistics for a course
     *
     * @param int $courseId Course ID
     * @return array Statistics
     */
    public function getCourseGapStatistics($courseId) {
        try {
            $stmt = $this->db->prepare('
                SELECT
                    prerequisite_concept,
                    COUNT(DISTINCT user_id) as affected_students,
                    AVG(confidence) as avg_confidence,
                    AVG(prerequisite_performance) as avg_performance,
                    COUNT(*) as total_gaps
                FROM prerequisite_gaps
                WHERE course_id = ?
                GROUP BY prerequisite_concept
                ORDER BY affected_students DESC
            ');
            $stmt->execute([$courseId]);

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            $this->logger->error("Failed to get course gap statistics: " . $e->getMessage());
            return [];
        }
    }
}
