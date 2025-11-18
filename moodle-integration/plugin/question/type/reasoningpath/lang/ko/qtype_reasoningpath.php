<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Korean language strings for Reasoning Path question type.
 *
 * @package    qtype_reasoningpath
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

// Plugin name
$string['pluginname'] = '추론 경로';
$string['pluginname_help'] = '학생의 문제 해결 과정과 추론 경로를 평가하는 문제 유형입니다. 정답 여부가 아닌 사고 과정의 완성도를 채점합니다.';
$string['pluginnameadding'] = '추론 경로 문제 추가';
$string['pluginnameediting'] = '추론 경로 문제 편집';
$string['pluginnamesummary'] = '학생이 단계별로 추론 과정을 작성하면, AI가 추론의 완성도와 논리적 일관성을 평가합니다.';

// Question editing
$string['min_steps_required'] = '최소 필요 단계 수';
$string['min_steps_required_help'] = '학생이 작성해야 하는 최소 추론 단계 수';
$string['expected_steps'] = '예상 해결 단계';
$string['expected_steps_help'] = '모범 답안의 해결 단계 (선택사항)';
$string['grading_rubric'] = '채점 기준';
$string['grading_rubric_help'] = '추가 채점 기준 및 가이드라인';
$string['allow_multiple_methods'] = '여러 풀이 방법 허용';
$string['enable_ai_grading'] = 'AI 자동 채점 사용';

// Grading weights
$string['completeness_weight'] = '완성도 비중 (%)';
$string['coherence_weight'] = '논리적 일관성 비중 (%)';
$string['method_weight'] = '방법 적절성 비중 (%)';
$string['clarity_weight'] = '명확성 비중 (%)';
$string['weights_must_sum_100'] = '모든 비중의 합은 100이어야 합니다.';

// Student interface
$string['youranswer'] = '당신의 추론 과정';
$string['addstep'] = '단계 추가';
$string['removestep'] = '단계 삭제';
$string['stepnumber'] = '단계 {$a}';
$string['steptype'] = '단계 유형';
$string['stepdescription'] = '설명';
$string['stepcontent'] = '작업 내용';
$string['insertmath'] = '수식 입력';

// Step types
$string['calculation'] = '계산';
$string['explanation'] = '설명';
$string['assumption'] = '가정';
$string['conclusion'] = '결론';

// Validation messages
$string['pleaseprovidereasoning'] = '추론 과정을 작성해주세요.';
$string['invalidstepsformat'] = '단계 형식이 올바르지 않습니다.';
$string['notenoughsteps'] = '최소 {$a}개의 단계가 필요합니다.';
$string['noresponse'] = '응답 없음';
$string['invalidresponse'] = '잘못된 응답';
$string['stepssubmitted'] = '{$a}개의 단계 제출됨';
$string['responserequiresgrading'] = '채점 대기 중';

// Grading feedback
$string['excellent'] = '우수';
$string['good'] = '양호';
$string['satisfactory'] = '보통';
$string['incomplete'] = '미흡';
$string['multiplecorrectpaths'] = '여러 가지 올바른 풀이 방법이 있습니다.';
$string['expectedsteps'] = '예상 풀이 단계';
$string['fallbackgrading'] = 'AI 채점을 사용할 수 없어 기본 채점 방식을 사용했습니다. 교사의 수동 검토가 필요할 수 있습니다.';

// Grading criteria
$string['completeness'] = '완성도';
$string['completeness_help'] = '모든 필요한 추론 단계가 포함되어 있는가?';
$string['logical_coherence'] = '논리적 일관성';
$string['logical_coherence_help'] = '각 단계가 논리적으로 연결되어 있는가?';
$string['method_appropriateness'] = '방법의 적절성';
$string['method_appropriateness_help'] = '문제에 적합한 접근 방법을 사용했는가?';
$string['clarity'] = '명확성';
$string['clarity_help'] = '추론 과정이 명확하게 설명되어 있는가?';

// Analysis feedback
$string['analysis_completeness'] = '완성도 분석';
$string['analysis_coherence'] = '논리성 분석';
$string['analysis_method'] = '방법 분석';
$string['analysis_clarity'] = '명확성 분석';
$string['overall_feedback'] = '종합 피드백';
$string['strengths'] = '잘한 점';
$string['areas_for_improvement'] = '개선할 점';

// Admin settings
$string['analysis_api_endpoint'] = '분석 API 엔드포인트';
$string['analysis_api_endpoint_desc'] = '추론 경로 분석 엔진의 API 주소';
$string['analysis_api_key'] = 'API 인증 키';
$string['analysis_api_key_desc'] = '분석 API 접근을 위한 인증 키';
$string['api_timeout'] = 'API 타임아웃 (초)';
$string['api_timeout_desc'] = 'AI 분석 API 호출 타임아웃 시간';

// Errors
$string['apicallfailed'] = 'AI 분석 API 호출 실패: {$a}';
$string['apireturnedcode'] = 'AI 분석 API가 오류 코드를 반환했습니다: {$a}';
$string['invalidjsonresponse'] = 'AI 분석 응답 형식이 올바르지 않습니다.';
$string['invalidanalysisresult'] = '분석 결과가 유효하지 않습니다.';

// Privacy
$string['privacy:metadata:qtype_reasoningpath_steps'] = '학생의 추론 단계 데이터';
$string['privacy:metadata:qtype_reasoningpath_steps:step_content'] = '학생이 작성한 단계 내용';
$string['privacy:metadata:qtype_reasoningpath_steps:step_description'] = '학생이 작성한 단계 설명';
$string['privacy:metadata:qtype_reasoningpath_analysis'] = 'AI 채점 분석 결과';
$string['privacy:metadata:qtype_reasoningpath_analysis:ai_feedback'] = 'AI가 생성한 피드백';
$string['privacy:metadata:external_anthropic'] = 'Claude AI API';
$string['privacy:metadata:external_anthropic:steps'] = '추론 단계가 AI 분석을 위해 Claude API로 전송됩니다.';
