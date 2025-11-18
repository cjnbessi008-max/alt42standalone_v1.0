<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Korean language strings for mod_goalwriting
 *
 * @package    mod_goalwriting
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['modulename'] = '목표 작성';
$string['modulenameplural'] = '목표 작성 활동';
$string['modulename_help'] = '목표 작성 활동을 통해 학생들은 자신의 학습 목표를 스스로 문장으로 작성하여, 무엇을 배우고자 하는지 명확히 이해하고 표현할 수 있습니다.';
$string['pluginname'] = '목표 작성';
$string['pluginadministration'] = '목표 작성 관리';

// Settings
$string['goalwriting:addinstance'] = '새로운 목표 작성 활동 추가';
$string['goalwriting:view'] = '목표 작성 활동 보기';
$string['goalwriting:submit'] = '목표 작성 제출';
$string['goalwriting:grade'] = '목표 작성 채점';
$string['goalwriting:viewallsubmissions'] = '모든 제출물 보기';

// Form fields
$string['goalwritingname'] = '활동 이름';
$string['goalwritingname_help'] = '이 목표 작성 활동의 이름';
$string['problemtext'] = '문제 설명';
$string['problemtext_help'] = '학생들이 학습 목표를 작성할 문제 또는 주제를 설명하세요';
$string['minwords'] = '최소 단어 수';
$string['minwords_help'] = '학생의 목표 진술에 필요한 최소 단어 수';
$string['maxwords'] = '최대 단어 수';
$string['maxwords_help'] = '학생의 목표 진술에 허용되는 최대 단어 수';
$string['allowresubmit'] = '재제출 허용';
$string['allowresubmit_help'] = '활성화하면 학생들이 피드백을 받은 후 목표를 재제출할 수 있습니다';

// Student view
$string['yourgoal'] = '나의 학습 목표';
$string['writegoal'] = '이 문제에 대한 학습 목표를 작성하세요';
$string['goalplaceholder'] = '이 문제를 통해 무엇을 배우고 싶은지 설명해주세요...';
$string['wordcount'] = '단어 수: {$a}';
$string['submitgoal'] = '목표 제출';
$string['savedraft'] = '임시 저장';
$string['goalsubmitted'] = '목표가 성공적으로 제출되었습니다';
$string['goalsaved'] = '목표가 임시 저장되었습니다';
$string['resubmit'] = '다시 제출';
$string['status'] = '상태';
$string['draft'] = '임시 저장';
$string['submitted'] = '제출됨';
$string['reviewed'] = '검토 완료';

// Validation
$string['errorminwords'] = '목표는 최소 {$a}단어 이상이어야 합니다';
$string['errormaxwords'] = '목표는 {$a}단어를 초과할 수 없습니다';
$string['erroremptygoal'] = '학습 목표를 작성해주세요';

// Teacher view
$string['viewsubmissions'] = '제출물 보기';
$string['nosubmissions'] = '아직 제출물이 없습니다';
$string['studentname'] = '학생 이름';
$string['submissiondate'] = '제출 날짜';
$string['teacherfeedback'] = '교사 피드백';
$string['grade'] = '성적';
$string['providefeedback'] = '피드백 제공';
$string['savefeedback'] = '피드백 저장';
$string['feedbacksaved'] = '피드백이 저장되었습니다';
$string['viewsubmission'] = '제출물 보기';

// Privacy
$string['privacy:metadata:goalwriting_submissions'] = '학생 목표 작성 제출물에 대한 정보';
$string['privacy:metadata:goalwriting_submissions:userid'] = '제출한 사용자의 ID';
$string['privacy:metadata:goalwriting_submissions:goaltext'] = '학생이 작성한 목표 텍스트';
$string['privacy:metadata:goalwriting_submissions:timesubmitted'] = '제출 시간';
$string['privacy:metadata:goalwriting_submissions:grade'] = '제출물에 대한 성적';
