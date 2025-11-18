<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Korean strings for slopeheatmap
 *
 * @package    mod_slopeheatmap
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['modulename'] = '기울기 히트맵';
$string['modulenameplural'] = '기울기 히트맵';
$string['modulename_help'] = '기울기 히트맵 활동은 학생들이 가상 스마트폰 인터페이스를 사용하여 기울기 기반 연습을 할 수 있게 합니다.';
$string['pluginname'] = '기울기 히트맵';
$string['pluginadministration'] = '기울기 히트맵 관리';

// Capabilities
$string['slopeheatmap:addinstance'] = '새 기울기 히트맵 활동 추가';
$string['slopeheatmap:view'] = '기울기 히트맵 보기';
$string['slopeheatmap:submit'] = '기울기 히트맵 데이터 제출';
$string['slopeheatmap:viewreports'] = '기울기 히트맵 리포트 보기';

// Settings
$string['slopeheatmapname'] = '활동 이름';
$string['slopeheatmapname_help'] = '이 기울기 히트맵 활동의 이름';

// View page
$string['lastsession'] = '마지막 세션: {$a}';
$string['previoussessions'] = '이전 세션';
$string['problem'] = '문제';
$string['score'] = '점수';
$string['duration'] = '소요 시간';
$string['viewheatmap'] = '히트맵 보기';

// Problems
$string['balance_basic'] = '기본 균형';
$string['tilt_forward'] = '앞으로 기울이기';
$string['circle_motion'] = '원 그리기';

// Errors
$string['error:invalidsession'] = '잘못된 세션';
$string['error:sessionnotfound'] = '세션을 찾을 수 없습니다';

// Events
$string['eventcoursemoduleviewed'] = '코스 모듈 조회됨';
$string['eventsessionstarted'] = '세션 시작됨';
$string['eventsessioncompleted'] = '세션 완료됨';
