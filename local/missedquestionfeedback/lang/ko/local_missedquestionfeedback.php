<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Korean language strings
 *
 * @package    local_missedquestionfeedback
 * @copyright  2025 Your Organization
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

// Plugin name
$string['pluginname'] = '놓친 문제 피드백';

// Capabilities
$string['missedquestionfeedback:view'] = '놓친 문제 피드백 보기';
$string['missedquestionfeedback:manage'] = '개념 및 오개념 관리';
$string['missedquestionfeedback:viewreports'] = '분석 보고서 보기';

// Main feedback strings
$string['whatyoumissed'] = '이번 문제에서 놓친 건?';
$string['concepttested'] = '테스트된 개념';
$string['yourmisconception'] = '당신의 오개념';
$string['correctunderstanding'] = '올바른 이해';
$string['remediationstrategy'] = '개선 방법';
$string['learnmore'] = '더 알아보기';
$string['nofeedbackavailable'] = '이 문제에 대한 추가 피드백이 없습니다.';

// Concept management
$string['manageconcepts'] = '개념 관리';
$string['addconcept'] = '새 개념 추가';
$string['editconcept'] = '개념 편집';
$string['deleteconcept'] = '개념 삭제';
$string['conceptname'] = '개념 이름';
$string['conceptdescription'] = '설명';
$string['conceptcategory'] = '카테고리';
$string['confirmdeleteconcepttitle'] = '개념을 삭제하시겠습니까?';
$string['confirmdeleteconcept'] = '개념 "{$a}"을(를) 삭제하시겠습니까? 관련된 모든 오개념도 함께 삭제됩니다.';

// Misconception management
$string['managemisconceptions'] = '오개념 관리';
$string['addmisconception'] = '새 오개념 추가';
$string['editmisconception'] = '오개념 편집';
$string['deletemisconception'] = '오개념 삭제';
$string['misconceptionname'] = '오개념 이름';
$string['misconceptiondescription'] = '오개념이 무엇인가요?';
$string['explanation'] = '왜 이것이 틀렸나요?';
$string['resourceurl'] = '리소스 URL';
$string['resourcetitle'] = '리소스 제목';
$string['severity'] = '심각도';
$string['severityminor'] = '경미함';
$string['severitymoderate'] = '보통';
$string['severitycritical'] = '심각함';
$string['confirmdeletemisconceptiontitle'] = '오개념을 삭제하시겠습니까?';
$string['confirmdeletemisconception'] = '오개념 "{$a}"을(를) 삭제하시겠습니까?';

// Question mapping
$string['mapquestions'] = '문제와 오개념 매핑';
$string['selectquestion'] = '문제 선택';
$string['selectanswer'] = '답변 선택 (선택사항)';
$string['selectmisconception'] = '오개념 선택';
$string['mappriority'] = '우선순위';
$string['addmapping'] = '매핑 추가';
$string['anywronganswer'] = '모든 오답';

// Analytics
$string['analytics'] = '오개념 분석';
$string['viewreports'] = '보고서 보기';
$string['mostcommonmisconceptions'] = '가장 흔한 오개념';
$string['misconceptiontrends'] = '오개념 추세';
$string['studentengagement'] = '학생 참여도';
$string['feedbackviewed'] = '피드백 조회수';
$string['resourcesclicked'] = '리소스 클릭수';
$string['averagetimespent'] = '평균 소요 시간';

// Errors
$string['error:conceptnotfound'] = '개념을 찾을 수 없습니다';
$string['error:misconceptionnotfound'] = '오개념을 찾을 수 없습니다';
$string['error:invaliddata'] = '잘못된 데이터가 제공되었습니다';
$string['error:nopermission'] = '이 작업을 수행할 권한이 없습니다';

// Success messages
$string['success:conceptcreated'] = '개념이 성공적으로 생성되었습니다';
$string['success:conceptupdated'] = '개념이 성공적으로 업데이트되었습니다';
$string['success:conceptdeleted'] = '개념이 성공적으로 삭제되었습니다';
$string['success:misconceptioncreated'] = '오개념이 성공적으로 생성되었습니다';
$string['success:misconceptionupdated'] = '오개념이 성공적으로 업데이트되었습니다';
$string['success:misconceptiondeleted'] = '오개념이 성공적으로 삭제되었습니다';
$string['success:mappingcreated'] = '문제 매핑이 성공적으로 생성되었습니다';

// Settings
$string['settings'] = '놓친 문제 피드백 설정';
$string['enableplugin'] = '플러그인 활성화';
$string['enableplugin_desc'] = '놓친 문제 피드백 기능을 전역적으로 활성화 또는 비활성화합니다';
$string['defaultseverity'] = '기본 심각도';
$string['defaultseverity_desc'] = '새 오개념의 기본 심각도 수준';
