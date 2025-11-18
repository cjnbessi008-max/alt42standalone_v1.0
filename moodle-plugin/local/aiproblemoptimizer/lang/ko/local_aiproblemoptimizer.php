<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * AI Problem Optimizer - Korean Language Strings
 *
 * @package    local_aiproblemoptimizer
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['pluginname'] = 'AI 문제 최적화기';
$string['aiproblemoptimizer'] = 'AI 문제 최적화기';

// Capabilities
$string['aiproblemoptimizer:viewown'] = '자신의 최적화 데이터 보기';
$string['aiproblemoptimizer:viewall'] = '모든 학생의 최적화 데이터 보기';
$string['aiproblemoptimizer:viewstatistics'] = '과목 통계 보기';
$string['aiproblemoptimizer:manage'] = '최적화 설정 관리';

// Dashboard
$string['dashboard'] = '대시보드';
$string['student_dashboard'] = '학생 대시보드';
$string['course_statistics'] = '과목 통계';

// Metrics
$string['total_attempts'] = '총 시도 횟수';
$string['correct_attempts'] = '정답 횟수';
$string['accuracy'] = '정확도';
$string['avg_time'] = '평균 소요 시간';
$string['difficulty_level'] = '난이도 수준';
$string['recommended_problems'] = '권장 문제 수';
$string['consecutive_days'] = '연속 학습 일수';
$string['last_activity'] = '마지막 활동';

// Recommendations
$string['recommendations'] = '학습 추천';
$string['optimal_problems'] = '최적 문제 수';
$string['study_tip'] = '학습 조언';
$string['suggested_difficulty'] = '추천 난이도';

// Configuration
$string['config_base_problems'] = '기본 문제 수';
$string['config_base_problems_desc'] = '학생에게 제시할 기본 문제 수';
$string['config_min_problems'] = '최소 문제 수';
$string['config_min_problems_desc'] = '최소 문제 수 제한';
$string['config_max_problems'] = '최대 문제 수';
$string['config_max_problems_desc'] = '최대 문제 수 제한';

$string['config_difficulty_up'] = '난이도 상승 임계값';
$string['config_difficulty_up_desc'] = '이 정확도 이상이면 난이도를 높입니다';
$string['config_difficulty_down'] = '난이도 하락 임계값';
$string['config_difficulty_down_desc'] = '이 정확도 미만이면 난이도를 낮춥니다';

$string['config_fast_time'] = '빠른 풀이 임계값 (초)';
$string['config_fast_time_desc'] = '이 시간보다 빠르면 빠른 풀이로 간주';
$string['config_slow_time'] = '느린 풀이 임계값 (초)';
$string['config_slow_time_desc'] = '이 시간보다 느리면 느린 풀이로 간주';

$string['config_high_consistency'] = '높은 지속도 임계값 (일)';
$string['config_high_consistency_desc'] = '연속 학습 일수가 이 값 이상이면 높은 지속도로 간주';

$string['config_enabled'] = '플러그인 활성화';
$string['config_enabled_desc'] = '이 과목에서 AI 문제 최적화 기능 사용';
$string['config_auto_difficulty'] = '자동 난이도 조정';
$string['config_auto_difficulty_desc'] = '학생 성과에 따라 자동으로 난이도 조정';

// Performance
$string['performance_title'] = '성과 분석';
$string['recent_performance'] = '최근 성과';
$string['difficulty_progress'] = '난이도별 진행도';
$string['level'] = '레벨';
$string['mastery'] = '숙달도';

// Messages
$string['no_data'] = '아직 데이터가 없습니다.';
$string['calculation_successful'] = '최적 문제 수가 계산되었습니다.';
$string['difficulty_adjusted'] = '난이도가 조정되었습니다.';
$string['settings_saved'] = '설정이 저장되었습니다.';

// Study tips
$string['tip_excellent'] = '훌륭합니다! 더 어려운 문제에 도전해보세요.';
$string['tip_perfect'] = '완벽합니다! 이 수준을 유지하세요.';
$string['tip_good'] = '잘 하고 있습니다. 꾸준히 연습하세요.';
$string['tip_focus'] = '조금 더 집중해서 풀어보세요. 천천히 해도 괜찮습니다.';
$string['tip_basics'] = '기초부터 차근차근 다시 연습해봅시다.';
$string['tip_start'] = '학습을 시작해보세요!';

// Errors
$string['error_permission'] = '권한이 없습니다.';
$string['error_not_enrolled'] = '이 과목에 등록되지 않았습니다.';
$string['error_invalid_data'] = '잘못된 데이터입니다.';
$string['error_database'] = '데이터베이스 오류가 발생했습니다.';

// Time units
$string['seconds'] = '초';
$string['minutes'] = '분';
$string['hours'] = '시간';
$string['days'] = '일';
