<?php
// This file is part of Moodle - http://moodle.org/
//
// 한국어 언어 문자열

defined('MOODLE_INTERNAL') || die();

$string['modulename'] = '수열 구슬';
$string['modulenameplural'] = '수열 구슬';
$string['modulename_help'] = '수열 구슬은 학생들이 수열에 대해 배우는 인터랙티브 활동입니다. 수열의 각 항은 빛나는 구슬로 표현되어 아름다운 시각적 학습 경험을 제공합니다.';
$string['sequencepearls:addinstance'] = '새로운 수열 구슬 활동 추가';
$string['sequencepearls:view'] = '수열 구슬 활동 보기';
$string['sequencepearls:submit'] = '수열 구슬 답안 제출';
$string['pluginname'] = '수열 구슬';
$string['pluginadministration'] = '수열 구슬 관리';

// 설정
$string['sequencepearls_name'] = '활동 이름';
$string['sequence_type'] = '수열 유형';
$string['sequence_type_help'] = '이 활동의 수열 유형을 선택하세요';
$string['arithmetic'] = '등차수열';
$string['geometric'] = '등비수열';
$string['fibonacci'] = '피보나치 수열';
$string['custom'] = '사용자 정의 수열';
$string['difficulty'] = '난이도';
$string['difficulty_help'] = '난이도를 설정하세요 (1-5)';
$string['num_problems'] = '문제 수';
$string['num_problems_help'] = '몇 개의 수열 문제를 생성할까요?';

// 보기 페이지
$string['welcome_message'] = '수열 구슬에 오신 것을 환영합니다!';
$string['instructions'] = '수열에서 빠진 숫자를 찾으세요. 각 항은 빛나는 구슬로 표현됩니다.';
$string['your_answer'] = '당신의 답';
$string['submit_answer'] = '제출';
$string['next_problem'] = '다음 문제';
$string['correct'] = '정답입니다! 잘했어요!';
$string['incorrect'] = '틀렸습니다. 다시 시도해보세요!';
$string['progress'] = '진행 상황';
$string['problems_solved'] = '해결한 문제: {$a->correct} / {$a->total}';
$string['accuracy'] = '정확도: {$a}%';
$string['current_streak'] = '현재 연속: {$a}';
$string['best_streak'] = '최고 연속: {$a}';
$string['time_spent'] = '소요 시간: {$a}';

// 모바일 뷰
$string['smartphone_view'] = '스마트폰 화면';
$string['fullscreen'] = '전체 화면';
$string['exit_fullscreen'] = '전체 화면 나가기';

// 오류 메시지
$string['error_no_problems'] = '사용 가능한 문제가 없습니다. 선생님에게 문의하세요.';
$string['error_invalid_answer'] = '유효한 숫자를 입력해주세요.';

// 이벤트
$string['eventanswersubmitted'] = '답안 제출됨';
