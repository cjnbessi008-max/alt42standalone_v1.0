<?php
/**
 * Korean language strings for selfexplanation module
 *
 * @package    mod_selfexplanation
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

// Module basics
$string['modulename'] = '자기설명 프롬프트';
$string['modulenameplural'] = '자기설명 프롬프트';
$string['modulename_help'] = '자기설명 프롬프트 모듈은 교사가 학생들이 자신의 추론과 이해를 설명하는 메타인지 학습 활동을 만들 수 있게 합니다.';
$string['selfexplanation:addinstance'] = '새 자기설명 프롬프트 추가';
$string['selfexplanation:submit'] = '자기설명 응답 제출';
$string['selfexplanation:view'] = '자기설명 프롬프트 보기';
$string['selfexplanation:viewresponses'] = '모든 학생 응답 보기';
$string['selfexplanation:grade'] = '학생 응답 평가';
$string['selfexplanation:viewanalytics'] = '분석 보기';
$string['pluginname'] = '자기설명 프롬프트';
$string['pluginadministration'] = '자기설명 관리';

// Activity settings
$string['selfexplanationname'] = '활동 이름';
$string['selfexplanationname_help'] = '이 자기설명 활동의 이름';
$string['prompttext'] = '프롬프트 텍스트';
$string['prompttext_help'] = '학생들이 응답할 질문 또는 프롬프트. 기본값: "나는 이걸 왜 아는가?"';
$string['prompttype'] = '프롬프트 유형';
$string['prompttype_help'] = '메타인지 프롬프트의 유형';
$string['prompttype_why_know'] = '나는 이걸 왜 아는가?';
$string['prompttype_how_know'] = '나는 이걸 어떻게 아는가?';
$string['prompttype_what_if'] = '만약에...라면?';
$string['prompttype_explain'] = '당신의 추론을 설명하세요';
$string['prompttype_custom'] = '사용자 정의 프롬프트';
$string['minwords'] = '최소 단어 수';
$string['minwords_help'] = '응답에 필요한 최소 단어 수';
$string['allowresubmit'] = '재제출 허용';
$string['allowresubmit_help'] = '학생들이 응답을 수정하고 재제출할 수 있도록 허용';
$string['displayfeedback'] = '피드백 표시';
$string['displayfeedback_help'] = '교사 피드백을 학생들에게 표시';

// Student view
$string['yourresponse'] = '당신의 응답';
$string['submitresponse'] = '응답 제출';
$string['saveresponse'] = '임시 저장';
$string['updateresponse'] = '응답 업데이트';
$string['responsetext'] = '당신의 자기설명';
$string['responsetext_help'] = '당신의 생각과 추론을 설명하세요. 구체적이고 철저하게 작성하세요.';
$string['wordcount'] = '단어 수: {$a}';
$string['minwordsrequired'] = '최소 {$a}개 단어 필요';
$string['responsesubmitted'] = '응답이 제출되었습니다';
$string['responsesaved'] = '응답이 임시 저장되었습니다';
$string['responseupdated'] = '응답이 업데이트되었습니다';
$string['noresponseyet'] = '아직 응답을 제출하지 않았습니다';
$string['draft'] = '임시 저장';
$string['submitted'] = '제출됨';
$string['graded'] = '평가됨';
$string['status'] = '상태';
$string['timespent'] = '소요 시간';
$string['minutes'] = '{$a}분';
$string['seconds'] = '{$a}초';

// Teacher view
$string['viewresponses'] = '모든 응답 보기';
$string['numresponses'] = '{$a}개 응답';
$string['noresponsesyet'] = '아직 응답 없음';
$string['studentname'] = '학생 이름';
$string['response'] = '응답';
$string['grade'] = '평가';
$string['feedback'] = '피드백';
$string['providefeedback'] = '피드백 제공';
$string['savefeedback'] = '피드백 저장';
$string['feedbacksaved'] = '피드백이 저장되었습니다';

// Analytics
$string['analytics'] = '분석';
$string['qualityscore'] = '품질 점수';
$string['keywordcount'] = '메타인지 키워드';
$string['avgresponselength'] = '평균 응답 길이';
$string['completionrate'] = '완료율';
$string['viewdetails'] = '세부 정보 보기';

// Privacy
$string['privacy:metadata:selfexplanation_responses'] = '사용자의 자기설명 응답에 대한 정보';
$string['privacy:metadata:selfexplanation_responses:userid'] = '사용자의 ID';
$string['privacy:metadata:selfexplanation_responses:responsetext'] = '사용자의 자기설명 응답';
$string['privacy:metadata:selfexplanation_responses:wordcount'] = '응답의 단어 수';
$string['privacy:metadata:selfexplanation_responses:timespent'] = '응답에 소요된 시간';
$string['privacy:metadata:selfexplanation_responses:grade'] = '교사가 부여한 평가';
$string['privacy:metadata:selfexplanation_responses:feedback'] = '교사가 제공한 피드백';
$string['privacy:metadata:selfexplanation_responses:timecreated'] = '응답이 생성된 시간';
$string['privacy:metadata:selfexplanation_responses:timemodified'] = '응답이 마지막으로 수정된 시간';

// Errors
$string['error:cannotsubmit'] = '이 응답을 제출할 수 없습니다';
$string['error:invalidresponse'] = '잘못된 응답';
$string['error:tooshort'] = '응답이 너무 짧습니다. 최소 {$a}개 단어를 작성해주세요.';
$string['error:notfound'] = '자기설명 활동을 찾을 수 없습니다';
