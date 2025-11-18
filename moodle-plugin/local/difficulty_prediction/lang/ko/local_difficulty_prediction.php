<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Korean language strings for Difficulty Prediction plugin
 *
 * @package    local_difficulty_prediction
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['pluginname'] = '난이도 예측';

// Capabilities.
$string['difficulty_prediction:view'] = '난이도 예측 보기';
$string['difficulty_prediction:manage'] = '난이도 예측 설정 관리';
$string['difficulty_prediction:viewanalytics'] = '난이도 분석 보기';

// Settings.
$string['settingsheader'] = '난이도 예측 설정';
$string['enable_auto_prediction'] = '자동 예측 활성화';
$string['enable_auto_prediction_desc'] = '문제가 생성되거나 업데이트될 때 자동으로 난이도 예측';
$string['weight_complexity'] = '복잡도 가중치';
$string['weight_complexity_desc'] = '복잡도 점수 가중치 (0.0 - 1.0)';
$string['weight_cognitive'] = '인지 부하 가중치';
$string['weight_cognitive_desc'] = '인지 부하 점수 가중치 (0.0 - 1.0)';
$string['weight_historical'] = '과거 데이터 가중치';
$string['weight_historical_desc'] = '과거 성과 데이터 가중치 (0.0 - 1.0)';
$string['weight_question_type'] = '문제 유형 가중치';
$string['weight_question_type_desc'] = '문제 유형 점수 가중치 (0.0 - 1.0)';
$string['min_attempts_threshold'] = '최소 시도 횟수';
$string['min_attempts_threshold_desc'] = '실제 난이도 데이터를 사용하기 전 최소 학생 시도 횟수';
$string['cache_ttl'] = '캐시 TTL (초)';
$string['cache_ttl_desc'] = '난이도 예측을 캐시하는 시간 (초 단위)';

// Difficulty levels.
$string['difficulty_level_1'] = '매우 쉬움';
$string['difficulty_level_2'] = '쉬움';
$string['difficulty_level_3'] = '보통';
$string['difficulty_level_4'] = '어려움';
$string['difficulty_level_5'] = '매우 어려움';

// UI strings.
$string['predicted_difficulty'] = '예측 난이도';
$string['difficulty_level'] = '난이도 레벨';
$string['confidence_score'] = '신뢰도 점수';
$string['actual_difficulty'] = '실제 난이도';
$string['analytics'] = '난이도 분석';
$string['question_analytics'] = '문제 분석';
$string['student_analytics'] = '학생 성과 분석';

// Analytics.
$string['total_questions'] = '전체 문제 수';
$string['difficulty_distribution'] = '난이도 분포';
$string['avg_difficulty'] = '평균 난이도';
$string['accuracy_rate'] = '예측 정확도';
$string['success_rate'] = '정답률';
$string['mastery_score'] = '숙달도 점수';
$string['questions_attempted'] = '시도한 문제 수';
$string['performance_trend'] = '성과 추세';

// Errors.
$string['error_questionnotfound'] = '문제를 찾을 수 없습니다';
$string['error_insufficientpermissions'] = '권한이 부족합니다';
$string['error_predictionfailed'] = '난이도 예측에 실패했습니다';
$string['error_invalidparameters'] = '잘못된 매개변수가 제공되었습니다';

// Tasks.
$string['task_update_difficulties'] = '난이도 예측 업데이트';
$string['task_cleanup_old_performance'] = '오래된 성과 데이터 정리';

// Info messages.
$string['prediction_generated'] = '난이도 예측이 성공적으로 생성되었습니다';
$string['prediction_updated'] = '학생 성과를 기반으로 난이도 예측이 업데이트되었습니다';
$string['no_historical_data'] = '이 문제에 대한 과거 데이터가 없습니다';
$string['low_confidence'] = '낮은 신뢰도 예측 (데이터 부족)';
