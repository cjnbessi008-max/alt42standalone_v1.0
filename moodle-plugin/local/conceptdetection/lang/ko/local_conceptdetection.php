<?php
/**
 * Korean language strings for Concept Detection Plugin
 *
 * @package    local_conceptdetection
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

$string['pluginname'] = '개념 감지';
$string['conceptdetection'] = '개념 감지';

// Settings strings
$string['threshold_time'] = '시간 임계값 (초)';
$string['threshold_time_desc'] = '개념을 제대로 학습했다고 간주하기 위한 최소 소요 시간';
$string['threshold_attempts'] = '시도 횟수 임계값';
$string['threshold_attempts_desc'] = '이해하지 못한 것으로 표시하기 전 최대 시도 횟수';
$string['threshold_score'] = '점수 임계값 (%)';
$string['threshold_score_desc'] = '개념을 이해한 것으로 간주하기 위한 최소 점수';
$string['enable_tracking'] = '행동 추적 활성화';
$string['enable_tracking_desc'] = '개념 이해도 분석을 위한 학생 행동 패턴 추적';

// Dashboard strings
$string['dashboard'] = '개념 감지 대시보드';
$string['dashboard_desc'] = '개념을 이해하지 못한 학생 보기';
$string['misunderstood_concepts'] = '이해하지 못한 개념';
$string['student_name'] = '학생 이름';
$string['concept_name'] = '개념';
$string['attempts'] = '시도 횟수';
$string['time_spent'] = '소요 시간';
$string['score'] = '점수';
$string['status'] = '상태';
$string['not_understood'] = '이해 못함';
$string['partially_understood'] = '부분적 이해';
$string['understood'] = '이해함';

// Analysis strings
$string['analyzing'] = '학생 행동 분석 중...';
$string['no_data'] = '분석할 데이터가 없습니다';
$string['view_details'] = '상세 보기';
$string['student_progress'] = '학생 진도';
$string['concept_analysis'] = '개념 분석';

// Additional UI strings
$string['no_courses_found'] = '교육 권한이 있는 코스를 찾을 수 없습니다';
$string['select_course'] = '코스 선택';
$string['auto_detecting_concepts'] = '코스 콘텐츠에서 개념을 자동으로 감지 중...';
$string['concepts_detected'] = '{$a}개의 개념이 감지되고 생성되었습니다';
$string['analyze_now'] = '지금 학생 분석';
$string['analysis_complete'] = '{$a}명의 학생에 대한 분석 완료';
$string['summary'] = '요약';
$string['total_concepts'] = '전체 개념';
$string['total_students'] = '전체 학생';
$string['students_struggling'] = '어려움을 겪는 학생';
$string['students_partial'] = '부분적 이해';
$string['concepts_detail'] = '개념 상세';
$string['difficulty'] = '난이도';
$string['actions'] = '작업';
$string['no_concepts_found'] = '개념을 찾을 수 없습니다. 첫 방문 시 자동으로 감지됩니다.';

// Difficulty levels
$string['difficulty_1'] = '매우 쉬움';
$string['difficulty_2'] = '쉬움';
$string['difficulty_3'] = '보통';
$string['difficulty_4'] = '어려움';
$string['difficulty_5'] = '매우 어려움';
$string['difficulty_very_easy'] = '매우 쉬움';
$string['difficulty_easy'] = '쉬움';
$string['difficulty_medium'] = '보통';
$string['difficulty_hard'] = '어려움';
$string['difficulty_very_hard'] = '매우 어려움';

// Concept detail page
$string['struggling_students'] = '도움이 필요한 학생';
$string['email'] = '이메일';
$string['last_activity'] = '마지막 활동';
$string['confidence'] = '신뢰도';
$string['module_type'] = '모듈 유형';
$string['all'] = '전체';
$string['no_struggling_students'] = '좋습니다! 모든 학생이 이 개념을 이해했습니다.';
$string['back_to_dashboard'] = '대시보드로 돌아가기';
$string['not_started'] = '시작 안 함';

// Recommendations
$string['recommendations'] = '교사를 위한 권장사항';
$string['recommendation_not_understood'] = '이 학생은 이 개념에 어려움을 겪고 있는 것으로 보입니다.';
$string['recommendation_partially_understood'] = '이 학생은 부분적으로 이해하고 있으며 추가 연습이 도움이 될 수 있습니다.';
$string['recommendation_understood'] = '이 학생은 이 개념에 대한 이해를 보여주었습니다.';
$string['recommendation_more_time'] = '학생이 이 자료에 최소한의 시간만 보냈습니다. 더 많은 참여를 권장하는 것을 고려하세요.';
$string['recommendation_seek_help'] = '여러 번의 시도에도 낮은 성공률은 학생이 일대일 도움이 필요할 수 있음을 시사합니다.';
$string['recommendation_focus'] = '빠른 종료는 주의 산만 또는 혼란을 나타낼 수 있습니다. 학생과 확인하는 것을 고려하세요.';
$string['recommendation_review_material'] = '소그룹으로 이 학생들과 학습 자료를 복습하세요.';
$string['recommendation_one_on_one'] = '낮은 신뢰도 점수를 가진 학생에게 일대일 튜터링 세션을 제공하세요.';
$string['recommendation_practice'] = '점진적으로 난이도를 높인 추가 연습 문제를 배정하세요.';
$string['recommendation_peer_learning'] = '어려움을 겪는 학생을 개념을 잘 이해한 학생과 짝지으세요.';

// Capabilities
$string['conceptdetection:view'] = '개념 감지 대시보드 보기';
$string['conceptdetection:manage'] = '개념 감지 설정 관리';
