<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

// Plugin name
$string['pluginname'] = '답변 확신도 및 이유 추적';

// Capabilities
$string['confidencereasoning:submit'] = '확신도 및 이유 제출';
$string['confidencereasoning:view'] = '학생 확신도 및 이유 보기';
$string['confidencereasoning:viewstats'] = '확신도 통계 보기';
$string['confidencereasoning:manage'] = '확신도 추적 설정 관리';

// UI Labels
$string['confidencelevel'] = '답에 대한 확신도는?';
$string['confidencelevel_help'] = '1(매우 불확실)부터 5(매우 확신)까지 확신도를 선택하세요';
$string['reasoning'] = '왜 확신하거나 확신하지 않나요?';
$string['reasoning_help'] = '이 답을 선택한 이유를 간단히 설명해주세요';
$string['reasoningcategory'] = '어떻게 이 답을 찾았나요?';

// Confidence levels
$string['confidence_1'] = '1 - 매우 불확실함';
$string['confidence_2'] = '2 - 불확실함';
$string['confidence_3'] = '3 - 보통';
$string['confidence_4'] = '4 - 확신함';
$string['confidence_5'] = '5 - 매우 확신함';

// Reasoning categories
$string['category_studied'] = '공부했던 내용';
$string['category_calculated'] = '계산해서 풀었음';
$string['category_remembered'] = '수업 시간에 배운 것을 기억함';
$string['category_guessed'] = '추측했음';
$string['category_eliminated'] = '오답을 제거했음';
$string['category_other'] = '기타';

// Report/Stats
$string['viewreport'] = '확신도 리포트 보기';
$string['avgconfidence'] = '평균 확신도';
$string['confidencestats'] = '확신도 통계';
$string['correctwithhighconfidence'] = '높은 확신도로 정답 (≥4)';
$string['incorrectwithhighconfidence'] = '높은 확신도로 오답 (≥4)';
$string['calibration'] = '확신도 보정';

// Errors
$string['error_savingdata'] = '확신도 데이터 저장 오류';
$string['error_invalidconfidence'] = '유효하지 않은 확신도';

// Privacy
$string['privacy:metadata:local_confidence_reasoning'] = '퀴즈 응시 시 학생의 확신도 및 이유를 저장합니다';
$string['privacy:metadata:local_confidence_reasoning:userid'] = '사용자 ID';
$string['privacy:metadata:local_confidence_reasoning:questionattemptid'] = '문제 응시 ID';
$string['privacy:metadata:local_confidence_reasoning:quizid'] = '퀴즈 ID';
$string['privacy:metadata:local_confidence_reasoning:questionid'] = '문제 ID';
$string['privacy:metadata:local_confidence_reasoning:confidencelevel'] = '학생 확신도 (1-5)';
$string['privacy:metadata:local_confidence_reasoning:reasoning'] = '학생이 작성한 이유';
$string['privacy:metadata:local_confidence_reasoning:reasoningcategory'] = '이유 카테고리';
$string['privacy:metadata:local_confidence_reasoning:timecreated'] = '기록 생성 시간';
$string['privacy:metadata:local_confidence_reasoning:timemodified'] = '기록 수정 시간';

$string['privacy:metadata:local_confidence_stats'] = '학생별 퀴즈별 확신도 통계 요약을 저장합니다';
$string['privacy:metadata:local_confidence_stats:userid'] = '사용자 ID';
$string['privacy:metadata:local_confidence_stats:quizid'] = '퀴즈 ID';
$string['privacy:metadata:local_confidence_stats:avgconfidence'] = '평균 확신도';
$string['privacy:metadata:local_confidence_stats:totalattempts'] = '총 응시 횟수';
$string['privacy:metadata:local_confidence_stats:correctwithhighconfidence'] = '높은 확신도로 정답 수';
$string['privacy:metadata:local_confidence_stats:incorrectwithhighconfidence'] = '높은 확신도로 오답 수';
