<?php
/**
 * Next Term Vision - Standalone
 * Recommendation Engine
 *
 * 다중 알고리즘 기반 문제 추천 시스템
 * - Content-based Filtering: 문제 특성 기반
 * - Collaborative Filtering: 유사 학생 기반
 * - Knowledge Tracing: 학습 상태 추적
 * - Zone of Proximal Development: 최적 난이도 제공
 */

class RecommendationEngine {
    private $db;

    // 추천 가중치 설정
    const WEIGHT_DIFFICULTY = 0.30;      // 난이도 매칭
    const WEIGHT_MASTERY = 0.25;         // 숙련도 갭
    const WEIGHT_VARIETY = 0.15;         // 다양성
    const WEIGHT_COLLABORATIVE = 0.15;   // 협업 필터링
    const WEIGHT_RECENT_PERFORMANCE = 0.10; // 최근 성과
    const WEIGHT_RANDOMNESS = 0.05;      // 탐색(Exploration)

    public function __construct($pdo) {
        $this->db = $pdo;
    }

    /**
     * 사용자에게 문제 추천
     *
     * @param int $user_id 사용자 ID
     * @param int $count 추천할 문제 개수
     * @param array $options 추가 옵션
     * @return array 추천 문제 리스트
     */
    public function recommendProblems($user_id, $count = 5, $options = []) {
        // 사용자 프로필 로드
        $user_profile = $this->getUserProfile($user_id);

        if (!$user_profile) {
            throw new Exception("User not found");
        }

        // 이미 푼 문제 제외
        $solved_problems = $this->getSolvedProblems($user_id, $options['recent_window'] ?? 20);

        // 모든 활성 문제 가져오기
        $all_problems = $this->getAllActiveProblems();

        // 각 문제에 대해 추천 점수 계산
        $scored_problems = [];

        foreach ($all_problems as $problem) {
            // 이미 푼 문제 스킵
            if (in_array($problem['id'], $solved_problems)) {
                continue;
            }

            $score = $this->calculateRecommendationScore($user_profile, $problem, $options);

            $scored_problems[] = [
                'problem' => $problem,
                'score' => $score['total'],
                'score_breakdown' => $score['breakdown']
            ];
        }

        // 점수순 정렬
        usort($scored_problems, function($a, $b) {
            return $b['score'] <=> $a['score'];
        });

        // 상위 문제 선택
        $recommended = array_slice($scored_problems, 0, $count);

        // 추천 로그 저장
        $this->logRecommendations($user_id, $recommended);

        return $recommended;
    }

    /**
     * 추천 점수 계산
     */
    private function calculateRecommendationScore($user_profile, $problem, $options) {
        $breakdown = [];

        // 1. 난이도 매칭 점수
        $breakdown['difficulty'] = $this->scoreDifficultyMatch(
            $user_profile['current_level'],
            $problem['difficulty_level']
        ) * self::WEIGHT_DIFFICULTY;

        // 2. 숙련도 갭 점수 (덜 익힌 영역 우선)
        $breakdown['mastery'] = $this->scoreMasteryGap(
            $user_profile,
            $problem['problem_type']
        ) * self::WEIGHT_MASTERY;

        // 3. 다양성 점수
        $breakdown['variety'] = $this->scoreVariety(
            $user_profile,
            $problem
        ) * self::WEIGHT_VARIETY;

        // 4. 협업 필터링 점수
        $breakdown['collaborative'] = $this->scoreCollaborativeFiltering(
            $user_profile['id'],
            $problem['id']
        ) * self::WEIGHT_COLLABORATIVE;

        // 5. 최근 성과 고려
        $breakdown['recent_performance'] = $this->scoreRecentPerformance(
            $user_profile,
            $problem
        ) * self::WEIGHT_RECENT_PERFORMANCE;

        // 6. 랜덤성 (탐색)
        $breakdown['randomness'] = (mt_rand(0, 100) / 100) * self::WEIGHT_RANDOMNESS;

        // 총점 계산
        $total = array_sum($breakdown);

        return [
            'total' => $total,
            'breakdown' => $breakdown
        ];
    }

    /**
     * 1. 난이도 매칭 점수
     * Zone of Proximal Development 적용
     */
    private function scoreDifficultyMatch($user_level, $problem_difficulty) {
        $diff = abs($user_level - $problem_difficulty);

        // 최적 난이도: 현재 레벨 ±1
        if ($diff == 0) {
            return 0.9; // 현재 레벨과 동일
        } else if ($diff == 1) {
            return 1.0; // 약간 어려운 것이 최적 (ZPD)
        } else if ($diff == 2) {
            return 0.7;
        } else if ($diff == 3) {
            return 0.4;
        } else {
            return 0.1; // 너무 쉽거나 어려움
        }
    }

    /**
     * 2. 숙련도 갭 점수
     * 덜 익힌 유형의 문제 우선 추천
     */
    private function scoreMasteryGap($user_profile, $problem_type) {
        $mastery_key = strtolower($problem_type) . '_mastery';

        $current_mastery = $user_profile[$mastery_key] ?? 0;

        // 숙련도가 낮을수록 높은 점수
        return 1.0 - $current_mastery;
    }

    /**
     * 3. 다양성 점수
     * 최근에 안 풀어본 유형 우선
     */
    private function scoreVariety($user_profile, $problem) {
        // 최근 10개 문제의 유형 분포 조회
        $stmt = $this->db->prepare("
            SELECT p.problem_type, COUNT(*) as count
            FROM responses r
            JOIN problems p ON r.problem_id = p.id
            WHERE r.user_id = ?
            AND r.submitted_at > DATE_SUB(NOW(), INTERVAL 1 DAY)
            GROUP BY p.problem_type
            ORDER BY count DESC
            LIMIT 1
        ");
        $stmt->execute([$user_profile['id']]);
        $recent_type = $stmt->fetch();

        if (!$recent_type) {
            return 0.5; // 최근 기록 없음
        }

        // 최근에 많이 푼 유형이면 낮은 점수
        if ($recent_type['problem_type'] === $problem['problem_type']) {
            return 0.2;
        } else {
            return 0.8; // 다양성 추구
        }
    }

    /**
     * 4. 협업 필터링 점수
     * 나와 비슷한 학생들이 푼 문제 추천
     */
    private function scoreCollaborativeFiltering($user_id, $problem_id) {
        // 나와 비슷한 수준의 학생들 찾기
        $stmt = $this->db->prepare("
            SELECT u2.id
            FROM users u1
            JOIN users u2 ON ABS(u1.grade_level - u2.grade_level) <= 1
            JOIN user_progress up1 ON u1.id = up1.user_id
            JOIN user_progress up2 ON u2.id = up2.user_id
            WHERE u1.id = ?
            AND u2.id != ?
            AND ABS(up1.current_level - up2.current_level) <= 1
            AND ABS((up1.correct_answers / NULLIF(up1.total_problems, 0)) -
                    (up2.correct_answers / NULLIF(up2.total_problems, 0))) < 0.2
            LIMIT 20
        ");
        $stmt->execute([$user_id, $user_id]);
        $similar_users = $stmt->fetchAll(PDO::FETCH_COLUMN);

        if (empty($similar_users)) {
            return 0.5;
        }

        // 비슷한 학생들이 이 문제를 풀었는지, 그리고 정답률은?
        $placeholders = str_repeat('?,', count($similar_users) - 1) . '?';
        $stmt = $this->db->prepare("
            SELECT
                COUNT(DISTINCT user_id) as solver_count,
                AVG(is_correct) as success_rate
            FROM responses
            WHERE problem_id = ?
            AND user_id IN ($placeholders)
        ");
        $stmt->execute(array_merge([$problem_id], $similar_users));
        $result = $stmt->fetch();

        if ($result['solver_count'] == 0) {
            return 0.3; // 아무도 안 풀어봄
        }

        // 많은 유사 학생이 풀고 성공률이 적당하면 높은 점수
        $popularity = min(1.0, $result['solver_count'] / count($similar_users));
        $optimal_success_rate = abs($result['success_rate'] - 0.7); // 70% 정답률이 최적

        return $popularity * (1 - $optimal_success_rate);
    }

    /**
     * 5. 최근 성과 점수
     * 최근에 잘하고 있으면 약간 더 어려운 문제
     */
    private function scoreRecentPerformance($user_profile, $problem) {
        // 최근 5개 문제 정답률
        $stmt = $this->db->prepare("
            SELECT AVG(is_correct) as recent_accuracy
            FROM (
                SELECT is_correct
                FROM responses
                WHERE user_id = ?
                ORDER BY submitted_at DESC
                LIMIT 5
            ) recent
        ");
        $stmt->execute([$user_profile['id']]);
        $result = $stmt->fetch();

        $recent_accuracy = $result['recent_accuracy'] ?? 0.5;

        // 잘하고 있으면 (+1 난이도), 못하고 있으면 (-1 난이도)
        if ($recent_accuracy > 0.8) {
            // 조금 더 어려운 문제 선호
            return ($problem['difficulty_level'] > $user_profile['current_level']) ? 0.8 : 0.3;
        } else if ($recent_accuracy < 0.5) {
            // 조금 더 쉬운 문제 선호
            return ($problem['difficulty_level'] < $user_profile['current_level']) ? 0.8 : 0.3;
        } else {
            return 0.5; // 중립
        }
    }

    /**
     * 사용자 프로필 로드
     */
    private function getUserProfile($user_id) {
        $stmt = $this->db->prepare("
            SELECT
                u.id,
                u.username,
                u.grade_level,
                up.current_level,
                up.total_problems,
                up.correct_answers,
                up.arithmetic_mastery,
                up.geometric_mastery,
                up.fibonacci_mastery,
                up.pattern_mastery,
                up.experience_points,
                up.preferred_animation,
                up.hint_usage_rate
            FROM users u
            LEFT JOIN user_progress up ON u.id = up.user_id
            WHERE u.id = ?
        ");
        $stmt->execute([$user_id]);

        return $stmt->fetch();
    }

    /**
     * 이미 푼 문제 ID 목록
     */
    private function getSolvedProblems($user_id, $recent_window = 20) {
        $stmt = $this->db->prepare("
            SELECT DISTINCT problem_id
            FROM responses
            WHERE user_id = ?
            ORDER BY submitted_at DESC
            LIMIT ?
        ");
        $stmt->execute([$user_id, $recent_window]);

        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    /**
     * 모든 활성 문제 가져오기
     */
    private function getAllActiveProblems() {
        $stmt = $this->db->query("
            SELECT
                id,
                problem_type,
                sequence_data,
                difficulty_level,
                correct_answer,
                hint_text,
                animation_type,
                concept_tags,
                prerequisite_concepts,
                estimated_time,
                total_attempts,
                correct_attempts,
                difficulty_rating
            FROM problems
            WHERE is_active = 1
            ORDER BY id
        ");

        $problems = $stmt->fetchAll();

        // JSON 필드 파싱
        foreach ($problems as &$problem) {
            $problem['sequence_data'] = json_decode($problem['sequence_data'], true);
            $problem['concept_tags'] = json_decode($problem['concept_tags'], true);
            $problem['prerequisite_concepts'] = json_decode($problem['prerequisite_concepts'], true);
        }

        return $problems;
    }

    /**
     * 추천 로그 저장
     */
    private function logRecommendations($user_id, $recommendations) {
        $stmt = $this->db->prepare("
            INSERT INTO recommendation_logs (user_id, problem_id, recommendation_score, recommendation_reason)
            VALUES (?, ?, ?, ?)
        ");

        foreach ($recommendations as $rec) {
            $stmt->execute([
                $user_id,
                $rec['problem']['id'],
                $rec['score'],
                json_encode($rec['score_breakdown'])
            ]);
        }
    }

    /**
     * 추천 피드백 업데이트
     */
    public function updateRecommendationFeedback($user_id, $problem_id, $was_attempted, $was_correct = null, $user_feedback = null) {
        $stmt = $this->db->prepare("
            UPDATE recommendation_logs
            SET was_attempted = ?,
                was_correct = ?,
                user_feedback = ?
            WHERE user_id = ?
            AND problem_id = ?
            AND recommended_at = (
                SELECT MAX(recommended_at)
                FROM recommendation_logs
                WHERE user_id = ? AND problem_id = ?
            )
        ");

        $stmt->execute([
            $was_attempted ? 1 : 0,
            $was_correct,
            $user_feedback,
            $user_id,
            $problem_id,
            $user_id,
            $problem_id
        ]);
    }

    /**
     * 개인화된 학습 경로 생성
     */
    public function generateLearningPath($user_id, $goal_level, $session_count = 10) {
        $user_profile = $this->getUserProfile($user_id);
        $current_level = $user_profile['current_level'];

        $path = [];

        for ($i = 0; $i < $session_count; $i++) {
            // 점진적으로 난이도 증가
            $target_level = $current_level + ($i / $session_count) * ($goal_level - $current_level);

            $recommendations = $this->recommendProblems($user_id, 3, [
                'target_level' => round($target_level),
                'focus_weak_areas' => true
            ]);

            $path[] = [
                'session' => $i + 1,
                'target_level' => round($target_level),
                'problems' => $recommendations
            ];
        }

        return $path;
    }

    /**
     * 약점 분석 및 보완 문제 추천
     */
    public function recommendForWeakness($user_id, $count = 5) {
        $user_profile = $this->getUserProfile($user_id);

        // 숙련도가 가장 낮은 영역 찾기
        $mastery_levels = [
            'arithmetic' => $user_profile['arithmetic_mastery'],
            'geometric' => $user_profile['geometric_mastery'],
            'fibonacci' => $user_profile['fibonacci_mastery'],
            'pattern' => $user_profile['pattern_mastery']
        ];

        asort($mastery_levels);
        $weakest_type = key($mastery_levels);

        // 해당 유형의 문제만 추천
        $stmt = $this->db->prepare("
            SELECT * FROM problems
            WHERE problem_type = ?
            AND is_active = 1
            AND difficulty_level BETWEEN ? AND ?
            ORDER BY RAND()
            LIMIT ?
        ");

        $min_diff = max(1, $user_profile['current_level'] - 1);
        $max_diff = $user_profile['current_level'] + 2;

        $stmt->execute([$weakest_type, $min_diff, $max_diff, $count]);

        $problems = $stmt->fetchAll();

        foreach ($problems as &$problem) {
            $problem['sequence_data'] = json_decode($problem['sequence_data'], true);
            $problem['recommendation_reason'] = "약점 보완: {$weakest_type} 유형";
        }

        return $problems;
    }
}
