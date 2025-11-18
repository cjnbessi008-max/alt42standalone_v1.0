<?php
/**
 * Korean language strings for mod_coreconditions
 *
 * @package    mod_coreconditions
 * @copyright  2025 AI Education System
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

// Module name
$string['modulename'] = '핵심 조건';
$string['modulenameplural'] = '핵심 조건들';
$string['modulename_help'] = '핵심 조건 모듈은 교사가 각 문제마다 정확히 3개의 핵심 조건을 선택하고 평가할 수 있는 문제를 만들 수 있게 합니다.';
$string['pluginname'] = '핵심 조건';
$string['pluginadministration'] = '핵심 조건 관리';

// Capabilities
$string['coreconditions:addinstance'] = '새 핵심 조건 활동 추가';
$string['coreconditions:view'] = '핵심 조건 활동 보기';
$string['coreconditions:submit'] = '핵심 조건 문제에 답안 제출';
$string['coreconditions:manageconditions'] = '문제의 핵심 조건 관리';
$string['coreconditions:viewreports'] = '학생 보고서 보기';

// General
$string['name'] = '활동 이름';
$string['intro'] = '설명';

// Problems
$string['problems'] = '문제';
$string['addproblem'] = '새 문제 추가';
$string['editproblem'] = '문제 편집';
$string['deleteproblem'] = '문제 삭제';
$string['problemname'] = '문제 이름';
$string['problemdescription'] = '문제 설명';
$string['problemtype'] = '문제 유형';
$string['difficultylevel'] = '난이도';
$string['correctanswer'] = '정답';
$string['noproblems'] = '아직 생성된 문제가 없습니다.';

// Core Conditions
$string['coreconditions'] = '핵심 조건';
$string['condition'] = '조건 {$a}';
$string['conditiontype'] = '조건 유형';
$string['conditionname'] = '조건 이름';
$string['conditiondescription'] = '조건 설명';
$string['conditionrule'] = '조건 규칙/논리';
$string['conditionweight'] = '가중치 (%)';
$string['selectconditions'] = '3가지 핵심 조건 선택';
$string['mustselect3'] = '각 문제마다 정확히 3개의 핵심 조건을 선택해야 합니다.';
$string['condition1'] = '핵심 조건 1';
$string['condition2'] = '핵심 조건 2';
$string['condition3'] = '핵심 조건 3';

// Condition types
$string['conditiontype_validation'] = '검증';
$string['conditiontype_calculation'] = '계산';
$string['conditiontype_progression'] = '진행';
$string['conditiontype_feedback'] = '피드백';

// Problem types
$string['problemtype_fraction'] = '분수';
$string['problemtype_algebra'] = '대수';
$string['problemtype_geometry'] = '기하';
$string['problemtype_arithmetic'] = '산술';
$string['problemtype_other'] = '기타';

// Student view
$string['submit'] = '답안 제출';
$string['youranswer'] = '당신의 답';
$string['attempt'] = '시도 {$a}';
$string['score'] = '점수';
$string['conditionsmet'] = '충족한 조건';
$string['timetaken'] = '소요 시간';

// Reports
$string['viewreport'] = '보고서 보기';
$string['studentreport'] = '학생 보고서';
$string['allstudents'] = '모든 학생';
$string['attempts'] = '시도';
$string['averagescore'] = '평균 점수';
$string['completionrate'] = '완료율';

// Errors
$string['error_noconditions'] = '이 문제에 정의된 조건이 없습니다.';
$string['error_invalidproblem'] = '잘못된 문제 ID입니다.';
$string['error_cannotsubmit'] = '답안을 제출할 권한이 없습니다.';
$string['error_conditioncount'] = '각 문제는 정확히 3개의 핵심 조건을 가져야 합니다.';

// Success messages
$string['conditionssaved'] = '핵심 조건이 성공적으로 저장되었습니다.';
$string['problemsaved'] = '문제가 성공적으로 저장되었습니다.';
$string['answersaved'] = '답안이 성공적으로 제출되었습니다.';
