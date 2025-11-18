<?php
/**
 * Concept Avoidance Detection Algorithm
 *
 * Detects patterns of concept avoidance in student learning behavior
 * using multiple detection strategies
 */

require_once __DIR__ . '/Database.php';

class AvoidanceDetector {
    private $db;

    // 감지 유형
    const TYPE_LOW_ACCURACY = 'low_accuracy';
    const TYPE_QUICK_SKIP = 'quick_skip';
    const TYPE_PATTERN_AVOID = 'pattern_avoid';
    const TYPE_TIME_ABNORMAL = 'time_abnormal';
    const TYPE_MIXED = 'mixed';

    // 심각도
    const SEVERITY_LOW = 'low';
    const SEVERITY_MEDIUM = 'medium';
    const SEVERITY_HIGH = 'high';
    const SEVERITY_CRITICAL = 'critical';

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Run detection for a specific student
     */
    public function detectForStudent($user_id) {
        $patterns = [];

        // Get all student analysis data
        $sql = "SELECT * FROM student_analysis WHERE moodle_user_id = :user_id";
        $analyses = $this->db->fetchAll($sql, [':user_id' => $user_id]);

        foreach ($analyses as $analysis) {
            // Skip if not enough attempts
            if ($analysis['total_attempts'] < MIN_ATTEMPTS_FOR_ANALYSIS) {
                continue;
            }

            $concept_id = $analysis['concept_id'];

            // Run all detection rules
            $detected = [];

            // 1. Low Accuracy Detection
            $low_accuracy = $this->detectLowAccuracy($analysis);
            if ($low_accuracy) {
                $detected[] = $low_accuracy;
            }

            // 2. Quick Skip Detection
            $quick_skip = $this->detectQuickSkip($analysis);
            if ($quick_skip) {
                $detected[] = $quick_skip;
            }

            // 3. Time Abnormality Detection
            $time_abnormal = $this->detectTimeAbnormality($analysis);
            if ($time_abnormal) {
                $detected[] = $time_abnormal;
            }

            // 4. Pattern Avoidance Detection
            $pattern_avoid = $this->detectPatternAvoidance($user_id, $analysis);
            if ($pattern_avoid) {
                $detected[] = $pattern_avoid;
            }

            // If multiple types detected, combine them
            if (count($detected) > 1) {
                $patterns[] = $this->combineDetections($user_id, $concept_id, $detected);
            } elseif (count($detected) == 1) {
                $patterns[] = $detected[0];
            }
        }

        // Save detected patterns to database
        foreach ($patterns as $pattern) {
            $this->savePattern($pattern);
        }

        return $patterns;
    }

    /**
     * Run detection for all students
     */
    public function detectAll() {
        $sql = "SELECT DISTINCT moodle_user_id FROM student_analysis";
        $users = $this->db->fetchAll($sql);

        $all_patterns = [];
        foreach ($users as $user) {
            $patterns = $this->detectForStudent($user['moodle_user_id']);
            $all_patterns = array_merge($all_patterns, $patterns);
        }

        return $all_patterns;
    }

    /**
     * Detect low accuracy (낮은 정답률)
     */
    private function detectLowAccuracy($analysis) {
        $accuracy = $analysis['accuracy_rate'];

        // Check against thresholds
        if ($accuracy < ACCURACY_THRESHOLD_CRITICAL) {
            $severity = self::SEVERITY_CRITICAL;
            $confidence = 95;
        } elseif ($accuracy < ACCURACY_THRESHOLD_LOW) {
            $severity = self::SEVERITY_HIGH;
            $confidence = 85;
        } elseif ($accuracy < 55) {
            $severity = self::SEVERITY_MEDIUM;
            $confidence = 75;
        } elseif ($accuracy < 70) {
            $severity = self::SEVERITY_LOW;
            $confidence = 65;
        } else {
            return null; // No detection
        }

        return [
            'user_id' => $analysis['moodle_user_id'],
            'concept_id' => $analysis['concept_id'],
            'type' => self::TYPE_LOW_ACCURACY,
            'severity' => $severity,
            'confidence' => $confidence,
            'evidence' => [
                'accuracy_rate' => $accuracy,
                'total_attempts' => $analysis['total_attempts'],
                'correct_attempts' => $analysis['correct_attempts'],
                'incorrect_attempts' => $analysis['incorrect_attempts'],
                'threshold_used' => $accuracy < ACCURACY_THRESHOLD_CRITICAL ? 'critical' : 'low'
            ]
        ];
    }

    /**
     * Detect quick skip pattern (빠른 건너뛰기)
     */
    private function detectQuickSkip($analysis) {
        $skipped = $analysis['skipped_attempts'];
        $total = $analysis['total_attempts'];

        if ($skipped == 0) {
            return null;
        }

        $skip_rate = ($skipped / $total) * 100;
        $avg_time = $analysis['avg_response_time'];

        // High skip rate + fast response time = avoidance
        if ($skip_rate > 40 && $avg_time < QUICK_SKIP_TIME_SECONDS) {
            $severity = self::SEVERITY_HIGH;
            $confidence = 90;
        } elseif ($skip_rate > 25 && $avg_time < QUICK_SKIP_TIME_SECONDS * 1.5) {
            $severity = self::SEVERITY_MEDIUM;
            $confidence = 75;
        } elseif ($skip_rate > 15) {
            $severity = self::SEVERITY_LOW;
            $confidence = 60;
        } else {
            return null;
        }

        return [
            'user_id' => $analysis['moodle_user_id'],
            'concept_id' => $analysis['concept_id'],
            'type' => self::TYPE_QUICK_SKIP,
            'severity' => $severity,
            'confidence' => $confidence,
            'evidence' => [
                'skip_rate' => $skip_rate,
                'skipped_attempts' => $skipped,
                'total_attempts' => $total,
                'avg_response_time' => $avg_time,
                'skip_threshold' => QUICK_SKIP_TIME_SECONDS
            ]
        ];
    }

    /**
     * Detect time abnormality (비정상 응답 시간)
     */
    private function detectTimeAbnormality($analysis) {
        $avg_time = $analysis['avg_response_time'];
        $min_time = $analysis['min_response_time'];
        $max_time = $analysis['max_response_time'];

        if ($avg_time == 0 || $max_time == 0) {
            return null;
        }

        // Check for extremely quick responses (rushing through)
        if ($avg_time < 5 && $analysis['accuracy_rate'] < 50) {
            $severity = self::SEVERITY_HIGH;
            $confidence = 85;
            $abnormality_type = 'too_fast';
        }
        // Check for extreme variance (inconsistent behavior)
        elseif ($max_time > $avg_time * ABNORMAL_TIME_MULTIPLIER &&
                $min_time < $avg_time / ABNORMAL_TIME_MULTIPLIER) {
            $severity = self::SEVERITY_MEDIUM;
            $confidence = 70;
            $abnormality_type = 'inconsistent';
        }
        // Check for very slow responses (struggling or avoiding)
        elseif ($avg_time > 120 && $analysis['accuracy_rate'] < 50) {
            $severity = self::SEVERITY_MEDIUM;
            $confidence = 65;
            $abnormality_type = 'too_slow';
        } else {
            return null;
        }

        return [
            'user_id' => $analysis['moodle_user_id'],
            'concept_id' => $analysis['concept_id'],
            'type' => self::TYPE_TIME_ABNORMAL,
            'severity' => $severity,
            'confidence' => $confidence,
            'evidence' => [
                'avg_response_time' => $avg_time,
                'min_response_time' => $min_time,
                'max_response_time' => $max_time,
                'time_variance' => $max_time - $min_time,
                'abnormality_type' => $abnormality_type,
                'multiplier' => ABNORMAL_TIME_MULTIPLIER
            ]
        ];
    }

    /**
     * Detect pattern avoidance (패턴 기반 회피)
     * Compares performance across related concepts
     */
    private function detectPatternAvoidance($user_id, $analysis) {
        $concept_id = $analysis['concept_id'];
        $accuracy = $analysis['accuracy_rate'];

        // Get parent and sibling concepts
        $sql = "SELECT parent_concept_id FROM concepts WHERE id = :concept_id";
        $concept = $this->db->fetchOne($sql, [':concept_id' => $concept_id]);

        if (!$concept || !$concept['parent_concept_id']) {
            return null; // No parent concept to compare
        }

        // Get sibling concepts (same parent)
        $sql = "SELECT c.id, sa.accuracy_rate
                FROM concepts c
                LEFT JOIN student_analysis sa ON sa.concept_id = c.id AND sa.moodle_user_id = :user_id
                WHERE c.parent_concept_id = :parent_id
                AND c.id != :concept_id
                AND sa.total_attempts >= :min_attempts";

        $siblings = $this->db->fetchAll($sql, [
            ':user_id' => $user_id,
            ':parent_id' => $concept['parent_concept_id'],
            ':concept_id' => $concept_id,
            ':min_attempts' => MIN_ATTEMPTS_FOR_ANALYSIS
        ]);

        if (empty($siblings)) {
            return null; // No comparable data
        }

        // Calculate average accuracy of siblings
        $sibling_accuracies = array_column($siblings, 'accuracy_rate');
        $avg_sibling_accuracy = array_sum($sibling_accuracies) / count($sibling_accuracies);

        // If this concept's accuracy is significantly lower than siblings
        $performance_gap = $avg_sibling_accuracy - $accuracy;

        if ($performance_gap > 30) {
            $severity = self::SEVERITY_HIGH;
            $confidence = 85;
        } elseif ($performance_gap > 20) {
            $severity = self::SEVERITY_MEDIUM;
            $confidence = 75;
        } elseif ($performance_gap > 10) {
            $severity = self::SEVERITY_LOW;
            $confidence = 65;
        } else {
            return null;
        }

        return [
            'user_id' => $user_id,
            'concept_id' => $concept_id,
            'type' => self::TYPE_PATTERN_AVOID,
            'severity' => $severity,
            'confidence' => $confidence,
            'evidence' => [
                'concept_accuracy' => $accuracy,
                'sibling_avg_accuracy' => $avg_sibling_accuracy,
                'performance_gap' => $performance_gap,
                'sibling_count' => count($siblings),
                'sibling_accuracies' => $sibling_accuracies
            ]
        ];
    }

    /**
     * Combine multiple detections into a mixed type
     */
    private function combineDetections($user_id, $concept_id, $detections) {
        // Calculate combined confidence
        $confidences = array_column($detections, 'confidence');
        $avg_confidence = array_sum($confidences) / count($confidences);

        // Determine overall severity (use highest)
        $severities = array_column($detections, 'severity');
        $severity_order = [
            self::SEVERITY_LOW => 1,
            self::SEVERITY_MEDIUM => 2,
            self::SEVERITY_HIGH => 3,
            self::SEVERITY_CRITICAL => 4
        ];

        $max_severity = self::SEVERITY_LOW;
        foreach ($severities as $sev) {
            if ($severity_order[$sev] > $severity_order[$max_severity]) {
                $max_severity = $sev;
            }
        }

        // Combine evidence
        $combined_evidence = [
            'detection_types' => array_column($detections, 'type'),
            'individual_confidences' => $confidences,
            'individual_evidences' => array_column($detections, 'evidence')
        ];

        return [
            'user_id' => $user_id,
            'concept_id' => $concept_id,
            'type' => self::TYPE_MIXED,
            'severity' => $max_severity,
            'confidence' => $avg_confidence,
            'evidence' => $combined_evidence
        ];
    }

    /**
     * Save detected pattern to database
     */
    private function savePattern($pattern) {
        // Check if already exists and not resolved
        $sql = "SELECT id FROM avoidance_patterns
                WHERE moodle_user_id = :user_id
                AND concept_id = :concept_id
                AND is_resolved = 0
                LIMIT 1";

        $existing = $this->db->fetchOne($sql, [
            ':user_id' => $pattern['user_id'],
            ':concept_id' => $pattern['concept_id']
        ]);

        if ($existing) {
            // Update existing pattern
            $this->db->update('avoidance_patterns', [
                'avoidance_type' => $pattern['type'],
                'confidence_score' => $pattern['confidence'],
                'severity_level' => $pattern['severity'],
                'evidence' => json_encode($pattern['evidence']),
                'detection_date' => date('Y-m-d H:i:s')
            ], 'id = :id', [':id' => $existing['id']]);

            return $existing['id'];
        } else {
            // Insert new pattern
            return $this->db->insert('avoidance_patterns', [
                'moodle_user_id' => $pattern['user_id'],
                'concept_id' => $pattern['concept_id'],
                'avoidance_type' => $pattern['type'],
                'confidence_score' => $pattern['confidence'],
                'severity_level' => $pattern['severity'],
                'evidence' => json_encode($pattern['evidence']),
                'is_resolved' => 0,
                'teacher_notified' => 0
            ]);
        }
    }

    /**
     * Get all patterns for a student
     */
    public function getStudentPatterns($user_id, $include_resolved = false) {
        $sql = "SELECT * FROM v_avoidance_dashboard WHERE moodle_user_id = :user_id";

        if (!$include_resolved) {
            $sql .= " AND is_resolved = 0";
        }

        $sql .= " ORDER BY severity_level DESC, confidence_score DESC";

        return $this->db->fetchAll($sql, [':user_id' => $user_id]);
    }

    /**
     * Get all patterns for a concept
     */
    public function getConceptPatterns($concept_id, $include_resolved = false) {
        $sql = "SELECT * FROM v_avoidance_dashboard WHERE concept_id = :concept_id";

        if (!$include_resolved) {
            $sql .= " AND is_resolved = 0";
        }

        $sql .= " ORDER BY severity_level DESC, confidence_score DESC";

        return $this->db->fetchAll($sql, [':concept_id' => $concept_id]);
    }

    /**
     * Get summary statistics
     */
    public function getStatistics() {
        $stats = [];

        // Total patterns by type
        $sql = "SELECT avoidance_type, COUNT(*) as count
                FROM avoidance_patterns
                WHERE is_resolved = 0
                GROUP BY avoidance_type";
        $stats['by_type'] = $this->db->fetchAll($sql);

        // Total patterns by severity
        $sql = "SELECT severity_level, COUNT(*) as count
                FROM avoidance_patterns
                WHERE is_resolved = 0
                GROUP BY severity_level";
        $stats['by_severity'] = $this->db->fetchAll($sql);

        // Most problematic concepts
        $sql = "SELECT c.concept_code, c.concept_name, c.concept_name_ko,
                       COUNT(*) as student_count,
                       AVG(ap.confidence_score) as avg_confidence
                FROM avoidance_patterns ap
                JOIN concepts c ON c.id = ap.concept_id
                WHERE ap.is_resolved = 0
                GROUP BY ap.concept_id
                ORDER BY student_count DESC, avg_confidence DESC
                LIMIT 10";
        $stats['problematic_concepts'] = $this->db->fetchAll($sql);

        // Students with most avoidance patterns
        $sql = "SELECT moodle_user_id,
                       COUNT(*) as pattern_count,
                       AVG(confidence_score) as avg_confidence
                FROM avoidance_patterns
                WHERE is_resolved = 0
                GROUP BY moodle_user_id
                ORDER BY pattern_count DESC
                LIMIT 10";
        $stats['students_at_risk'] = $this->db->fetchAll($sql);

        return $stats;
    }

    /**
     * Mark pattern as resolved
     */
    public function resolvePattern($pattern_id, $notes = null) {
        return $this->db->update('avoidance_patterns', [
            'is_resolved' => 1,
            'notes' => $notes
        ], 'id = :id', [':id' => $pattern_id]);
    }

    /**
     * Mark pattern as teacher notified
     */
    public function markNotified($pattern_id) {
        return $this->db->update('avoidance_patterns', [
            'teacher_notified' => 1
        ], 'id = :id', [':id' => $pattern_id]);
    }
}
