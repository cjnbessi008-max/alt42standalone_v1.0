<?php
/**
 * Korean language strings for Breathing Curve plugin
 *
 * @package    local_breathing_curve
 * @copyright  2024 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

// 플러그인 이름
$string['pluginname'] = 'Breathing Curve - 숨쉬는 곡선';

// 권한
$string['breathing_curve:view'] = 'Breathing Curve 애니메이션 보기';
$string['breathing_curve:manage'] = 'Breathing Curve 문제 관리하기';
$string['breathing_curve:configure'] = 'Breathing Curve 설정 구성하기';

// 일반 문자열
$string['title'] = 'Breathing Curve - 숨쉬는 함수 그래프';
$string['description'] = '함수의 증가/감소를 호흡 애니메이션으로 표현하는 인터랙티브 시각화';
$string['loadingproblem'] = 'Moodle에서 문제 정보를 가져오는 중...';
$string['noproblem'] = 'ID {$a}에 해당하는 문제를 찾을 수 없습니다';
$string['error'] = '오류: {$a}';

// 함수 유형
$string['quadratic'] = '2차 함수';
$string['sine'] = '삼각 함수';
$string['cubic'] = '3차 함수';

// UI 요소
$string['currentfunction'] = '현재 애니메이션:';
$string['breathingeffect'] = 'Breathing 효과:';
$string['breathingdescription'] = '증가 구간은 파란색으로 확장, 감소 구간은 빨간색으로 수축';
$string['changefunction'] = '함수 변경';

// 설정
$string['settings'] = 'Breathing Curve 설정';
$string['animationspeed'] = '애니메이션 속도';
$string['animationspeed_desc'] = '호흡 애니메이션의 속도 배율 (0.5 = 느림, 1.0 = 보통, 2.0 = 빠름)';
$string['showhints'] = '힌트 표시';
$string['showhints_desc'] = '학생들에게 힌트 표시';
$string['showcriticalpoints'] = '극값 표시';
$string['showcriticalpoints_desc'] = '그래프의 극댓값과 극솟값을 강조 표시';
$string['defaultfunction'] = '기본 함수 유형';
$string['defaultfunction_desc'] = '처음 로드될 때 표시할 함수 유형';

// 개인정보 보호
$string['privacy:metadata:breathing_curve_logs'] = 'Breathing Curve와의 사용자 상호작용 로그';
$string['privacy:metadata:breathing_curve_logs:userid'] = '사용자 ID';
$string['privacy:metadata:breathing_curve_logs:questionid'] = '조회한 문제 ID';
$string['privacy:metadata:breathing_curve_logs:action'] = '수행한 작업';
$string['privacy:metadata:breathing_curve_logs:timestamp'] = '작업이 발생한 시간';

$string['privacy:metadata:breathing_curve_progress'] = 'Breathing Curve 문제에 대한 학생 진도';
$string['privacy:metadata:breathing_curve_progress:userid'] = '사용자 ID';
$string['privacy:metadata:breathing_curve_progress:questionid'] = '문제 ID';
$string['privacy:metadata:breathing_curve_progress:attempts'] = '시도 횟수';
$string['privacy:metadata:breathing_curve_progress:completed'] = '문제 완료 여부';
$string['privacy:metadata:breathing_curve_progress:time_spent'] = '문제에 소요한 총 시간';
