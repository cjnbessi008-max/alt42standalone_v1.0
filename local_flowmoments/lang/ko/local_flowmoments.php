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
 * @package    local_flowmoments
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

$string['pluginname'] = '몰입 순간';
$string['flowmoments'] = '몰입 순간';
$string['flowmoments_dashboard'] = '몰입 순간 대시보드';
$string['flowmoments_for'] = '{$a}의 몰입 순간';

// Capabilities
$string['flowmoments:viewown'] = '자신의 몰입 순간 보기';
$string['flowmoments:viewreports'] = '모든 사용자의 몰입 순간 보기';

// Dashboard
$string['summary_statistics'] = '요약 통계';
$string['total_flow_moments'] = '총 몰입 순간 수';
$string['avg_flow_score'] = '평균 몰입 점수';
$string['total_flow_hours'] = '총 몰입 시간 (시간)';
$string['last_flow_moment'] = '마지막 몰입 순간';
$string['never'] = '없음';
$string['no_flow_data'] = '아직 몰입 데이터가 없습니다. 활동을 완료하면 추적이 시작됩니다.';
$string['flow_moments_history'] = '몰입 순간 기록';

// Table headers
$string['start_time'] = '시작 시간';
$string['duration'] = '지속 시간';
$string['flow_score'] = '몰입 점수';
$string['indicators'] = '몰입 지표';

// Indicators
$string['indicator_time_consistency'] = '시간 일관성';
$string['indicator_error_rate'] = '최적 난이도';
$string['indicator_continuity'] = '연속성';
$string['indicator_input_rhythm'] = '입력 리듬';
$string['indicator_correction_rate'] = '자가 수정';
$string['indicator_response_time'] = '응답 일관성';

// Privacy
$string['privacy:metadata:local_flowmoments_tracking'] = '몰입 감지를 위한 학생 행동 추적 데이터 저장';
$string['privacy:metadata:local_flowmoments_tracking:userid'] = '사용자 ID';
$string['privacy:metadata:local_flowmoments_tracking:courseid'] = '코스 ID';
$string['privacy:metadata:local_flowmoments_tracking:eventtype'] = '이벤트 유형 (클릭, 입력 등)';
$string['privacy:metadata:local_flowmoments_tracking:eventdata'] = '이벤트 데이터 (JSON)';
$string['privacy:metadata:local_flowmoments_tracking:timestamp'] = '이벤트 타임스탬프';

$string['privacy:metadata:local_flowmoments_detected'] = '감지된 몰입 순간 저장';
$string['privacy:metadata:local_flowmoments_detected:userid'] = '사용자 ID';
$string['privacy:metadata:local_flowmoments_detected:courseid'] = '코스 ID';
$string['privacy:metadata:local_flowmoments_detected:flowscore'] = '몰입 상태 점수';
$string['privacy:metadata:local_flowmoments_detected:starttime'] = '몰입 순간 시작 시간';
$string['privacy:metadata:local_flowmoments_detected:duration'] = '몰입 순간 지속 시간';

$string['privacy:metadata:local_flowmoments_summary'] = '집계된 몰입 통계 저장';
$string['privacy:metadata:local_flowmoments_summary:userid'] = '사용자 ID';
$string['privacy:metadata:local_flowmoments_summary:courseid'] = '코스 ID';
$string['privacy:metadata:local_flowmoments_summary:totalflowmoments'] = '총 몰입 순간 수';
$string['privacy:metadata:local_flowmoments_summary:avgflowscore'] = '평균 몰입 점수';
