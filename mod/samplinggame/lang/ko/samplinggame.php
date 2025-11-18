<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

$string['modulename'] = '표본추출 게임';
$string['modulenameplural'] = '표본추출 게임들';
$string['modulename_help'] = '표본추출 게임 모듈은 학생들이 인터랙티브 게임플레이를 통해 통계적 표본추출 방법을 배울 수 있게 합니다.';
$string['pluginname'] = '표본추출 게임';
$string['pluginadministration'] = '표본추출 게임 관리';

// Capabilities
$string['samplinggame:addinstance'] = '새 표본추출 게임 추가';
$string['samplinggame:view'] = '표본추출 게임 보기';
$string['samplinggame:submit'] = '표본추출 게임 시도 제출';
$string['samplinggame:viewreports'] = '표본추출 게임 리포트 보기';

// Settings
$string['samplinggamename'] = '게임 이름';
$string['samplinggamename_help'] = '이 표본추출 게임 활동의 이름';
$string['populationsize'] = '모집단 크기';
$string['populationsize_help'] = '모집단 내 전체 항목 수';
$string['samplesize'] = '표본 크기';
$string['samplesize_help'] = '학생이 선택해야 하는 항목 수';
$string['samplingmethod'] = '표본추출 방법';
$string['samplingmethod_help'] = '가르칠 통계적 표본추출 방법';
$string['gamescenario'] = '게임 시나리오';
$string['gamescenario_help'] = '게임의 시각적 테마 (학생, 공, 사탕 등)';
$string['timelimit'] = '제한 시간';
$string['timelimit_help'] = '제한 시간(초) (제한 없음은 비워두세요)';

// Sampling methods
$string['simple_random'] = '단순무작위추출';
$string['systematic'] = '계통추출';
$string['stratified'] = '층화추출';
$string['cluster'] = '집락추출';

// Game scenarios
$string['students'] = '교실 속 학생들';
$string['balls'] = '색깔 공들';
$string['candies'] = '사탕들';
$string['cards'] = '카드들';

// Game interface
$string['startgame'] = '게임 시작';
$string['reset'] = '다시 시작';
$string['submit'] = '제출';
$string['yourattempts'] = '나의 시도';
$string['attemptnumber'] = '시도 번호';
$string['score'] = '점수';
$string['timespent'] = '소요 시간';
$string['date'] = '날짜';

// Instructions
$string['instructions_simple_random'] = '모집단에서 {$a}개의 항목을 무작위로 선택하세요. 각 항목은 동일한 확률로 선택되어야 합니다.';
$string['instructions_systematic'] = '모집단에서 k번째 항목마다 체계적으로 선택하세요.';
$string['instructions_stratified'] = '모집단을 그룹으로 나누고 각 그룹에서 비례적으로 표본을 선택하세요.';
$string['instructions_cluster'] = '모집단을 집락으로 나누고 전체 집락을 무작위로 선택하세요.';

// Feedback
$string['feedback_excellent'] = '훌륭합니다! 표본추출 방법에 대한 강한 이해를 보여주셨습니다.';
$string['feedback_good'] = '잘했어요! 표본추출 기법이 대부분 정확했습니다.';
$string['feedback_needsimprovement'] = '표본추출이 개선이 필요합니다. 표본추출 방법을 복습하고 다시 시도해보세요.';
$string['feedback_tryagain'] = '다시 시도해보세요. 항목을 선택하기 전에 표본추출 방법을 이해했는지 확인하세요.';
$string['feedback_randomness'] = '기억하세요: 무작위 표본추출에서는 각 항목이 동일한 선택 확률을 가져야 합니다.';
$string['feedback_systematic'] = '기억하세요: 계통 표본추출에서는 일정한 간격으로 항목을 선택해야 합니다.';

// Timer
$string['timeleft'] = '남은 시간: {$a}';
$string['timeup'] = '시간 종료!';

// Errors
$string['error_notenoughsamples'] = '{$a}개의 표본을 선택해야 합니다.';
$string['error_toomanysamples'] = '너무 많은 표본을 선택했습니다. 최대: {$a}';
$string['error_invalidselection'] = '잘못된 선택입니다. 다시 시도해주세요.';

// Reports
$string['viewreport'] = '리포트 보기';
$string['studentattempts'] = '학생 시도';
$string['averagescore'] = '평균 점수';
$string['completionrate'] = '완료율';

// Additional strings
$string['settings'] = '게임 설정';
$string['nosamplinggames'] = '이 코스에 표본추출 게임이 없습니다';
$string['attemptsaved'] = '시도가 성공적으로 저장되었습니다';
$string['eventattemptsubmitted'] = '표본추출 게임 시도 제출됨';

// Form validation errors
$string['error_samplesizetoobig'] = '표본 크기가 모집단 크기보다 클 수 없습니다';
$string['error_populationtoosmall'] = '모집단 크기는 최소 10이어야 합니다';
$string['error_populationtoobig'] = '모집단 크기는 1000을 초과할 수 없습니다';
$string['error_timelimittoosmall'] = '제한 시간은 최소 30초 이상이어야 합니다';
