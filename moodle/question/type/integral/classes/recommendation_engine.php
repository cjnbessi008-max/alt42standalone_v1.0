<?php
// This file is part of Moodle - http://moodle.org/
/**
 * Intelligent Recommendation Engine
 * AI 기반 적분 문제 추천 엔진
 *
 * @package    qtype_integral
 * @copyright  2025 Alt42 Education System
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace qtype_integral;

defined('MOODLE_INTERNAL') || die();

/**
 * 추천 엔진 클래스
 * 학생의 성과를 분석하고 최적의 다음 문제를 추천
 */
class recommendation_engine {

    /** @var \moodle_database Database instance */
    private $db;

    /** @var int Student ID */
    private $student_id;

    /** @var string Module ID */
    private $module_id;

    /** @var object Student learning profile */
    private $profile;

    /** @var string Algorithm version */
    const ALGORITHM_VERSION = '1.0';

    /**
     * Constructor
     *
     * @param int $student_id Student ID
     * @param string $module_id Module UUID
     */
    public function __construct($student_id, $module_id) {
        global $DB;
        $this->db = $DB;
        $this->student_id = $student_id;
        $this->module_id = $module_id;

        // 학습 프로필 로드 또는 생성
        $this->load_or_create_profile();
    }

    /**
     * 학습 프로필 로드 또는 생성
     */
    private function load_or_create_profile() {
        $this->profile = $this->db->get_record('student_learning_profile',
            array('student_id' => $this->student_id, 'module_id' => $this->module_id));

        if (!$this->profile) {
            // 새 프로필 생성
            $this->profile = $this->create_new_profile();
        }
    }

    /**
     * 새 학습 프로필 생성
     *
     * @return object New profile
     */
    private function create_new_profile() {
        $profile = new \stdClass();
        $profile->student_id = $this->student_id;
        $profile->module_id = $this->module_id;
        $profile->overall_performance_score = 50.00;
        $profile->learning_speed = 'average';
        $profile->consistency_score = 50.00;
        $profile->difficulty_1_success_rate = 0.00;
        $profile->difficulty_2_success_rate = 0.00;
        $profile->difficulty_3_success_rate = 0.00;
        $profile->difficulty_4_success_rate = 0.00;
        $profile->difficulty_5_success_rate = 0.00;
        $profile->current_difficulty_level = 1;
        $profile->recommended_difficulty_level = 1;
        $profile->concept_mastery = json_encode(array());
        $profile->weak_concepts = json_encode(array());
        $profile->strong_concepts = json_encode(array());
        $profile->preferred_problem_types = json_encode(array());
        $profile->avg_time_per_problem = 0;
        $profile->optimal_study_time = 0;
        $profile->recommendation_acceptance_rate = 0.00;
        $profile->target_difficulty_level = 3;
        $profile->created_at = time();
        $profile->updated_at = time();

        $profile->id = $this->db->insert_record('student_learning_profile', $profile);

        return $profile;
    }

    /**
     * 학생 성과 분석 및 프로필 업데이트
     *
     * @return array Analysis results
     */
    public function analyze_student_performance() {
        // 모든 시도 기록 가져오기
        $attempts = $this->get_student_attempts();

        if (empty($attempts)) {
            return array(
                'status' => 'no_data',
                'message' => '아직 시도 기록이 없습니다.'
            );
        }

        // 전체 성과 분석
        $overall_stats = $this->calculate_overall_stats($attempts);

        // 난이도별 성과 분석
        $difficulty_stats = $this->calculate_difficulty_stats($attempts);

        // 개념별 숙련도 분석
        $concept_mastery = $this->analyze_concept_mastery($attempts);

        // 학습 속도 분석
        $learning_speed = $this->analyze_learning_speed($attempts);

        // 일관성 분석
        $consistency = $this->analyze_consistency($attempts);

        // 프로필 업데이트
        $this->update_profile(array(
            'overall_stats' => $overall_stats,
            'difficulty_stats' => $difficulty_stats,
            'concept_mastery' => $concept_mastery,
            'learning_speed' => $learning_speed,
            'consistency' => $consistency
        ));

        return array(
            'status' => 'success',
            'overall_performance' => $overall_stats['performance_score'],
            'current_level' => $this->profile->current_difficulty_level,
            'recommended_level' => $this->profile->recommended_difficulty_level,
            'strong_concepts' => json_decode($this->profile->strong_concepts, true),
            'weak_concepts' => json_decode($this->profile->weak_concepts, true),
            'learning_speed' => $this->profile->learning_speed,
            'consistency_score' => $this->profile->consistency_score
        );
    }

    /**
     * 학생의 모든 시도 기록 가져오기
     *
     * @return array Attempts with problem info
     */
    private function get_student_attempts() {
        $sql = "SELECT a.*, p.difficulty_level, p.problem_type, d.key_concepts
                FROM {student_attempts} a
                JOIN {integral_problems} p ON a.problem_id = p.id
                LEFT JOIN {integral_digest} d ON p.digest_id = d.id
                WHERE a.student_id = ? AND p.module_id = ?
                ORDER BY a.attempted_at ASC";

        return $this->db->get_records_sql($sql, array($this->student_id, $this->module_id));
    }

    /**
     * 전체 성과 통계 계산
     *
     * @param array $attempts Student attempts
     * @return array Overall statistics
     */
    private function calculate_overall_stats($attempts) {
        $total = count($attempts);
        $correct = 0;
        $total_time = 0;

        foreach ($attempts as $attempt) {
            if ($attempt->is_correct) {
                $correct++;
            }
            $total_time += $attempt->time_spent_seconds;
        }

        $success_rate = $total > 0 ? ($correct / $total) * 100 : 0;
        $avg_time = $total > 0 ? $total_time / $total : 0;

        // 성과 점수 계산 (정답률 70% + 시간 효율성 30%)
        $time_efficiency = $this->calculate_time_efficiency($avg_time);
        $performance_score = ($success_rate * 0.7) + ($time_efficiency * 0.3);

        return array(
            'total_attempts' => $total,
            'correct_attempts' => $correct,
            'success_rate' => round($success_rate, 2),
            'avg_time_seconds' => round($avg_time),
            'performance_score' => round($performance_score, 2)
        );
    }

    /**
     * 시간 효율성 계산
     *
     * @param int $avg_time Average time in seconds
     * @return float Efficiency score (0-100)
     */
    private function calculate_time_efficiency($avg_time) {
        // 최적 시간: 5-10분 (300-600초)
        $optimal_min = 300;
        $optimal_max = 600;

        if ($avg_time >= $optimal_min && $avg_time <= $optimal_max) {
            return 100;
        } else if ($avg_time < $optimal_min) {
            // 너무 빠름 (정확도 희생 가능성)
            return 80;
        } else {
            // 너무 느림
            $penalty = ($avg_time - $optimal_max) / 60; // 분당 감점
            return max(0, 100 - $penalty);
        }
    }

    /**
     * 난이도별 성과 통계
     *
     * @param array $attempts Student attempts
     * @return array Difficulty statistics
     */
    private function calculate_difficulty_stats($attempts) {
        $by_difficulty = array(1 => array(), 2 => array(), 3 => array(), 4 => array(), 5 => array());

        foreach ($attempts as $attempt) {
            $level = $attempt->difficulty_level;
            if (isset($by_difficulty[$level])) {
                $by_difficulty[$level][] = $attempt;
            }
        }

        $stats = array();
        $max_success_level = 1;

        foreach ($by_difficulty as $level => $level_attempts) {
            if (empty($level_attempts)) {
                $stats[$level] = array('success_rate' => 0, 'attempts' => 0);
                continue;
            }

            $correct = 0;
            foreach ($level_attempts as $attempt) {
                if ($attempt->is_correct) {
                    $correct++;
                }
            }

            $success_rate = ($correct / count($level_attempts)) * 100;
            $stats[$level] = array(
                'success_rate' => round($success_rate, 2),
                'attempts' => count($level_attempts)
            );

            // 80% 이상 성공률인 최고 난이도 찾기
            if ($success_rate >= 80) {
                $max_success_level = max($max_success_level, $level);
            }
        }

        $stats['current_mastered_level'] = $max_success_level;
        $stats['recommended_next_level'] = min(5, $max_success_level + 1);

        return $stats;
    }

    /**
     * 개념별 숙련도 분석
     *
     * @param array $attempts Student attempts
     * @return array Concept mastery data
     */
    private function analyze_concept_mastery($attempts) {
        $concept_attempts = array();

        foreach ($attempts as $attempt) {
            if (empty($attempt->key_concepts)) {
                continue;
            }

            $concepts = json_decode($attempt->key_concepts, true);
            if (!is_array($concepts)) {
                continue;
            }

            foreach ($concepts as $concept) {
                if (!isset($concept_attempts[$concept])) {
                    $concept_attempts[$concept] = array('total' => 0, 'correct' => 0);
                }

                $concept_attempts[$concept]['total']++;
                if ($attempt->is_correct) {
                    $concept_attempts[$concept]['correct']++;
                }
            }
        }

        // 숙련도 점수 계산
        $mastery_scores = array();
        $weak_concepts = array();
        $strong_concepts = array();

        foreach ($concept_attempts as $concept => $stats) {
            $mastery_score = ($stats['correct'] / $stats['total']) * 100;
            $mastery_scores[$concept] = round($mastery_score, 2);

            if ($mastery_score < 60) {
                $weak_concepts[] = $concept;
            } else if ($mastery_score >= 85) {
                $strong_concepts[] = $concept;
            }
        }

        return array(
            'mastery_scores' => $mastery_scores,
            'weak_concepts' => $weak_concepts,
            'strong_concepts' => $strong_concepts
        );
    }

    /**
     * 학습 속도 분석
     *
     * @param array $attempts Student attempts
     * @return string Learning speed (slow/average/fast)
     */
    private function analyze_learning_speed($attempts) {
        if (count($attempts) < 5) {
            return 'average'; // 데이터 부족
        }

        // 최근 10개 시도의 개선 추세 분석
        $recent = array_slice($attempts, -10);
        $first_half = array_slice($recent, 0, 5);
        $second_half = array_slice($recent, 5);

        $first_success_rate = $this->get_success_rate($first_half);
        $second_success_rate = $this->get_success_rate($second_half);

        $improvement = $second_success_rate - $first_success_rate;

        if ($improvement >= 20) {
            return 'fast';
        } else if ($improvement >= 10) {
            return 'average';
        } else {
            return 'slow';
        }
    }

    /**
     * 일관성 분석
     *
     * @param array $attempts Student attempts
     * @return float Consistency score (0-100)
     */
    private function analyze_consistency($attempts) {
        if (count($attempts) < 3) {
            return 50.00; // 기본값
        }

        // 최근 시도들의 성공률 분산 계산
        $recent = array_slice($attempts, -10);
        $success_values = array();

        foreach ($recent as $attempt) {
            $success_values[] = $attempt->is_correct ? 100 : 0;
        }

        $mean = array_sum($success_values) / count($success_values);
        $variance = 0;

        foreach ($success_values as $value) {
            $variance += pow($value - $mean, 2);
        }

        $variance /= count($success_values);
        $std_dev = sqrt($variance);

        // 표준편차가 낮을수록 일관성이 높음
        // 표준편차 0 = 100점, 표준편차 50 = 0점
        $consistency_score = max(0, 100 - ($std_dev * 2));

        return round($consistency_score, 2);
    }

    /**
     * 성공률 계산 헬퍼 함수
     *
     * @param array $attempts Attempts subset
     * @return float Success rate
     */
    private function get_success_rate($attempts) {
        if (empty($attempts)) {
            return 0;
        }

        $correct = 0;
        foreach ($attempts as $attempt) {
            if ($attempt->is_correct) {
                $correct++;
            }
        }

        return ($correct / count($attempts)) * 100;
    }

    /**
     * 프로필 업데이트
     *
     * @param array $analysis_data Analysis results
     */
    private function update_profile($analysis_data) {
        $overall = $analysis_data['overall_stats'];
        $difficulty = $analysis_data['difficulty_stats'];
        $concept = $analysis_data['concept_mastery'];

        $this->profile->overall_performance_score = $overall['performance_score'];
        $this->profile->learning_speed = $analysis_data['learning_speed'];
        $this->profile->consistency_score = $analysis_data['consistency'];

        // 난이도별 성공률 업데이트
        for ($i = 1; $i <= 5; $i++) {
            $field = "difficulty_{$i}_success_rate";
            $this->profile->$field = $difficulty[$i]['success_rate'];
        }

        $this->profile->current_difficulty_level = $difficulty['current_mastered_level'];
        $this->profile->recommended_difficulty_level = $difficulty['recommended_next_level'];

        // 개념 마스터리 업데이트
        $this->profile->concept_mastery = json_encode($concept['mastery_scores']);
        $this->profile->weak_concepts = json_encode($concept['weak_concepts']);
        $this->profile->strong_concepts = json_encode($concept['strong_concepts']);

        $this->profile->avg_time_per_problem = $overall['avg_time_seconds'];
        $this->profile->updated_at = time();

        $this->db->update_record('student_learning_profile', $this->profile);
    }

    /**
     * 다음 문제 추천
     *
     * @param string $recommendation_type Type: 'difficulty_based', 'concept_based', 'mixed'
     * @param int $count Number of recommendations
     * @return array Recommended problems
     */
    public function recommend_next_problems($recommendation_type = 'mixed', $count = 3) {
        // 성과 분석 (프로필이 최신이 아니면 업데이트)
        $this->analyze_student_performance();

        $recommendations = array();

        switch ($recommendation_type) {
            case 'difficulty_based':
                $recommendations = $this->recommend_by_difficulty($count);
                break;

            case 'concept_based':
                $recommendations = $this->recommend_by_concept($count);
                break;

            case 'mixed':
            default:
                // 50% 난이도 기반, 50% 개념 기반
                $diff_count = ceil($count / 2);
                $concept_count = $count - $diff_count;

                $diff_recs = $this->recommend_by_difficulty($diff_count);
                $concept_recs = $this->recommend_by_concept($concept_count);

                $recommendations = array_merge($diff_recs, $concept_recs);
                break;
        }

        // 추천 기록 저장
        foreach ($recommendations as &$rec) {
            $rec['history_id'] = $this->save_recommendation_history($rec);
        }

        return $recommendations;
    }

    /**
     * 난이도 기반 추천
     *
     * @param int $count Number of recommendations
     * @return array Recommended problems
     */
    private function recommend_by_difficulty($count) {
        $recommended_level = $this->profile->recommended_difficulty_level;

        // 이미 시도한 문제 제외
        $attempted_ids = $this->get_attempted_problem_ids();

        $sql = "SELECT p.id, p.problem_type, p.difficulty_level, p.integrand,
                       d.problem_title, d.concept_overview, d.time_estimate_minutes
                FROM {integral_problems} p
                LEFT JOIN {integral_digest} d ON p.digest_id = d.id
                WHERE p.module_id = ?
                  AND p.difficulty_level = ?
                  AND p.id NOT IN (" . implode(',', array_fill(0, count($attempted_ids), '?')) . ")
                ORDER BY RAND()
                LIMIT ?";

        $params = array_merge(
            array($this->module_id, $recommended_level),
            $attempted_ids,
            array($count)
        );

        if (empty($attempted_ids)) {
            $sql = "SELECT p.id, p.problem_type, p.difficulty_level, p.integrand,
                           d.problem_title, d.concept_overview, d.time_estimate_minutes
                    FROM {integral_problems} p
                    LEFT JOIN {integral_digest} d ON p.digest_id = d.id
                    WHERE p.module_id = ? AND p.difficulty_level = ?
                    ORDER BY RAND()
                    LIMIT ?";
            $params = array($this->module_id, $recommended_level, $count);
        }

        $problems = $this->db->get_records_sql($sql, $params);

        $recommendations = array();
        foreach ($problems as $problem) {
            $recommendations[] = array(
                'problem_id' => $problem->id,
                'problem_title' => $problem->problem_title,
                'difficulty' => $problem->difficulty_level,
                'recommendation_type' => 'difficulty_based',
                'recommendation_reason' => "현재 레벨 {$recommended_level}에 적합한 문제입니다.",
                'recommendation_score' => $this->calculate_recommendation_score($problem, 'difficulty'),
                'expected_success_rate' => $this->predict_success_rate($problem),
                'estimated_time' => $problem->time_estimate_minutes
            );
        }

        return $recommendations;
    }

    /**
     * 개념 기반 추천
     *
     * @param int $count Number of recommendations
     * @return array Recommended problems
     */
    private function recommend_by_concept($count) {
        $weak_concepts = json_decode($this->profile->weak_concepts, true);

        if (empty($weak_concepts)) {
            // 약점이 없으면 난이도 기반으로 대체
            return $this->recommend_by_difficulty($count);
        }

        // 약점 개념을 포함하는 문제 찾기
        $attempted_ids = $this->get_attempted_problem_ids();

        $concept_conditions = array();
        foreach ($weak_concepts as $concept) {
            $concept_conditions[] = "d.key_concepts LIKE '%" . $this->db->sql_like_escape($concept) . "%'";
        }

        $concept_where = "(" . implode(' OR ', $concept_conditions) . ")";

        $sql = "SELECT p.id, p.problem_type, p.difficulty_level, p.integrand,
                       d.problem_title, d.concept_overview, d.key_concepts, d.time_estimate_minutes
                FROM {integral_problems} p
                JOIN {integral_digest} d ON p.digest_id = d.id
                WHERE p.module_id = ?
                  AND {$concept_where}
                  AND p.difficulty_level <= ?
                  AND p.id NOT IN (" . implode(',', array_fill(0, count($attempted_ids), '?')) . ")
                ORDER BY RAND()
                LIMIT ?";

        $params = array_merge(
            array($this->module_id, $this->profile->current_difficulty_level),
            $attempted_ids,
            array($count)
        );

        if (empty($attempted_ids)) {
            $sql = "SELECT p.id, p.problem_type, p.difficulty_level, p.integrand,
                           d.problem_title, d.concept_overview, d.key_concepts, d.time_estimate_minutes
                    FROM {integral_problems} p
                    JOIN {integral_digest} d ON p.digest_id = d.id
                    WHERE p.module_id = ? AND {$concept_where} AND p.difficulty_level <= ?
                    ORDER BY RAND()
                    LIMIT ?";
            $params = array($this->module_id, $this->profile->current_difficulty_level, $count);
        }

        $problems = $this->db->get_records_sql($sql, $params);

        $recommendations = array();
        foreach ($problems as $problem) {
            $matching_concepts = $this->find_matching_weak_concepts($problem->key_concepts, $weak_concepts);

            $recommendations[] = array(
                'problem_id' => $problem->id,
                'problem_title' => $problem->problem_title,
                'difficulty' => $problem->difficulty_level,
                'recommendation_type' => 'concept_based',
                'recommendation_reason' => "약점 개념 보강: " . implode(', ', $matching_concepts),
                'recommendation_score' => $this->calculate_recommendation_score($problem, 'concept'),
                'expected_success_rate' => $this->predict_success_rate($problem),
                'estimated_time' => $problem->time_estimate_minutes,
                'target_concepts' => $matching_concepts
            );
        }

        return $recommendations;
    }

    /**
     * 시도한 문제 ID 목록 가져오기
     *
     * @return array Problem IDs
     */
    private function get_attempted_problem_ids() {
        $sql = "SELECT DISTINCT problem_id
                FROM {student_attempts}
                WHERE student_id = ?";

        $records = $this->db->get_records_sql($sql, array($this->student_id));

        $ids = array();
        foreach ($records as $record) {
            $ids[] = "'{$record->problem_id}'";
        }

        return !empty($ids) ? $ids : array("''");
    }

    /**
     * 약점 개념 매칭
     *
     * @param string $problem_concepts JSON string of problem concepts
     * @param array $weak_concepts Weak concepts array
     * @return array Matching concepts
     */
    private function find_matching_weak_concepts($problem_concepts, $weak_concepts) {
        $concepts = json_decode($problem_concepts, true);
        if (!is_array($concepts)) {
            return array();
        }

        return array_intersect($concepts, $weak_concepts);
    }

    /**
     * 추천 점수 계산
     *
     * @param object $problem Problem object
     * @param string $type Recommendation type
     * @return float Score (0-100)
     */
    private function calculate_recommendation_score($problem, $type) {
        $score = 50.0; // 기본 점수

        if ($type === 'difficulty') {
            // 난이도가 추천 레벨과 정확히 맞으면 높은 점수
            if ($problem->difficulty_level == $this->profile->recommended_difficulty_level) {
                $score = 90.0;
            } else {
                $diff = abs($problem->difficulty_level - $this->profile->recommended_difficulty_level);
                $score = max(50, 90 - ($diff * 15));
            }
        } else if ($type === 'concept') {
            // 약점 개념을 다루는 문제일수록 높은 점수
            $score = 85.0;
        }

        return round($score, 2);
    }

    /**
     * 성공률 예측
     *
     * @param object $problem Problem object
     * @return float Predicted success rate (0-100)
     */
    private function predict_success_rate($problem) {
        $difficulty = $problem->difficulty_level;

        // 해당 난이도에서의 과거 성공률 가져오기
        $field = "difficulty_{$difficulty}_success_rate";
        $historical_rate = $this->profile->$field;

        // 전체 성과 점수 고려
        $overall_score = $this->profile->overall_performance_score;

        // 가중 평균
        $predicted_rate = ($historical_rate * 0.7) + ($overall_score * 0.3);

        return round($predicted_rate, 2);
    }

    /**
     * 추천 기록 저장
     *
     * @param array $recommendation Recommendation data
     * @return int History ID
     */
    private function save_recommendation_history($recommendation) {
        $history = new \stdClass();
        $history->student_id = $this->student_id;
        $history->problem_id = $recommendation['problem_id'];
        $history->recommendation_type = $recommendation['recommendation_type'];
        $history->recommendation_reason = $recommendation['recommendation_reason'];
        $history->recommendation_score = $recommendation['recommendation_score'];
        $history->student_current_level = $this->profile->current_difficulty_level;
        $history->problem_difficulty = $recommendation['difficulty'];
        $history->expected_success_rate = $recommendation['expected_success_rate'];
        $history->algorithm_version = self::ALGORITHM_VERSION;
        $history->recommendation_factors = json_encode(array(
            'overall_performance' => $this->profile->overall_performance_score,
            'learning_speed' => $this->profile->learning_speed,
            'consistency' => $this->profile->consistency_score
        ));
        $history->was_accepted = false;
        $history->was_attempted = false;
        $history->recommended_at = time();

        return $this->db->insert_record('recommendation_history', $history);
    }

    /**
     * 추천 수락 기록
     *
     * @param int $history_id Recommendation history ID
     * @return bool Success
     */
    public function accept_recommendation($history_id) {
        try {
            $this->db->set_field('recommendation_history', 'was_accepted', true,
                array('id' => $history_id));
            $this->db->set_field('recommendation_history', 'accepted_at', time(),
                array('id' => $history_id));

            // 수락률 업데이트
            $this->update_acceptance_rate();

            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * 수락률 업데이트
     */
    private function update_acceptance_rate() {
        $sql = "SELECT COUNT(*) as total,
                       SUM(CASE WHEN was_accepted = 1 THEN 1 ELSE 0 END) as accepted
                FROM {recommendation_history}
                WHERE student_id = ?";

        $stats = $this->db->get_record_sql($sql, array($this->student_id));

        if ($stats && $stats->total > 0) {
            $rate = ($stats->accepted / $stats->total) * 100;
            $this->db->set_field('student_learning_profile', 'recommendation_acceptance_rate',
                round($rate, 2),
                array('student_id' => $this->student_id, 'module_id' => $this->module_id));
        }
    }

    /**
     * 학습 경로 생성
     *
     * @param int $target_difficulty Target difficulty level
     * @param int $problem_count Number of problems in path
     * @return int Learning path ID
     */
    public function create_learning_path($target_difficulty = null, $problem_count = 10) {
        if ($target_difficulty === null) {
            $target_difficulty = $this->profile->target_difficulty_level;
        }

        $current_level = $this->profile->current_difficulty_level;

        // 점진적인 난이도 증가 경로 생성
        $sequence = $this->generate_progressive_sequence($current_level, $target_difficulty, $problem_count);

        $path = new \stdClass();
        $path->student_id = $this->student_id;
        $path->module_id = $this->module_id;
        $path->path_name = "레벨 {$current_level}에서 {$target_difficulty}로 가는 학습 경로";
        $path->path_type = 'auto_generated';
        $path->problem_sequence = json_encode($sequence);
        $path->current_position = 0;
        $path->total_problems = count($sequence);
        $path->problems_completed = 0;
        $path->success_rate = 0.00;
        $path->estimated_completion_time = $this->estimate_path_time($sequence);
        $path->is_adaptive = true;
        $path->adjustment_count = 0;
        $path->learning_goal = "{$target_difficulty}레벨 달성";
        $path->status = 'active';
        $path->created_at = time();
        $path->updated_at = time();

        return $this->db->insert_record('learning_path', $path);
    }

    /**
     * 점진적 난이도 증가 시퀀스 생성
     *
     * @param int $start_level Start difficulty
     * @param int $target_level Target difficulty
     * @param int $total_problems Total number of problems
     * @return array Problem sequence
     */
    private function generate_progressive_sequence($start_level, $target_level, $total_problems) {
        $sequence = array();
        $level_progression = array();

        // 각 레벨별 문제 수 배분
        $levels_to_cover = range($start_level, $target_level);
        $problems_per_level = max(2, floor($total_problems / count($levels_to_cover)));

        foreach ($levels_to_cover as $level) {
            $level_progression[$level] = $problems_per_level;
        }

        // 각 레벨에서 문제 선택
        foreach ($level_progression as $level => $count) {
            $recommendations = $this->recommend_by_difficulty($count);

            foreach ($recommendations as $rec) {
                $sequence[] = $rec['problem_id'];
            }
        }

        return $sequence;
    }

    /**
     * 학습 경로 완료 시간 추정
     *
     * @param array $sequence Problem sequence
     * @return int Estimated time in minutes
     */
    private function estimate_path_time($sequence) {
        $avg_time = $this->profile->avg_time_per_problem > 0 ?
            $this->profile->avg_time_per_problem : 600; // 기본 10분

        $total_seconds = count($sequence) * $avg_time;

        return round($total_seconds / 60); // 분 단위 반환
    }

    /**
     * 프로필 가져오기
     *
     * @return object Student learning profile
     */
    public function get_profile() {
        return $this->profile;
    }
}
