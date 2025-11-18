<?php
/**
 * Concept Extractor
 *
 * Extracts mathematical concepts from quiz questions
 * Uses keyword matching and pattern recognition
 *
 * @package WeakLinkDetector
 */

class ConceptExtractor {
    private $db;
    private $conceptKeywords;

    /**
     * Constructor
     */
    public function __construct() {
        $this->db = Database::getInstance();
        $this->initializeKeywords();
    }

    /**
     * Initialize concept keywords for matching
     */
    private function initializeKeywords() {
        $this->conceptKeywords = [
            '분수' => ['분수', 'fraction', '분자', 'numerator', '분모', 'denominator'],
            '분수 덧셈' => ['분수 덧셈', 'fraction addition', '분수를 더하', '더하기'],
            '분수 뺄셈' => ['분수 뺄셈', 'fraction subtraction', '분수를 빼', '빼기'],
            '통분' => ['통분', 'common denominator', '공통분모', '분모를 같게'],
            '약분' => ['약분', 'simplify', '간단히', 'reduce'],
            '곱셈' => ['곱하기', 'multiply', 'multiplication', '×', '*'],
            '나눗셈' => ['나누기', 'divide', 'division', '÷', '/'],
            '소수' => ['소수', 'decimal', '소수점'],
            '백분율' => ['백분율', 'percentage', 'percent', '%'],
            '비율' => ['비율', 'ratio', '비', ':'],
            '방정식' => ['방정식', 'equation', '='],
            '도형' => ['도형', 'shape', '사각형', 'square', '원', 'circle', '삼각형', 'triangle'],
            '넓이' => ['넓이', 'area', '면적'],
            '둘레' => ['둘레', 'perimeter', '길이'],
            '부피' => ['부피', 'volume', '체적']
        ];
    }

    /**
     * Extract concepts from question text
     *
     * @param string $questionText Question text
     * @param int $questionId Moodle question ID
     * @return array Detected concepts
     */
    public function extractConcepts($questionText, $questionId) {
        $detectedConcepts = [];

        foreach ($this->conceptKeywords as $conceptName => $keywords) {
            foreach ($keywords as $keyword) {
                if (mb_stripos($questionText, $keyword) !== false) {
                    $detectedConcepts[] = $conceptName;
                    break; // Found this concept, move to next
                }
            }
        }

        // Remove duplicates
        $detectedConcepts = array_unique($detectedConcepts);

        // Save to database
        foreach ($detectedConcepts as $conceptName) {
            $this->saveConceptMapping($conceptName, $questionId);
        }

        return $detectedConcepts;
    }

    /**
     * Save or update concept mapping
     *
     * @param string $conceptName Concept name
     * @param int $questionId Moodle question ID
     * @return int Concept ID
     */
    private function saveConceptMapping($conceptName, $questionId) {
        // Get or create concept
        $concept = $this->db->queryOne(
            "SELECT id, moodle_question_ids FROM concepts WHERE name = ?",
            [$conceptName]
        );

        if ($concept) {
            // Update question IDs
            $questionIds = json_decode($concept['moodle_question_ids'] ?? '[]', true);
            if (!in_array($questionId, $questionIds)) {
                $questionIds[] = $questionId;
                $this->db->execute(
                    "UPDATE concepts SET moodle_question_ids = ?, updated_at = NOW() WHERE id = ?",
                    [json_encode($questionIds), $concept['id']]
                );
            }
            return $concept['id'];
        } else {
            // Create new concept
            return $this->db->execute(
                "INSERT INTO concepts (name, moodle_question_ids) VALUES (?, ?)",
                [$conceptName, json_encode([$questionId])]
            );
        }
    }

    /**
     * Build concept relationships based on co-occurrence
     *
     * Concepts that appear together in quizzes are related
     *
     * @return int Number of relationships created
     */
    public function buildConceptRelationships() {
        // Get all quiz analyses with concepts
        $analyses = $this->db->query(
            "SELECT moodle_quiz_id, GROUP_CONCAT(DISTINCT concept_id) as concept_ids
             FROM quiz_analysis
             WHERE concept_id IS NOT NULL
             GROUP BY moodle_quiz_id
             HAVING COUNT(DISTINCT concept_id) > 1"
        );

        $relationshipsCreated = 0;

        foreach ($analyses as $analysis) {
            $conceptIds = explode(',', $analysis['concept_ids']);

            // Create relationships between all concept pairs in this quiz
            for ($i = 0; $i < count($conceptIds); $i++) {
                for ($j = $i + 1; $j < count($conceptIds); $j++) {
                    $this->createOrUpdateRelation(
                        $conceptIds[$i],
                        $conceptIds[$j],
                        'related'
                    );
                    $relationshipsCreated++;
                }
            }
        }

        return $relationshipsCreated;
    }

    /**
     * Create or update concept relation
     *
     * @param int $sourceId Source concept ID
     * @param int $targetId Target concept ID
     * @param string $type Relation type
     * @return void
     */
    private function createOrUpdateRelation($sourceId, $targetId, $type = 'related') {
        $existing = $this->db->queryOne(
            "SELECT id, evidence_count, strength
             FROM concept_relations
             WHERE source_concept_id = ? AND target_concept_id = ? AND relation_type = ?",
            [$sourceId, $targetId, $type]
        );

        if ($existing) {
            // Increase evidence count and strengthen the relation
            $newEvidenceCount = $existing['evidence_count'] + 1;
            $newStrength = min(1.0, $existing['strength'] + 0.05);

            $this->db->execute(
                "UPDATE concept_relations
                 SET evidence_count = ?, strength = ?, updated_at = NOW()
                 WHERE id = ?",
                [$newEvidenceCount, $newStrength, $existing['id']]
            );
        } else {
            // Create new relation
            $this->db->execute(
                "INSERT INTO concept_relations
                 (source_concept_id, target_concept_id, relation_type, strength, evidence_count)
                 VALUES (?, ?, ?, 0.5, 1)",
                [$sourceId, $targetId, $type]
            );
        }
    }

    /**
     * Link quiz analysis to concepts
     *
     * @param int $quizId Moodle quiz ID
     * @param int $questionId Moodle question ID
     * @param string $questionText Question text
     * @return void
     */
    public function linkQuizToConcepts($quizId, $questionId, $questionText) {
        $concepts = $this->extractConcepts($questionText, $questionId);

        if (empty($concepts)) {
            return;
        }

        // Get the first detected concept (primary)
        $primaryConcept = $this->db->queryOne(
            "SELECT id FROM concepts WHERE name = ?",
            [$concepts[0]]
        );

        if ($primaryConcept) {
            // Update quiz_analysis with concept_id
            $this->db->execute(
                "UPDATE quiz_analysis
                 SET concept_id = ?
                 WHERE moodle_quiz_id = ? AND moodle_question_id = ?",
                [$primaryConcept['id'], $quizId, $questionId]
            );
        }
    }

    /**
     * Get all concepts with statistics
     *
     * @return array Concepts with stats
     */
    public function getConceptsWithStats() {
        return $this->db->query(
            "SELECT c.id, c.name, c.category, c.description,
                    COUNT(DISTINCT qa.id) as question_count,
                    AVG(qa.accuracy_rate) as avg_accuracy,
                    AVG(qa.difficulty_score) as avg_difficulty
             FROM concepts c
             LEFT JOIN quiz_analysis qa ON qa.concept_id = c.id
             GROUP BY c.id
             ORDER BY avg_accuracy ASC"
        );
    }

    /**
     * Get concept network (graph data)
     *
     * @return array Graph data with nodes and edges
     */
    public function getConceptNetwork() {
        $concepts = $this->db->query("SELECT id, name, category FROM concepts");
        $relations = $this->db->query(
            "SELECT cr.source_concept_id, cr.target_concept_id,
                    cr.relation_type, cr.strength,
                    c1.name as source_name, c2.name as target_name
             FROM concept_relations cr
             JOIN concepts c1 ON cr.source_concept_id = c1.id
             JOIN concepts c2 ON cr.target_concept_id = c2.id
             WHERE cr.strength > 0"
        );

        return [
            'nodes' => $concepts,
            'edges' => $relations
        ];
    }
}
