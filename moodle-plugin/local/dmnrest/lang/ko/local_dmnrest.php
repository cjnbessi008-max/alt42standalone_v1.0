<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

$string['pluginname'] = 'DMN 휴식 루틴';
$string['privacy:metadata'] = 'DMN 휴식 루틴 플러그인은 개인 데이터를 로컬에 저장하지 않습니다. 휴식 루틴 제안을 위해 익명화된 사용 데이터를 외부 API로 전송합니다.';

// Settings
$string['setting_enabled'] = 'DMN 휴식 루틴 활성화';
$string['setting_enabled_desc'] = '자동 휴식 루틴 제안 활성화 또는 비활성화';

$string['setting_api_endpoint'] = 'API 엔드포인트';
$string['setting_api_endpoint_desc'] = 'DMN 휴식 루틴 API의 URL (예: http://localhost:3000/api/dmn)';

$string['setting_api_key'] = 'API 키';
$string['setting_api_key_desc'] = 'DMN API 인증을 위한 API 키';

$string['setting_trigger_strategy'] = '트리거 전략';
$string['setting_trigger_strategy_desc'] = '휴식 루틴을 언제 제안할까요?';

$string['setting_complexity_threshold'] = '복잡도 임계값';
$string['setting_complexity_threshold_desc'] = '휴식 루틴을 트리거하기 위한 최소 문제 복잡도 (1-5) (complex_only 전략용)';

$string['setting_allow_skip'] = '학생의 건너뛰기 허용';
$string['setting_allow_skip_desc'] = '학생이 휴식 루틴을 건너뛸 수 있도록 허용';

$string['setting_min_rest_interval'] = '최소 휴식 간격 (분)';
$string['setting_min_rest_interval_desc'] = '휴식 루틴 제안 사이의 최소 시간';

$string['setting_problems_per_interval'] = '간격당 문제 수';
$string['setting_problems_per_interval_desc'] = '휴식 제안 사이의 문제 수 (every_n_problems 전략용)';

// Strategies
$string['strategy_every_problem'] = '모든 문제 전';
$string['strategy_complex_only'] = '복잡한 문제 전만';
$string['strategy_every_n_problems'] = 'N개 문제마다';
$string['strategy_fatigue_based'] = '피로도 기반 (권장)';

// UI strings
$string['rest_routine_title'] = '두뇌 휴식 시간입니다!';
$string['rest_routine_subtitle'] = '잠시 마음을 새롭게 해봅시다';
$string['button_start'] = '휴식 루틴 시작';
$string['button_skip'] = '나중에 하기';
$string['button_complete'] = '완료했어요!';
$string['timer_label'] = '예상 시간:';
$string['feedback_prompt'] = '이 휴식 루틴이 얼마나 도움이 되었나요?';
$string['feedback_submit'] = '피드백 제출';
