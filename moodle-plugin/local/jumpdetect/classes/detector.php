<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Jump Detection Engine
 *
 * 점프 추론 감지 핵심 알고리즘
 *
 * @package    local_jumpdetect
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

class local_jumpdetect_detector {

    /** @var int 순차적 건너뛰기 임계값 */
    const SEQUENTIAL_THRESHOLD = 1;

    /** @var float 시간 이상 Z-Score 임계값 */
    const TIME_ZSCORE_THRESHOLD = -2.0;

    /** @var int 최소 학습 시간 (초) */
    const MIN_LEARNING_TIME = 60;

    /**
     * 사용자 행동 분석 (메인 함수)
     *
     * @param int $userid 사용자 ID
     * @param int $courseid 코스 ID
     * @param int $moduleid 모듈 ID
     * @return array 감지 결과
     */
    public function analyze_user_behavior($userid, $courseid, $moduleid) {
        $results = [];

        // 1. 순차적 건너뛰기 감지
        $sequential_result = $this->detect_sequential_jump($userid, $courseid, $moduleid);
        if ($sequential_result['detected']) {
            $results[] = $sequential_result;
        }

        // 2. 선수 학습 누락 감지
        $prerequisite_result = $this->detect_prerequisite_skip($userid, $courseid, $moduleid);
        if ($prerequisite_result['detected']) {
            $results[] = $prerequisite_result;
        }

        // 3. 퀴즈/과제 회피 감지
        $assessment_result = $this->detect_assessment_evasion($userid, $courseid, $moduleid);
        if ($assessment_result['detected']) {
            $results[] = $assessment_result;
        }

        // 4. 결과 통합
        if (!empty($results)) {
            return $this->merge_results($results);
        }

        return [
            'detected' => false,
            'jump_score' => 0,
            'severity' => 'normal'
        ];
    }

    /**
     * 순차적 건너뛰기 감지
     *
     * @param int $userid
     * @param int $courseid
     * @param int $moduleid
     * @return array
     */
    public function detect_sequential_jump($userid, $courseid, $moduleid) {
        global $DB;

        // 1. 코스의 정상 모듈 순서 가져오기
        $expected_sequence = $this->get_course_module_sequence($courseid);

        if (empty($expected_sequence)) {
            return ['detected' => false, 'jump_score' => 0];
        }

        // 2. 현재 모듈 위치 찾기
        $current_position = array_search($moduleid, $expected_sequence);

        if ($current_position === false) {
            return ['detected' => false, 'jump_score' => 0];
        }

        // 3. 사용자의 마지막 완료 위치 찾기
        $last_position = $this->get_last_completed_position($userid, $courseid, $expected_sequence);

        // 4. 건너뛴 모듈 계산
        $jump_distance = $current_position - $last_position;

        if ($jump_distance > self::SEQUENTIAL_THRESHOLD) {
            $skipped_modules = [];
            for ($i = $last_position + 1; $i < $current_position; $i++) {
                $skipped_modules[] = $expected_sequence[$i];
            }

            $jump_score = count($skipped_modules) * 2;
            $severity = $this->calculate_severity($jump_score);

            return [
                'detected' => true,
                'jump_type' => 'sequential',
                'skipped_modules' => $skipped_modules,
                'jump_score' => $jump_score,
                'severity' => $severity,
                'details' => "모듈 {$jump_distance}개 건너뛰기"
            ];
        }

        return ['detected' => false, 'jump_score' => 0];
    }

    /**
     * 선수 학습 누락 감지
     *
     * @param int $userid
     * @param int $courseid
     * @param int $moduleid
     * @return array
     */
    public function detect_prerequisite_skip($userid, $courseid, $moduleid) {
        global $DB;

        // 1. 현재 모듈의 선수 과정 가져오기
        $prerequisites = $this->get_module_prerequisites($moduleid);

        if (empty($prerequisites)) {
            return ['detected' => false, 'jump_score' => 0];
        }

        // 2. 사용자의 선수 과정 완료 여부 확인
        $missing_prerequisites = [];

        foreach ($prerequisites as $prereq_id) {
            $completed = $DB->record_exists('jumpdetect_tracking', [
                'userid' => $userid,
                'moduleid' => $prereq_id,
                'eventname' => 'course_module_completion'
            ]);

            if (!$completed) {
                $missing_prerequisites[] = $prereq_id;
            }
        }

        // 3. 누락된 선수 과정이 있으면 점프 감지
        if (!empty($missing_prerequisites)) {
            $jump_score = count($missing_prerequisites) * 3;
            $severity = $this->calculate_severity($jump_score);

            return [
                'detected' => true,
                'jump_type' => 'prerequisite',
                'missing_prerequisites' => $missing_prerequisites,
                'jump_score' => $jump_score,
                'severity' => $severity,
                'details' => "선수 과정 " . count($missing_prerequisites) . "개 미완료"
            ];
        }

        return ['detected' => false, 'jump_score' => 0];
    }

    /**
     * 시간 이상 패턴 감지
     *
     * @param int $userid
     * @param int $moduleid
     * @return array
     */
    public function check_time_anomaly($userid, $moduleid) {
        global $DB;

        // 1. 해당 모듈의 사용자 학습 시간 계산
        $sql = "SELECT MIN(timecreated) as start_time, MAX(timemodified) as end_time
                FROM {jumpdetect_tracking}
                WHERE userid = :userid AND moduleid = :moduleid";

        $times = $DB->get_record_sql($sql, [
            'userid' => $userid,
            'moduleid' => $moduleid
        ]);

        if (!$times || !$times->start_time || !$times->end_time) {
            return ['detected' => false, 'jump_score' => 0];
        }

        $time_spent = $times->end_time - $times->start_time;

        // 2. 해당 모듈의 평균 학습 시간 및 표준편차 계산
        $sql = "SELECT AVG(timemodified - timecreated) as avg_time,
                       STD(timemodified - timecreated) as stddev_time
                FROM (
                    SELECT userid, MIN(timecreated) as timecreated, MAX(timemodified) as timemodified
                    FROM {jumpdetect_tracking}
                    WHERE moduleid = :moduleid
                    AND userid != :userid
                    GROUP BY userid
                ) as user_times";

        $stats = $DB->get_record_sql($sql, [
            'moduleid' => $moduleid,
            'userid' => $userid
        ]);

        $avg_time = $stats->avg_time ?? 3600; // 기본값: 1시간
        $stddev_time = $stats->stddev_time ?? 600; // 기본값: 10분

        if ($stddev_time == 0) {
            $stddev_time = 600; // 0으로 나누기 방지
        }

        // 3. Z-Score 계산
        $z_score = ($time_spent - $avg_time) / $stddev_time;

        // 4. 비정상적으로 빠르게 완료한 경우 (Z-Score < -2)
        if ($z_score < self::TIME_ZSCORE_THRESHOLD || $time_spent < self::MIN_LEARNING_TIME) {
            $jump_score = abs($z_score) * 1.5;
            $severity = $this->calculate_severity($jump_score);

            return [
                'detected' => true,
                'jump_type' => 'time_anomaly',
                'time_spent' => $time_spent,
                'avg_time' => $avg_time,
                'z_score' => round($z_score, 2),
                'jump_score' => $jump_score,
                'severity' => $severity,
                'details' => "학습 시간: " . gmdate('i:s', $time_spent) . " (평균: " . gmdate('i:s', $avg_time) . ")"
            ];
        }

        return ['detected' => false, 'jump_score' => 0];
    }

    /**
     * 퀴즈/과제 회피 감지
     *
     * @param int $userid
     * @param int $courseid
     * @param int $moduleid
     * @return array
     */
    public function detect_assessment_evasion($userid, $courseid, $moduleid) {
        global $DB;

        // 1. 코스의 모듈 순서 가져오기
        $sequence = $this->get_course_module_sequence($courseid);
        $current_position = array_search($moduleid, $sequence);

        if ($current_position === false || $current_position == 0) {
            return ['detected' => false, 'jump_score' => 0];
        }

        // 2. 이전 모듈이 퀴즈/과제인지 확인
        $previous_module_id = $sequence[$current_position - 1];
        $previous_module_type = $this->get_module_type($previous_module_id);

        if (!in_array($previous_module_type, ['quiz', 'assign'])) {
            return ['detected' => false, 'jump_score' => 0];
        }

        // 3. 이전 퀴즈/과제를 완료했는지 확인
        $completed = $DB->record_exists('jumpdetect_tracking', [
            'userid' => $userid,
            'moduleid' => $previous_module_id,
            'eventname' => 'course_module_completion'
        ]);

        if (!$completed) {
            $jump_score = 2.5;
            $severity = $this->calculate_severity($jump_score);

            return [
                'detected' => true,
                'jump_type' => 'assessment_evasion',
                'skipped_assessment' => $previous_module_id,
                'assessment_type' => $previous_module_type,
                'jump_score' => $jump_score,
                'severity' => $severity,
                'details' => ucfirst($previous_module_type) . " 건너뛰기"
            ];
        }

        return ['detected' => false, 'jump_score' => 0];
    }

    /**
     * 코스 모듈 순서 가져오기
     *
     * @param int $courseid
     * @return array
     */
    private function get_course_module_sequence($courseid) {
        global $DB;

        // course_sections 테이블에서 모듈 순서 가져오기
        $sql = "SELECT sequence
                FROM {course_sections}
                WHERE course = :courseid
                ORDER BY section ASC";

        $sections = $DB->get_records_sql($sql, ['courseid' => $courseid]);

        $sequence = [];
        foreach ($sections as $section) {
            if (!empty($section->sequence)) {
                $modules = explode(',', $section->sequence);
                $sequence = array_merge($sequence, $modules);
            }
        }

        return array_filter($sequence);
    }

    /**
     * 사용자의 마지막 완료 위치 가져오기
     *
     * @param int $userid
     * @param int $courseid
     * @param array $sequence
     * @return int
     */
    private function get_last_completed_position($userid, $courseid, $sequence) {
        global $DB;

        $sql = "SELECT moduleid
                FROM {jumpdetect_tracking}
                WHERE userid = :userid AND courseid = :courseid
                AND eventname = 'course_module_completion'
                ORDER BY timecreated DESC
                LIMIT 1";

        $last_module = $DB->get_record_sql($sql, [
            'userid' => $userid,
            'courseid' => $courseid
        ]);

        if ($last_module) {
            $position = array_search($last_module->moduleid, $sequence);
            return $position !== false ? $position : -1;
        }

        return -1;
    }

    /**
     * 모듈의 선수 과정 가져오기
     *
     * @param int $moduleid
     * @return array
     */
    private function get_module_prerequisites($moduleid) {
        global $DB;

        // Moodle의 availability 시스템에서 선수 과정 정보 추출
        $cm = $DB->get_record('course_modules', ['id' => $moduleid], 'availability');

        if (!$cm || empty($cm->availability)) {
            return [];
        }

        $availability = json_decode($cm->availability, true);
        $prerequisites = [];

        if (isset($availability['c']) && is_array($availability['c'])) {
            foreach ($availability['c'] as $condition) {
                if (isset($condition['type']) && $condition['type'] === 'completion') {
                    if (isset($condition['cm'])) {
                        $prerequisites[] = $condition['cm'];
                    }
                }
            }
        }

        return $prerequisites;
    }

    /**
     * 모듈 타입 가져오기
     *
     * @param int $moduleid
     * @return string
     */
    private function get_module_type($moduleid) {
        global $DB;

        $sql = "SELECT m.name as modname
                FROM {course_modules} cm
                JOIN {modules} m ON cm.module = m.id
                WHERE cm.id = :moduleid";

        $module = $DB->get_record_sql($sql, ['moduleid' => $moduleid]);

        return $module ? $module->modname : '';
    }

    /**
     * 심각도 계산
     *
     * @param float $jump_score
     * @return string
     */
    private function calculate_severity($jump_score) {
        if ($jump_score >= 21) {
            return 'critical';
        } elseif ($jump_score >= 11) {
            return 'warning';
        } elseif ($jump_score >= 6) {
            return 'caution';
        } else {
            return 'normal';
        }
    }

    /**
     * 여러 감지 결과 통합
     *
     * @param array $results
     * @return array
     */
    private function merge_results($results) {
        $total_score = 0;
        $jump_types = [];
        $all_details = [];

        foreach ($results as $result) {
            $total_score += $result['jump_score'];
            $jump_types[] = $result['jump_type'];
            if (isset($result['details'])) {
                $all_details[] = $result['details'];
            }
        }

        return [
            'detected' => true,
            'jump_type' => implode(', ', $jump_types),
            'jump_score' => $total_score,
            'severity' => $this->calculate_severity($total_score),
            'details' => implode(' | ', $all_details),
            'individual_results' => $results
        ];
    }

    /**
     * 사용자의 총 점프 점수 계산
     *
     * @param int $userid
     * @param int $courseid
     * @param int $days 최근 몇 일간
     * @return float
     */
    public function get_user_total_jump_score($userid, $courseid, $days = 30) {
        global $DB;

        $time_threshold = time() - ($days * 24 * 60 * 60);

        $sql = "SELECT SUM(jump_score) as total_score
                FROM {jumpdetect_patterns}
                WHERE userid = :userid
                AND courseid = :courseid
                AND detected_at >= :time_threshold";

        $result = $DB->get_record_sql($sql, [
            'userid' => $userid,
            'courseid' => $courseid,
            'time_threshold' => $time_threshold
        ]);

        return $result->total_score ?? 0;
    }
}
