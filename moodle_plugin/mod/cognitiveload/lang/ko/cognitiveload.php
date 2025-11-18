<?php
/**
 * Korean language strings
 *
 * @package    mod_cognitiveload
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['modulename'] = '인지 부하 분석';
$string['modulenameplural'] = '인지 부하 분석';
$string['modulename_help'] = '인지 부하 분석 모듈은 문제를 풀기 위해 필요한 정신적 노력을 자동으로 분석하고 교사에게 통찰을 제공합니다.';
$string['pluginname'] = '인지 부하 분석';
$string['pluginadministration'] = '인지 부하 분석 관리';

// Settings
$string['api_url'] = 'API URL';
$string['api_url_desc'] = '인지 부하 분석 서비스 URL (예: http://localhost:8000)';
$string['api_key'] = 'API 키';
$string['api_key_desc'] = '인증을 위한 API 키 (선택사항)';
$string['cache_duration'] = '캐시 유효 기간';
$string['cache_duration_desc'] = '분석 결과를 캐시할 기간 (초 단위, 기본값: 86400 = 24시간)';

// Cognitive load levels
$string['level_verylow'] = '매우 낮음';
$string['level_low'] = '낮음';
$string['level_medium'] = '중간';
$string['level_high'] = '높음';
$string['level_veryhigh'] = '매우 높음';

// Dashboard
$string['dashboard'] = '인지 부하 대시보드';
$string['intrinsic_load'] = '내재적 부하';
$string['extraneous_load'] = '외재적 부하';
$string['germane_load'] = '본유적 부하';
$string['total_score'] = '총 인지 부하 점수';
$string['difficulty_level'] = '난이도 수준';
$string['estimated_time'] = '예상 소요 시간';
$string['problem_type'] = '문제 유형';

// Problem types
$string['type_calculation'] = '단순 계산';
$string['type_word_problem'] = '단어 문제';
$string['type_multistep'] = '다단계 문제';
$string['type_conceptual'] = '개념 이해';
$string['type_problem_solving'] = '문제 해결';
$string['type_proof'] = '증명/논리';

// Errors
$string['error_api_unavailable'] = '인지 부하 분석 서비스를 사용할 수 없습니다';
$string['error_analysis_failed'] = '문제 분석에 실패했습니다';
