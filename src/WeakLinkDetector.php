<?php
/**
 * Weak Link Detector
 *
 * Detects weak connections between concepts based on student performance
 * Uses multiple algorithms to identify learning gaps
 *
 * @package WeakLinkDetector
 */

class WeakLinkDetector {
    private $db;

    /**
     * Constructor
     */
    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Detect all weak links in the concept graph
     *
     * @return array Weak links detected
     */
    public function detectWeakLinks() {
        $weakLinks = [];

        // Method 1: Low accuracy connections
        $weakLinks = array_merge($weakLinks, $this->detectLowAccuracyLinks());

        // Method 2: High error correlation
        $weakLinks = array_merge($weakLinks, $this->detectHighErrorCorrelation());

        // Method 3: Prerequisite failures
        $weakLinks = array_merge($weakLinks, $this->detectPrerequisiteFailures());

        // Method 4: Concept gaps
        $weakLinks = array_merge($weakLinks, $this->detectConceptGaps());

        // Save to database
        foreach ($weakLinks as $link) {
            $this->saveWeakLink($link);
        }

        return $weakLinks;
    }

    /**
     * Method 1: Detect links where both concepts have low accuracy
     *
     * @return array Weak links
     */
    private function detectLowAccuracyLinks() {
        $weakLinks = [];

        $query = "
            SELECT cr.id as relation_id,
                   cr.source_concept_id, cr.target_concept_id,
                   cr.strength, c1.name as source_name, c2.name as target_name,
                   AVG(qa1.accuracy_rate) as source_accuracy,
                   AVG(qa2.accuracy_rate) as target_accuracy
            FROM concept_relations cr
            JOIN concepts c1 ON cr.source_concept_id = c1.id
            JOIN concepts c2 ON cr.target_concept_id = c2.id
            LEFT JOIN quiz_analysis qa1 ON qa1.concept_id = c1.id
            LEFT JOIN quiz_analysis qa2 ON qa2.concept_id = c2.id
            WHERE qa1.total_attempts >= ?
              AND qa2.total_attempts >= ?
            GROUP BY cr.id
            HAVING source_accuracy < ? AND target_accuracy < ?
        ";

        $results = $this->db->query($query, [
            MIN_ATTEMPTS_FOR_ANALYSIS,
            MIN_ATTEMPTS_FOR_ANALYSIS,
            LOW_ACCURACY_THRESHOLD,
            LOW_ACCURACY_THRESHOLD
        ]);

        foreach ($results as $row) {
            $weaknessScore = 100 - (($row['source_accuracy'] + $row['target_accuracy']) / 2);

            $weakLinks[] = [
                'relation_id' => $row['relation_id'],
                'weakness_score' => $weaknessScore,
                'weakness_type' => 'low_accuracy',
                'evidence' => json_encode([
                    'source_concept' => $row['source_name'],
                    'target_concept' => $row['target_name'],
                    'source_accuracy' => round($row['source_accuracy'], 2),
                    'target_accuracy' => round($row['target_accuracy'], 2)
                ]),
                'recommendation' => "두 개념 '{$row['source_name']}'과 '{$row['target_name']}' 모두 낮은 정답률을 보입니다. 기초 개념 복습이 필요합니다."
            ];
        }

        return $weakLinks;
    }

    /**
     * Method 2: Detect high error correlation
     * Students who fail concept A also fail concept B
     *
     * @return array Weak links
     */
    private function detectHighErrorCorrelation() {
        $weakLinks = [];

        // Get student performance patterns
        $query = "
            SELECT spp1.concept_id as concept1_id,
                   spp2.concept_id as concept2_id,
                   COUNT(*) as shared_students,
                   SUM(CASE WHEN spp1.mastery_level < 60 AND spp2.mastery_level < 60 THEN 1 ELSE 0 END) as both_struggling
            FROM student_performance_patterns spp1
            JOIN student_performance_patterns spp2
              ON spp1.moodle_student_id = spp2.moodle_student_id
             AND spp1.concept_id < spp2.concept_id
            GROUP BY spp1.concept_id, spp2.concept_id
            HAVING shared_students >= 5
               AND (both_struggling / shared_students) > ?
        ";

        $results = $this->db->query($query, [CORRELATION_THRESHOLD]);

        foreach ($results as $row) {
            $correlation = $row['both_struggling'] / $row['shared_students'];

            // Find the relation
            $relation = $this->db->queryOne(
                "SELECT cr.id, c1.name as source_name, c2.name as target_name
                 FROM concept_relations cr
                 JOIN concepts c1 ON cr.source_concept_id = c1.id
                 JOIN concepts c2 ON cr.target_concept_id = c2.id
                 WHERE (cr.source_concept_id = ? AND cr.target_concept_id = ?)
                    OR (cr.source_concept_id = ? AND cr.target_concept_id = ?)",
                [$row['concept1_id'], $row['concept2_id'], $row['concept2_id'], $row['concept1_id']]
            );

            if ($relation) {
                $weaknessScore = $correlation * 100;

                $weakLinks[] = [
                    'relation_id' => $relation['id'],
                    'weakness_score' => $weaknessScore,
                    'weakness_type' => 'high_correlation',
                    'affected_students' => $row['both_struggling'],
                    'evidence' => json_encode([
                        'correlation' => round($correlation, 2),
                        'affected_students' => $row['both_struggling'],
                        'total_students' => $row['shared_students']
                    ]),
                    'recommendation' => "{$row['both_struggling']}명의 학생이 두 개념 모두에서 어려움을 겪고 있습니다. 연결된 학습 활동이 필요합니다."
                ];
            }
        }

        return $weakLinks;
    }

    /**
     * Method 3: Detect prerequisite failures
     * Students struggle with advanced concept because they haven't mastered prerequisite
     *
     * @return array Weak links
     */
    private function detectPrerequisiteFailures() {
        $weakLinks = [];

        $query = "
            SELECT cr.id as relation_id,
                   cr.source_concept_id, cr.target_concept_id,
                   c1.name as prerequisite_name, c2.name as advanced_name,
                   AVG(spp1.mastery_level) as prerequisite_mastery,
                   AVG(spp2.mastery_level) as advanced_mastery,
                   COUNT(DISTINCT spp2.moodle_student_id) as affected_students
            FROM concept_relations cr
            JOIN concepts c1 ON cr.source_concept_id = c1.id
            JOIN concepts c2 ON cr.target_concept_id = c2.id
            JOIN student_performance_patterns spp1 ON spp1.concept_id = c1.id
            JOIN student_performance_patterns spp2
              ON spp2.concept_id = c2.id
             AND spp2.moodle_student_id = spp1.moodle_student_id
            WHERE cr.relation_type = 'prerequisite'
              AND spp1.mastery_level < 70
              AND spp2.mastery_level < 60
            GROUP BY cr.id
            HAVING affected_students >= 3
        ";

        $results = $this->db->query($query);

        foreach ($results as $row) {
            $weaknessScore = 100 - $row['prerequisite_mastery'];

            $weakLinks[] = [
                'relation_id' => $row['relation_id'],
                'weakness_score' => $weaknessScore,
                'weakness_type' => 'prerequisite_failure',
                'affected_students' => $row['affected_students'],
                'evidence' => json_encode([
                    'prerequisite_concept' => $row['prerequisite_name'],
                    'advanced_concept' => $row['advanced_name'],
                    'prerequisite_mastery' => round($row['prerequisite_mastery'], 2),
                    'advanced_mastery' => round($row['advanced_mastery'], 2)
                ]),
                'recommendation' => "'{$row['prerequisite_name']}' 선수 개념을 먼저 강화해야 '{$row['advanced_name']}'을(를) 학습할 수 있습니다."
            ];
        }

        return $weakLinks;
    }

    /**
     * Method 4: Detect concept gaps
     * Missing intermediate concepts between related concepts
     *
     * @return array Weak links
     */
    private function detectConceptGaps() {
        $weakLinks = [];

        // Find relations with weak strength but high difficulty difference
        $query = "
            SELECT cr.id as relation_id,
                   cr.source_concept_id, cr.target_concept_id, cr.strength,
                   c1.name as source_name, c2.name as target_name,
                   AVG(qa1.difficulty_score) as source_difficulty,
                   AVG(qa2.difficulty_score) as target_difficulty
            FROM concept_relations cr
            JOIN concepts c1 ON cr.source_concept_id = c1.id
            JOIN concepts c2 ON cr.target_concept_id = c2.id
            LEFT JOIN quiz_analysis qa1 ON qa1.concept_id = c1.id
            LEFT JOIN quiz_analysis qa2 ON qa2.concept_id = c2.id
            WHERE cr.strength < ?
            GROUP BY cr.id
            HAVING ABS(source_difficulty - target_difficulty) > 0.3
        ";

        $results = $this->db->query($query, [WEAK_LINK_THRESHOLD]);

        foreach ($results as $row) {
            $difficultyGap = abs($row['source_difficulty'] - $row['target_difficulty']);
            $weaknessScore = ($difficultyGap * 100) + ((WEAK_LINK_THRESHOLD - $row['strength']) * 50);

            $weakLinks[] = [
                'relation_id' => $row['relation_id'],
                'weakness_score' => min(100, $weaknessScore),
                'weakness_type' => 'concept_gap',
                'evidence' => json_encode([
                    'source_concept' => $row['source_name'],
                    'target_concept' => $row['target_name'],
                    'difficulty_gap' => round($difficultyGap, 2),
                    'connection_strength' => $row['strength']
                ]),
                'recommendation' => "'{$row['source_name']}'과 '{$row['target_name']}' 사이에 중간 개념이 필요할 수 있습니다."
            ];
        }

        return $weakLinks;
    }

    /**
     * Save weak link to database
     *
     * @param array $linkData Weak link data
     * @return int Weak link ID
     */
    private function saveWeakLink($linkData) {
        // Check if already exists
        $existing = $this->db->queryOne(
            "SELECT id FROM weak_links
             WHERE relation_id = ? AND weakness_type = ? AND status != 'ignored'",
            [$linkData['relation_id'], $linkData['weakness_type']]
        );

        if ($existing) {
            // Update existing
            return $this->db->execute(
                "UPDATE weak_links
                 SET weakness_score = ?, affected_students = ?,
                     evidence = ?, recommendation = ?, updated_at = NOW()
                 WHERE id = ?",
                [
                    $linkData['weakness_score'],
                    $linkData['affected_students'] ?? 0,
                    $linkData['evidence'],
                    $linkData['recommendation'],
                    $existing['id']
                ]
            );
        } else {
            // Insert new
            return $this->db->execute(
                "INSERT INTO weak_links
                 (relation_id, weakness_score, weakness_type, affected_students,
                  evidence, recommendation, status)
                 VALUES (?, ?, ?, ?, ?, ?, 'detected')",
                [
                    $linkData['relation_id'],
                    $linkData['weakness_score'],
                    $linkData['weakness_type'],
                    $linkData['affected_students'] ?? 0,
                    $linkData['evidence'],
                    $linkData['recommendation']
                ]
            );
        }
    }

    /**
     * Get all detected weak links
     *
     * @param string $status Filter by status
     * @return array Weak links
     */
    public function getWeakLinks($status = 'detected') {
        $query = "
            SELECT wl.*, cr.source_concept_id, cr.target_concept_id,
                   c1.name as source_concept_name,
                   c2.name as target_concept_name
            FROM weak_links wl
            JOIN concept_relations cr ON wl.relation_id = cr.id
            JOIN concepts c1 ON cr.source_concept_id = c1.id
            JOIN concepts c2 ON cr.target_concept_id = c2.id
        ";

        if ($status) {
            $query .= " WHERE wl.status = ?";
            return $this->db->query($query . " ORDER BY wl.weakness_score DESC", [$status]);
        }

        return $this->db->query($query . " ORDER BY wl.weakness_score DESC");
    }

    /**
     * Get weak links summary statistics
     *
     * @return array Statistics
     */
    public function getWeakLinkStats() {
        $stats = $this->db->queryOne(
            "SELECT COUNT(*) as total_weak_links,
                    SUM(CASE WHEN status = 'detected' THEN 1 ELSE 0 END) as new_links,
                    SUM(CASE WHEN status = 'reviewing' THEN 1 ELSE 0 END) as under_review,
                    SUM(CASE WHEN status = 'addressed' THEN 1 ELSE 0 END) as addressed,
                    AVG(weakness_score) as avg_weakness_score,
                    SUM(affected_students) as total_affected_students
             FROM weak_links"
        );

        $typeBreakdown = $this->db->query(
            "SELECT weakness_type, COUNT(*) as count
             FROM weak_links
             WHERE status = 'detected'
             GROUP BY weakness_type"
        );

        return [
            'summary' => $stats,
            'by_type' => $typeBreakdown
        ];
    }
}
