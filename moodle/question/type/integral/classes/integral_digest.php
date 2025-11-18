<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Integral Digest API - 적분 문제 요약 생성 및 관리
 *
 * @package    qtype_integral
 * @copyright  2025 Alt42 Education System
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace qtype_integral;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/lib/dml/moodle_database.php');

/**
 * 적분 문제 다이제스트 클래스
 * 문제 전체 구조를 요약하여 모바일 앱에 제공
 */
class integral_digest {

    /** @var \moodle_database Database instance */
    private $db;

    /** @var string Problem ID */
    private $problem_id;

    /** @var object Digest data */
    private $digest_data;

    /**
     * Constructor
     *
     * @param string $problem_id UUID of the integral problem
     */
    public function __construct($problem_id = null) {
        global $DB;
        $this->db = $DB;
        $this->problem_id = $problem_id;

        if ($problem_id) {
            $this->load_digest();
        }
    }

    /**
     * 문제 다이제스트 생성
     *
     * @param array $problem_data 문제 데이터 배열
     * @return int|false Digest ID or false on failure
     */
    public function create_digest($problem_data) {
        try {
            $digest = new \stdClass();

            // 기본 정보
            $digest->problem_id = $problem_data['problem_id'];
            $digest->module_id = $problem_data['module_id'];
            $digest->problem_title = $problem_data['title'];
            $digest->problem_type = $problem_data['type'];
            $digest->difficulty_level = $problem_data['difficulty'];

            // 수학적 표현
            $digest->integrand = $problem_data['integrand'];
            $digest->lower_bound = isset($problem_data['lower_bound']) ? $problem_data['lower_bound'] : null;
            $digest->upper_bound = isset($problem_data['upper_bound']) ? $problem_data['upper_bound'] : null;
            $digest->variable_of_integration = isset($problem_data['variable']) ? $problem_data['variable'] : 'x';

            // 개념 요약 생성
            $digest->concept_overview = $this->generate_concept_overview($problem_data);
            $digest->key_concepts = json_encode($this->extract_key_concepts($problem_data));
            $digest->learning_objectives = json_encode($this->generate_learning_objectives($problem_data));
            $digest->prerequisite_skills = json_encode($this->identify_prerequisite_skills($problem_data));

            // 솔루션 다이제스트
            $digest->solution_steps = json_encode($this->generate_solution_steps($problem_data));
            $digest->final_answer = $problem_data['correct_answer'];
            $digest->alternative_methods = json_encode($this->suggest_alternative_methods($problem_data));
            $digest->solution_explanation = $this->generate_solution_explanation($problem_data);

            // 시각화 정보
            $digest->visual_type = isset($problem_data['visual_type']) ? $problem_data['visual_type'] : 'graph';
            $digest->graph_config = json_encode($this->create_graph_config($problem_data));
            $digest->has_animation = isset($problem_data['has_animation']) ? $problem_data['has_animation'] : false;

            // 도전 분석
            $digest->common_mistakes = json_encode($this->identify_common_mistakes($problem_data));
            $digest->difficulty_explanation = $this->explain_difficulty($problem_data);
            $digest->time_estimate_minutes = $this->estimate_time($problem_data);

            // 통계 초기화
            $digest->avg_attempts = 0.00;
            $digest->success_rate = 0.00;
            $digest->avg_time_seconds = 0;
            $digest->total_attempts = 0;

            $digest->created_at = time();
            $digest->updated_at = time();

            // DB에 삽입
            $digest_id = $this->db->insert_record('integral_digest', $digest);

            return $digest_id;

        } catch (\Exception $e) {
            debugging('Error creating integral digest: ' . $e->getMessage(), DEBUG_DEVELOPER);
            return false;
        }
    }

    /**
     * 다이제스트 로드
     *
     * @return object|false Digest data or false
     */
    private function load_digest() {
        if (!$this->problem_id) {
            return false;
        }

        $this->digest_data = $this->db->get_record('integral_digest',
            array('problem_id' => $this->problem_id));

        return $this->digest_data;
    }

    /**
     * 다이제스트 가져오기 (모바일 앱용 포맷)
     *
     * @param string $format 'summary', 'detailed', 'mobile'
     * @return array Formatted digest data
     */
    public function get_digest($format = 'mobile') {
        if (!$this->digest_data) {
            $this->load_digest();
        }

        if (!$this->digest_data) {
            return array('error' => 'Digest not found');
        }

        switch ($format) {
            case 'mobile':
                return $this->format_for_mobile();
            case 'summary':
                return $this->format_summary();
            case 'detailed':
                return $this->format_detailed();
            default:
                return $this->format_for_mobile();
        }
    }

    /**
     * 모바일 앱용 포맷 (우측 하단 가상 스마트폰 화면)
     *
     * @return array Mobile-optimized digest
     */
    private function format_for_mobile() {
        $digest = $this->digest_data;

        return array(
            'problem_id' => $digest->problem_id,
            'title' => $digest->problem_title,

            // 상단 섹션: 문제 개요
            'overview' => array(
                'type' => $this->translate_problem_type($digest->problem_type),
                'difficulty' => array(
                    'level' => $digest->difficulty_level,
                    'stars' => str_repeat('★', $digest->difficulty_level) . str_repeat('☆', 5 - $digest->difficulty_level),
                    'explanation' => $digest->difficulty_explanation
                ),
                'time_estimate' => $digest->time_estimate_minutes . '분',
                'concept' => $digest->concept_overview
            ),

            // 중단 섹션: 수학적 표현
            'mathematical_expression' => array(
                'integrand' => $digest->integrand,
                'bounds' => array(
                    'lower' => $digest->lower_bound,
                    'upper' => $digest->upper_bound
                ),
                'variable' => $digest->variable_of_integration,
                'latex' => $this->generate_latex_expression($digest)
            ),

            // 핵심 개념
            'key_concepts' => json_decode($digest->key_concepts, true),

            // 해법 요약 (접을 수 있는 형태)
            'solution_digest' => array(
                'steps' => json_decode($digest->solution_steps, true),
                'final_answer' => $digest->final_answer,
                'explanation' => $digest->solution_explanation,
                'alternative_methods' => json_decode($digest->alternative_methods, true)
            ),

            // 시각화
            'visualization' => array(
                'type' => $digest->visual_type,
                'config' => json_decode($digest->graph_config, true),
                'has_animation' => (bool)$digest->has_animation
            ),

            // 학습 가이드
            'learning_guide' => array(
                'objectives' => json_decode($digest->learning_objectives, true),
                'prerequisites' => json_decode($digest->prerequisite_skills, true),
                'common_mistakes' => json_decode($digest->common_mistakes, true)
            ),

            // 통계 (학생들의 평균 성과)
            'statistics' => array(
                'avg_attempts' => floatval($digest->avg_attempts),
                'success_rate' => floatval($digest->success_rate),
                'avg_time_minutes' => round($digest->avg_time_seconds / 60, 1),
                'total_attempts' => intval($digest->total_attempts)
            ),

            // UI 설정
            'mobile_layout' => array(
                'sections' => array(
                    array('type' => 'header', 'height' => '10%'),
                    array('type' => 'overview', 'height' => '15%', 'collapsible' => false),
                    array('type' => 'expression', 'height' => '20%', 'collapsible' => false),
                    array('type' => 'visualization', 'height' => '30%', 'collapsible' => true),
                    array('type' => 'solution', 'height' => '15%', 'collapsible' => true, 'initial' => 'collapsed'),
                    array('type' => 'navigation', 'height' => '10%')
                ),
                'theme' => 'light',
                'font_size' => 'medium',
                'enable_latex' => true
            )
        );
    }

    /**
     * 요약 포맷
     *
     * @return array Summary data
     */
    private function format_summary() {
        $digest = $this->digest_data;

        return array(
            'title' => $digest->problem_title,
            'type' => $digest->problem_type,
            'difficulty' => $digest->difficulty_level,
            'expression' => $this->generate_latex_expression($digest),
            'concept' => $digest->concept_overview,
            'answer' => $digest->final_answer,
            'time_estimate' => $digest->time_estimate_minutes
        );
    }

    /**
     * 상세 포맷
     *
     * @return array Detailed data
     */
    private function format_detailed() {
        $digest = $this->digest_data;

        return array(
            'basic_info' => array(
                'problem_id' => $digest->problem_id,
                'module_id' => $digest->module_id,
                'title' => $digest->problem_title,
                'type' => $digest->problem_type,
                'difficulty' => $digest->difficulty_level
            ),
            'mathematical' => array(
                'integrand' => $digest->integrand,
                'lower_bound' => $digest->lower_bound,
                'upper_bound' => $digest->upper_bound,
                'variable' => $digest->variable_of_integration
            ),
            'concepts' => array(
                'overview' => $digest->concept_overview,
                'key_concepts' => json_decode($digest->key_concepts, true),
                'objectives' => json_decode($digest->learning_objectives, true),
                'prerequisites' => json_decode($digest->prerequisite_skills, true)
            ),
            'solution' => array(
                'steps' => json_decode($digest->solution_steps, true),
                'answer' => $digest->final_answer,
                'alternatives' => json_decode($digest->alternative_methods, true),
                'explanation' => $digest->solution_explanation
            ),
            'visualization' => array(
                'type' => $digest->visual_type,
                'config' => json_decode($digest->graph_config, true),
                'animation' => $digest->has_animation
            ),
            'challenges' => array(
                'common_mistakes' => json_decode($digest->common_mistakes, true),
                'difficulty_reason' => $digest->difficulty_explanation,
                'time_estimate' => $digest->time_estimate_minutes
            ),
            'statistics' => array(
                'avg_attempts' => $digest->avg_attempts,
                'success_rate' => $digest->success_rate,
                'avg_time_seconds' => $digest->avg_time_seconds,
                'total_attempts' => $digest->total_attempts
            )
        );
    }

    /**
     * 개념 개요 생성
     */
    private function generate_concept_overview($problem_data) {
        $type = $problem_data['type'];
        $difficulty = $problem_data['difficulty'];

        $overview = '';

        switch ($type) {
            case 'definite_integral':
                $overview = '주어진 구간에서 함수의 정적분을 계산합니다. ';
                $overview .= '미적분학의 기본정리를 사용하여 부정적분을 구한 후 구간의 끝점에서 평가합니다.';
                break;
            case 'indefinite_integral':
                $overview = '함수의 부정적분(역도함수)을 구합니다. ';
                $overview .= '적분 공식과 기법을 활용하여 원시함수를 찾습니다.';
                break;
            case 'area_under_curve':
                $overview = '함수 그래프 아래의 면적을 계산합니다. ';
                $overview .= '정적분을 기하학적으로 해석하는 문제입니다.';
                break;
            case 'volume_of_rotation':
                $overview = '회전체의 부피를 계산합니다. ';
                $overview .= '적분을 이용한 입체도형의 부피 계산 응용 문제입니다.';
                break;
            default:
                $overview = '적분 문제를 해결합니다.';
        }

        if ($difficulty >= 4) {
            $overview .= ' 고급 적분 기법이 필요한 도전적인 문제입니다.';
        } else if ($difficulty >= 3) {
            $overview .= ' 중급 수준의 적분 기법이 필요합니다.';
        } else {
            $overview .= ' 기본 적분 공식을 적용하면 해결할 수 있습니다.';
        }

        return $overview;
    }

    /**
     * 핵심 개념 추출
     */
    private function extract_key_concepts($problem_data) {
        $concepts = array();
        $type = $problem_data['type'];
        $integrand = $problem_data['integrand'];

        // 문제 유형에 따른 기본 개념
        if ($type === 'definite_integral') {
            $concepts[] = '미적분학의 기본정리';
            $concepts[] = '정적분의 계산';
        } else if ($type === 'indefinite_integral') {
            $concepts[] = '부정적분';
            $concepts[] = '적분상수';
        }

        // 함수 유형에 따른 개념
        if (strpos($integrand, '^') !== false) {
            $concepts[] = '거듭제곱 함수의 적분';
        }
        if (preg_match('/(sin|cos|tan)/', $integrand)) {
            $concepts[] = '삼각함수의 적분';
        }
        if (preg_match('/(exp|e\^)/', $integrand)) {
            $concepts[] = '지수함수의 적분';
        }
        if (strpos($integrand, 'ln') !== false || strpos($integrand, 'log') !== false) {
            $concepts[] = '로그함수의 적분';
        }

        // 복잡도에 따른 개념
        if ($problem_data['difficulty'] >= 3) {
            if (preg_match('/\*/', $integrand) || substr_count($integrand, ' ') > 2) {
                $concepts[] = '치환적분법';
            }
            if ($problem_data['difficulty'] >= 4) {
                $concepts[] = '부분적분법';
            }
        }

        return array_unique($concepts);
    }

    /**
     * 학습 목표 생성
     */
    private function generate_learning_objectives($problem_data) {
        $objectives = array();
        $type = $problem_data['type'];

        $objectives[] = '문제에서 요구하는 적분의 유형을 파악할 수 있다';
        $objectives[] = '적절한 적분 공식과 기법을 선택할 수 있다';

        if ($type === 'definite_integral') {
            $objectives[] = '미적분학의 기본정리를 정확히 적용할 수 있다';
            $objectives[] = '구간의 끝점에서 함수값을 정확히 계산할 수 있다';
        } else if ($type === 'indefinite_integral') {
            $objectives[] = '적분상수를 포함한 일반해를 구할 수 있다';
        }

        $objectives[] = '계산 결과를 검증할 수 있다';

        return $objectives;
    }

    /**
     * 선수 학습 개념 식별
     */
    private function identify_prerequisite_skills($problem_data) {
        $skills = array(
            '미분과 적분의 관계',
            '기본 적분 공식'
        );

        if ($problem_data['type'] === 'definite_integral') {
            $skills[] = '함수의 평가';
            $skills[] = '사칙연산';
        }

        if ($problem_data['difficulty'] >= 3) {
            $skills[] = '복잡한 대수 계산';
        }

        if (preg_match('/(sin|cos)/', $problem_data['integrand'])) {
            $skills[] = '삼각함수의 기본 성질';
        }

        return $skills;
    }

    /**
     * 해법 단계 생성
     */
    private function generate_solution_steps($problem_data) {
        $steps = array();
        $type = $problem_data['type'];

        if ($type === 'definite_integral') {
            $steps[] = array(
                'step' => 1,
                'action' => '부정적분 구하기',
                'description' => '주어진 함수의 역도함수 F(x)를 찾습니다',
                'formula' => '∫' . $problem_data['integrand'] . ' dx = F(x) + C'
            );

            $steps[] = array(
                'step' => 2,
                'action' => '상한에서 평가',
                'description' => '상한 값을 F(x)에 대입합니다',
                'formula' => 'F(' . $problem_data['upper_bound'] . ')'
            );

            $steps[] = array(
                'step' => 3,
                'action' => '하한에서 평가',
                'description' => '하한 값을 F(x)에 대입합니다',
                'formula' => 'F(' . $problem_data['lower_bound'] . ')'
            );

            $steps[] = array(
                'step' => 4,
                'action' => '차이 계산',
                'description' => '미적분학의 기본정리를 적용합니다',
                'formula' => 'F(' . $problem_data['upper_bound'] . ') - F(' . $problem_data['lower_bound'] . ')',
                'result' => $problem_data['correct_answer']
            );
        } else {
            $steps[] = array(
                'step' => 1,
                'action' => '적분 공식 적용',
                'description' => '적절한 적분 공식을 선택합니다'
            );

            $steps[] = array(
                'step' => 2,
                'action' => '역도함수 구하기',
                'description' => '항별로 적분을 수행합니다'
            );

            $steps[] = array(
                'step' => 3,
                'action' => '적분상수 추가',
                'description' => '+ C를 추가하여 일반해를 완성합니다',
                'result' => $problem_data['correct_answer'] . ' + C'
            );
        }

        return $steps;
    }

    /**
     * 대안 풀이법 제안
     */
    private function suggest_alternative_methods($problem_data) {
        $methods = array();

        if ($problem_data['difficulty'] >= 3) {
            $methods[] = array(
                'name' => '치환적분법',
                'description' => 'u = g(x) 형태로 치환하여 적분을 간단히 만듭니다',
                'applicable' => true
            );
        }

        if ($problem_data['difficulty'] >= 4) {
            $methods[] = array(
                'name' => '부분적분법',
                'description' => '∫u dv = uv - ∫v du 공식을 활용합니다',
                'applicable' => true
            );
        }

        if ($problem_data['type'] === 'definite_integral') {
            $methods[] = array(
                'name' => '수치적 방법',
                'description' => '사다리꼴 공식이나 심슨 공식으로 근사값을 구합니다',
                'applicable' => true
            );
        }

        return $methods;
    }

    /**
     * 해법 설명 생성
     */
    private function generate_solution_explanation($problem_data) {
        $explanation = '';

        if ($problem_data['type'] === 'definite_integral') {
            $explanation = '이 문제는 정적분을 계산하는 전형적인 문제입니다. ';
            $explanation .= '먼저 피적분함수 ' . $problem_data['integrand'] . '의 부정적분을 구한 후, ';
            $explanation .= '미적분학의 기본정리를 적용하여 구간 [' . $problem_data['lower_bound'] . ', ';
            $explanation .= $problem_data['upper_bound'] . ']에서의 값을 계산합니다. ';
            $explanation .= '최종 답은 ' . $problem_data['correct_answer'] . '입니다.';
        }

        return $explanation;
    }

    /**
     * 그래프 설정 생성
     */
    private function create_graph_config($problem_data) {
        $config = array(
            'domain' => array(
                'xmin' => $problem_data['lower_bound'] ? floatval($problem_data['lower_bound']) - 1 : -5,
                'xmax' => $problem_data['upper_bound'] ? floatval($problem_data['upper_bound']) + 1 : 5
            ),
            'range' => array(
                'ymin' => -5,
                'ymax' => 10
            ),
            'features' => array(
                'show_axes' => true,
                'show_grid' => true,
                'show_function' => true,
                'show_shaded_area' => $problem_data['type'] === 'definite_integral' || $problem_data['type'] === 'area_under_curve',
                'show_bounds' => isset($problem_data['lower_bound']) && isset($problem_data['upper_bound'])
            ),
            'colors' => array(
                'function' => '#3498db',
                'shaded_area' => 'rgba(52, 152, 219, 0.3)',
                'bounds' => '#e74c3c'
            )
        );

        return $config;
    }

    /**
     * 흔한 실수 식별
     */
    private function identify_common_mistakes($problem_data) {
        $mistakes = array();

        if ($problem_data['type'] === 'definite_integral') {
            $mistakes[] = array(
                'mistake' => '상한과 하한의 순서 혼동',
                'correction' => '항상 F(상한) - F(하한) 순서로 계산해야 합니다'
            );
            $mistakes[] = array(
                'mistake' => '부정적분을 구할 때 계수 실수',
                'correction' => '거듭제곱 공식: ∫x^n dx = x^(n+1)/(n+1) + C'
            );
        } else {
            $mistakes[] = array(
                'mistake' => '적분상수 C를 빠뜨림',
                'correction' => '부정적분은 항상 + C를 포함해야 합니다'
            );
        }

        $mistakes[] = array(
            'mistake' => '복잡한 식의 전개 오류',
            'correction' => '단계별로 검산하며 진행하세요'
        );

        return $mistakes;
    }

    /**
     * 난이도 설명
     */
    private function explain_difficulty($problem_data) {
        $level = $problem_data['difficulty'];

        switch ($level) {
            case 1:
                return '기본 적분 공식만으로 해결 가능한 쉬운 문제입니다.';
            case 2:
                return '기본 공식과 간단한 대수 계산이 필요한 문제입니다.';
            case 3:
                return '치환적분이나 부분적분 등의 기법이 필요한 중급 문제입니다.';
            case 4:
                return '여러 단계의 적분 기법을 조합해야 하는 어려운 문제입니다.';
            case 5:
                return '고급 적분 기법과 복잡한 계산이 필요한 매우 어려운 문제입니다.';
            default:
                return '난이도 정보 없음';
        }
    }

    /**
     * 소요 시간 추정
     */
    private function estimate_time($problem_data) {
        $base_time = 5; // 기본 5분
        $difficulty_factor = $problem_data['difficulty'];

        $estimated = $base_time + ($difficulty_factor * 2);

        if ($problem_data['type'] === 'volume_of_rotation') {
            $estimated += 5; // 입체 문제는 추가 시간
        }

        return $estimated;
    }

    /**
     * LaTeX 수식 생성
     */
    private function generate_latex_expression($digest) {
        $latex = '';

        if ($digest->lower_bound && $digest->upper_bound) {
            $latex = '\\int_{' . $digest->lower_bound . '}^{' . $digest->upper_bound . '} ';
        } else {
            $latex = '\\int ';
        }

        $latex .= $this->convert_to_latex($digest->integrand);
        $latex .= ' \\, d' . $digest->variable_of_integration;

        return $latex;
    }

    /**
     * 수식을 LaTeX로 변환
     */
    private function convert_to_latex($expression) {
        // 간단한 변환 (실제로는 더 정교한 파서 필요)
        $latex = $expression;
        $latex = str_replace('^', '^{', $latex);
        $latex = str_replace(' ', '}', $latex);
        $latex = str_replace('*', '\\cdot ', $latex);

        return $latex;
    }

    /**
     * 문제 유형 한글 번역
     */
    private function translate_problem_type($type) {
        $translations = array(
            'definite_integral' => '정적분',
            'indefinite_integral' => '부정적분',
            'area_under_curve' => '곡선 아래 넓이',
            'volume_of_rotation' => '회전체의 부피'
        );

        return isset($translations[$type]) ? $translations[$type] : $type;
    }

    /**
     * 학생 답안 기록 및 통계 업데이트
     *
     * @param int $student_id Student ID
     * @param array $attempt_data Attempt data
     * @return bool Success
     */
    public function record_student_attempt($student_id, $attempt_data) {
        try {
            // 답안 기록
            $attempt = new \stdClass();
            $attempt->student_id = $student_id;
            $attempt->problem_id = $this->problem_id;
            $attempt->submitted_answer = $attempt_data['answer'];
            $attempt->is_correct = $attempt_data['is_correct'];
            $attempt->time_spent_seconds = $attempt_data['time_spent'];
            $attempt->attempted_at = time();

            $this->db->insert_record('student_attempts', $attempt);

            // 통계 업데이트
            $this->update_statistics();

            return true;

        } catch (\Exception $e) {
            debugging('Error recording student attempt: ' . $e->getMessage(), DEBUG_DEVELOPER);
            return false;
        }
    }

    /**
     * 통계 업데이트
     */
    private function update_statistics() {
        global $DB;

        // 모든 답안 가져오기
        $attempts = $DB->get_records('student_attempts', array('problem_id' => $this->problem_id));

        if (empty($attempts)) {
            return;
        }

        $total = count($attempts);
        $correct = 0;
        $total_time = 0;
        $student_attempts = array();

        foreach ($attempts as $attempt) {
            if ($attempt->is_correct) {
                $correct++;
            }
            $total_time += $attempt->time_spent_seconds;

            if (!isset($student_attempts[$attempt->student_id])) {
                $student_attempts[$attempt->student_id] = 0;
            }
            $student_attempts[$attempt->student_id]++;
        }

        // 평균 계산
        $avg_attempts = count($student_attempts) > 0 ? $total / count($student_attempts) : 0;
        $success_rate = $total > 0 ? ($correct / $total) * 100 : 0;
        $avg_time = $total > 0 ? $total_time / $total : 0;

        // 업데이트
        $DB->execute("UPDATE {integral_digest} SET
            avg_attempts = ?,
            success_rate = ?,
            avg_time_seconds = ?,
            total_attempts = ?,
            updated_at = ?
            WHERE problem_id = ?",
            array($avg_attempts, $success_rate, $avg_time, $total, time(), $this->problem_id)
        );
    }

    /**
     * 여러 문제의 다이제스트를 배치 생성
     *
     * @param array $problems_data Array of problem data
     * @return array Array of digest IDs
     */
    public static function batch_create_digests($problems_data) {
        $digest_ids = array();

        foreach ($problems_data as $problem_data) {
            $digest = new self();
            $digest_id = $digest->create_digest($problem_data);

            if ($digest_id) {
                $digest_ids[] = $digest_id;
            }
        }

        return $digest_ids;
    }

    /**
     * 모듈의 모든 문제 다이제스트 가져오기
     *
     * @param string $module_id Module UUID
     * @param string $format Format type
     * @return array Array of digests
     */
    public static function get_module_digests($module_id, $format = 'summary') {
        global $DB;

        $digests = $DB->get_records('integral_digest', array('module_id' => $module_id));
        $result = array();

        foreach ($digests as $digest_data) {
            $digest = new self($digest_data->problem_id);
            $result[] = $digest->get_digest($format);
        }

        return $result;
    }
}
