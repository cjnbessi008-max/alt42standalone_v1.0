<?php
// This file is part of Moodle - http://moodle.org/

/**
 * 점프 감지 플러그인 한국어 언어 파일
 *
 * @package    local_jumpdetect
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['pluginname'] = '점프 추론 감지';
$string['jumpdetect'] = '점프 감지';
$string['dashboard'] = '점프 감지 대시보드';

// 권한
$string['jumpdetect:view'] = '점프 감지 대시보드 보기';
$string['jumpdetect:configure'] = '점프 감지 설정 구성';

// 점프 유형
$string['sequential'] = '순차적 건너뛰기';
$string['prerequisite'] = '선수 학습 누락';
$string['time_anomaly'] = '시간 비정상 패턴';
$string['assessment_evasion'] = '퀴즈/과제 회피';

// 심각도
$string['severity_normal'] = '정상';
$string['severity_caution'] = '주의';
$string['severity_warning'] = '경고';
$string['severity_critical'] = '위험';

// 대시보드
$string['stats_summary'] = '통계 요약';
$string['recent_alerts'] = '최근 알림';
$string['student_scores'] = '학생별 점프 점수';
$string['jump_type_stats'] = '점프 유형별 통계';

// 메시지
$string['no_data'] = '데이터가 없습니다';
$string['no_alerts'] = '최근 알림이 없습니다';

// 설정
$string['settings'] = '설정';
$string['sequential_threshold'] = '순차적 건너뛰기 임계값';
$string['sequential_threshold_desc'] = '감지를 트리거하기 전에 건너뛸 수 있는 모듈 수';
$string['time_threshold'] = '시간 이상 Z-Score 임계값';
$string['time_threshold_desc'] = '비정상적으로 빠른 완료를 감지하기 위한 Z-score 임계값';
$string['min_learning_time'] = '최소 학습 시간 (초)';
$string['min_learning_time_desc'] = '모듈 완료에 필요한 최소 시간';
