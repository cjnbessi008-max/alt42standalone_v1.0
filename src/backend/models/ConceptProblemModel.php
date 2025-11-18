<?php
/**
 * 개념-문제 매칭 모델 클래스
 */

class ConceptProblemModel {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * 모든 개념 가져오기
     */
    public function getAllConcepts($filters = []) {
        $where = [];
        $params = [];

        if (isset($filters['category'])) {
            $where[] = "category = :category";
            $params['category'] = $filters['category'];
        }

        if (isset($filters['difficulty_level'])) {
            $where[] = "difficulty_level = :difficulty_level";
            $params['difficulty_level'] = $filters['difficulty_level'];
        }

        $sql = "SELECT * FROM concepts";
        if (!empty($where)) {
            $sql .= " WHERE " . implode(" AND ", $where);
        }
        $sql .= " ORDER BY category, name";

        return $this->db->query($sql, $params);
    }

    /**
     * 개념 상세 정보
     */
    public function getConceptById($id) {
        $sql = "SELECT c.*,
                       COUNT(DISTINCT cpm.problem_id) as problem_count,
                       pc.name as parent_name
                FROM concepts c
                LEFT JOIN concept_problem_mapping cpm ON c.id = cpm.concept_id
                LEFT JOIN concepts pc ON c.parent_concept_id = pc.id
                WHERE c.id = :id
                GROUP BY c.id";

        return $this->db->fetchOne($sql, ['id' => $id]);
    }

    /**
     * 개념에 연결된 문제들
     */
    public function getProblemsByConcept($conceptId, $includeRelated = false) {
        $mappingTypes = ['direct'];
        if ($includeRelated) {
            $mappingTypes[] = 'related';
            $mappingTypes[] = 'prerequisite';
        }

        $placeholders = implode(',', array_fill(0, count($mappingTypes), '?'));

        $sql = "SELECT p.*,
                       cpm.relevance_score,
                       cpm.is_primary,
                       cpm.mapping_type
                FROM problems p
                JOIN concept_problem_mapping cpm ON p.id = cpm.problem_id
                WHERE cpm.concept_id = ?
                AND cpm.mapping_type IN ($placeholders)
                ORDER BY cpm.is_primary DESC, cpm.relevance_score DESC, p.difficulty_level";

        $params = array_merge([$conceptId], $mappingTypes);
        return $this->db->query($sql, $params);
    }

    /**
     * 문제에 연결된 개념들
     */
    public function getConceptsByProblem($problemId) {
        $sql = "SELECT c.*,
                       cpm.relevance_score,
                       cpm.is_primary,
                       cpm.mapping_type
                FROM concepts c
                JOIN concept_problem_mapping cpm ON c.id = cpm.concept_id
                WHERE cpm.problem_id = :problem_id
                ORDER BY cpm.is_primary DESC, cpm.relevance_score DESC";

        return $this->db->query($sql, ['problem_id' => $problemId]);
    }

    /**
     * 개념-문제 관계 그래프 데이터
     */
    public function getConceptProblemGraph($filters = []) {
        // 노드: 개념과 문제
        $concepts = $this->getAllConcepts($filters);
        $problems = $this->getAllProblems($filters);

        // 엣지: 매핑 관계
        $sql = "SELECT
                    cpm.concept_id,
                    cpm.problem_id,
                    cpm.relevance_score,
                    cpm.is_primary,
                    cpm.mapping_type,
                    c.name as concept_name,
                    p.title as problem_title
                FROM concept_problem_mapping cpm
                JOIN concepts c ON cpm.concept_id = c.id
                JOIN problems p ON cpm.problem_id = p.id";

        $where = [];
        $params = [];

        if (isset($filters['concept_id'])) {
            $where[] = "cpm.concept_id = :concept_id";
            $params['concept_id'] = $filters['concept_id'];
        }

        if (!empty($where)) {
            $sql .= " WHERE " . implode(" AND ", $where);
        }

        $edges = $this->db->query($sql, $params);

        return [
            'nodes' => [
                'concepts' => $concepts,
                'problems' => $problems
            ],
            'edges' => $edges,
            'statistics' => [
                'total_concepts' => count($concepts),
                'total_problems' => count($problems),
                'total_mappings' => count($edges)
            ]
        ];
    }

    /**
     * 모든 문제 가져오기
     */
    public function getAllProblems($filters = []) {
        $where = [];
        $params = [];

        if (isset($filters['difficulty_level'])) {
            $where[] = "difficulty_level = :difficulty_level";
            $params['difficulty_level'] = $filters['difficulty_level'];
        }

        if (isset($filters['problem_type'])) {
            $where[] = "problem_type = :problem_type";
            $params['problem_type'] = $filters['problem_type'];
        }

        if (isset($filters['concept_id'])) {
            $sql = "SELECT DISTINCT p.*
                    FROM problems p
                    JOIN concept_problem_mapping cpm ON p.id = cpm.problem_id
                    WHERE cpm.concept_id = :concept_id";
            $params['concept_id'] = $filters['concept_id'];
            return $this->db->query($sql, $params);
        }

        $sql = "SELECT * FROM problems";
        if (!empty($where)) {
            $sql .= " WHERE " . implode(" AND ", $where);
        }
        $sql .= " ORDER BY difficulty_level, title";

        return $this->db->query($sql, $params);
    }

    /**
     * 개념 선수 관계 트리
     */
    public function getPrerequisiteTree($conceptId) {
        $sql = "WITH RECURSIVE concept_tree AS (
                    SELECT id, name, parent_concept_id, 0 as level
                    FROM concepts
                    WHERE id = :concept_id

                    UNION ALL

                    SELECT c.id, c.name, c.parent_concept_id, ct.level + 1
                    FROM concepts c
                    JOIN concept_tree ct ON c.id = ct.parent_concept_id
                    WHERE ct.level < 10
                )
                SELECT * FROM concept_tree ORDER BY level";

        return $this->db->query($sql, ['concept_id' => $conceptId]);
    }

    /**
     * 학생 진도 조회
     */
    public function getStudentProgress($studentId, $conceptId = null) {
        $sql = "SELECT
                    sp.*,
                    c.name as concept_name,
                    c.category,
                    p.title as problem_title,
                    p.difficulty_level as problem_difficulty,
                    p.points
                FROM student_progress sp
                JOIN concepts c ON sp.concept_id = c.id
                JOIN problems p ON sp.problem_id = p.id
                WHERE sp.student_id = :student_id";

        $params = ['student_id' => $studentId];

        if ($conceptId) {
            $sql .= " AND sp.concept_id = :concept_id";
            $params['concept_id'] = $conceptId;
        }

        $sql .= " ORDER BY sp.last_attempt_at DESC";

        return $this->db->query($sql, $params);
    }

    /**
     * 개념별 학생 성취도 통계
     */
    public function getConceptMasteryStats($studentId) {
        $sql = "SELECT
                    c.id as concept_id,
                    c.name as concept_name,
                    c.category,
                    COUNT(DISTINCT sp.problem_id) as problems_attempted,
                    SUM(CASE WHEN sp.status = 'mastered' THEN 1 ELSE 0 END) as problems_mastered,
                    AVG(sp.best_score) as average_score,
                    SUM(sp.time_spent) as total_time_spent
                FROM concepts c
                LEFT JOIN student_progress sp ON c.id = sp.concept_id AND sp.student_id = :student_id
                GROUP BY c.id, c.name, c.category
                ORDER BY c.category, c.name";

        return $this->db->query($sql, ['student_id' => $studentId]);
    }

    /**
     * 추천 문제 목록 (약한 개념 기반)
     */
    public function getRecommendedProblems($studentId, $limit = 10) {
        $sql = "SELECT
                    p.*,
                    c.name as concept_name,
                    c.id as concept_id,
                    COALESCE(sp.attempts, 0) as attempts,
                    COALESCE(sp.best_score, 0) as best_score
                FROM concepts c
                JOIN concept_problem_mapping cpm ON c.id = cpm.concept_id
                JOIN problems p ON cpm.problem_id = p.id
                LEFT JOIN student_progress sp ON p.id = sp.problem_id
                    AND c.id = sp.concept_id
                    AND sp.student_id = :student_id
                WHERE (sp.status IS NULL OR sp.status != 'mastered')
                AND cpm.is_primary = 1
                ORDER BY
                    COALESCE(sp.best_score, 0) ASC,
                    COALESCE(sp.attempts, 0) ASC,
                    p.difficulty_level ASC
                LIMIT :limit";

        return $this->db->query($sql, [
            'student_id' => $studentId,
            'limit' => $limit
        ]);
    }
}
