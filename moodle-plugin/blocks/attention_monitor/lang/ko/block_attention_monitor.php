<?php
/**
 * Korean language strings for Attention Monitor block
 *
 * @package    block_attention_monitor
 * @copyright  2025 Your Name
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

$string['pluginname'] = '집중도 모니터';
$string['attention_monitor'] = '집중도 모니터';
$string['attention_monitor:addinstance'] = '새로운 집중도 모니터 블록 추가';
$string['attention_monitor:myaddinstance'] = '대시보드에 새로운 집중도 모니터 블록 추가';

// Consent
$string['notloggedin'] = '집중도 모니터를 사용하려면 로그인해야 합니다.';
$string['consenttitle'] = '집중도 모니터링 동의';
$string['consentdesc'] = '눈 추적 기술을 사용하여 학습 활동 중 집중도를 모니터링하고자 합니다. 다음 내용을 읽어주세요:';
$string['consentpoint1'] = '웹캠은 눈 추적 용도로만 사용됩니다 (영상은 녹화되거나 저장되지 않습니다)';
$string['consentpoint2'] = '익명화된 집중도 메트릭만 저장됩니다';
$string['consentpoint3'] = '언제든지 동의를 철회할 수 있습니다';
$string['consentpoint4'] = '이 데이터는 학습 경험 개선에 도움이 됩니다';
$string['giveconsent'] = '동의합니다';
$string['revokeconsent'] = '동의 철회';

// Tracking interface
$string['status'] = '상태';
$string['active'] = '활성';
$string['inactive'] = '비활성';
$string['attentionscore'] = '집중도 점수';
$string['starttracking'] = '추적 시작';
$string['stoptracking'] = '추적 중지';
$string['viewreport'] = '리포트 보기';

// Alerts
$string['alert_excessive_blinking'] = '과도한 눈 깜빡임 감지 - 피곤하거나 스트레스를 받고 있을 수 있습니다';
$string['alert_insufficient_blinking'] = '눈 깜빡임 부족 - 안구 건조를 방지하기 위해 눈을 깜빡여주세요';
$string['alert_gaze_away'] = '시선이 화면을 벗어났습니다';
$string['alert_face_away'] = '화면을 정면으로 보고 있지 않습니다';
$string['alert_no_face_detected'] = '얼굴이 감지되지 않습니다 - 자리에 계신가요?';
$string['alert_low_attention'] = '낮은 집중도 감지 - 필요하다면 휴식을 취하세요';

// Settings
$string['api_endpoint'] = 'API 엔드포인트';
$string['api_endpoint_desc'] = '눈 추적 API 백엔드 URL';
$string['sampling_rate'] = '샘플링 주기 (밀리초)';
$string['sampling_rate_desc'] = '눈 추적 데이터 캡처 주기 (밀리초 단위)';
$string['window_size'] = '분석 윈도우 크기 (밀리초)';
$string['window_size_desc'] = '집중도 분석 시간 윈도우 (밀리초 단위)';
$string['show_video'] = '비디오 미리보기 표시';
$string['show_video_desc'] = '사용자에게 웹캠 비디오 미리보기 표시';
$string['show_prediction'] = '시선 예측 표시';
$string['show_prediction_desc'] = '화면에 시선 예측 점 표시';

// Privacy
$string['privacy:metadata:eye_tracking_events'] = '눈 추적 이벤트 데이터';
$string['privacy:metadata:eye_tracking_events:userid'] = '사용자 ID';
$string['privacy:metadata:eye_tracking_events:timestamp'] = '이벤트 타임스탬프';
$string['privacy:metadata:eye_tracking_events:gaze_data'] = '시선 위치 데이터 (익명화됨)';
$string['privacy:metadata:attention_metrics'] = '집중도 분석 메트릭';
$string['privacy:metadata:attention_metrics:userid'] = '사용자 ID';
$string['privacy:metadata:attention_metrics:attention_score'] = '계산된 집중도 점수';
