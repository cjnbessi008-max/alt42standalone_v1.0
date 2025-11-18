<?php
// This file is part of Moodle - http://moodle.org/
//
// Mini Trial Game - Korean language strings
//
// @package    mod_minitrial
// @copyright  2025 KAIST Touch Math Academy
// @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later

defined('MOODLE_INTERNAL') || die();

// Plugin name
$string['modulename'] = '미니 시행 게임';
$string['modulenameplural'] = '미니 시행 게임';
$string['modulename_help'] = '미니 시행 게임 활동은 학생들이 상호작용 시뮬레이션을 통해 확률 실험을 수행할 수 있게 합니다.

학생들은 다음을 할 수 있습니다:
* 주사위 굴리기
* 동전 던지기
* 카드 뽑기
* 회전판 돌리기

활동은 결과를 추적하고 통계를 계산하여 학생들이 확률 개념을 이해하도록 돕습니다.';
$string['pluginname'] = '미니 시행 게임';
$string['pluginadministration'] = '미니 시행 게임 관리';

// Capabilities
$string['minitrial:addinstance'] = '새 미니 시행 게임 추가';
$string['minitrial:view'] = '미니 시행 게임 보기';
$string['minitrial:submit'] = '시행 제출';
$string['minitrial:viewreports'] = '보고서 보기';

// Settings
$string['minitrial:name'] = '활동 이름';
$string['intro'] = '설명';
$string['gametype'] = '게임 종류';
$string['gametype_help'] = '확률 실험의 종류를 선택하세요';
$string['trialsrequired'] = '필요한 시행 횟수';
$string['trialsrequired_help'] = '학생이 완료해야 하는 시행 횟수';

// Game types
$string['gametype_dice'] = '주사위 굴리기';
$string['gametype_coin'] = '동전 던지기';
$string['gametype_card'] = '카드 뽑기';
$string['gametype_spinner'] = '회전판';

// View page
$string['startgame'] = '게임 시작';
$string['continuegame'] = '게임 계속하기';
$string['runtrial'] = '시행 실행';
$string['resettrial'] = '모든 시행 초기화';
$string['progress'] = '진행 상황';
$string['trialscompleted'] = '완료한 시행: {$a->completed} / {$a->required}';
$string['congratulations'] = '축하합니다!';
$string['activitycompleted'] = '모든 필요한 시행을 완료했습니다.';

// Results
$string['result'] = '결과';
$string['statistics'] = '통계';
$string['frequency'] = '빈도';
$string['probability'] = '확률';
$string['theoretical'] = '이론적';
$string['experimental'] = '실험적';

// Dice specific
$string['rollresult'] = '주사위 결과: {$a}';
$string['diceside'] = '{$a}번';

// Coin specific
$string['flipresult'] = '결과: {$a}';
$string['heads'] = '앞면';
$string['tails'] = '뒷면';

// Card specific
$string['drawresult'] = '뽑은 카드: {$a}';
$string['suit_hearts'] = '하트';
$string['suit_diamonds'] = '다이아몬드';
$string['suit_clubs'] = '클로버';
$string['suit_spades'] = '스페이드';

// Errors
$string['error_nogametype'] = '게임 종류가 선택되지 않았습니다';
$string['error_invalidtrial'] = '잘못된 시행 데이터';
$string['nominitrialsincourse'] = '이 코스에 미니 시행 게임이 없습니다';

// Page type
$string['page-mod-minitrial-x'] = '모든 미니 시행 게임 페이지';

// Privacy
$string['privacy:metadata:minitrial_attempts'] = '시행 시도에 대한 정보';
$string['privacy:metadata:minitrial_attempts:userid'] = '사용자 ID';
$string['privacy:metadata:minitrial_attempts:result'] = '시행 결과';
$string['privacy:metadata:minitrial_attempts:timecreated'] = '시행 생성 시간';
$string['privacy:metadata:minitrial_progress'] = '진행 상황 정보';
$string['privacy:metadata:minitrial_progress:userid'] = '사용자 ID';
$string['privacy:metadata:minitrial_progress:grade'] = '사용자 성적';
$string['privacy:metadata:minitrial_progress:completed'] = '완료 상태';
